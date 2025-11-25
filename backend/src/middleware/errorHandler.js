/**
 * Глобальний мідлвар для обробки помилок
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Помилки бази даних Oracle
    if (err.errorNum) {
        const oracleErrors = {
            1: 'Unique constraint violation',
            2291: 'Foreign key constraint violation',
            2290: 'Check constraint violation',
            20001: 'Business rule violation'
        };

        const errorCode = oracleErrors[err.errorNum] ? 'DB_CONSTRAINT' : 'VALIDATION';
        const message = oracleErrors[err.errorNum] || err.message || 'Database error';

        return res.status(400).json({
            error: {
                code: errorCode,
                message: message,
                details: {
                    oracleError: err.errorNum,
                    oracleMessage: err.message
                }
            }
        });
    }

    // Помилки валідації
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: {
                code: 'VALIDATION',
                message: err.message,
                details: err.details || {}
            }
        });
    }

    // Помилки, пов’язані з JWT
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: {
                code: 'AUTH',
                message: 'Invalid or expired token',
                details: {}
            }
        });
    }

    // Поведінка за замовчуванням
    res.status(err.status || 500).json({
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: err.message || 'Internal server error',
            details: {}
        }
    });
};

module.exports = errorHandler;

