const depreciationService = require('../services/depreciationService');
const warrantyService = require('../services/warrantyService');
const Device = require('../models/Device');
const Warranty = require('../models/Warranty');
const Assignment = require('../models/Assignment');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const ReportConfig = require('../models/ReportConfigs');

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

// Generate maintenance report
exports.generateMaintenanceReport = async (req, res) => {
  try {
    const { deviceId, status, dateFrom, dateTo } = req.query;

    const filter = {};
    if (deviceId) filter.deviceId = deviceId;
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const records = await MaintenanceRecord.find(filter)
      .populate('deviceId', 'name serialNumber assetTag')
      .populate('performedBy', 'firstName lastName email')
      .populate('requestedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const report = {
      timestamp: new Date(),
      summary: {
        totalRecords: records.length,
        totalCost: 0
      },
      byStatus: {},
      byType: {},
      records: records.map(r => ({
        _id: r._id,
        deviceName: r.deviceId?.name,
        serialNumber: r.deviceId?.serialNumber,
        assetTag: r.deviceId?.assetTag,
        type: r.type,
        status: r.status,
        scheduledDate: r.scheduledDate,
        completedDate: r.completedDate,
        cost: r.cost,
        performedBy: r.performedBy ? `${r.performedBy.firstName} ${r.performedBy.lastName}` : null
      }))
    };

    records.forEach(r => {
      // Accumulate cost
      report.summary.totalCost += r.cost || 0;

      // Group by status
      if (!report.byStatus[r.status]) {
        report.byStatus[r.status] = 0;
      }
      report.byStatus[r.status]++;

      // Group by type
      if (!report.byType[r.type]) {
        report.byType[r.type] = 0;
      }
      report.byType[r.type]++;
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate custom report
exports.generateCustomReport = async (req, res) => {
  try {
    // Expected nested object from body: { filters: {}, fields: [] }
    const { filters = {}, fields = [] } = req.body;

    // Building the query based on filters
    const query = {};

    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.locationId) query.locationId = filters.locationId;
    if (filters.status) query.status = filters.status;
    if (filters.condition) query.condition = filters.condition;
    
    // Date range for purchaseDate
    if (filters.purchaseDateFrom || filters.purchaseDateTo) {
      query.purchaseDate = {};
      if (filters.purchaseDateFrom) query.purchaseDate.$gte = new Date(filters.purchaseDateFrom);
      if (filters.purchaseDateTo) query.purchaseDate.$lte = new Date(filters.purchaseDateTo);
    }
    
    // Value range for purchasePrice
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.purchasePrice = {};
      if (filters.minPrice !== undefined) query.purchasePrice.$gte = Number(filters.minPrice);
      if (filters.maxPrice !== undefined) query.purchasePrice.$lte = Number(filters.maxPrice);
    }

    // Default fields if none provided
    const defaultFields = ['name', 'serialNumber', 'assetTag', 'status', 'condition', 'purchaseDate', 'purchasePrice'];
    const selectFields = fields.length > 0 ? fields.join(' ') : defaultFields.join(' ');

    // Execute query
    const devices = await Device.find(query)
      .select(selectFields)
      .populate('categoryId', 'name')
      .populate('locationId', 'name')
      .lean();

    const report = {
      timestamp: new Date(),
      summary: {
        totalRecords: devices.length,
        filtersApplied: Object.keys(filters).length,
      },
      data: devices.map(device => {
        // Flatten populated fields for easier CSV/Excel export later if needed
        return {
          ...device,
          categoryName: device.categoryId ? device.categoryId.name : null,
          locationName: device.locationId ? device.locationId.name : null,
          // Remove the actual objects to keep the response clean
          categoryId: undefined,
          locationId: undefined
        };
      })
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Schedule Report (UC-38) ---
exports.createReportConfig = async (req, res) => {
  try {
    const { reportType, frequency, format, emailRecipients, filters } = req.body;
    
    // Ensure the array of emails exists
    const recipients = emailRecipients || [];
    // Add user email if not included
    if (req.user.email && !recipients.includes(req.user.email)) {
      recipients.push(req.user.email);
    }

    const reportConfig = new ReportConfig({
      userId: req.user.userId,
      reportType,
      frequency,
      format,
      emailRecipients: recipients,
      filters
    });

    await reportConfig.save();
    res.status(201).json(reportConfig);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReportConfigs = async (req, res) => {
  try {
    // Users can only view their own configs unless they are Admin
    const query = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    
    const configs = await ReportConfig.find(query).populate('userId', 'firstName lastName email').sort({ createdAt: -1 });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReportConfig = async (req, res) => {
  try {
    const config = await ReportConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'Report Config not found' });
    }

    // Role check
    if (req.user.role !== 'admin' && config.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { frequency, format, emailRecipients, filters } = req.body;
    if (frequency) config.frequency = frequency;
    if (format) config.format = format;
    if (emailRecipients) config.emailRecipients = emailRecipients;
    if (filters) config.filters = filters;

    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReportConfig = async (req, res) => {
  try {
    const config = await ReportConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'Report Config not found' });
    }

    // Role check
    if (req.user.role !== 'admin' && config.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await config.deleteOne();
    res.json({ message: 'Report Config deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Export Report (UC-39) ---
exports.exportReport = async (req, res) => {
  try {
    // The client sends the report data they want to export and the format
    // Expected body: { data: [{}], format: 'csv' | 'excel', filename: 'report' }
    const { data, format = 'csv', filename = 'export' } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: 'No data provided for export or data is empty' });
    }

    if (format === 'csv') {
      // Extract headers from the first object keys
      const headers = Object.keys(data[0]);
      
      // Map data to CSV rows
      const rows = data.map(row => {
        return headers.map(header => {
          let cellValue = row[header] === null || row[header] === undefined ? '' : row[header];
          // Escape quotes and wrap in quotes if there's a comma
          cellValue = String(cellValue).replace(/"/g, '""');
          if (cellValue.search(/("|,|\n)/g) >= 0) {
            cellValue = `"${cellValue}"`;
          }
          return cellValue;
        }).join(',');
      });

      // Combine headers and rows
      const csvContent = [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      return res.status(200).send(csvContent);
    } 
    
    if (format === 'excel') {
      // For a real production app, we would use a library like 'exceljs' or 'xlsx'.
      // For now, we return a 501 Not Implemented or suggest they use CSV.
      return res.status(501).json({ message: 'Excel export requires additional libraries (e.g., exceljs). Please use CSV format.' });
    }

    res.status(400).json({ message: 'Unsupported format. Use csv.' });

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
