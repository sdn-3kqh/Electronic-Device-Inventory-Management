const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticate, adminOnly } = require('../middleware/auth');

// Health check (can be public)
router.get('/health', systemController.healthCheck);

// System settings (requires authentication)
router.get('/settings', [authenticate, adminOnly], systemController.getSystemSettings);
router.post('/settings', [authenticate, adminOnly], systemController.updateSystemSetting);
router.delete('/settings/:key', [authenticate, adminOnly], systemController.deleteSystemSetting);

// Database statistics
router.get('/stats', [authenticate, adminOnly], systemController.getDatabaseStats);

// Backup operations (admin only)
router.post('/backup/create', [authenticate, adminOnly], systemController.createBackup);
router.get('/backup/list', [authenticate, adminOnly], systemController.getBackupList);
router.get('/backup/download/:filename', [authenticate, adminOnly], systemController.downloadBackup);
router.delete('/backup/delete/:filename', [authenticate, adminOnly], systemController.deleteBackup);

// System logs
router.get('/logs', [authenticate, adminOnly], systemController.getSystemLogs);

module.exports = router;
