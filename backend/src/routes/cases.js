const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { authenticate, authorize } = require('../middleware/auth');
const { caseRules, commonRules } = require('../utils/validation');
const { handleValidationErrors } = require('../utils/validation');

router.use(authenticate);

router.get('/',
    authorize('Admin', 'Agent', 'Client'),
    commonRules.pagination,
    handleValidationErrors,
    caseController.getAll
);

router.post('/',
    authorize('Admin', 'Agent'),
    caseRules.create,
    handleValidationErrors,
    caseController.create
);

router.get('/:id',
    authorize('Admin', 'Agent', 'Client'),
    commonRules.id,
    handleValidationErrors,
    caseController.getById
);

router.put('/:id',
    authorize('Admin', 'Agent'),
    commonRules.id,
    caseRules.update,
    handleValidationErrors,
    caseController.update
);

router.delete('/:id',
    authorize('Admin'),
    commonRules.id,
    handleValidationErrors,
    caseController.remove
);

module.exports = router;

