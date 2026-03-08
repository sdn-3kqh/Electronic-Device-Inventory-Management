// routes/deviceRoutes.js
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authenticate, adminOnly, adminOrManager, allRoles } = require('../middleware/auth'); // Import từ auth.js của bạn

// Search and Filter (MUST be before /:id routes to avoid param matching)
router.get('/search', [authenticate, allRoles], deviceController.searchDevices); // All: Search
router.get('/filter', [authenticate, allRoles], deviceController.filterDevices); // All: Filter
router.get('/advanced-search', [authenticate, allRoles], deviceController.advancedSearch); // All: Advanced search with pagination

// Barcode operations
router.get('/barcode/scan/:code', [authenticate, allRoles], deviceController.scanBarcode); // UC-11: Scan barcode/QR to lookup device
router.post('/barcode/generate/:deviceId', [authenticate, adminOrManager], deviceController.generateBarcode); // Generate single barcode
router.post('/barcode/generate-multiple', [authenticate, adminOrManager], deviceController.generateMultipleBarcodes); // Generate multiple barcodes

// Asset Label operations (UC-12)
router.get('/label/:id', [authenticate, adminOrManager], deviceController.printAssetLabel); // UC-12: Get printable label for single device
router.post('/labels/bulk', [authenticate, adminOrManager], deviceController.bulkPrintAssetLabels); // UC-12: Get printable labels for multiple devices

// Bulk operations
router.post('/bulk/import', [authenticate, adminOrManager], deviceController.bulkImportDevices); // Bulk import
router.post('/bulk/export', [authenticate, allRoles], deviceController.bulkExportDevices); // Bulk export
router.put('/bulk/update-status', [authenticate, adminOrManager], deviceController.bulkUpdateStatus); // Bulk update status
router.put('/bulk/update-location', [authenticate, adminOrManager], deviceController.bulkUpdateLocation); // Bulk update location

// CRUD Routes
router.post('/', [authenticate, adminOrManager], deviceController.addDevice); // Admin/IM: Add
router.get('/', [authenticate, allRoles], deviceController.getAllDevices); // All: List with pagination
router.get('/:id', [authenticate, allRoles], deviceController.getDeviceDetails); // All: View details (Staff chỉ view assigned, nhưng implement thêm logic trong controller nếu cần)
router.put('/:id', [authenticate, adminOrManager], deviceController.updateDevice); // Admin/IM: Update
router.delete('/:id', [authenticate, adminOrManager], deviceController.deleteDevice); // Admin/IM: Delete
router.patch('/:id/dispose', [authenticate, adminOrManager], deviceController.disposeDevice); // Admin/IM: Dispose

module.exports = router;