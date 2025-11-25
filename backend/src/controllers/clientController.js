const db = require('../config/database');

/**
 * Отримати всіх клієнтів з пагінацією та фільтрами
 */
const getAll = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const name = req.query.name || '';
        const phone = req.query.phone || '';
        const email = req.query.email || '';

        let sql = `SELECT ClientID, LastName, FirstName, MiddleName, Address, Phone, Email FROM Client WHERE 1=1`;
        const binds = {};

        if (name) {
            sql += ` AND (UPPER(LastName) LIKE UPPER(:name) OR UPPER(FirstName) LIKE UPPER(:name))`;
            binds.name = `%${name}%`;
        }
        if (phone) {
            sql += ` AND Phone LIKE :phone`;
            binds.phone = `%${phone}%`;
        }
        if (email) {
            sql += ` AND UPPER(Email) LIKE UPPER(:email)`;
            binds.email = `%${email}%`;
        }

        // Розмежування доступу за ролями
        if (req.user.ROLE === 'Agent') {
            sql += ` AND ClientID IN (SELECT DISTINCT ClientID FROM Contract WHERE AgentID = :agentId)`;
            binds.agentId = req.user.AGENTID;
        } else if (req.user.ROLE === 'Client') {
            sql += ` AND Email = :userEmail`;
            binds.userEmail = req.user.EMAIL;
        }

        sql += ` ORDER BY ClientID DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;

        const result = await db.execute(sql, {
            ...binds,
            offset,
            limit
        });

        // Отримати загальну кількість записів
        let countSql = `SELECT COUNT(*) as TOTAL FROM Client WHERE 1=1`;
        if (name) countSql += ` AND (UPPER(LastName) LIKE UPPER(:name) OR UPPER(FirstName) LIKE UPPER(:name))`;
        if (phone) countSql += ` AND Phone LIKE :phone`;
        if (email) countSql += ` AND UPPER(Email) LIKE UPPER(:email)`;
        if (req.user.ROLE === 'Agent') {
            countSql += ` AND ClientID IN (SELECT DISTINCT ClientID FROM Contract WHERE AgentID = :agentId)`;
        } else if (req.user.ROLE === 'Client') {
            countSql += ` AND Email = :userEmail`;
        }

        const countResult = await db.execute(countSql, binds);
        const total = countResult.rows[0].TOTAL;

        res.json({
            data: result.rows.map(row => ({
                clientId: row.CLIENTID,
                lastName: row.LASTNAME,
                firstName: row.FIRSTNAME,
                middleName: row.MIDDLENAME,
                address: row.ADDRESS,
                phone: row.PHONE,
                email: row.EMAIL
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
 * Отримати клієнта за ідентифікатором
 */
const getById = async (req, res, next) => {
    try {
        const { id } = req.params;

        let sql = `SELECT ClientID, LastName, FirstName, MiddleName, Address, Phone, Email FROM Client WHERE ClientID = :id`;
        const binds = { id: parseInt(id) };

        // Розмежування доступу за ролями
        if (req.user.ROLE === 'Agent') {
            sql += ` AND ClientID IN (SELECT DISTINCT ClientID FROM Contract WHERE AgentID = :agentId)`;
            binds.agentId = req.user.AGENTID;
        } else if (req.user.ROLE === 'Client') {
            sql += ` AND Email = :userEmail`;
            binds.userEmail = req.user.EMAIL;
        }

        const result = await db.execute(sql, binds);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Client not found',
                    details: {}
                }
            });
        }

        const row = result.rows[0];
        res.json({
            clientId: row.CLIENTID,
            lastName: row.LASTNAME,
            firstName: row.FIRSTNAME,
            middleName: row.MIDDLENAME,
            address: row.ADDRESS,
            phone: row.PHONE,
            email: row.EMAIL
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Створити клієнта
 */
const create = async (req, res, next) => {
    try {
        const { lastName, firstName, middleName, address, phone, email } = req.body;

        const result = await db.execute(
            `INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email)
             VALUES (seq_client_id.NEXTVAL, :lastName, :firstName, :middleName, :address, :phone, :email)`,
            {
                lastName,
                firstName,
                middleName: middleName || null,
                address: address || null,
                phone: phone || null,
                email: email || null
            },
            { autoCommit: true, auditUserId: req.user.USERID }
        );

        // Отримати щойно створеного клієнта
        const newClient = await db.execute(
            `SELECT ClientID, LastName, FirstName, MiddleName, Address, Phone, Email 
             FROM Client WHERE LastName = :lastName AND FirstName = :firstName 
             ORDER BY ClientID DESC FETCH FIRST 1 ROWS ONLY`,
            { lastName, firstName }
        );

        res.status(201).json({
            clientId: newClient.rows[0].CLIENTID,
            lastName: newClient.rows[0].LASTNAME,
            firstName: newClient.rows[0].FIRSTNAME,
            middleName: newClient.rows[0].MIDDLENAME,
            address: newClient.rows[0].ADDRESS,
            phone: newClient.rows[0].PHONE,
            email: newClient.rows[0].EMAIL
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Оновити дані клієнта
 */
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { lastName, firstName, middleName, address, phone, email } = req.body;

        // Побудувати динамічний SQL для оновлення
        const updates = [];
        const binds = { id: parseInt(id) };

        if (lastName !== undefined) {
            updates.push('LastName = :lastName');
            binds.lastName = lastName;
        }
        if (firstName !== undefined) {
            updates.push('FirstName = :firstName');
            binds.firstName = firstName;
        }
        if (middleName !== undefined) {
            updates.push('MiddleName = :middleName');
            binds.middleName = middleName;
        }
        if (address !== undefined) {
            updates.push('Address = :address');
            binds.address = address;
        }
        if (phone !== undefined) {
            updates.push('Phone = :phone');
            binds.phone = phone;
        }
        if (email !== undefined) {
            updates.push('Email = :email');
            binds.email = email;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION',
                    message: 'No fields to update',
                    details: {}
                }
            });
        }

        const sql = `UPDATE Client SET ${updates.join(', ')} WHERE ClientID = :id`;
        const result = await db.execute(sql, binds, { autoCommit: true, auditUserId: req.user.USERID });

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Client not found',
                    details: {}
                }
            });
        }

        const updated = await db.execute(
            `SELECT ClientID, LastName, FirstName, MiddleName, Address, Phone, Email FROM Client WHERE ClientID = :id`,
            { id: parseInt(id) }
        );

        res.json({
            clientId: updated.rows[0].CLIENTID,
            lastName: updated.rows[0].LASTNAME,
            firstName: updated.rows[0].FIRSTNAME,
            middleName: updated.rows[0].MIDDLENAME,
            address: updated.rows[0].ADDRESS,
            phone: updated.rows[0].PHONE,
            email: updated.rows[0].EMAIL
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Видалити клієнта
 */
const remove = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.execute(
            `DELETE FROM Client WHERE ClientID = :id`,
            { id: parseInt(id) },
            { autoCommit: true, auditUserId: req.user.USERID }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Client not found',
                    details: {}
                }
            });
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

/**
 * Отримати договори клієнта
 */
const getContracts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const activeOnly = req.query.activeOnly === 'true';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        let sql = `SELECT c.ContractID, c.ClientID, c.AgentID, c.InsuranceTypeID, 
                          c.StartDate, c.EndDate, c.InsuranceAmount, c.ContributionAmount, 
                          c.AgentPercent, c.Status
                   FROM Contract c
                   WHERE c.ClientID = :clientId`;
        const binds = { clientId: parseInt(id) };

        // Розмежування доступу за ролями
        if (req.user.ROLE === 'Client') {
            const clientCheck = await db.execute(
                `SELECT ClientID FROM Client WHERE ClientID = :id AND Email = :email`,
                { id: parseInt(id), email: req.user.EMAIL }
            );
            if (clientCheck.rows.length === 0) {
                return res.status(403).json({
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Access denied',
                        details: {}
                    }
                });
            }
        } else if (req.user.ROLE === 'Agent') {
            sql += ` AND c.AgentID = :agentId`;
            binds.agentId = req.user.AGENTID;
        }

        if (activeOnly) {
            sql += ` AND c.Status = 'Active' AND c.EndDate >= SYSDATE`;
        }

        sql += ` ORDER BY c.StartDate DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;

        const result = await db.execute(sql, {
            ...binds,
            offset,
            limit
        });

        // Отримати загальну кількість записів
        let countSql = `SELECT COUNT(*) as TOTAL FROM Contract WHERE ClientID = :clientId`;
        if (req.user.ROLE === 'Agent') {
            countSql += ` AND AgentID = :agentId`;
        }
        if (activeOnly) {
            countSql += ` AND Status = 'Active' AND EndDate >= SYSDATE`;
        }
        const countResult = await db.execute(countSql, binds);
        const total = countResult.rows[0].TOTAL;

        res.json({
            data: result.rows.map(row => ({
                contractId: row.CONTRACTID,
                clientId: row.CLIENTID,
                agentId: row.AGENTID,
                insuranceTypeId: row.INSURANCETYPEID,
                startDate: row.STARTDATE,
                endDate: row.ENDDATE,
                insuranceAmount: row.INSURANCEAMOUNT,
                contributionAmount: row.CONTRIBUTIONAMOUNT,
                agentPercent: row.AGENTPERCENT,
                status: row.STATUS
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

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    getContracts
};

