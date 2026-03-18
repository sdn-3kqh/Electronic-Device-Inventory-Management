const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, adminOrManager, allRoles } = require('../middleware/auth');

// Warranty reports
router.get('/warranty', [authenticate, allRoles], reportController.generateWarrantyReport);
router.get('/warranty-alerts', [authenticate, allRoles], reportController.getWarrantyAlerts);

// Depreciation reports
router.get('/depreciation', [authenticate, adminOrManager], reportController.generateDepreciationReport);

// Device and inventory reports
router.get('/device-status', [authenticate, allRoles], reportController.generateDeviceStatusReport);
router.get('/inventory-value', [authenticate, adminOrManager], reportController.generateInventoryValueReport);

// Assignment reports
router.get('/assignments', [authenticate, allRoles], reportController.generateAssignmentReport);

// Maintenance reports
router.get('/maintenance', [authenticate, adminOrManager], reportController.generateMaintenanceReport);

// Custom report (POST to handle complex filter body)
router.post('/custom', [authenticate, adminOrManager], reportController.generateCustomReport);

// Schedule reports
router.post('/schedules', [authenticate, adminOrManager], reportController.createReportConfig);
router.get('/schedules', [authenticate, adminOrManager], reportController.getReportConfigs);
router.put('/schedules/:id', [authenticate, adminOrManager], reportController.updateReportConfig);
router.delete('/schedules/:id', [authenticate, adminOrManager], reportController.deleteReportConfig);

// Export reports (POST because report data can be large)
router.post('/export', [authenticate, adminOrManager], reportController.exportReport);

module.exports = router;
