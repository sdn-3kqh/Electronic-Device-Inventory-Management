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


// ================= PUBLIC ROUTES =================

// Sign in
router.post('/signin', signInValidation, authController.signIn);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// ⚠️ Reset password (cũ - KHÔNG AN TOÀN, chỉ nên dùng nội bộ)
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// 🆕 Forgot password (gửi email)
router.post('/forgot-password', authController.forgotPassword);

// 🆕 Reset password bằng token từ email
router.post('/reset-password/:token', authController.resetPasswordWithToken);


// ================= PROTECTED ROUTES =================

// Get profile
router.get('/me', authenticate, authController.getProfile);

// Sign out
router.post('/signout', authenticate, authController.signOut);

// Update profile
router.put('/profile', authenticate, updateProfileValidation, authController.updateProfile);

// Change password
router.put('/change-password', authenticate, changePasswordValidation, authController.changePassword);


// ================= ADMIN ROUTES =================

// Register user
router.post('/register', authenticate, adminOnly, registerValidation, authController.register);

// Unlock account
router.post('/unlock-account', authenticate, adminOnly, authController.unlockAccount);


module.exports = router;