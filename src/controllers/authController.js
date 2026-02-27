const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validatePasswordStrength } = require('../utils/passwordHelper');
const { sendResetPasswordEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || 'reset-secret';

const JWT_EXPIRES_IN = '60m';
const REFRESH_EXPIRES_IN = '7d';
const RESET_TOKEN_EXPIRES = '15m';


// ================= GENERATE TOKENS =================
const generateTokens = (user) => {
  const payload = { userId: user._id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};


// ================= SIGN IN =================
exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.status === 'inactive')
      return res.status(403).json({ message: 'Account is inactive' });

    if (user.failedLoginAttempts >= 5)
      return res.status(403).json({ message: 'Account is locked. Contact administrator.' });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;
      await user.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= REFRESH TOKEN =================
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token is required' });

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.status === 'inactive')
      return res.status(401).json({ message: 'Invalid refresh token' });

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};


// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, departmentId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: 'Email already registered' });

    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: role || 'staff',
      departmentId
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    // tạo reset token
    const token = jwt.sign(
      { userId: user._id },
      RESET_TOKEN_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRES }
    );

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

    await sendResetPasswordEmail(user.email, resetLink);

    res.json({ message: 'Password reset email sent' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= RESET PASSWORD (TOKEN) =================
exports.resetPasswordWithToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({
        message: 'Password does not meet requirements',
        errors: validation.errors
      });
    }

    const decoded = jwt.verify(token, RESET_TOKEN_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user || user.resetPasswordToken !== token)
      return res.status(400).json({ message: 'Invalid token' });

    if (user.resetPasswordExpires < Date.now())
      return res.status(400).json({ message: 'Token expired' });

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.failedLoginAttempts = 0;

    await user.save();

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};


// ================= CHANGE PASSWORD =================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({
        message: 'Password does not meet requirements',
        errors: validation.errors
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid)
      return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= OTHER APIs (GIỮ NGUYÊN) =================
exports.getProfile = async (req, res) => { /* giữ nguyên */ };
exports.signOut = async (req, res) => { res.json({ message: 'Signed out successfully' }); };
exports.updateProfile = async (req, res) => { /* giữ nguyên */ };
exports.unlockAccount = async (req, res) => { /* giữ nguyên */ };