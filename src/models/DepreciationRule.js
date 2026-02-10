const mongoose = require('mongoose');

const depreciationRuleSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceCategory', required: true },
  method: { type: String, enum: ['straight_line', 'declining_balance'], default: 'straight_line' },
  usefulLifeYears: { type: Number, required: true },
  salvageValuePercent: { type: Number, default: 0 },
  depreciationRate: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('DepreciationRule', depreciationRuleSchema);
