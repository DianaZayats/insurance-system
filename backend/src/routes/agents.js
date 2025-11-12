const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors, commonRules } = require('../utils/validation');

router.use(authenticate);

router.get('/',
    authorize('Admin', 'Agent'),
    commonRules.pagination,
    handleValidationErrors,
    agentController.getAll
);

router.post('/',
    authorize('Admin'),
    [
        body('fullName').notEmpty().trim(),
        body('hireDate').isISO8601(),
        body('phone').optional().trim(),
        body('email').optional().isEmail(),
        body('branchId').optional().isInt({ min: 1 }),
        handleValidationErrors
    ],
    agentController.create
);

router.get('/:id',
    authorize('Admin', 'Agent'),
    commonRules.id,
    handleValidationErrors,
    agentController.getById
);

router.put('/:id',
    authorize('Admin'),
    commonRules.id,
    [
        body('fullName').optional().notEmpty().trim(),
        body('hireDate').optional().isISO8601(),
        body('phone').optional().trim(),
        body('email').optional().isEmail(),
        body('branchId').optional().isInt({ min: 1 }),
        handleValidationErrors
    ],
    agentController.update
);

router.delete('/:id',
    authorize('Admin'),
    commonRules.id,
    handleValidationErrors,
    agentController.remove
);

module.exports = router;

