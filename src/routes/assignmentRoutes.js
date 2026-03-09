//
// Dev3 Week 1 - Assignment Routes
//
const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticate, adminOrManager, allRoles } = require('../middleware/auth');
const { assignDeviceValidation, updateAssignmentValidation, transferDeviceValidation } = require('../middleware/validators');

// All routes require authentication
router.use(authenticate);

// Admin/Manager only - specific routes before :id
router.post('/', adminOrManager, (req, res, next) => {
  req.body.assignedBy = req.user.userId;
  next();
}, assignDeviceValidation, assignmentController.assignDevice);
router.put('/:id', adminOrManager, updateAssignmentValidation, assignmentController.updateAssignment);
router.delete('/:id', adminOrManager, assignmentController.unassignDevice);
router.post('/:id/transfer', adminOrManager, transferDeviceValidation, assignmentController.transferDevice);

// All roles - View (specific routes before :id)
router.get('/', allRoles, assignmentController.getAllAssignments);
router.get('/device/:deviceId/history', allRoles, assignmentController.getAssignmentHistory);
router.get('/user/:userId', allRoles, assignmentController.getUserAssignments);
router.get('/:id', allRoles, assignmentController.getAssignmentById);

// Staff can acknowledge their own assignment
router.patch('/:id/acknowledge', allRoles, assignmentController.acknowledgeAssignment);

module.exports = router;
//
