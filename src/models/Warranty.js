const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  type: { type: String, enum: ['manufacturer', 'extended', 'other'], default: 'manufacturer' },
  provider: { type: String, trim: true },
  startDate: Date,
  endDate: Date,
  coverage: { type: String, trim: true },
  cost: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Warranty', warrantySchema);
