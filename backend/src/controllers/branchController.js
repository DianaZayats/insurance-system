const db = require('../config/database');

/**
 * Get all branches with pagination and search
 */
const getAll = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const query = req.query.query || '';

        let sql = `SELECT BranchID, Name FROM Branch WHERE 1=1`;
        const binds = {};

        if (query) {
            sql += ` AND UPPER(Name) LIKE UPPER(:query)`;
            binds.query = `%${query}%`;
        }

        sql += ` ORDER BY Name OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;

        const result = await db.execute(sql, {
            ...binds,
            offset,
            limit
        });

        // Get total count
        let countSql = `SELECT COUNT(*) as TOTAL FROM Branch WHERE 1=1`;
        if (query) {
            countSql += ` AND UPPER(Name) LIKE UPPER(:query)`;
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
 * Get branch by ID
 */
const getById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.execute(
            `SELECT BranchID, Name FROM Branch WHERE BranchID = :id`,
            { id: parseInt(id) }
        );

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
 * Create branch
 */
const create = async (req, res, next) => {
    try {
        const { name } = req.body;

        const result = await db.execute(
            `INSERT INTO Branch (BranchID, Name)
             VALUES (seq_branch_id.NEXTVAL, :name)
             RETURNING BranchID INTO :branchId`,
            { name },
            { autoCommit: true }
        );

        // Get the created branch
        const newBranch = await db.execute(
            `SELECT BranchID, Name FROM Branch WHERE Name = :name`,
            { name }
        );

        res.status(201).json({
            branchId: newBranch.rows[0].BRANCHID,
            name: newBranch.rows[0].NAME
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Update branch
 */
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const result = await db.execute(
            `UPDATE Branch SET Name = :name WHERE BranchID = :id`,
            { name, id: parseInt(id) },
            { autoCommit: true }
        );

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
            `SELECT BranchID, Name FROM Branch WHERE BranchID = :id`,
            { id: parseInt(id) }
        );

        res.json({
            branchId: updated.rows[0].BRANCHID,
            name: updated.rows[0].NAME
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Delete branch
 */
const remove = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.execute(
            `DELETE FROM Branch WHERE BranchID = :id`,
            { id: parseInt(id) },
            { autoCommit: true }
        );

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

