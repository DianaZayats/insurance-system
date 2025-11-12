const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticate, authorize, checkClientAccess } = require('../middleware/auth');
const { clientRules, commonRules } = require('../utils/validation');
const { handleValidationErrors } = require('../utils/validation');

// All routes require authentication
router.use(authenticate);

/**
 * GET /clients
 * Get all clients
 */
router.get('/',
    authorize('Admin', 'Agent', 'Client'),
    commonRules.pagination,
    handleValidationErrors,
    clientController.getAll
);

/**
 * POST /clients
 * Create client
 */
router.post('/',
    authorize('Admin', 'Agent'),
    clientRules.create,
    handleValidationErrors,
    clientController.create
);

/**
 * GET /clients/:id
 * Get client by ID
 */
router.get('/:id',
    authorize('Admin', 'Agent', 'Client'),
    checkClientAccess,
    commonRules.id,
    handleValidationErrors,
    clientController.getById
);

/**
 * PUT /clients/:id
 * Update client
 */
router.put('/:id',
    authorize('Admin', 'Agent'),
    checkClientAccess,
    commonRules.id,
    clientRules.update,
    handleValidationErrors,
    clientController.update
);

/**
 * DELETE /clients/:id
 * Delete client (Admin only)
 */
router.delete('/:id',
    authorize('Admin'),
    commonRules.id,
    handleValidationErrors,
    clientController.remove
);

/**
 * GET /clients/:id/contracts
 * Get client contracts
 */
router.get('/:id/contracts',
    authorize('Admin', 'Agent', 'Client'),
    checkClientAccess,
    commonRules.id,
    handleValidationErrors,
    clientController.getContracts
);

module.exports = router;

