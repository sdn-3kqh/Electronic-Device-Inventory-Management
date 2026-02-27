const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  firstName: {
    type: String,
    required: true,
    trim: true
  },

  lastName: {
    type: String,
    required: true,
    trim: true
  },

  role: {
    type: String,
    enum: ['admin', 'inventory_manager', 'staff'],
    default: 'staff'
  },

  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },

  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },

  failedLoginAttempts: {
    type: Number,
    default: 0
  },

  lastLogin: {
    type: Date
  },

  // 🔐 RESET PASSWORD FIELDS
  resetPasswordToken: {
    type: String,
    default: null
  },

  resetPasswordExpires: {
    type: Date,
    default: null
  }

}, {
  timestamps: true
});


// 🔐 Hash password trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


// 🔐 So sánh mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};


module.exports = mongoose.model('User', userSchema);