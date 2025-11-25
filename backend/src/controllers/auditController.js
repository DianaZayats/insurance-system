const db = require('../config/database');

/**
 * Отримати записи аудиту з пагінацією та фільтрами
 * Доступно лише адміністратору
 */
const getAllAuditLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Отримати загальну кількість записів
        const countQuery = `SELECT COUNT(*) as TOTAL FROM Audit_Log`;
        /*
         * SELECT COUNT(*) ... – підраховуємо кількість записів аудиту, щоб побудувати пагінацію.
         * FROM Audit_Log – працюємо з таблицею журналу аудиту.
         */
        const countResult = await db.execute(countQuery);
        const total = countResult.rows[0].TOTAL;

        // Отримати дані для вибраної сторінки
        // Конвертуємо дату/час у часовий пояс Києва (Europe/Kiev)
        // ChangedAt зберігається як TIMESTAMP без таймзони, припускаємо UTC
        // і переводимо у київський час
        // Використовуємо DBMS_LOB.SUBSTR, щоб перетворити CLOB у VARCHAR2
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
        /*
         * SELECT ... – забираємо основні поля запису аудиту.
         * FROM_TZ(... AT TIME ZONE 'Europe/Kiev') – переводимо мітку часу з UTC у київський час.
         * TO_CHAR(DBMS_LOB.SUBSTR(...)) – перетворюємо CLOB payload у рядок, щоб повернути через API.
         * ORDER BY ChangedAt DESC – показуємо найновіші зміни першими.
         * OFFSET / FETCH – реалізуємо пагінацію.
         */
        
        const binds = {
            offset: offset,
            limit: limit
        };

        const result = await db.execute(dataQuery, binds);

        // Формуємо відповідь: створюємо звичайні об’єкти, щоб уникнути циклічних посилань
        // Витягуємо лише примітивні значення для коректної JSON-серіалізації
        const auditLogs = result.rows.map(row => {
            // Створюємо простий об’єкт лише з примітивами
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

        // Переконуємось, що в пагінації теж лише примітиви
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

