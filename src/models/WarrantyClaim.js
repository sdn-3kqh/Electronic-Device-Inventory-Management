const mongoose = require('mongoose');

const warrantyClaimSchema = new mongoose.Schema({
  warrantyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warranty', required: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  claimNumber: { type: String, trim: true },
  filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  filedDate: Date,
  issue: { type: String, trim: true },
  status: { type: String, enum: ['filed', 'in_review', 'resolved', 'rejected'], default: 'filed' },
  resolution: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('WarrantyClaim', warrantyClaimSchema);
