const depreciationService = require('../services/depreciationService');
const warrantyService = require('../services/warrantyService');
const Device = require('../models/Device');
const Warranty = require('../models/Warranty');
const Assignment = require('../models/Assignment');

// Generate warranty report
exports.generateWarrantyReport = async (req, res) => {
  try {
    const report = await warrantyService.getWarrantyReport();
    
    if (report.error) {
      return res.status(500).json({ message: report.error });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate depreciation report
exports.generateDepreciationReport = async (req, res) => {
  try {
    const { categoryId } = req.query;

    if (!categoryId) {
      return res.status(400).json({ message: 'categoryId is required' });
    }

    const report = await depreciationService.getDepreciationReport(categoryId);
    
    if (report.error) {
      return res.status(500).json({ message: report.error });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate device status report
exports.generateDeviceStatusReport = async (req, res) => {
  try {
    const devices = await Device.find()
      .populate('categoryId', 'name')
      .populate('locationId', 'name');

    const report = {
      timestamp: new Date(),
      summary: {
        totalDevices: devices.length,
        available: 0,
        assigned: 0,
        inMaintenance: 0,
        retired: 0
      },
      byStatus: {},
      byCategory: {},
      byLocation: {}
    };

    devices.forEach(device => {
      // Count by status
      report.summary[device.status === 'in_maintenance' ? 'inMaintenance' : device.status]++;
      
      if (!report.byStatus[device.status]) {
        report.byStatus[device.status] = [];
      }
      report.byStatus[device.status].push({
        _id: device._id,
        name: device.name,
        serialNumber: device.serialNumber
      });

      // Count by category
      const categoryName = device.categoryId?.name || 'Unknown';
      if (!report.byCategory[categoryName]) {
        report.byCategory[categoryName] = { count: 0, devices: [] };
      }
      report.byCategory[categoryName].count++;
      report.byCategory[categoryName].devices.push(device.name);

      // Count by location
      const locationName = device.locationId?.name || 'Unknown';
      if (!report.byLocation[locationName]) {
        report.byLocation[locationName] = { count: 0, devices: [] };
      }
      report.byLocation[locationName].count++;
      report.byLocation[locationName].devices.push(device.name);
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate assignment report
exports.generateAssignmentReport = async (req, res) => {
  try {
    const { userId, status } = req.query;

    const filter = {};
    if (userId) filter['assignedTo.userId'] = userId;
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .populate('deviceId', 'name serialNumber assetTag')
      .populate('assignedTo.userId', 'name email')
      .populate('assignedBy.userId', 'name email')
      .sort({ createdAt: -1 });

    const report = {
      timestamp: new Date(),
      total: assignments.length,
      byStatus: {},
      assignments: assignments.map(a => ({
        _id: a._id,
        deviceName: a.deviceId?.name,
        serialNumber: a.deviceId?.serialNumber,
        assignedTo: a.assignedTo?.userId?.name,
        assignedBy: a.assignedBy?.userId?.name,
        status: a.status,
        assignedDate: a.assignedDate,
        returnedDate: a.returnedDate
      }))
    };

    assignments.forEach(a => {
      if (!report.byStatus[a.status]) {
        report.byStatus[a.status] = 0;
      }
      report.byStatus[a.status]++;
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get warranty expiration alerts
exports.getWarrantyAlerts = async (req, res) => {
  try {
    const alerts = await warrantyService.getWarrantyAlerts();
    
    if (!alerts.success) {
      return res.status(500).json({ message: alerts.error });
    }

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate inventory value report
exports.generateInventoryValueReport = async (req, res) => {
  try {
    const devices = await Device.find()
      .populate('categoryId', 'name')
      .sort({ categoryId: 1 });

    const report = {
      timestamp: new Date(),
      summary: {
        totalDevices: devices.length,
        totalPurchaseValue: 0,
        totalCurrentValue: 0,
        totalDepreciation: 0,
        averageDepreciation: 0
      },
      byCategory: {}
    };

    devices.forEach(device => {
      const purchaseValue = device.purchasePrice || 0;
      const currentValue = device.currentValue || 0;
      const depreciation = purchaseValue - currentValue;

      report.summary.totalPurchaseValue += purchaseValue;
      report.summary.totalCurrentValue += currentValue;
      report.summary.totalDepreciation += depreciation;

      const categoryName = device.categoryId?.name || 'Unknown';
      if (!report.byCategory[categoryName]) {
        report.byCategory[categoryName] = {
          count: 0,
          purchaseValue: 0,
          currentValue: 0,
          depreciation: 0,
          devices: []
        };
      }

      report.byCategory[categoryName].count++;
      report.byCategory[categoryName].purchaseValue += purchaseValue;
      report.byCategory[categoryName].currentValue += currentValue;
      report.byCategory[categoryName].depreciation += depreciation;
      report.byCategory[categoryName].devices.push({
        name: device.name,
        purchasePrice: purchaseValue,
        currentValue,
        depreciation
      });
    });

    if (devices.length > 0) {
      report.summary.averageDepreciation = (
        (report.summary.totalDepreciation / report.summary.totalPurchaseValue) * 100
      ).toFixed(2);
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
