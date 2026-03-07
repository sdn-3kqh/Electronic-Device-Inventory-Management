const express = require('express');
const router = express.Router();
const warrantyController = require('../controllers/warrantyController');
const { authenticate, adminOrManager, allRoles } = require('../middleware/auth');

// Warranty endpoints
router.post('/', [authenticate, adminOrManager], warrantyController.createWarranty);
router.get('/', [authenticate, allRoles], warrantyController.getAllWarranties);
router.get('/expiring/:days?', [authenticate, allRoles], warrantyController.getExpiringWarranties);
router.get('/refresh-status', [authenticate, adminOrManager], warrantyController.refreshWarrantyStatus);
router.get('/:id', [authenticate, allRoles], warrantyController.getWarrantyById);
router.put('/:id', [authenticate, adminOrManager], warrantyController.updateWarranty);
router.delete('/:id', [authenticate, adminOrManager], warrantyController.deleteWarranty);

// Warranty claim endpoints
router.post('/claims', [authenticate, allRoles], warrantyController.createWarrantyClaim);
router.get('/claims', [authenticate, allRoles], warrantyController.getAllWarrantyClaims);
router.get('/claims/:id', [authenticate, allRoles], warrantyController.getWarrantyClaimById);
router.put('/claims/:id', [authenticate, adminOrManager], warrantyController.updateWarrantyClaim);
router.delete('/claims/:id', [authenticate, adminOrManager], warrantyController.deleteWarrantyClaim);

module.exports = router;
