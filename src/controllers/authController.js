const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validatePasswordStrength } = require('../utils/passwordHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = '60m';
const REFRESH_EXPIRES_IN = '7d';

// Generate token pair
const generateTokens = (user) => {
  const payload = { userId: user._id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};

exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    if (user.failedLoginAttempts >= 5) {
      return res.status(403).json({ message: 'Account is locked. Contact administrator.' });
    }

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

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.status === 'inactive') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, departmentId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

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

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('departmentId', 'name');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.signOut = async (req, res) => {
  res.json({ message: 'Signed out successfully' });
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { firstName, lastName },
      { new: true, select: '-password' }
    );
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

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
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({
        message: 'Password does not meet requirements',
        errors: validation.errors
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    user.failedLoginAttempts = 0;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unlockAccount = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.failedLoginAttempts = 0;
    await user.save();

    res.json({ message: 'Account unlocked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
