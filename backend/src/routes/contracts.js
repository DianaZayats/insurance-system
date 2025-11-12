const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticate, authorize } = require('../middleware/auth');
const { contractRules, commonRules } = require('../utils/validation');
const { handleValidationErrors } = require('../utils/validation');

router.use(authenticate);

router.get('/',
    authorize('Admin', 'Agent', 'Client'),
    commonRules.pagination,
    handleValidationErrors,
    contractController.getAll
);

router.post('/',
    authorize('Admin', 'Agent'),
    contractRules.create,
    handleValidationErrors,
    contractController.create
);

router.get('/:id',
    authorize('Admin', 'Agent', 'Client'),
    commonRules.id,
    handleValidationErrors,
    contractController.getById
);

router.put('/:id',
    authorize('Admin', 'Agent'),
    commonRules.id,
    contractRules.update,
    handleValidationErrors,
    contractController.update
);

router.post('/:id/status',
    authorize('Admin', 'Agent'),
    commonRules.id,
    [
        require('express-validator').body('status').isIn(['Draft', 'Active', 'Suspended', 'Cancelled', 'Completed']),
        handleValidationErrors
    ],
    contractController.updateStatus
);

router.delete('/:id',
    authorize('Admin'),
    commonRules.id,
    handleValidationErrors,
    contractController.remove
);

module.exports = router;

