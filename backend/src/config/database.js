const oracledb = require('oracledb');

// Oracle database configuration
const dbConfig = {
    user: process.env.DB_USER || 'INSURANCE_USER',
    password: process.env.DB_PASSWORD || 'Insurance123',
    connectString: `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '1521'}/${process.env.DB_SERVICE || 'XE'}`,
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
    poolTimeout: 60
};

// Initialize connection pool
let pool;

async function initialize() {
    try {
        // Set Oracle client directory if needed (for Docker)
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
 * Set the current user ID for audit logging
 * This should be called before any INSERT/UPDATE/DELETE operations
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
        // Don't throw - audit context is optional
    }
}

async function execute(query, binds = {}, options = {}) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Set audit user if provided in options
        // This must be done in the same session before the DML operation
        // Clear any stale audit context first, then set the new one
        if (options.auditUserId) {
            try {
                // Clear any existing audit context first (set to NULL)
                await connection.execute(
                    'BEGIN AuditContext.SetUserID(NULL); END;',
                    {},
                    { autoCommit: false }
                );
                // Set the audit context in the same session
                await connection.execute(
                    'BEGIN AuditContext.SetUserID(:userId); END;',
                    { userId: options.auditUserId },
                    { autoCommit: false }
                );
            } catch (err) {
                // Log the error but don't fail the operation
                console.error('Error setting audit user context:', err);
                console.warn('Warning: Audit logging may not work for this operation');
            }
        } else {
            // Clear audit context if no user ID provided
            try {
                await connection.execute(
                    'BEGIN AuditContext.SetUserID(NULL); END;',
                    {},
                    { autoCommit: false }
                );
            } catch (err) {
                // Ignore errors when clearing
            }
        }
        
        // Execute the main query in the same session
        // The audit context package variable will be available to triggers
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

