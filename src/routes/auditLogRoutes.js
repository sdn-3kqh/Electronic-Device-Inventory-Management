const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticate, adminOrManager } = require('../middleware/auth');

// GET /api/audit-logs
// Admin: full access | Inventory Manager: device-related logs only
router.get('/', [authenticate, adminOrManager], auditLogController.getAuditLogs);

// UC-45: Export Audit Trail as CSV (Admin only)
router.get('/export', [authenticate, adminOrManager], auditLogController.exportAuditLogs);

module.exports = router;
