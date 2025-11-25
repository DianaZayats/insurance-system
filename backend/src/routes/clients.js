const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticate, authorize, checkClientAccess } = require('../middleware/auth');
const { clientRules, commonRules } = require('../utils/validation');
const { handleValidationErrors } = require('../utils/validation');

// Усі маршрути потребують автентифікації
router.use(authenticate);

/**
 * GET /clients
 * Отримати всіх клієнтів
 */
router.get('/',
    authorize('Admin', 'Agent', 'Client'),
    commonRules.pagination,
    handleValidationErrors,
    clientController.getAll
);

/**
 * POST /clients
 * Створити клієнта
 */
router.post('/',
    authorize('Admin', 'Agent'),
    clientRules.create,
    handleValidationErrors,
    clientController.create
);

/**
 * GET /clients/:id
 * Отримати клієнта за ідентифікатором
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
 * Оновити клієнта
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
 * Видалити клієнта (лише адміністратор)
 */
router.delete('/:id',
    authorize('Admin'),
    commonRules.id,
    handleValidationErrors,
    clientController.remove
);

/**
 * GET /clients/:id/contracts
 * Отримати договори клієнта
 */
router.get('/:id/contracts',
    authorize('Admin', 'Agent', 'Client'),
    checkClientAccess,
    commonRules.id,
    handleValidationErrors,
    clientController.getContracts
);

module.exports = router;

