const db = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const clientId = req.query.clientId;
        const agentId = req.query.agentId;
        const status = req.query.status;
        const from = req.query.from;
        const to = req.query.to;

        let sql = `
            SELECT ContractID, ClientID, AgentID, InsuranceTypeID, StartDate, EndDate,
                   InsuranceAmount, ContributionAmount, AgentPercent, Status
            FROM Contract
            WHERE 1=1
        `;
        /*
         * SELECT ... – забираємо всі ключові реквізити договору (дати, суми, ставки, статус).
         * FROM Contract – беремо дані з таблиці договорів.
         * WHERE 1=1 – технічний вираз для гнучкого додавання подальших умов.
         */
        const binds = {};

        if (clientId) {
            sql += ` AND ClientID = :clientId`;
            // AND ClientID ... – залишаємо договори конкретного клієнта
            binds.clientId = parseInt(clientId);
        }
        if (agentId) {
            sql += ` AND AgentID = :agentId`;
            // AND AgentID ... – фільтруємо за агентом
            binds.agentId = parseInt(agentId);
        }
        if (status) {
            sql += ` AND Status = :status`;
            // AND Status ... – беремо договори з певним статусом
            binds.status = status;
        }
        if (from) {
            sql += ` AND StartDate >= TO_DATE(:from, 'YYYY-MM-DD')`;
            // AND StartDate >= ... – обмежуємо нижньою датою початку
            binds.from = from;
        }
        if (to) {
            sql += ` AND EndDate <= TO_DATE(:to, 'YYYY-MM-DD')`;
            // AND EndDate <= ... – обмежуємо верхньою датою завершення
            binds.to = to;
        }

        // Розмежування доступу за ролями
        if (req.user.ROLE === 'Agent') {
            sql += ` AND AgentID = :userAgentId`;
            binds.userAgentId = req.user.AGENTID;
        } else if (req.user.ROLE === 'Client') {
            const clientResult = await db.execute(
                `SELECT ClientID FROM Client WHERE Email = :email`,
                { email: req.user.EMAIL }
            );
            /*
             * SELECT ClientID ... – визначаємо, якому клієнту належить email авторизованого користувача,
             * щоб обмежити видачу тільки його договорами.
             */
            if (clientResult.rows.length > 0) {
                sql += ` AND ClientID = :userClientId`;
                // AND ClientID ... – клієнт бачить лише власні договори
                binds.userClientId = clientResult.rows[0].CLIENTID;
            } else {
                return res.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
            }
        }

        sql += ` ORDER BY ContractID DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
        /*
         * ORDER BY ContractID DESC – показуємо найновіші договори першими.
         * OFFSET ... / FETCH ... – реалізація пагінації.
         */

        const result = await db.execute(sql, { ...binds, offset, limit });

        let countSql = `
            SELECT COUNT(*) as TOTAL
            FROM Contract
            WHERE 1=1
        `;
        /*
         * SELECT COUNT(*) ... – підраховуємо кількість договорів для побудови пагінації.
         * FROM Contract – використовуємо ту саму таблицю, що й у основному запиті.
         * WHERE 1=1 – база для додавання тих самих фільтрів, що й вище.
         */
        if (clientId) countSql += ` AND ClientID = :clientId`; // обмежуємо підрахунок клієнтом
        if (agentId) countSql += ` AND AgentID = :agentId`; // рахуємо тільки договори агента
        if (status) countSql += ` AND Status = :status`; // враховуємо лише вибраний статус
        if (from) countSql += ` AND StartDate >= TO_DATE(:from, 'YYYY-MM-DD')`; // нижня межа дати старту
        if (to) countSql += ` AND EndDate <= TO_DATE(:to, 'YYYY-MM-DD')`; // верхня межа дати завершення
        if (req.user.ROLE === 'Agent') countSql += ` AND AgentID = :userAgentId`; // агент бачить тільки свої договори
        if (req.user.ROLE === 'Client' && binds.userClientId) countSql += ` AND ClientID = :userClientId`; // клієнт – тільки свої

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
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        let sql = `
            SELECT ContractID, ClientID, AgentID, InsuranceTypeID, StartDate, EndDate,
                   InsuranceAmount, ContributionAmount, AgentPercent, Status
            FROM Contract
            WHERE ContractID = :id
        `;
        /*
         * SELECT ... – підтягуємо повну інформацію про конкретний договір.
         * WHERE ContractID = :id – шукаємо запис за переданим ідентифікатором.
         */
        const binds = { id: parseInt(id) };

        if (req.user.ROLE === 'Agent') {
            sql += ` AND AgentID = :agentId`;
            // AND AgentID ... – агент може читати тільки свої договори
            binds.agentId = req.user.AGENTID;
        } else if (req.user.ROLE === 'Client') {
            const clientResult = await db.execute(
                `SELECT ClientID FROM Client WHERE Email = :email`,
                { email: req.user.EMAIL }
            );
            /*
             * SELECT ClientID ... – визначаємо клієнта за email, щоб обмежити доступ.
             */
            if (clientResult.rows.length > 0) {
                sql += ` AND ClientID = :clientId`;
                // AND ClientID ... – клієнт отримує лише власний договір
                binds.clientId = clientResult.rows[0].CLIENTID;
            }
        }

        const result = await db.execute(sql, binds);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Contract not found', details: {} }
            });
        }

        const row = result.rows[0];
        res.json({
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
        });
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { clientId, agentId, insuranceTypeId, startDate, endDate, insuranceAmount, agentPercent, status } = req.body;

        // Розмежування прав на створення за ролями
        if (req.user.ROLE === 'Agent' && agentId !== req.user.AGENTID) {
            return res.status(403).json({
                error: { code: 'FORBIDDEN', message: 'Cannot create contract for another agent', details: {} }
            });
        }

        const result = await db.execute(
            `INSERT INTO Contract (ContractID, ClientID, AgentID, InsuranceTypeID, StartDate, EndDate,
                                   InsuranceAmount, AgentPercent, Status)
             VALUES (seq_contract_id.NEXTVAL, :clientId, :agentId, :insuranceTypeId,
                     TO_DATE(:startDate, 'YYYY-MM-DD'), TO_DATE(:endDate, 'YYYY-MM-DD'),
                     :insuranceAmount, :agentPercent, :status)`,
            {
                clientId,
                agentId,
                insuranceTypeId,
                startDate,
                endDate,
                insuranceAmount,
                agentPercent: agentPercent || null,
                status: status || 'Draft'
            },
            { autoCommit: true, auditUserId: req.user.USERID }
        );
        /*
         * INSERT INTO Contract ... – створюємо новий договір.
         * seq_contract_id.NEXTVAL – генеруємо унікальний ContractID.
         * TO_DATE(...) – коректно зберігаємо дати початку та завершення.
         */

        // Отримуємо створений договір (разом з обчисленими полями)
        const newContract = await db.execute(
            `SELECT ContractID, ClientID, AgentID, InsuranceTypeID, StartDate, EndDate,
                    InsuranceAmount, ContributionAmount, AgentPercent, Status
             FROM Contract WHERE ContractID = (SELECT MAX(ContractID) FROM Contract)`
        );
        /*
         * SELECT ... WHERE ContractID = (SELECT MAX...) – підтягуємо щойно створений запис,
         * щоб одразу повернути його клієнту (припускаючи, що має найбільший ID).
         */

        res.status(201).json({
            contractId: newContract.rows[0].CONTRACTID,
            clientId: newContract.rows[0].CLIENTID,
            agentId: newContract.rows[0].AGENTID,
            insuranceTypeId: newContract.rows[0].INSURANCETYPEID,
            startDate: newContract.rows[0].STARTDATE,
            endDate: newContract.rows[0].ENDDATE,
            insuranceAmount: newContract.rows[0].INSURANCEAMOUNT,
            contributionAmount: newContract.rows[0].CONTRIBUTIONAMOUNT,
            agentPercent: newContract.rows[0].AGENTPERCENT,
            status: newContract.rows[0].STATUS
        });
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { clientId, agentId, insuranceTypeId, startDate, endDate, insuranceAmount, agentPercent, status } = req.body;
        const updates = [];
        const binds = { id: parseInt(id) };

        if (clientId !== undefined) { updates.push('ClientID = :clientId'); binds.clientId = clientId; }
        if (agentId !== undefined) { updates.push('AgentID = :agentId'); binds.agentId = agentId; }
        if (insuranceTypeId !== undefined) { updates.push('InsuranceTypeID = :insuranceTypeId'); binds.insuranceTypeId = insuranceTypeId; }
        if (startDate !== undefined) { updates.push('StartDate = TO_DATE(:startDate, \'YYYY-MM-DD\')'); binds.startDate = startDate; }
        if (endDate !== undefined) { updates.push('EndDate = TO_DATE(:endDate, \'YYYY-MM-DD\')'); binds.endDate = endDate; }
        if (insuranceAmount !== undefined) { updates.push('InsuranceAmount = :insuranceAmount'); binds.insuranceAmount = insuranceAmount; }
        if (agentPercent !== undefined) { updates.push('AgentPercent = :agentPercent'); binds.agentPercent = agentPercent; }
        if (status !== undefined) { updates.push('Status = :status'); binds.status = status; }

        if (updates.length === 0) {
            return res.status(400).json({
                error: { code: 'VALIDATION', message: 'No fields to update', details: {} }
            });
        }

        await db.execute(
            `UPDATE Contract SET ${updates.join(', ')} WHERE ContractID = :id`,
            binds,
            { autoCommit: true, auditUserId: req.user.USERID }
        );
        /*
         * UPDATE Contract ... – змінюємо лише ті поля, які прийшли в запиті.
         * WHERE ContractID = :id – працюємо з конкретним договором.
         */

        const updated = await db.execute(
            `SELECT ContractID, ClientID, AgentID, InsuranceTypeID, StartDate, EndDate,
                    InsuranceAmount, ContributionAmount, AgentPercent, Status
             FROM Contract WHERE ContractID = :id`,
            { id: parseInt(id) }
        );
        /*
         * SELECT ... – повертаємо оновлену версію договору, щоб клієнт побачив актуальні дані.
         */

        if (updated.rows.length === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Contract not found', details: {} }
            });
        }

        const row = updated.rows[0];
        res.json({
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
        });
    } catch (err) {
        next(err);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const result = await db.execute(
            `UPDATE Contract SET Status = :status WHERE ContractID = :id`,
            { status, id: parseInt(id) },
            { autoCommit: true, auditUserId: req.user.USERID }
        );
        /*
         * UPDATE Contract SET Status ... – змінюємо лише статус договору.
         * WHERE ContractID = :id – застосовуємо до конкретного договору.
         */

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Contract not found', details: {} }
            });
        }

        const updated = await db.execute(
            `SELECT ContractID, Status FROM Contract WHERE ContractID = :id`,
            { id: parseInt(id) }
        );
        /*
         * SELECT ContractID, Status ... – повертаємо коротку відповідь із новим статусом.
         */

        res.json({
            contractId: updated.rows[0].CONTRACTID,
            status: updated.rows[0].STATUS
        });
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.execute(
            `DELETE FROM Contract WHERE ContractID = :id`,
            { id: parseInt(id) },
            { autoCommit: true, auditUserId: req.user.USERID }
        );
        /*
         * DELETE FROM Contract ... – видаляємо договір із бази.
         * WHERE ContractID = :id – працюємо з конкретним записом.
         */

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Contract not found', details: {} }
            });
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

module.exports = { getAll, getById, create, update, updateStatus, remove };

