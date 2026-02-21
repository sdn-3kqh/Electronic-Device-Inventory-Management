const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, adminOnly } = require('../middleware/auth');
const {
  signInValidation,
  registerValidation,
  changePasswordValidation,
  resetPasswordValidation,
  updateProfileValidation
} = require('../middleware/validators');

// Public routes
router.post('/signin', signInValidation, authController.signIn);
router.post('/refresh-token', authController.refreshToken);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.post('/signout', authenticate, authController.signOut);
router.put('/profile', authenticate, updateProfileValidation, authController.updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, authController.changePassword);

// Admin-only routes
router.post('/register', authenticate, adminOnly, registerValidation, authController.register);
router.post('/unlock-account', authenticate, adminOnly, authController.unlockAccount);

module.exports = router;
