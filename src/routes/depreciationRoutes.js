const express = require('express');
const router = express.Router();
const depreciationController = require('../controllers/depreciationController');
const { authenticate, adminOrManager, allRoles } = require('../middleware/auth');

// Depreciation Rule endpoints
router.post('/', [authenticate, adminOrManager], depreciationController.createDepreciationRule);
router.get('/', [authenticate, allRoles], depreciationController.getAllDepreciationRules);
router.get('/rule/:id', [authenticate, allRoles], depreciationController.getDepreciationRuleById);
router.get('/category/:categoryId', [authenticate, allRoles], depreciationController.getDepreciationRuleByCategory);
router.put('/:id', [authenticate, adminOrManager], depreciationController.updateDepreciationRule);
router.delete('/:id', [authenticate, adminOrManager], depreciationController.deleteDepreciationRule);

// Depreciation calculation endpoints
router.get('/device/:deviceId', [authenticate, allRoles], depreciationController.calculateDeviceDepreciation);
router.get('/category-depreciation/:categoryId', [authenticate, allRoles], depreciationController.getCategoryDepreciation);
router.post('/batch-update-values', [authenticate, adminOrManager], depreciationController.updateAllDeviceValues);

module.exports = router;
