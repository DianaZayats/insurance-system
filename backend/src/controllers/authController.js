const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Register a new user (Admin only)
 */
const register = async (req, res, next) => {
    try {
        const { email, password, role, agentId } = req.body;

        // Check if user exists
        const existing = await db.execute(
            `SELECT UserID FROM Users WHERE Email = :email`,
            { email }
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION',
                    message: 'User with this email already exists',
                    details: {}
                }
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
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

        // Get the new user ID
        const userIdResult = await db.execute(
            `SELECT UserID FROM Users WHERE Email = :email`,
            { email }
        );

        const userId = userIdResult.rows[0].USERID;

        // Generate token
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
 * Login user
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await db.execute(
            `SELECT UserID, Email, PasswordHash, Role, AgentID FROM Users WHERE Email = :email`,
            { email }
        );

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

        // Verify password
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

        // Generate token
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
 * Get current user
 */
const getMe = async (req, res, next) => {
    try {
        const result = await db.execute(
            `SELECT UserID, Email, Role, AgentID FROM Users WHERE UserID = :userId`,
            { userId: req.user.USERID }
        );

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

