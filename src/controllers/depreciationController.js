const DepreciationRule = require('../models/DepreciationRule');
const Device = require('../models/Device');
const DeviceCategory = require('../models/DeviceCategory');

/**
 * Straight Line Depreciation Formula:
 * Annual Depreciation = (Cost - Salvage Value) / Useful Life in Years
 * Book Value = Cost - (Annual Depreciation × Years Used)
 */
const calculateStraightLineDepreciation = (purchasePrice, salvageValue, usefulLifeYears, monthsUsed) => {
  const monthsInYear = 12;
  const annualDepreciation = (purchasePrice - salvageValue) / usefulLifeYears;
  const monthlyDepreciation = annualDepreciation / monthsInYear;
  const totalDepreciation = monthlyDepreciation * monthsUsed;
  const bookValue = Math.max(salvageValue, purchasePrice - totalDepreciation);
  
  return {
    annualDepreciation,
    monthlyDepreciation,
    totalDepreciation,
    bookValue,
    depreciationPercent: ((purchasePrice - bookValue) / purchasePrice * 100).toFixed(2)
  };
};

/**
 * Declining Balance Depreciation Formula:
 * Annual Depreciation Rate = 1 / Useful Life
 * Book Value = Cost × (1 - Rate)^Years
 */
const calculateDecliningBalanceDepreciation = (purchasePrice, salvageValue, usefulLifeYears, monthsUsed) => {
  const yearsUsed = monthsUsed / 12;
  const depreciationRate = 1 / usefulLifeYears;
  const bookValue = Math.max(salvageValue, purchasePrice * Math.pow(1 - depreciationRate, yearsUsed));
  const totalDepreciation = purchasePrice - bookValue;
  const annualDepreciation = (purchasePrice - bookValue) / yearsUsed;
  
  return {
    annualDepreciation,
    depreciationRate: (depreciationRate * 100).toFixed(2),
    totalDepreciation,
    bookValue,
    depreciationPercent: ((purchasePrice - bookValue) / purchasePrice * 100).toFixed(2)
  };
};

