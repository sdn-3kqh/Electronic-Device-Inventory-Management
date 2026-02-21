const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  type: { type: String, enum: ['preventive', 'corrective', 'other'], default: 'other' },
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
  scheduledDate: Date,
  completedDate: Date,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, trim: true },
  cost: { type: Number, default: 0 },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
