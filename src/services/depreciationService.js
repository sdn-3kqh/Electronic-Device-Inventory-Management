const Device = require('../models/Device');
const DepreciationRule = require('../models/DepreciationRule');
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

/**
 * Calculate depreciation for a single device
 */
const calculateDeviceValue = async (device) => {
  try {
    if (!device.purchasePrice || !device.purchaseDate) {
      return device.currentValue;
    }

    const rule = await DepreciationRule.findOne({ categoryId: device.categoryId });
    if (!rule) {
      return device.currentValue;
    }

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

    return depreciation.bookValue;
  } catch (error) {
    console.error('Error calculating device value:', error);
    return device.currentValue;
  }
};

/**
 * Update all device values based on depreciation
 * This should be run periodically (e.g., daily via cron job)
 */
exports.updateAllDeviceValues = async () => {
  try {
    console.log('Starting depreciation calculation job...');
    
    const categories = await DeviceCategory.find();
    let updatedCount = 0;

    for (const category of categories) {
      const rule = await DepreciationRule.findOne({ categoryId: category._id });
      if (!rule) continue;

      const devices = await Device.find({ categoryId: category._id });

      for (const device of devices) {
        if (!device.purchasePrice || !device.purchaseDate) continue;

        const newValue = await calculateDeviceValue(device);
        if (newValue !== device.currentValue) {
          device.currentValue = newValue;
          await device.save();
          updatedCount++;
        }
      }
    }

    console.log(`Depreciation job completed. Updated ${updatedCount} devices.`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error('Error in depreciation job:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get depreciation report for a category
 */
exports.getDepreciationReport = async (categoryId) => {
  try {
    const devices = await Device.find({ categoryId });
    const rule = await DepreciationRule.findOne({ categoryId });

    if (!rule) {
      return { error: 'No depreciation rule found for this category' };
    }

    const report = {
      categoryId,
      depreciationMethod: rule.method,
      usefulLifeYears: rule.usefulLifeYears,
      salvageValuePercent: rule.salvageValuePercent,
      devices: [],
      summary: {
        totalCost: 0,
        totalCurrentValue: 0,
        totalDepreciation: 0,
        averageDepreciationPercent: 0
      }
    };

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

      const deviceReport = {
        deviceId: device._id,
        name: device.name,
        serialNumber: device.serialNumber,
        purchasePrice: device.purchasePrice,
        purchaseDate: device.purchaseDate,
        monthsUsed,
        salvageValue: salvageValue.toFixed(2),
        currentValue: depreciation.bookValue.toFixed(2),
        totalDepreciation: depreciation.totalDepreciation.toFixed(2),
        depreciationPercent: depreciation.depreciationPercent
      };

      report.devices.push(deviceReport);
      report.summary.totalCost += device.purchasePrice;
      report.summary.totalCurrentValue += depreciation.bookValue;
      report.summary.totalDepreciation += depreciation.totalDepreciation;
    }

    if (report.devices.length > 0) {
      report.summary.averageDepreciationPercent = (
        (report.summary.totalDepreciation / report.summary.totalCost) * 100
      ).toFixed(2);
    }

    return report;
  } catch (error) {
    console.error('Error generating depreciation report:', error);
    return { error: error.message };
  }
};
