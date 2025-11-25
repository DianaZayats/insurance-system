const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors, commonRules } = require('../utils/validation');

// Усі маршрути потребують автентифікації
router.use(authenticate);

/**
 * GET /branches
 * Отримати всі філії
 */
router.get('/',
    authorize('Admin', 'Agent'),
    commonRules.pagination,
    handleValidationErrors,
    branchController.getAll
);

/**
 * POST /branches
 * Створити філію (лише адміністратор)
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
 * Отримати філію за ідентифікатором
 */
router.get('/:id',
    authorize('Admin', 'Agent'),
    commonRules.id,
    handleValidationErrors,
    branchController.getById
);

/**
 * PUT /branches/:id
 * Оновити філію (лише адміністратор)
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
 * Видалити філію (лише адміністратор)
 */
router.delete('/:id',
    authorize('Admin'),
    commonRules.id,
    handleValidationErrors,
    branchController.remove
);

module.exports = router;

