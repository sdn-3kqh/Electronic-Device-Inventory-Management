const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  type: { type: String, enum: ['building', 'floor', 'room', 'other'], default: 'other' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  address: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
