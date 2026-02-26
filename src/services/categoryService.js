const DeviceCategory = require('../models/DeviceCategory');
const Device = require('../models/Device');

// Create
exports.createCategory = async (data) => {
  const existing = await DeviceCategory.findOne({ name: data.name });
  if (existing) {
    throw new Error('Category name must be unique');
  }

  const category = new DeviceCategory(data);
  return await category.save();
};

// Update
exports.updateCategory = async (id, data) => {
  if (data.name) {
    const existing = await DeviceCategory.findOne({ name: data.name });
    if (existing && existing._id.toString() !== id) {
      throw new Error('Category name must be unique');
    }
  }

  const category = await DeviceCategory.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );

  if (!category) throw new Error('Category not found');

  return category;
};

// Delete
exports.deleteCategory = async (id) => {
  const usedByDevice = await Device.findOne({ categoryId: id });
  if (usedByDevice) {
    throw new Error('Cannot delete category that is used by devices');
  }

  const category = await DeviceCategory.findByIdAndDelete(id);
  if (!category) throw new Error('Category not found');

  return true;
};

// Get One
exports.getCategoryById = async (id) => {
  const category = await DeviceCategory.findById(id)
    .populate('depreciationRuleId');

  if (!category) throw new Error('Category not found');

  return category;
};

// Get All
exports.getAllCategories = async () => {
  return await DeviceCategory.find()
    .populate('depreciationRuleId')
    .sort({ createdAt: -1 });
};