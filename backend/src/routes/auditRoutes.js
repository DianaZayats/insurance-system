const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * GET /audit-logs
 * Отримати записи аудиту з пагінацією та фільтрами
 * Доступно лише адміністратору
 */
router.get('/',
    authenticate,
    authorize('Admin'),
    auditController.getAllAuditLogs
);

module.exports = router;



