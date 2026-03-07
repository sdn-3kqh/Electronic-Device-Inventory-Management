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

module.exports = router;
