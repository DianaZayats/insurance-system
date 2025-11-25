const db = require('../config/database');

/**
 * Звіт 1: знайти місяць з максимальною сумою страхових внесків
 */
const maxContributionMonth = async (req, res, next) => {
    try {
        const result = await db.execute(
            `SELECT TO_CHAR(StartDate, 'YYYY-MM') as Month,
                    SUM(ContributionAmount) as TotalContributions
             FROM Contract
             WHERE Status != 'Draft'
             GROUP BY TO_CHAR(StartDate, 'YYYY-MM')
             ORDER BY SUM(ContributionAmount) DESC
             FETCH FIRST 1 ROWS ONLY`
        );
        /*
         * SELECT TO_CHAR(StartDate, 'YYYY-MM') ... – групуємо договори за місяцями.
         * SUM(ContributionAmount) – підраховуємо суму внесків за місяць.
         * WHERE Status != 'Draft' – ігноруємо чорнові договори.
         * ORDER BY ... FETCH FIRST 1 – знаходимо місяць із максимальною сумою.
         */

        if (result.rows.length === 0) {
            return res.json({ month: null, totalContributions: 0 });
        }

        res.json({
            month: result.rows[0].MONTH,
            totalContributions: parseFloat(result.rows[0].TOTALCONTRIBUTIONS)
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Звіт 2: підрахунок доходу кожного агента за вказаний місяць
 */
const agentIncome = async (req, res, next) => {
    try {
        const month = req.query.month; // Формат: YYYY-MM
        if (!month) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION',
                    message: 'Month parameter is required (format: YYYY-MM)',
                    details: {}
                }
            });
        }

        const result = await db.execute(
            `SELECT a.AgentID, a.FullName,
                    SUM(c.ContributionAmount * c.AgentPercent) as TotalIncome
             FROM Agent a
             JOIN Contract c ON a.AgentID = c.AgentID
             WHERE TO_CHAR(c.StartDate, 'YYYY-MM') = :month
               AND c.Status != 'Draft'
             GROUP BY a.AgentID, a.FullName
             ORDER BY TotalIncome DESC`,
            { month }
        );
        /*
         * SELECT ... – рахуємо дохід кожного агента за вказаний місяць.
         * SUM(ContributionAmount * AgentPercent) – загальний заробіток агента.
         * WHERE TO_CHAR(...) = :month – фільтр за місяцем у форматі YYYY-MM.
         * AND c.Status != 'Draft' – враховуємо лише реальні договори.
         * ORDER BY TotalIncome DESC – сортуємо від найбільшого доходу.
         */

        res.json({
            month,
            data: result.rows.map(row => ({
                agentId: row.AGENTID,
                fullName: row.FULLNAME,
                totalIncome: parseFloat(row.TOTALINCOME)
            }))
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Звіт 3: визначити для кожного клієнта найпопулярніший тип страхування
 */
const mostDemandedTypePerClient = async (req, res, next) => {
    try {
        const result = await db.execute(
            `WITH ClientTypeCounts AS (
                SELECT c.ClientID, c.LastName, c.FirstName, it.InsuranceTypeID, it.Name as TypeName,
                       COUNT(*) as ContractCount,
                       ROW_NUMBER() OVER (PARTITION BY c.ClientID ORDER BY COUNT(*) DESC) as rn
                FROM Client c
                JOIN Contract ct ON c.ClientID = ct.ClientID
                JOIN InsuranceType it ON ct.InsuranceTypeID = it.InsuranceTypeID
                WHERE ct.Status != 'Draft'
                GROUP BY c.ClientID, c.LastName, c.FirstName, it.InsuranceTypeID, it.Name
            )
            SELECT ClientID, LastName, FirstName, InsuranceTypeID, TypeName, ContractCount
            FROM ClientTypeCounts
            WHERE rn = 1
            ORDER BY ClientID`
        );
        /*
         * WITH ClientTypeCounts AS (...) – рахуємо кількість договорів кожного клієнта за типами страхування,
         * додаємо ROW_NUMBER, щоб знайти найпопулярніший тип.
         * SELECT ... WHERE rn = 1 – залишаємо по одному запису з максимальним ContractCount для кожного клієнта.
         */

        res.json({
            data: result.rows.map(row => ({
                clientId: row.CLIENTID,
                lastName: row.LASTNAME,
                firstName: row.FIRSTNAME,
                insuranceTypeId: row.INSURANCETYPEID,
                typeName: row.TYPENAME,
                contractCount: row.CONTRACTCOUNT
            }))
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Звіт 4: для вибраного клієнта показати всі активні договори
 */
const activeContracts = async (req, res, next) => {
    try {
        const clientId = req.query.clientId;
        if (!clientId) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION',
                    message: 'clientId parameter is required',
                    details: {}
                }
            });
        }

        // Перевірка доступу відповідно до ролі
        if (req.user.ROLE === 'Client') {
            const clientCheck = await db.execute(
                `SELECT ClientID FROM Client WHERE ClientID = :clientId AND Email = :email`,
                { clientId: parseInt(clientId), email: req.user.EMAIL }
            );
            /*
             * SELECT ClientID ... – перевіряємо, що клієнт дійсно запитує свої договори.
             */
            if (clientCheck.rows.length === 0) {
                return res.status(403).json({
                    error: { code: 'FORBIDDEN', message: 'Access denied', details: {} }
                });
            }
        } else if (req.user.ROLE === 'Agent') {
            const contractCheck = await db.execute(
                `SELECT COUNT(*) as CNT FROM Contract WHERE ClientID = :clientId AND AgentID = :agentId`,
                { clientId: parseInt(clientId), agentId: req.user.AGENTID }
            );
            /*
             * SELECT COUNT(*) ... – впевнюємося, що у агента є договори з цим клієнтом.
             */
            if (contractCheck.rows[0].CNT === 0) {
                return res.status(403).json({
                    error: { code: 'FORBIDDEN', message: 'Client not in your portfolio', details: {} }
                });
            }
        }

        const result = await db.execute(
            `SELECT c.ContractID, c.ClientID, c.AgentID, c.InsuranceTypeID, c.StartDate, c.EndDate,
                    c.InsuranceAmount, c.ContributionAmount, c.AgentPercent, c.Status,
                    it.Name as InsuranceTypeName, a.FullName as AgentName
             FROM Contract c
             JOIN InsuranceType it ON c.InsuranceTypeID = it.InsuranceTypeID
             JOIN Agent a ON c.AgentID = a.AgentID
             WHERE c.ClientID = :clientId
               AND c.Status = 'Active'
               AND c.EndDate >= SYSDATE
             ORDER BY c.StartDate DESC`,
            { clientId: parseInt(clientId) }
        );
        /*
         * SELECT ... – дістаємо активні договори клієнта разом із назвами типів і агентами.
         * WHERE c.Status = 'Active' AND c.EndDate >= SYSDATE – залишаємо лише чинні договори.
         * ORDER BY c.StartDate DESC – сортуємо за датою початку в зворотному порядку.
         */

        res.json({
            clientId: parseInt(clientId),
            data: result.rows.map(row => ({
                contractId: row.CONTRACTID,
                clientId: row.CLIENTID,
                agentId: row.AGENTID,
                agentName: row.AGENTNAME,
                insuranceTypeId: row.INSURANCETYPEID,
                insuranceTypeName: row.INSURANCETYPENAME,
                startDate: row.STARTDATE,
                endDate: row.ENDDATE,
                insuranceAmount: row.INSURANCEAMOUNT,
                contributionAmount: row.CONTRIBUTIONAMOUNT,
                agentPercent: row.AGENTPERCENT,
                status: row.STATUS
            }))
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Звіт 5: визначити клієнтів з найбільшою кількістю страхових випадків або без них
 */
const caseExtremes = async (req, res, next) => {
    try {
        const mode = req.query.mode || 'most'; // значення «most» або «zero»

        if (mode === 'most') {
            const result = await db.execute(
                `SELECT c.ClientID, c.LastName, c.FirstName, COUNT(ic.CaseID) as CaseCount
                 FROM Client c
                 JOIN Contract ct ON c.ClientID = ct.ClientID
                 JOIN InsuranceCase ic ON ct.ContractID = ic.ContractID
                 GROUP BY c.ClientID, c.LastName, c.FirstName
                 ORDER BY COUNT(ic.CaseID) DESC
                 FETCH FIRST 10 ROWS ONLY`
            );
            /*
             * SELECT ... COUNT(ic.CaseID) – підраховуємо кількість страхових випадків на клієнта.
             * ORDER BY ... FETCH FIRST 10 – показуємо топ-10 клієнтів з найбільшою кількістю випадків.
             */

            res.json({
                mode: 'most',
                data: result.rows.map(row => ({
                    clientId: row.CLIENTID,
                    lastName: row.LASTNAME,
                    firstName: row.FIRSTNAME,
                    caseCount: row.CASECOUNT
                }))
            });
        } else if (mode === 'zero') {
            const result = await db.execute(
                `SELECT c.ClientID, c.LastName, c.FirstName
                 FROM Client c
                 WHERE c.ClientID NOT IN (
                     SELECT DISTINCT ct.ClientID
                     FROM Contract ct
                     JOIN InsuranceCase ic ON ct.ContractID = ic.ContractID
                 )
                 ORDER BY c.ClientID`
            );
            /*
             * SELECT ... WHERE NOT IN (...) – знаходимо клієнтів, у яких немає жодного страхового випадку.
             * ORDER BY c.ClientID – сортуємо для стабільного виводу.
             */

            res.json({
                mode: 'zero',
                data: result.rows.map(row => ({
                    clientId: row.CLIENTID,
                    lastName: row.LASTNAME,
                    firstName: row.FIRSTNAME,
                    caseCount: 0
                }))
            });
        } else {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION',
                    message: 'Mode must be "most" or "zero"',
                    details: {}
                }
            });
        }
    } catch (err) {
        next(err);
    }
};

/**
 * Звіт 6: знайти клієнтів, які скористались усіма типами страхування
 */
const allTypesUsedClients = async (req, res, next) => {
    try {
        const totalTypesResult = await db.execute(`SELECT COUNT(*) as TOTAL FROM InsuranceType`);
        /*
         * SELECT COUNT(*) ... – дізнаємося, скільки всього типів страхування існує,
         * щоб потім порівняти з кількістю типів на клієнта.
         */
        const totalTypes = totalTypesResult.rows[0].TOTAL;

        const result = await db.execute(
            `SELECT c.ClientID, c.LastName, c.FirstName,
                    COUNT(DISTINCT ct.InsuranceTypeID) as TypesUsed
             FROM Client c
             JOIN Contract ct ON c.ClientID = ct.ClientID
             WHERE ct.Status != 'Draft'
             GROUP BY c.ClientID, c.LastName, c.FirstName
             HAVING COUNT(DISTINCT ct.InsuranceTypeID) = :totalTypes
             ORDER BY c.ClientID`,
            { totalTypes }
        );
        /*
         * SELECT ... COUNT(DISTINCT ...) – рахуємо, скільки різних типів страхування має кожен клієнт.
         * HAVING COUNT(...) = :totalTypes – залишаємо тільки тих, хто покрив усі типи.
         */

        res.json({
            totalTypes,
            data: result.rows.map(row => ({
                clientId: row.CLIENTID,
                lastName: row.LASTNAME,
                firstName: row.FIRSTNAME,
                typesUsed: row.TYPESUSED
            }))
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Експорт будь-якого звіту у формат CSV
 */
const exportCSV = async (req, res, next) => {
    try {
        const reportName = req.query.name;
        const params = req.query;

        let data = [];
        let headers = [];

        switch (reportName) {
            case 'max-contribution-month':
                const maxMonth = await db.execute(
                    `SELECT TO_CHAR(StartDate, 'YYYY-MM') as Month,
                            SUM(ContributionAmount) as TotalContributions
                     FROM Contract WHERE Status != 'Draft'
                     GROUP BY TO_CHAR(StartDate, 'YYYY-MM')
                     ORDER BY SUM(ContributionAmount) DESC FETCH FIRST 1 ROWS ONLY`
                );
                /*
                 * SELECT ... – той самий запит, що й у maxContributionMonth,
                 * використовується для експорту до CSV.
                 */
                headers = ['Month', 'TotalContributions'];
                data = maxMonth.rows.map(r => [r.MONTH, r.TOTALCONTRIBUTIONS]);
                break;

            case 'agent-income':
                const month = params.month;
                if (!month) {
                    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Month required', details: {} } });
                }
                const income = await db.execute(
                    `SELECT a.AgentID, a.FullName,
                            SUM(c.ContributionAmount * c.AgentPercent) as TotalIncome
                     FROM Agent a
                     JOIN Contract c ON a.AgentID = c.AgentID
                     WHERE TO_CHAR(c.StartDate, 'YYYY-MM') = :month AND c.Status != 'Draft'
                     GROUP BY a.AgentID, a.FullName`,
                    { month }
                );
                /*
                 * SELECT ... – дублює запит звіту agentIncome для експорту.
                 */
                headers = ['AgentID', 'FullName', 'TotalIncome'];
                data = income.rows.map(r => [r.AGENTID, r.FULLNAME, r.TOTALINCOME]);
                break;

            case 'most-demanded-type-per-client':
                const demanded = await db.execute(
                    `WITH ClientTypeCounts AS (
                        SELECT c.ClientID, c.LastName, c.FirstName, it.Name as TypeName, COUNT(*) as ContractCount,
                               ROW_NUMBER() OVER (PARTITION BY c.ClientID ORDER BY COUNT(*) DESC) as rn
                        FROM Client c
                        JOIN Contract ct ON c.ClientID = ct.ClientID
                        JOIN InsuranceType it ON ct.InsuranceTypeID = it.InsuranceTypeID
                        WHERE ct.Status != 'Draft'
                        GROUP BY c.ClientID, c.LastName, c.FirstName, it.InsuranceTypeID, it.Name
                    )
                    SELECT ClientID, LastName, FirstName, TypeName, ContractCount
                    FROM ClientTypeCounts WHERE rn = 1`
                );
                /*
                 * WITH ... SELECT ... – та ж логіка, що у звіті mostDemandedTypePerClient,
                 * але для експорту у CSV.
                 */
                headers = ['ClientID', 'LastName', 'FirstName', 'TypeName', 'ContractCount'];
                data = demanded.rows.map(r => [r.CLIENTID, r.LASTNAME, r.FIRSTNAME, r.TYPENAME, r.CONTRACTCOUNT]);
                break;

            case 'active-contracts':
                const clientId = params.clientId;
                if (!clientId) {
                    return res.status(400).json({ error: { code: 'VALIDATION', message: 'clientId required', details: {} } });
                }
                const contracts = await db.execute(
                    `SELECT c.ContractID, c.ClientID, c.StartDate, c.EndDate, c.InsuranceAmount, it.Name as TypeName
                     FROM Contract c
                     JOIN InsuranceType it ON c.InsuranceTypeID = it.InsuranceTypeID
                     WHERE c.ClientID = :clientId AND c.Status = 'Active' AND c.EndDate >= SYSDATE`,
                    { clientId: parseInt(clientId) }
                );
                /*
                 * SELECT ... – отримуємо діючі договори клієнта (для CSV).
                 */
                headers = ['ContractID', 'ClientID', 'StartDate', 'EndDate', 'InsuranceAmount', 'TypeName'];
                data = contracts.rows.map(r => [r.CONTRACTID, r.CLIENTID, r.STARTDATE, r.ENDDATE, r.INSURANCEAMOUNT, r.TYPENAME]);
                break;

            case 'case-extremes':
                const mode = params.mode || 'most';
                if (mode === 'most') {
                    const most = await db.execute(
                        `SELECT c.ClientID, c.LastName, c.FirstName, COUNT(ic.CaseID) as CaseCount
                         FROM Client c
                         JOIN Contract ct ON c.ClientID = ct.ClientID
                         JOIN InsuranceCase ic ON ct.ContractID = ic.ContractID
                         GROUP BY c.ClientID, c.LastName, c.FirstName
                         ORDER BY COUNT(ic.CaseID) DESC FETCH FIRST 10 ROWS ONLY`
                    );
                    /*
                     * SELECT ... – повторюємо логіку режиму "most" для експорту.
                     */
                    headers = ['ClientID', 'LastName', 'FirstName', 'CaseCount'];
                    data = most.rows.map(r => [r.CLIENTID, r.LASTNAME, r.FIRSTNAME, r.CASECOUNT]);
                } else {
                    const zero = await db.execute(
                        `SELECT c.ClientID, c.LastName, c.FirstName
                         FROM Client c
                         WHERE c.ClientID NOT IN (
                             SELECT DISTINCT ct.ClientID FROM Contract ct JOIN InsuranceCase ic ON ct.ContractID = ic.ContractID
                         )`
                    );
                    /*
                     * SELECT ... WHERE NOT IN – формуємо список клієнтів без страхових випадків.
                     */
                    headers = ['ClientID', 'LastName', 'FirstName', 'CaseCount'];
                    data = zero.rows.map(r => [r.CLIENTID, r.LASTNAME, r.FIRSTNAME, 0]);
                }
                break;

            case 'all-types-used-clients':
                const totalTypesResultExport = await db.execute(`SELECT COUNT(*) as TOTAL FROM InsuranceType`);
                /*
                 * SELECT COUNT(*) ... – визначаємо загальну кількість типів страхування для CSV-звіту.
                 */
                const totalTypes = totalTypesResultExport.rows[0].TOTAL;
                const allTypes = await db.execute(
                    `SELECT c.ClientID, c.LastName, c.FirstName, COUNT(DISTINCT ct.InsuranceTypeID) as TypesUsed
                     FROM Client c
                     JOIN Contract ct ON c.ClientID = ct.ClientID
                     WHERE ct.Status != 'Draft'
                     GROUP BY c.ClientID, c.LastName, c.FirstName
                     HAVING COUNT(DISTINCT ct.InsuranceTypeID) = :totalTypes`,
                    { totalTypes }
                );
                /*
                 * SELECT ... HAVING COUNT(DISTINCT ...) – шукаємо клієнтів, які охопили всі типи,
                 * аналогічно базовому звіту.
                 */
                headers = ['ClientID', 'LastName', 'FirstName', 'TypesUsed'];
                data = allTypes.rows.map(r => [r.CLIENTID, r.LASTNAME, r.FIRSTNAME, r.TYPESUSED]);
                break;

            default:
                return res.status(400).json({
                    error: { code: 'VALIDATION', message: 'Invalid report name', details: {} }
                });
        }

        // Формуємо CSV
        const csv = [headers.join(','), ...data.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${reportName}.csv"`);
        res.send(csv);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    maxContributionMonth,
    agentIncome,
    mostDemandedTypePerClient,
    activeContracts,
    caseExtremes,
    allTypesUsedClients,
    exportCSV
};

