const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate, adminOrManager, allRoles } = require('../middleware/auth');

// Admin/IM: Create, Update, Delete
router.post('/', [authenticate, adminOrManager], locationController.createLocation);
router.put('/:id', [authenticate, adminOrManager], locationController.updateLocation);
router.delete('/:id', [authenticate, adminOrManager], locationController.deleteLocation);

// All roles: View
router.get('/', [authenticate, allRoles], locationController.getAllLocations);
router.get('/:id', [authenticate, allRoles], locationController.getLocationById);

module.exports = router;