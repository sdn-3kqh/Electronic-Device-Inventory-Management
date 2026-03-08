const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticate, adminOrManager, allRoles } = require('../middleware/auth');

// Get all maintenance records (with filters, pagination)
router.get('/', [authenticate, allRoles], maintenanceController.getAllMaintenance);

// Get upcoming scheduled maintenance
router.get('/upcoming', [authenticate, allRoles], maintenanceController.getUpcomingMaintenance);

// UC-25: View maintenance history for a device
router.get('/history/:deviceId', [authenticate, allRoles], maintenanceController.getMaintenanceHistory);

// Get maintenance record by ID
router.get('/:id', [authenticate, allRoles], maintenanceController.getMaintenanceById);

// UC-21: Record maintenance (already completed)
router.post('/record', [authenticate, adminOrManager], maintenanceController.recordMaintenance);

// UC-22: Request maintenance (all roles - staff can request)
router.post('/request', [authenticate, allRoles], maintenanceController.requestMaintenance);

// UC-23: Schedule maintenance
router.post('/schedule', [authenticate, adminOrManager], maintenanceController.scheduleMaintenance);

// Update maintenance record
router.put('/:id', [authenticate, adminOrManager], maintenanceController.updateMaintenance);

// UC-24: Complete maintenance
router.patch('/:id/complete', [authenticate, adminOrManager], maintenanceController.completeMaintenance);

// Cancel maintenance
router.patch('/:id/cancel', [authenticate, adminOrManager], maintenanceController.cancelMaintenance);

module.exports = router;