// Create depreciation rule
exports.createDepreciationRule = async (req, res) => {
  try {
    const { categoryId, method, usefulLifeYears, salvageValuePercent } = req.body;

    // Validate category exists
    const category = await DeviceCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Device category not found' });
    }

    // Check if rule already exists for this category
    const existingRule = await DepreciationRule.findOne({ categoryId });
    if (existingRule) {
      return res.status(400).json({ message: 'Depreciation rule already exists for this category' });
    }

    // Calculate depreciation rate for straight line method
    const depreciationRate = method === 'straight_line' 
      ? (100 / usefulLifeYears).toFixed(2) 
      : (100 / usefulLifeYears).toFixed(2);

    const rule = new DepreciationRule({
      categoryId,
      method,
      usefulLifeYears,
      salvageValuePercent,
      depreciationRate
    });

    await rule.save();
    await rule.populate('categoryId', 'name code');

    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all depreciation rules
exports.getAllDepreciationRules = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = {};
    
    if (categoryId) filter.categoryId = categoryId;

    const rules = await DepreciationRule.find(filter)
      .populate('categoryId', 'name code')
      .sort({ createdAt: -1 });

    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get depreciation rule by ID
exports.getDepreciationRuleById = async (req, res) => {
  try {
    const rule = await DepreciationRule.findById(req.params.id)
      .populate('categoryId', 'name code description');

    if (!rule) {
      return res.status(404).json({ message: 'Depreciation rule not found' });
    }

    res.json(rule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get depreciation rule by category
exports.getDepreciationRuleByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const rule = await DepreciationRule.findOne({ categoryId })
      .populate('categoryId', 'name code description');

    if (!rule) {
      return res.status(404).json({ message: 'No depreciation rule found for this category' });
    }

    res.json(rule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update depreciation rule
exports.updateDepreciationRule = async (req, res) => {
  try {
    const { method, usefulLifeYears, salvageValuePercent } = req.body;
    const updates = { method, usefulLifeYears, salvageValuePercent };

    // Remove undefined fields
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    // Recalculate depreciation rate if usefulLifeYears changes
    if (usefulLifeYears) {
      updates.depreciationRate = method === 'straight_line' || !method
        ? (100 / usefulLifeYears).toFixed(2)
        : (100 / usefulLifeYears).toFixed(2);
    }

    const rule = await DepreciationRule.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name code');

    if (!rule) {
      return res.status(404).json({ message: 'Depreciation rule not found' });
    }

    res.json(rule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete depreciation rule
exports.deleteDepreciationRule = async (req, res) => {
  try {
    const rule = await DepreciationRule.findByIdAndDelete(req.params.id);
    
    if (!rule) {
      return res.status(404).json({ message: 'Depreciation rule not found' });
    }

    res.json({ message: 'Depreciation rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Calculate current depreciation for a device
exports.calculateDeviceDepreciation = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findById(deviceId).populate('categoryId');
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const rule = await DepreciationRule.findOne({ categoryId: device.categoryId });
    if (!rule) {
      return res.status(404).json({ message: 'No depreciation rule found for this device category' });
    }

    // Calculate months used
    const monthsUsed = device.purchaseDate 
      ? Math.floor((new Date() - new Date(device.purchaseDate)) / (1000 * 60 * 60 * 24 * 30.44))
      : 0;

    const salvageValue = device.purchasePrice * (rule.salvageValuePercent / 100);

    let depreciation;
    if (rule.method === 'straight_line') {
      depreciation = calculateStraightLineDepreciation(
        device.purchasePrice,
        salvageValue,
        rule.usefulLifeYears,
        monthsUsed
      );
    } else {
      depreciation = calculateDecliningBalanceDepreciation(
        device.purchasePrice,
        salvageValue,
        rule.usefulLifeYears,
        monthsUsed
      );
    }

    res.json({
      deviceId,
      deviceName: device.name,
      categoryId: device.categoryId._id,
      categoryName: device.categoryId.name,
      purchasePrice: device.purchasePrice,
      purchaseDate: device.purchaseDate,
      currentValue: device.currentValue,
      salvageValue: salvageValue.toFixed(2),
      depreciationMethod: rule.method,
      usefulLifeYears: rule.usefulLifeYears,
      monthsUsed,
      yearsUsed: (monthsUsed / 12).toFixed(2),
      depreciation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get depreciation values for all devices in a category
exports.getCategoryDepreciation = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const devices = await Device.find({ categoryId });
    if (devices.length === 0) {
      return res.status(404).json({ message: 'No devices found in this category' });
    }

    const rule = await DepreciationRule.findOne({ categoryId });
    if (!rule) {
      return res.status(404).json({ message: 'No depreciation rule found for this category' });
    }

    const category = await DeviceCategory.findById(categoryId);

    const result = devices.map(device => {
      const monthsUsed = device.purchaseDate 
        ? Math.floor((new Date() - new Date(device.purchaseDate)) / (1000 * 60 * 60 * 24 * 30.44))
        : 0;

      const salvageValue = device.purchasePrice * (rule.salvageValuePercent / 100);

      let depreciation;
      if (rule.method === 'straight_line') {
        depreciation = calculateStraightLineDepreciation(
          device.purchasePrice,
          salvageValue,
          rule.usefulLifeYears,
          monthsUsed
        );
      } else {
        depreciation = calculateDecliningBalanceDepreciation(
          device.purchasePrice,
          salvageValue,
          rule.usefulLifeYears,
          monthsUsed
        );
      }

      return {
        deviceId: device._id,
        deviceName: device.name,
        purchasePrice: device.purchasePrice,
        salvageValue: salvageValue.toFixed(2),
        currentBookValue: depreciation.bookValue.toFixed(2),
        monthsUsed,
        depreciationPercent: depreciation.depreciationPercent
      };
    });

    res.json({
      category: category.name,
      depreciationMethod: rule.method,
      usefulLifeYears: rule.usefulLifeYears,
      devicesCount: result.length,
      devices: result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Batch update device current value based on depreciation
exports.updateAllDeviceValues = async (req, res) => {
  try {
    const categories = await DeviceCategory.find();
    let updatedCount = 0;

    for (const category of categories) {
      const rule = await DepreciationRule.findOne({ categoryId: category._id });
      if (!rule) continue;

      const devices = await Device.find({ categoryId: category._id });

      for (const device of devices) {
        if (!device.purchasePrice || !device.purchaseDate) continue;

        const monthsUsed = Math.floor((new Date() - new Date(device.purchaseDate)) / (1000 * 60 * 60 * 24 * 30.44));
        const salvageValue = device.purchasePrice * (rule.salvageValuePercent / 100);

        let depreciation;
        if (rule.method === 'straight_line') {
          depreciation = calculateStraightLineDepreciation(
            device.purchasePrice,
            salvageValue,
            rule.usefulLifeYears,
            monthsUsed
          );
        } else {
          depreciation = calculateDecliningBalanceDepreciation(
            device.purchasePrice,
            salvageValue,
            rule.usefulLifeYears,
            monthsUsed
          );
        }

        device.currentValue = depreciation.bookValue;
        await device.save();
        updatedCount++;
      }
    }

    res.json({
      message: 'Device values updated successfully',
      updatedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
