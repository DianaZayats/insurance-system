const db = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const name = req.query.name || '';
        const branchId = req.query.branchId;

        let sql = `SELECT a.AgentID, a.FullName, a.Phone, a.Email, a.HireDate, a.BranchID, b.Name as BranchName, u.Email as UserEmail
                   FROM Agent a
                   LEFT JOIN Branch b ON a.BranchID = b.BranchID
                   LEFT JOIN Users u ON u.AgentID = a.AgentID
                   WHERE 1=1`;
        const binds = {};

        if (name) {
            sql += ` AND UPPER(a.FullName) LIKE UPPER(:name)`;
            binds.name = `%${name}%`;
        }
        if (branchId) {
            sql += ` AND a.BranchID = :branchId`;
            binds.branchId = parseInt(branchId);
        }

        sql += ` ORDER BY a.AgentID DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;

        const result = await db.execute(sql, {
            ...binds,
            offset,
            limit
        });

        let countSql = `SELECT COUNT(*) as TOTAL FROM Agent WHERE 1=1`;
        if (name) countSql += ` AND UPPER(FullName) LIKE UPPER(:name)`;
        if (branchId) countSql += ` AND BranchID = :branchId`;
        const countResult = await db.execute(countSql, binds);
        const total = countResult.rows[0].TOTAL;

        res.json({
            data: result.rows.map(row => ({
                agentId: row.AGENTID,
                fullName: row.FULLNAME,
                phone: row.PHONE,
                email: row.EMAIL,
                hireDate: row.HIREDATE,
                branchId: row.BRANCHID,
                branchName: row.BRANCHNAME,
                userEmail: row.USEREMAIL || null
            })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.execute(
            `SELECT a.AgentID, a.FullName, a.Phone, a.Email, a.HireDate, a.BranchID, b.Name as BranchName, u.Email as UserEmail
             FROM Agent a
             LEFT JOIN Branch b ON a.BranchID = b.BranchID
             LEFT JOIN Users u ON u.AgentID = a.AgentID
             WHERE a.AgentID = :id`,
            { id: parseInt(id) }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Agent not found', details: {} }
            });
        }

        const row = result.rows[0];
        res.json({
            agentId: row.AGENTID,
            fullName: row.FULLNAME,
            phone: row.PHONE,
            email: row.EMAIL,
            hireDate: row.HIREDATE,
            branchId: row.BRANCHID,
            branchName: row.BRANCHNAME,
            userEmail: row.USEREMAIL || null
        });
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { fullName, phone, email, hireDate, branchId } = req.body;
        const result = await db.execute(
            `INSERT INTO Agent (AgentID, FullName, Phone, Email, HireDate, BranchID)
             VALUES (seq_agent_id.NEXTVAL, :fullName, :phone, :email, TO_DATE(:hireDate, 'YYYY-MM-DD'), :branchId)`,
            {
                fullName,
                phone: phone || null,
                email: email || null,
                hireDate,
                branchId: branchId || null
            },
            { autoCommit: true, auditUserId: req.user.USERID }
        );

        const newAgent = await db.execute(
            `SELECT a.AgentID, a.FullName, a.Phone, a.Email, a.HireDate, a.BranchID, b.Name as BranchName
             FROM Agent a
             LEFT JOIN Branch b ON a.BranchID = b.BranchID
             WHERE a.FullName = :fullName ORDER BY a.AgentID DESC FETCH FIRST 1 ROWS ONLY`,
            { fullName }
        );

        res.status(201).json({
            agentId: newAgent.rows[0].AGENTID,
            fullName: newAgent.rows[0].FULLNAME,
            phone: newAgent.rows[0].PHONE,
            email: newAgent.rows[0].EMAIL,
            hireDate: newAgent.rows[0].HIREDATE,
            branchId: newAgent.rows[0].BRANCHID,
            branchName: newAgent.rows[0].BRANCHNAME
        });
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { fullName, phone, email, hireDate, branchId } = req.body;
        const updates = [];
        const binds = { id: parseInt(id) };

        if (fullName !== undefined) { updates.push('FullName = :fullName'); binds.fullName = fullName; }
        if (phone !== undefined) { updates.push('Phone = :phone'); binds.phone = phone; }
        if (email !== undefined) { updates.push('Email = :email'); binds.email = email; }
        if (hireDate !== undefined) { updates.push('HireDate = TO_DATE(:hireDate, \'YYYY-MM-DD\')'); binds.hireDate = hireDate; }
        if (branchId !== undefined) { updates.push('BranchID = :branchId'); binds.branchId = branchId; }

        if (updates.length === 0) {
            return res.status(400).json({
                error: { code: 'VALIDATION', message: 'No fields to update', details: {} }
            });
        }

        const sql = `UPDATE Agent SET ${updates.join(', ')} WHERE AgentID = :id`;
        await db.execute(sql, binds, { autoCommit: true, auditUserId: req.user.USERID });

        const updated = await db.execute(
            `SELECT a.AgentID, a.FullName, a.Phone, a.Email, a.HireDate, a.BranchID, b.Name as BranchName
             FROM Agent a LEFT JOIN Branch b ON a.BranchID = b.BranchID WHERE a.AgentID = :id`,
            { id: parseInt(id) }
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Agent not found', details: {} }
            });
        }

        const row = updated.rows[0];
        res.json({
            agentId: row.AGENTID,
            fullName: row.FULLNAME,
            phone: row.PHONE,
            email: row.EMAIL,
            hireDate: row.HIREDATE,
            branchId: row.BRANCHID,
            branchName: row.BRANCHNAME
        });
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.execute(
            `DELETE FROM Agent WHERE AgentID = :id`,
            { id: parseInt(id) },
            { autoCommit: true, auditUserId: req.user.USERID }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Agent not found', details: {} }
            });
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

module.exports = { getAll, getById, create, update, remove };

