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

async function execute(query, binds = {}, options = {}) {
    let connection;
    try {
        connection = await pool.getConnection();
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
    pool: () => pool
};

