// routes/deviceRoutes.js
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authenticate, adminOnly, adminOrManager, allRoles } = require('../middleware/auth'); // Import từ auth.js của bạn

// CRUD Routes
router.post('/', [authenticate, adminOrManager], deviceController.addDevice); // Admin/IM: Add
router.put('/:id', [authenticate, adminOrManager], deviceController.updateDevice); // Admin/IM: Update
router.delete('/:id', [authenticate, adminOrManager], deviceController.deleteDevice); // Admin/IM: Delete
router.get('/:id', [authenticate, allRoles], deviceController.getDeviceDetails); // All: View details (Staff chỉ view assigned, nhưng implement thêm logic trong controller nếu cần)
router.get('/', [authenticate, allRoles], deviceController.getAllDevices); // All: List (Staff chỉ view assigned, implement filter trong controller dựa req.user)

// Search and Filter
router.get('/search', [authenticate, allRoles], deviceController.searchDevices); // All: Search
router.get('/filter', [authenticate, allRoles], deviceController.filterDevices); // All: Filter

// Dispose
router.patch('/:id/dispose', [authenticate, adminOrManager], deviceController.disposeDevice); // Admin/IM: Dispose

module.exports = router;