const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../utils/validation');

/**
 * POST /auth/register
 * Register a new user (Admin only)
 */
router.post('/register',
    authenticate,
    authorize('Admin'),
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').optional().isIn(['Admin', 'Agent', 'Client']),
        body('agentId').optional().isInt({ min: 1 }),
        handleValidationErrors
    ],
    authController.register
);

/**
 * POST /auth/login
 * Login user
 */
router.post('/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
        handleValidationErrors
    ],
    authController.login
);

/**
 * GET /auth/me
 * Get current user
 */
router.get('/me',
    authenticate,
    authController.getMe
);

module.exports = router;

