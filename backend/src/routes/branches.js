const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors, commonRules } = require('../utils/validation');

// All routes require authentication
router.use(authenticate);

/**
 * GET /branches
 * Get all branches
 */
router.get('/',
    authorize('Admin', 'Agent'),
    commonRules.pagination,
    handleValidationErrors,
    branchController.getAll
);

/**
 * POST /branches
 * Create branch (Admin only)
 */
router.post('/',
    authorize('Admin'),
    [
        body('name').notEmpty().trim().withMessage('Name is required'),
        handleValidationErrors
    ],
    branchController.create
);

/**
 * GET /branches/:id
 * Get branch by ID
 */
router.get('/:id',
    authorize('Admin', 'Agent'),
    commonRules.id,
    handleValidationErrors,
    branchController.getById
);

/**
 * PUT /branches/:id
 * Update branch (Admin only)
 */
router.put('/:id',
    authorize('Admin'),
    commonRules.id,
    [
        body('name').notEmpty().trim().withMessage('Name is required'),
        handleValidationErrors
    ],
    branchController.update
);

/**
 * DELETE /branches/:id
 * Delete branch (Admin only)
 */
router.delete('/:id',
    authorize('Admin'),
    commonRules.id,
    handleValidationErrors,
    branchController.remove
);

module.exports = router;

