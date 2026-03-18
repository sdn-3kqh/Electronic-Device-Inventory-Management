const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Admin only
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Assign role
router.patch('/:id/role', userController.assignRole);

// Deactivate user (Soft delete)
router.patch('/:id/deactivate', userController.deactivateUser);

module.exports = router;