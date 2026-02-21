const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema({
  fieldName: { type: String, trim: true },
  fieldType: { type: String, trim: true },
  required: { type: Boolean, default: false }
}, { _id: false });

const deviceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  description: { type: String, trim: true },
  customFields: { type: [customFieldSchema], default: [] },
  depreciationRuleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DepreciationRule', default: null }
}, { timestamps: true });

module.exports = mongoose.model('DeviceCategory', deviceCategorySchema);
