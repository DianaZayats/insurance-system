const db = require('../config/database');

/**
 * Get all audit log entries with pagination and filtering
 * Admin only
 */
const getAllAuditLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Get total count
        const countQuery = `SELECT COUNT(*) as TOTAL FROM Audit_Log`;
        const countResult = await db.execute(countQuery);
        const total = countResult.rows[0].TOTAL;

        // Get paginated data
        // Convert timestamp to Kyiv timezone (Europe/Kiev)
        // ChangedAt is stored as TIMESTAMP (no timezone), so we assume it's in UTC
        // and convert to Kyiv timezone
        // Use DBMS_LOB.SUBSTR to convert CLOB to VARCHAR2 to avoid circular reference issues
        const dataQuery = `
            SELECT 
                LogID,
                Entity,
                EntityID,
                Action,
                ChangedBy,
                TO_CHAR(
                    FROM_TZ(CAST(ChangedAt AS TIMESTAMP), 'UTC') AT TIME ZONE 'Europe/Kiev',
                    'YYYY-MM-DD HH24:MI:SS'
                ) as ChangedAt,
                CASE 
                    WHEN Payload IS NULL THEN NULL
                    ELSE TO_CHAR(DBMS_LOB.SUBSTR(Payload, 4000, 1))
                END as Payload
            FROM Audit_Log
            ORDER BY ChangedAt DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        `;
        
        const binds = {
            offset: offset,
            limit: limit
        };

        const result = await db.execute(dataQuery, binds);

        // Format response - Create plain objects to avoid circular references
        // Extract primitive values only to ensure JSON serialization works
        const auditLogs = result.rows.map(row => {
            // Create a plain object with only primitive values
            const log = {
                logId: Number(row.LOGID),
                entity: String(row.ENTITY || ''),
                entityId: Number(row.ENTITYID),
                action: String(row.ACTION || ''),
                changedBy: row.CHANGEDBY ? Number(row.CHANGEDBY) : null,
                changedAt: String(row.CHANGEDAT || ''),
                payload: row.PAYLOAD ? String(row.PAYLOAD) : null
            };
            return log;
        });

        const totalPages = Math.ceil(total / limit);

        // Ensure pagination values are primitives
        const response = {
            data: auditLogs,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: Number(total),
                totalPages: Number(totalPages)
            }
        };

        res.json(response);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllAuditLogs
};

