const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * GET /audit-logs
 * Get all audit log entries with pagination and filtering
 * Admin only
 */
router.get('/',
    authenticate,
    authorize('Admin'),
    auditController.getAllAuditLogs
);

module.exports = router;


