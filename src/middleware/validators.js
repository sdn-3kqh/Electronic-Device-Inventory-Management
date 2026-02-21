const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(e => e.msg)
    });
  }
  next();
};

const signInValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation
];

const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/\d/).withMessage('Password must contain a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain a special character'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role')
    .optional()
    .isIn(['admin', 'inventory_manager', 'staff'])
    .withMessage('Invalid role'),
  handleValidation
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/\d/).withMessage('Password must contain a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain a special character'),
  handleValidation
];

const resetPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter'),
  handleValidation
];

const updateProfileValidation = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  handleValidation
];

module.exports = {
  signInValidation,
  registerValidation,
  changePasswordValidation,
  resetPasswordValidation,
  updateProfileValidation
};
