const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Зареєструвати нового користувача (лише для адміністратора)
 */
const register = async (req, res, next) => {
    try {
        const { email, password, role, agentId } = req.body;

        // Перевіряємо, чи існує користувач
        const existing = await db.execute(
            `SELECT UserID
             FROM Users
             WHERE Email = :email`,
            { email }
        );
        /*
         * SELECT UserID ... – перевіряємо, чи існує користувач з таким email,
         * щоб не створити дублікат.
         */

        if (existing.rows.length > 0) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION',
                    message: 'User with this email already exists',
                    details: {}
                }
            });
        }

        // Хешуємо пароль
        const passwordHash = await bcrypt.hash(password, 10);

        // Додаємо користувача
        await db.execute(
            `INSERT INTO Users (UserID, Email, PasswordHash, Role, AgentID)
             VALUES (seq_user_id.NEXTVAL, :email, :passwordHash, :role, :agentId)`,
            {
                email,
                passwordHash,
                role: role || 'Client',
                agentId: agentId || null
            },
            { autoCommit: true }
        );
        /*
         * INSERT INTO Users ... – створюємо нового користувача.
         * seq_user_id.NEXTVAL – генеруємо унікальний UserID.
         */

        // Отримуємо ідентифікатор створеного користувача
        const userIdResult = await db.execute(
            `SELECT UserID
             FROM Users
             WHERE Email = :email`,
            { email }
        );
        /*
         * SELECT UserID ... – визначаємо ідентифікатор щойно створеного користувача
         * для формування JWT.
         */

        const userId = userIdResult.rows[0].USERID;

        // Генеруємо токен
        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            user: {
                userId,
                email,
                role: role || 'Client'
            },
            token
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Авторизація користувача
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Шукаємо користувача
        const result = await db.execute(
            `SELECT UserID, Email, PasswordHash, Role, AgentID
             FROM Users
             WHERE Email = :email`,
            { email }
        );
        /*
         * SELECT ... FROM Users WHERE Email = :email – шукаємо користувача за email
         * щоб перевірити існування та зчитати хеш пароля.
         */

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: {
                    code: 'AUTH',
                    message: 'Invalid credentials',
                    details: {}
                }
            });
        }

        const user = result.rows[0];

        // Перевіряємо пароль
        const valid = await bcrypt.compare(password, user.PASSWORDHASH);
        if (!valid) {
            return res.status(401).json({
                error: {
                    code: 'AUTH',
                    message: 'Invalid credentials',
                    details: {}
                }
            });
        }

        // Генеруємо токен
        const token = jwt.sign({ userId: user.USERID }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            user: {
                userId: user.USERID,
                email: user.EMAIL,
                role: user.ROLE,
                agentId: user.AGENTID
            },
            token
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Отримати дані поточного користувача
 */
const getMe = async (req, res, next) => {
    try {
        const result = await db.execute(
            `SELECT UserID, Email, Role, AgentID
             FROM Users
             WHERE UserID = :userId`,
            { userId: req.user.USERID }
        );
        /*
         * SELECT ... WHERE UserID = :userId – повертаємо базову інформацію
         * про авторизованого користувача за його ID.
         */

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'User not found',
                    details: {}
                }
            });
        }

        const user = result.rows[0];
        res.json({
            userId: user.USERID,
            email: user.EMAIL,
            role: user.ROLE,
            agentId: user.AGENTID
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    register,
    login,
    getMe
};

