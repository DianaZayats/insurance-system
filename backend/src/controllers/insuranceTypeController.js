const db = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const name = req.query.name || '';

        let sql = `SELECT InsuranceTypeID, Name, Description, BaseRate, PayoutCoeff, AgentPercentDefault
                   FROM InsuranceType WHERE 1=1`;
        const binds = {};

        if (name) {
            sql += ` AND UPPER(Name) LIKE UPPER(:name)`;
            binds.name = `%${name}%`;
        }

        sql += ` ORDER BY Name OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;

        const result = await db.execute(sql, { ...binds, offset, limit });

        let countSql = `SELECT COUNT(*) as TOTAL FROM InsuranceType WHERE 1=1`;
        if (name) countSql += ` AND UPPER(Name) LIKE UPPER(:name)`;
        const countResult = await db.execute(countSql, binds);
        const total = countResult.rows[0].TOTAL;

        res.json({
            data: result.rows.map(row => ({
                insuranceTypeId: row.INSURANCETYPEID,
                name: row.NAME,
                description: row.DESCRIPTION,
                baseRate: row.BASERATE,
                payoutCoeff: row.PAYOUTCOEFF,
                agentPercentDefault: row.AGENTPERCENTDEFAULT
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
            `SELECT InsuranceTypeID, Name, Description, BaseRate, PayoutCoeff, AgentPercentDefault
             FROM InsuranceType WHERE InsuranceTypeID = :id`,
            { id: parseInt(id) }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Insurance type not found', details: {} }
            });
        }

        const row = result.rows[0];
        res.json({
            insuranceTypeId: row.INSURANCETYPEID,
            name: row.NAME,
            description: row.DESCRIPTION,
            baseRate: row.BASERATE,
            payoutCoeff: row.PAYOUTCOEFF,
            agentPercentDefault: row.AGENTPERCENTDEFAULT
        });
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { name, description, baseRate, payoutCoeff, agentPercentDefault } = req.body;
        await db.execute(
            `INSERT INTO InsuranceType (InsuranceTypeID, Name, Description, BaseRate, PayoutCoeff, AgentPercentDefault)
             VALUES (seq_insurance_type_id.NEXTVAL, :name, :description, :baseRate, :payoutCoeff, :agentPercentDefault)`,
            {
                name,
                description: description || null,
                baseRate,
                payoutCoeff,
                agentPercentDefault
            },
            { autoCommit: true }
        );

        const newType = await db.execute(
            `SELECT InsuranceTypeID, Name, Description, BaseRate, PayoutCoeff, AgentPercentDefault
             FROM InsuranceType WHERE Name = :name ORDER BY InsuranceTypeID DESC FETCH FIRST 1 ROWS ONLY`,
            { name }
        );

        res.status(201).json({
            insuranceTypeId: newType.rows[0].INSURANCETYPEID,
            name: newType.rows[0].NAME,
            description: newType.rows[0].DESCRIPTION,
            baseRate: newType.rows[0].BASERATE,
            payoutCoeff: newType.rows[0].PAYOUTCOEFF,
            agentPercentDefault: newType.rows[0].AGENTPERCENTDEFAULT
        });
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, baseRate, payoutCoeff, agentPercentDefault } = req.body;
        const updates = [];
        const binds = { id: parseInt(id) };

        if (name !== undefined) { updates.push('Name = :name'); binds.name = name; }
        if (description !== undefined) { updates.push('Description = :description'); binds.description = description; }
        if (baseRate !== undefined) { updates.push('BaseRate = :baseRate'); binds.baseRate = baseRate; }
        if (payoutCoeff !== undefined) { updates.push('PayoutCoeff = :payoutCoeff'); binds.payoutCoeff = payoutCoeff; }
        if (agentPercentDefault !== undefined) { updates.push('AgentPercentDefault = :agentPercentDefault'); binds.agentPercentDefault = agentPercentDefault; }

        if (updates.length === 0) {
            return res.status(400).json({
                error: { code: 'VALIDATION', message: 'No fields to update', details: {} }
            });
        }

        await db.execute(`UPDATE InsuranceType SET ${updates.join(', ')} WHERE InsuranceTypeID = :id`, binds, { autoCommit: true });

        const updated = await db.execute(
            `SELECT InsuranceTypeID, Name, Description, BaseRate, PayoutCoeff, AgentPercentDefault
             FROM InsuranceType WHERE InsuranceTypeID = :id`,
            { id: parseInt(id) }
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Insurance type not found', details: {} }
            });
        }

        const row = updated.rows[0];
        res.json({
            insuranceTypeId: row.INSURANCETYPEID,
            name: row.NAME,
            description: row.DESCRIPTION,
            baseRate: row.BASERATE,
            payoutCoeff: row.PAYOUTCOEFF,
            agentPercentDefault: row.AGENTPERCENTDEFAULT
        });
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.execute(
            `DELETE FROM InsuranceType WHERE InsuranceTypeID = :id`,
            { id: parseInt(id) },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Insurance type not found', details: {} }
            });
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

module.exports = { getAll, getById, create, update, remove };

