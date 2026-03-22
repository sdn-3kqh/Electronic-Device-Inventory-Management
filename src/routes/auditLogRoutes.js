const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/audit-logs
// Only Admin can access
router.get('/', [authenticate, adminOnly], auditLogController.getAuditLogs);

module.exports = router;
