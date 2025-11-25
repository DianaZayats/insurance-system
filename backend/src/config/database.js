const oracledb = require('oracledb');

// Налаштування підключення до бази даних Oracle
const dbConfig = {
    user: process.env.DB_USER || 'INSURANCE_USER',
    password: process.env.DB_PASSWORD || 'Insurance123',
    connectString: `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '1521'}/${process.env.DB_SERVICE || 'XE'}`,
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
    poolTimeout: 60
};

// Ініціалізуємо пул з’єднань
let pool;

async function initialize() {
    try {
        // Вказуємо директорію клієнта Oracle за потреби (наприклад, у Docker)
        if (process.env.ORACLE_CLIENT_LIB_DIR) {
            oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_LIB_DIR });
        }
        
        pool = await oracledb.createPool(dbConfig);
        console.log('Oracle connection pool created');
    } catch (err) {
        console.error('Error initializing Oracle pool:', err);
        throw err;
    }
}

async function close() {
    try {
        if (pool) {
            await pool.close();
            console.log('Oracle connection pool closed');
        }
    } catch (err) {
        console.error('Error closing Oracle pool:', err);
    }
}

/**
 * Встановити поточного користувача для аудиту
 * Викликається перед будь-якими операціями INSERT/UPDATE/DELETE
 */
async function setAuditUser(userId) {
    if (!userId) return;
    try {
        await execute(
            'BEGIN AuditContext.SetUserID(:userId); END;',
            { userId },
            { autoCommit: false }
        );
    } catch (err) {
        console.error('Error setting audit user:', err);
        // Помилку не кидаємо — контекст аудиту не є обов’язковим
    }
}

async function execute(query, binds = {}, options = {}) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Якщо вказано auditUserId — встановлюємо користувача аудиту
        // Це потрібно робити в межах однієї сесії перед DML
        // Спершу очищуємо попередній контекст, потім задаємо новий
        if (options.auditUserId) {
            try {
                // Спершу обнуляємо наявний контекст аудиту
                await connection.execute(
                    'BEGIN AuditContext.SetUserID(NULL); END;',
                    {},
                    { autoCommit: false }
                );
                // Далі встановлюємо новий контекст у тій же сесії
                await connection.execute(
                    'BEGIN AuditContext.SetUserID(:userId); END;',
                    { userId: options.auditUserId },
                    { autoCommit: false }
                );
            } catch (err) {
                // Логуємо помилку, але не зупиняємо основну операцію
                console.error('Error setting audit user context:', err);
                console.warn('Попередження: аудит може некоректно відпрацювати для цієї операції');
            }
        } else {
            // Якщо користувача не передано — очищуємо контекст аудиту
            try {
                await connection.execute(
                    'BEGIN AuditContext.SetUserID(NULL); END;',
                    {},
                    { autoCommit: false }
                );
            } catch (err) {
                // Ігноруємо помилки під час очищення
            }
        }
        
        // Виконуємо основний запит у тій же сесії
        // Змінна пакету AuditContext буде доступна тригерам
        const result = await connection.execute(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            autoCommit: options.autoCommit !== false,
            ...options
        });
        return result;
    } catch (err) {
        console.error('Database execution error:', err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

async function executeMany(query, binds, options = {}) {
    let connection;
    try {
        connection = await pool.getConnection();
        const result = await connection.executeMany(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            autoCommit: options.autoCommit !== false,
            ...options
        });
        return result;
    } catch (err) {
        console.error('Database execution error:', err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

module.exports = {
    initialize,
    close,
    execute,
    executeMany,
    setAuditUser,
    pool: () => pool
};

