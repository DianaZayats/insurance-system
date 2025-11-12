const jwt = require('jsonwebtoken');
const db = require('../config/database');

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Middleware to verify JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: {
                    code: 'AUTH',
                    message: 'No token provided',
                    details: {}
                }
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get user from database
        const result = await db.execute(
            `SELECT UserID, Email, Role, AgentID FROM Users WHERE UserID = :userId`,
            { userId: decoded.userId }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: {
                    code: 'AUTH',
                    message: 'Invalid token',
                    details: {}
                }
            });
        }

        req.user = result.rows[0];
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: {
                    code: 'AUTH',
                    message: 'Invalid or expired token',
                    details: {}
                }
            });
        }
        next(err);
    }
};

/**
 * Role-based access control middleware
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: {
                    code: 'AUTH',
                    message: 'Authentication required',
                    details: {}
                }
            });
        }

        if (!roles.includes(req.user.ROLE)) {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions',
                    details: {}
                }
            });
        }

        next();
    };
};

/**
 * Check if user can access client data (Agent can only access their own clients)
 */
const checkClientAccess = async (req, res, next) => {
    try {
        if (req.user.ROLE === 'Admin') {
            return next();
        }

        if (req.user.ROLE === 'Client') {
            // Client can only access their own data
            const clientId = parseInt(req.params.id || req.body.clientId || req.query.clientId);
            if (clientId) {
                const result = await db.execute(
                    `SELECT ClientID FROM Client WHERE Email = :email`,
                    { email: req.user.EMAIL }
                );
                if (result.rows.length > 0 && result.rows[0].CLIENTID !== clientId) {
                    return res.status(403).json({
                        error: {
                            code: 'FORBIDDEN',
                            message: 'Access denied to this client data',
                            details: {}
                        }
                    });
                }
            }
            return next();
        }

        if (req.user.ROLE === 'Agent') {
            // Agent can access clients from their contracts
            const clientId = parseInt(req.params.id || req.body.clientId || req.query.clientId);
            if (clientId) {
                const result = await db.execute(
                    `SELECT COUNT(*) as CNT FROM Contract WHERE ClientID = :clientId AND AgentID = :agentId`,
                    { clientId, agentId: req.user.AGENTID }
                );
                if (result.rows[0].CNT === 0) {
                    return res.status(403).json({
                        error: {
                            code: 'FORBIDDEN',
                            message: 'Access denied: client not in your portfolio',
                            details: {}
                        }
                    });
                }
            }
            return next();
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = {
    authenticate,
    authorize,
    checkClientAccess,
    JWT_SECRET
};

