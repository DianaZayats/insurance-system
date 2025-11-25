const db = require('../config/database');

/**
 * Отримати всі філії з пагінацією та пошуком
 */
const getAll = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const query = req.query.query || '';

        let sql = `
            SELECT BranchID, Name
            FROM Branch
            WHERE 1=1
        `;
        /*
         * SELECT BranchID, Name – забираємо ідентифікатор та назву кожної філії.
         * FROM Branch – працюємо з таблицею філій.
         * WHERE 1=1 – технічний вираз, який дозволяє гнучко додавати фільтри.
         */
        const binds = {};

        if (query) {
            sql += ` AND UPPER(Name) LIKE UPPER(:query)`;
            // AND UPPER(Name) ... – залишаємо лише філії, що відповідають тексту пошуку
            binds.query = `%${query}%`;
        }

        sql += ` ORDER BY BranchID DESC
                 OFFSET :offset ROWS
                 FETCH NEXT :limit ROWS ONLY`;
        /*
         * ORDER BY BranchID DESC – показуємо найновіші філії першими.
         * OFFSET ... – пропускаємо записи попередніх сторінок.
         * FETCH NEXT ... – беремо лише ліміт записів для поточної сторінки.
         */

        const result = await db.execute(sql, {
            ...binds,
            offset,
            limit
        });

        // Отримати загальну кількість записів
        let countSql = `
            SELECT COUNT(*) as TOTAL
            FROM Branch
            WHERE 1=1
        `;
        /*
         * SELECT COUNT(*) ... – підраховуємо кількість записів для пагінації.
         * FROM Branch – беремо дані з таблиці філій.
         * WHERE 1=1 – базовий вираз для додавання умов.
         */
        if (query) {
            countSql += ` AND UPPER(Name) LIKE UPPER(:query)`;
            // AND UPPER(Name) ... – враховуємо лише ті філії, що відповідають пошуку
        }
        const countResult = await db.execute(countSql, binds);
        const total = countResult.rows[0].TOTAL;

        res.json({
            data: result.rows.map(row => ({
                branchId: row.BRANCHID,
                name: row.NAME
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Отримати філію за ідентифікатором
 */
const getById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.execute(
            `SELECT BranchID, Name
             FROM Branch
             WHERE BranchID = :id`,
            { id: parseInt(id) }
        );
        /*
         * SELECT ... – повертаємо ідентифікатор і назву конкретної філії.
         * WHERE BranchID = :id – беремо запис за переданим ID.
         */

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Branch not found',
                    details: {}
                }
            });
        }

        const row = result.rows[0];
        res.json({
            branchId: row.BRANCHID,
            name: row.NAME
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Створити філію
 */
const create = async (req, res, next) => {
    try {
        const { name } = req.body;

        const result = await db.execute(
            `INSERT INTO Branch (BranchID, Name)
             VALUES (seq_branch_id.NEXTVAL, :name)
             RETURNING BranchID INTO :branchId`,
            { name },
            { autoCommit: true, auditUserId: req.user.USERID }
        );
        /*
         * INSERT INTO ... – додаємо новий запис.
         * seq_branch_id.NEXTVAL – генеруємо унікальний ідентифікатор.
         * RETURNING ... – одразу отримуємо створений BranchID.
         */

        // Отримати щойно створену філію
        const newBranch = await db.execute(
            `SELECT BranchID, Name
             FROM Branch
             WHERE Name = :name`,
            { name }
        );
        /*
         * SELECT ... – отримуємо створений запис, щоб повернути його клієнту.
         */

        res.status(201).json({
            branchId: newBranch.rows[0].BRANCHID,
            name: newBranch.rows[0].NAME
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Оновити інформацію про філію
 */
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const result = await db.execute(
            `UPDATE Branch
             SET Name = :name
             WHERE BranchID = :id`,
            { name, id: parseInt(id) },
            { autoCommit: true, auditUserId: req.user.USERID }
        );
        /*
         * UPDATE ... – змінюємо назву філії.
         * WHERE BranchID = :id – працюємо з конкретним записом.
         */

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Branch not found',
                    details: {}
                }
            });
        }

        const updated = await db.execute(
            `SELECT BranchID, Name
             FROM Branch
             WHERE BranchID = :id`,
            { id: parseInt(id) }
        );
        /*
         * SELECT ... – повертаємо оновлені дані, щоби клієнт бачив актуальну інформацію.
         */

        res.json({
            branchId: updated.rows[0].BRANCHID,
            name: updated.rows[0].NAME
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Видалити філію
 */
const remove = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.execute(
            `DELETE FROM Branch
             WHERE BranchID = :id`,
            { id: parseInt(id) },
            { autoCommit: true, auditUserId: req.user.USERID }
        );
        /*
         * DELETE FROM ... – видаляємо запис про філію.
         * WHERE BranchID = :id – працюємо з конкретним ідентифікатором.
         */

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Branch not found',
                    details: {}
                }
            });
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};

