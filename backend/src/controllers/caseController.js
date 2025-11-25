const db = require('../config/database');

const getAll = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const contractId = req.query.contractId;
        const from = req.query.from;
        const to = req.query.to;

        let sql = `
            SELECT ic.CaseID, ic.ContractID, ic.CaseDate, ic.ActNumber, ic.DamageLevel,
                   ic.AccruedPayment, ic.AccruedDate, ic.PaymentDate
            FROM InsuranceCase ic
            JOIN Contract c ON ic.ContractID = c.ContractID
            WHERE 1=1
        `;
        /*
         * SELECT ... – обираємо всі ключові поля страхового випадку.
         * FROM InsuranceCase ic – працюємо з таблицею страхових випадків як основною.
         * JOIN Contract ... – приєднуємо договори, щоб мати доступ до клієнтів/агентів.
         * WHERE 1=1 – технічний вираз, що дозволяє гнучко додавати умови.
         */
        const binds = {};

        if (contractId) {
            sql += ` AND ic.ContractID = :contractId`;
            // AND ic.ContractID ... – залишаємо тільки випадки певного договору
            binds.contractId = parseInt(contractId);
        }
        if (from) {
            sql += ` AND ic.CaseDate >= TO_DATE(:from, 'YYYY-MM-DD')`;
            // AND ic.CaseDate >= ... – беремо записи починаючи з указаного дня
            binds.from = from;
        }
        if (to) {
            sql += ` AND ic.CaseDate <= TO_DATE(:to, 'YYYY-MM-DD')`;
            // AND ic.CaseDate <= ... – обмежуємо вибірку кінцевою датою
            binds.to = to;
        }

        // Розмежування доступу за ролями
        if (req.user.ROLE === 'Agent') {
            sql += ` AND c.AgentID = :agentId -- Агенти бачать тільки свої випадки`;
            binds.agentId = req.user.AGENTID;
        } else if (req.user.ROLE === 'Client') {
            const clientResult = await db.execute(
                `SELECT ClientID
                 FROM Client
                 WHERE Email = :email`,
                { email: req.user.EMAIL }
            );
            /*
             * SELECT ClientID ... – визначаємо ID клієнта за email авторизованого користувача,
             * щоб потім обмежити вибірку випадків лише його договорами.
             */
            if (clientResult.rows.length > 0) {
                sql += ` AND c.ClientID = :clientId`;
                // AND c.ClientID ... – клієнт бачить лише випадки своїх договорів
                binds.clientId = clientResult.rows[0].CLIENTID;
            } else {
                return res.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
            }
        }

        sql += ` ORDER BY ic.CaseID DESC
                 OFFSET :offset ROWS
                 FETCH NEXT :limit ROWS ONLY`;
        /*
         * ORDER BY ic.CaseID DESC – найновіші випадки відображаються першими.
         * OFFSET ... – пропускаємо записи попередніх сторінок.
         * FETCH NEXT ... – беремо лише потрібну кількість рядків для поточної сторінки.
         */

        const result = await db.execute(sql, { ...binds, offset, limit });

        let countSql = `
            SELECT COUNT(*) as TOTAL
            FROM InsuranceCase ic
            JOIN Contract c ON ic.ContractID = c.ContractID
            WHERE 1=1
        `;
        /*
         * SELECT COUNT(*) ... – підраховуємо загальну кількість рядків для пагінації.
         * FROM InsuranceCase ... JOIN Contract ... – враховуємо ті ж самі зв'язки, що й у основному запиті.
         * WHERE 1=1 – базовий вираз для подальшого додавання умов.
         */
        if (contractId) {
            countSql += ` AND ic.ContractID = :contractId`;
            // AND ic.ContractID ... – враховуємо лише випадки конкретного договору
        }
        if (from) {
            countSql += ` AND ic.CaseDate >= TO_DATE(:from, 'YYYY-MM-DD')`;
            // AND ic.CaseDate >= ... – застосовуємо початкову дату
        }
        if (to) {
            countSql += ` AND ic.CaseDate <= TO_DATE(:to, 'YYYY-MM-DD')`;
            // AND ic.CaseDate <= ... – застосовуємо кінцеву дату
        }
        if (req.user.ROLE === 'Agent') {
            countSql += ` AND c.AgentID = :agentId`;
            // AND c.AgentID ... – підраховуємо лише записи агента
        }
        if (req.user.ROLE === 'Client' && binds.clientId) {
            countSql += ` AND c.ClientID = :clientId`;
            // AND c.ClientID ... – підраховуємо лише записи клієнта
        }

        const countResult = await db.execute(countSql, binds);
        const total = countResult.rows[0].TOTAL;

        res.json({
            data: result.rows.map(row => ({
                caseId: row.CASEID,
                contractId: row.CONTRACTID,
                caseDate: row.CASEDATE,
                actNumber: row.ACTNUMBER,
                damageLevel: row.DAMAGELEVEL,
                accruedPayment: row.ACCRUEDPAYMENT,
                accruedDate: row.ACCRUEDDATE,
                paymentDate: row.PAYMENTDATE
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
            SELECT ic.CaseID, ic.ContractID, ic.CaseDate, ic.ActNumber, ic.DamageLevel,
                   ic.AccruedPayment, ic.AccruedDate, ic.PaymentDate
            FROM InsuranceCase ic
            JOIN Contract c ON ic.ContractID = c.ContractID
            WHERE ic.CaseID = :id
        `;
        /*
         * SELECT ... – забираємо всі ключові поля конкретного страхового випадку.
         * FROM InsuranceCase ... JOIN Contract ... – поєднуємо з договорами для контролю доступу.
         * WHERE ic.CaseID = :id – обмежуємо запит одним записом за переданим ID.
         */
        const binds = { id: parseInt(id) };

        if (req.user.ROLE === 'Agent') {
            sql += ` AND c.AgentID = :agentId`;
            // AND c.AgentID ... – агент бачить тільки свої випадки
            binds.agentId = req.user.AGENTID;
        } else if (req.user.ROLE === 'Client') {
            const clientResult = await db.execute(
                `SELECT ClientID
                 FROM Client
                 WHERE Email = :email`,
                { email: req.user.EMAIL }
            );
            /*
             * SELECT ClientID ... – визначаємо, якому клієнту належить email користувача,
             * щоб обмежити доступ тільки його договорами.
             */
            if (clientResult.rows.length > 0) {
                sql += ` AND c.ClientID = :clientId`;
                binds.clientId = clientResult.rows[0].CLIENTID;
            }
        }

        const result = await db.execute(sql, binds);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Insurance case not found', details: {} }
            });
        }

        const row = result.rows[0];
        res.json({
            caseId: row.CASEID,
            contractId: row.CONTRACTID,
            caseDate: row.CASEDATE,
            actNumber: row.ACTNUMBER,
            damageLevel: row.DAMAGELEVEL,
            accruedPayment: row.ACCRUEDPAYMENT,
            accruedDate: row.ACCRUEDDATE,
            paymentDate: row.PAYMENTDATE
        });
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { contractId, caseDate, actNumber, damageLevel, paymentDate } = req.body;

        // Перевіряємо, чи має користувач доступ до договору
        if (req.user.ROLE === 'Agent') {
            const contractCheck = await db.execute(
                `SELECT ContractID
                 FROM Contract
                 WHERE ContractID = :contractId AND AgentID = :agentId`,
                { contractId, agentId: req.user.AGENTID }
            );
            /*
             * SELECT ContractID ... – перевіряємо, чи справді цей договір закріплений за агентом,
             * щоб він не міг створити випадок для чужого клієнта.
             */
            if (contractCheck.rows.length === 0) {
                return res.status(403).json({
                    error: { code: 'FORBIDDEN', message: 'Access denied to this contract', details: {} }
                });
            }
        }

        const result = await db.execute(
            `INSERT INTO InsuranceCase (CaseID, ContractID, CaseDate, ActNumber, DamageLevel, PaymentDate)
             VALUES (seq_case_id.NEXTVAL,
                     :contractId,
                     TO_DATE(:caseDate, 'YYYY-MM-DD'),
                     :actNumber,
                     :damageLevel,
                     CASE WHEN :paymentDate IS NOT NULL THEN TO_DATE(:paymentDate, 'YYYY-MM-DD') ELSE NULL END)`,
            {
                contractId,
                caseDate,
                actNumber,
                damageLevel,
                paymentDate: paymentDate || null
            },
            { autoCommit: true, auditUserId: req.user.USERID }
        );
        /*
         * INSERT INTO ... – створюємо новий страховий випадок.
         * seq_case_id.NEXTVAL – генеруємо унікальний ідентифікатор.
         * TO_DATE(...) – приводимо текстові дати до формату DATE.
         * CASE WHEN ... – записуємо дату виплати лише якщо вона передана.
         */

        // Отримуємо створений випадок (разом з обчисленими полями)
        const newCase = await db.execute(
            `SELECT CaseID, ContractID, CaseDate, ActNumber, DamageLevel,
                    AccruedPayment, AccruedDate, PaymentDate
             FROM InsuranceCase
             WHERE CaseID = (SELECT MAX(CaseID) FROM InsuranceCase)`
        );
        /*
         * SELECT ... – підтягуємо всі поля нового запису.
         * WHERE CaseID = (SELECT MAX...) – покладаємось на те, що щойно створений запис має найбільший ідентифікатор.
         */

        res.status(201).json({
            caseId: newCase.rows[0].CASEID,
            contractId: newCase.rows[0].CONTRACTID,
            caseDate: newCase.rows[0].CASEDATE,
            actNumber: newCase.rows[0].ACTNUMBER,
            damageLevel: newCase.rows[0].DAMAGELEVEL,
            accruedPayment: newCase.rows[0].ACCRUEDPAYMENT,
            accruedDate: newCase.rows[0].ACCRUEDDATE,
            paymentDate: newCase.rows[0].PAYMENTDATE
        });
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { contractId, caseDate, actNumber, damageLevel, paymentDate } = req.body;
        const updates = [];
        const binds = { id: parseInt(id) };

        if (contractId !== undefined) { updates.push('ContractID = :contractId'); binds.contractId = contractId; }
        if (caseDate !== undefined) { updates.push('CaseDate = TO_DATE(:caseDate, \'YYYY-MM-DD\')'); binds.caseDate = caseDate; }
        if (actNumber !== undefined) { updates.push('ActNumber = :actNumber'); binds.actNumber = actNumber; }
        if (damageLevel !== undefined) { updates.push('DamageLevel = :damageLevel'); binds.damageLevel = damageLevel; }
        if (paymentDate !== undefined) {
            if (paymentDate === null) {
                updates.push('PaymentDate = NULL');
            } else {
                updates.push('PaymentDate = TO_DATE(:paymentDate, \'YYYY-MM-DD\')');
                binds.paymentDate = paymentDate;
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: { code: 'VALIDATION', message: 'No fields to update', details: {} }
            });
        }

        await db.execute(
            `UPDATE InsuranceCase SET ${updates.join(', ')}
             WHERE CaseID = :id`,
            binds,
            { autoCommit: true, auditUserId: req.user.USERID }
        );
        /*
         * UPDATE ... – змінюємо тільки ті поля, які надійшли у запиті.
         * WHERE CaseID = :id – оновлюємо конкретний запис за його ідентифікатором.
         */

        const updated = await db.execute(
            `SELECT CaseID, ContractID, CaseDate, ActNumber, DamageLevel,
                    AccruedPayment, AccruedDate, PaymentDate
             FROM InsuranceCase
             WHERE CaseID = :id`,
            { id: parseInt(id) }
        );
        /*
         * SELECT ... – повертаємо оновлені дані, щоб клієнт одразу отримав актуальний стан запису.
         */

        if (updated.rows.length === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Insurance case not found', details: {} }
            });
        }

        const row = updated.rows[0];
        res.json({
            caseId: row.CASEID,
            contractId: row.CONTRACTID,
            caseDate: row.CASEDATE,
            actNumber: row.ACTNUMBER,
            damageLevel: row.DAMAGELEVEL,
            accruedPayment: row.ACCRUEDPAYMENT,
            accruedDate: row.ACCRUEDDATE,
            paymentDate: row.PAYMENTDATE
        });
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.execute(
            `DELETE FROM InsuranceCase
             WHERE CaseID = :id`,
            { id: parseInt(id) },
            { autoCommit: true, auditUserId: req.user.USERID }
        );
        /*
         * DELETE FROM ... – прибираємо запис зі страховими випадками.
         * WHERE CaseID = :id – видаляємо саме той випадок, який попросив користувач.
         */

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Insurance case not found', details: {} }
            });
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

module.exports = { getAll, getById, create, update, remove };

