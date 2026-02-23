const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  assetTag: { type: String, trim: true },
  serialNumber: { type: String, trim: true },
  name: { type: String, required: true, trim: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceCategory', required: true },
  manufacturer: { type: String, trim: true },
  model: { type: String, trim: true },
  specifications: { type: Object, default: {} },
  purchaseDate: Date,
  purchasePrice: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  salvageValue: { type: Number, default: 0 },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  status: { type: String, enum: ['available', 'assigned', 'in_maintenance', 'retired'], default: 'available' },
  condition: { type: String, enum: ['new', 'good', 'fair', 'poor'], default: 'good' },
  barcode: { type: String, trim: true },
  imageUrl: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);