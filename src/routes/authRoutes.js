const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/signin', authController.signIn);
router.post('/reset-password', authController.resetPassword);

// Protected routes (require authentication)
router.post('/signout', authenticate, authController.signOut);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
