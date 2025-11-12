const db = require('../config/database');

/**
 * Report 1: Find the month with the highest total insurance contributions
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
 * Report 2: Calculate each agent's total income for the previous month
 */
const agentIncome = async (req, res, next) => {
    try {
        const month = req.query.month; // Format: YYYY-MM
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
 * Report 3: For each client, determine the most demanded insurance type
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
 * Report 4: For a chosen client, list all contracts currently active
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

        // Role-based access check
        if (req.user.ROLE === 'Client') {
            const clientCheck = await db.execute(
                `SELECT ClientID FROM Client WHERE ClientID = :clientId AND Email = :email`,
                { clientId: parseInt(clientId), email: req.user.EMAIL }
            );
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
 * Report 5: Determine clients with the most insurance cases or with no cases
 */
const caseExtremes = async (req, res, next) => {
    try {
        const mode = req.query.mode || 'most'; // 'most' or 'zero'

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
 * Report 6: Identify clients who have used all insurance types
 */
const allTypesUsedClients = async (req, res, next) => {
    try {
        const totalTypesResult = await db.execute(`SELECT COUNT(*) as TOTAL FROM InsuranceType`);
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
 * Export report as CSV
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
                    headers = ['ClientID', 'LastName', 'FirstName', 'CaseCount'];
                    data = zero.rows.map(r => [r.CLIENTID, r.LASTNAME, r.FIRSTNAME, 0]);
                }
                break;

            case 'all-types-used-clients':
                const totalTypes = (await db.execute(`SELECT COUNT(*) as TOTAL FROM InsuranceType`)).rows[0].TOTAL;
                const allTypes = await db.execute(
                    `SELECT c.ClientID, c.LastName, c.FirstName, COUNT(DISTINCT ct.InsuranceTypeID) as TypesUsed
                     FROM Client c
                     JOIN Contract ct ON c.ClientID = ct.ClientID
                     WHERE ct.Status != 'Draft'
                     GROUP BY c.ClientID, c.LastName, c.FirstName
                     HAVING COUNT(DISTINCT ct.InsuranceTypeID) = :totalTypes`,
                    { totalTypes }
                );
                headers = ['ClientID', 'LastName', 'FirstName', 'TypesUsed'];
                data = allTypes.rows.map(r => [r.CLIENTID, r.LASTNAME, r.FIRSTNAME, r.TYPESUSED]);
                break;

            default:
                return res.status(400).json({
                    error: { code: 'VALIDATION', message: 'Invalid report name', details: {} }
                });
        }

        // Generate CSV
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

