const express = require('express');
const router = express.Router();
const insuranceTypeController = require('../controllers/insuranceTypeController');
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors, commonRules } = require('../utils/validation');

router.use(authenticate);

router.get('/',
    authorize('Admin', 'Agent', 'Client'),
    commonRules.pagination,
    handleValidationErrors,
    insuranceTypeController.getAll
);

router.post('/',
    authorize('Admin'),
    [
        body('name').notEmpty().trim(),
        body('baseRate').isFloat({ min: 0, max: 1 }),
        body('payoutCoeff').isFloat({ min: 0 }),
        body('agentPercentDefault').isFloat({ min: 0, max: 1 }),
        body('description').optional().trim(),
        handleValidationErrors
    ],
    insuranceTypeController.create
);

router.get('/:id',
    authorize('Admin', 'Agent', 'Client'),
    commonRules.id,
    handleValidationErrors,
    insuranceTypeController.getById
);

router.put('/:id',
    authorize('Admin'),
    commonRules.id,
    [
        body('name').optional().notEmpty().trim(),
        body('baseRate').optional().isFloat({ min: 0, max: 1 }),
        body('payoutCoeff').optional().isFloat({ min: 0 }),
        body('agentPercentDefault').optional().isFloat({ min: 0, max: 1 }),
        body('description').optional().trim(),
        handleValidationErrors
    ],
    insuranceTypeController.update
);

router.delete('/:id',
    authorize('Admin'),
    commonRules.id,
    handleValidationErrors,
    insuranceTypeController.remove
);

module.exports = router;

