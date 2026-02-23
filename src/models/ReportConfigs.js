const mongoose = require('mongoose');

const reportConfigSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportType: { type: String, required: true }, // e.g., 'inventory', 'maintenance'
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  format: { type: String, enum: ['pdf', 'excel'], default: 'pdf' },
  emailRecipients: { type: [String], default: [] },
  filters: { type: Object, default: {} } // e.g., { departmentId: '...', status: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('ReportConfig', reportConfigSchema);