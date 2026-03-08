const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticate, adminOrManager, allRoles } = require('../middleware/auth');

// Assign a device
router.post('/', [authenticate, adminOrManager], assignmentController.assignDevice);

// Get assignment history for a device
router.get('/history/:deviceId', [authenticate, allRoles], assignmentController.getAssignmentHistory);

// Get assignments for a user
router.get('/user/:userId', [authenticate, allRoles], assignmentController.getUserAssignments);

// Acknowledge an assignment
router.patch('/:id/acknowledge', [authenticate, allRoles], assignmentController.acknowledgeAssignment);

// Unassign (return) a device
router.patch('/:id/unassign', [authenticate, adminOrManager], assignmentController.unassignDevice);

module.exports = router;
