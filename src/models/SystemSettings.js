const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., 'session_timeout', 'audit_retention_years'
  value: { type: mongoose.Schema.Types.Mixed, required: true }, // Có thể là string, number, object
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);