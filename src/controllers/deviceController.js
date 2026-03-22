// controllers/deviceController.js
const Device = require('../models/Device');
const Assignment = require('../models/Assignment'); // Để check assignment khi delete

// Barcode generation utility
const generateBarcode = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BC-${timestamp.slice(-8)}-${random}`;
};

// Add Device (UC-05)
exports.addDevice = async (req, res) => {
  try {
    const {
      assetTag, serialNumber, name, categoryId, manufacturer, model,
      specifications, purchaseDate, purchasePrice, currentValue,
      salvageValue, locationId, status, condition, barcode, imageUrl
    } = req.body;

    // Check if serialNumber is unique (BR-004) — only when provided
    if (serialNumber) {
      const existingDevice = await Device.findOne({ serialNumber });
      if (existingDevice) {
        return res.status(400).json({ message: 'Serial number must be unique' });
      }
    }

    // Validate purchaseDate not in future (BR-006)
    if (purchaseDate && new Date(purchaseDate) > new Date()) {
      return res.status(400).json({ message: 'Purchase date cannot be in the future' });
    }

    const device = new Device({
      assetTag, serialNumber, name, categoryId, manufacturer, model,
      specifications, purchaseDate, purchasePrice, currentValue,
      salvageValue, locationId, status, condition, barcode, imageUrl
    });

    await device.save();
    res.status(201).json(device);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update Device (UC-06)
exports.updateDevice = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const updates = req.body;

    // Check if serialNumber is being updated and remains unique
    if (updates.serialNumber) {
      const existingDevice = await Device.findOne({ serialNumber: updates.serialNumber });
      if (existingDevice && existingDevice._id.toString() !== deviceId) {
        return res.status(400).json({ message: 'Serial number must be unique' });
      }
    }

    // Validate purchaseDate if updated
    if (updates.purchaseDate && new Date(updates.purchaseDate) > new Date()) {
      return res.status(400).json({ message: 'Purchase date cannot be in the future' });
    }

    const device = await Device.findByIdAndUpdate(deviceId, updates, { new: true, runValidators: true });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.json(device);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Device (UC-07)
exports.deleteDevice = async (req, res) => {
  try {
    const deviceId = req.params.id;

    // Check if device is assigned (BR-011)
    const activeAssignment = await Assignment.findOne({ deviceId, status: { $in: ['pending', 'acknowledged', 'active'] } });
    if (activeAssignment) {
      return res.status(400).json({ message: 'Cannot delete assigned device' });
    }

    const device = await Device.findByIdAndDelete(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// View Device Details (UC-08)
exports.getDeviceDetails = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('categoryId', 'name code description')
      .populate('locationId', 'name code type address');
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search Devices (UC-09) - Simple search by keyword
exports.searchDevices = async (req, res) => {
  try {
    const { keyword } = req.query;
    const devices = await Device.find({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { serialNumber: { $regex: keyword, $options: 'i' } },
        { model: { $regex: keyword, $options: 'i' } },
        { manufacturer: { $regex: keyword, $options: 'i' } }
      ]
    }).populate('categoryId', 'name').populate('locationId', 'name');
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Filter Devices (UC-10) - Example: by status, category, location
exports.filterDevices = async (req, res) => {
  try {
    const { status, categoryId, locationId, condition, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (categoryId) filter.categoryId = categoryId;
    if (locationId) filter.locationId = locationId;
    if (condition) filter.condition = condition;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const devices = await Device.find(filter)
      .populate('categoryId', 'name')
      .populate('locationId', 'name')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Device.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: devices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dispose Device (UC-50) - Similar to retire
exports.disposeDevice = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check if assigned
    const activeAssignment = await Assignment.findOne({ deviceId, status: { $in: ['pending', 'acknowledged', 'active'] } });
    if (activeAssignment) {
      return res.status(400).json({ message: 'Cannot dispose assigned device' });
    }

    device.status = 'retired';
    await device.save();
    res.json({ message: 'Device disposed successfully', device });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Additional: Get All Devices (for listing) with pagination
exports.getAllDevices = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = '-1' } = req.query;
    
    let query = {};
    if (req.user.role === 'staff') {
      const assignments = await Assignment.find({ 'assignedTo.userId': req.user.id, status: { $in: ['pending', 'acknowledged', 'active'] } });
      const assignedDeviceIds = assignments.map(a => a.deviceId);
      query._id = { $in: assignedDeviceIds };
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const sortObj = {};
    sortObj[sortBy] = parseInt(sortOrder);

    const devices = await Device.find(query)
      .populate('categoryId', 'name code')
      .populate('locationId', 'name code')
      .skip(skip)
      .limit(limitNum)
      .sort(sortObj);

    const total = await Device.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: devices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate barcode for a device
exports.generateBarcode = async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const barcode = generateBarcode();
    device.barcode = barcode;
    await device.save();

    res.json({ 
      deviceId,
      barcode,
      message: 'Barcode generated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate barcodes for multiple devices
exports.generateMultipleBarcodes = async (req, res) => {
  try {
    const { deviceIds } = req.body;

    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ message: 'deviceIds must be a non-empty array' });
    }

    const result = [];
    for (const deviceId of deviceIds) {
      const device = await Device.findById(deviceId);
      if (device) {
        const barcode = generateBarcode();
        device.barcode = barcode;
        await device.save();
        result.push({ deviceId, barcode });
      }
    }

    res.json({ 
      message: 'Barcodes generated successfully',
      count: result.length,
      barcodes: result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk import devices from CSV data
exports.bulkImportDevices = async (req, res) => {
  try {
    const { devices } = req.body;

    if (!Array.isArray(devices) || devices.length === 0) {
      return res.status(400).json({ message: 'devices must be a non-empty array' });
    }

    const results = {
      imported: [],
      failed: []
    };

    for (const deviceData of devices) {
      try {
        // Check serial number uniqueness
        const existing = await Device.findOne({ serialNumber: deviceData.serialNumber });
        if (existing) {
          results.failed.push({
            serialNumber: deviceData.serialNumber,
            error: 'Serial number already exists'
          });
          continue;
        }

        const device = new Device({
          ...deviceData,
          barcode: deviceData.barcode || generateBarcode()
        });

        await device.save();
        results.imported.push({
          _id: device._id,
          name: device.name,
          serialNumber: device.serialNumber,
          barcode: device.barcode
        });
      } catch (error) {
        results.failed.push({
          serialNumber: deviceData.serialNumber,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bulk import completed',
      imported: results.imported.length,
      failed: results.failed.length,
      details: results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk export devices
exports.bulkExportDevices = async (req, res) => {
  try {
    const { filter = {} } = req.body;

    const devices = await Device.find(filter)
      .populate('categoryId', 'name')
      .populate('locationId', 'name')
      .lean();

    const csvData = devices.map(device => ({
      id: device._id,
      assetTag: device.assetTag || '',
      serialNumber: device.serialNumber || '',
      name: device.name,
      category: device.categoryId?.name || '',
      manufacturer: device.manufacturer || '',
      model: device.model || '',
      purchaseDate: device.purchaseDate ? new Date(device.purchaseDate).toISOString().split('T')[0] : '',
      purchasePrice: device.purchasePrice || 0,
      currentValue: device.currentValue || 0,
      salvageValue: device.salvageValue || 0,
      location: device.locationId?.name || '',
      status: device.status,
      condition: device.condition,
      barcode: device.barcode || ''
    }));

    res.json({
      count: csvData.length,
      data: csvData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk update device status
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { deviceIds, status } = req.body;

    if (!Array.isArray(deviceIds) || !status) {
      return res.status(400).json({ message: 'deviceIds array and status are required' });
    }

    const result = await Device.updateMany(
      { _id: { $in: deviceIds } },
      { status }
    );

    res.json({
      message: 'Status updated successfully',
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk update device location
exports.bulkUpdateLocation = async (req, res) => {
  try {
    const { deviceIds, locationId } = req.body;

    if (!Array.isArray(deviceIds) || !locationId) {
      return res.status(400).json({ message: 'deviceIds array and locationId are required' });
    }

    const result = await Device.updateMany(
      { _id: { $in: deviceIds } },
      { locationId }
    );

    res.json({
      message: 'Location updated successfully',
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Advanced search with filters
exports.advancedSearch = async (req, res) => {
  try {
    const { 
      keyword, 
      status, 
      categoryId, 
      locationId, 
      condition,
      minPrice,
      maxPrice,
      dateFrom,
      dateTo,
      page = 1, 
      limit = 20 
    } = req.query;

    const filter = {};

    // Text search
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { serialNumber: { $regex: keyword, $options: 'i' } },
        { model: { $regex: keyword, $options: 'i' } },
        { manufacturer: { $regex: keyword, $options: 'i' } },
        { barcode: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Exact filters
    if (status) filter.status = status;
    if (categoryId) filter.categoryId = categoryId;
    if (locationId) filter.locationId = locationId;
    if (condition) filter.condition = condition;

    // Price range
    if (minPrice || maxPrice) {
      filter.currentValue = {};
      if (minPrice) filter.currentValue.$gte = parseFloat(minPrice);
      if (maxPrice) filter.currentValue.$lte = parseFloat(maxPrice);
    }

    // Date range
    if (dateFrom || dateTo) {
      filter.purchaseDate = {};
      if (dateFrom) filter.purchaseDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.purchaseDate.$lte = endDate;
      }
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const devices = await Device.find(filter)
      .populate('categoryId', 'name code')
      .populate('locationId', 'name code')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Device.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: devices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// UC-11: Scan Barcode - Lookup device by barcode/QR code
exports.scanBarcode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Barcode or QR code is required' });
    }

    // Try to find by barcode first, then by serialNumber, then by assetTag
    let device = await Device.findOne({ barcode: code })
      .populate('categoryId', 'name code description')
      .populate('locationId', 'name code type address');

    if (!device) {
      device = await Device.findOne({ serialNumber: code })
        .populate('categoryId', 'name code description')
        .populate('locationId', 'name code type address');
    }

    if (!device) {
      device = await Device.findOne({ assetTag: code })
        .populate('categoryId', 'name code description')
        .populate('locationId', 'name code type address');
    }

    if (!device) {
      return res.status(404).json({ message: 'No device found for this code' });
    }

    // Get current assignment info if assigned
    let currentAssignment = null;
    if (device.status === 'assigned') {
      currentAssignment = await Assignment.findOne({
        deviceId: device._id,
        status: { $in: ['pending', 'acknowledged', 'active'] }
      })
        .populate('assignedTo.userId', 'firstName lastName email')
        .populate('assignedTo.departmentId', 'name code');
    }

    res.json({
      device,
      currentAssignment,
      scannedCode: code,
      scannedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UC-12: Print Asset Label - Generate printable label data for a device
exports.printAssetLabel = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findById(id)
      .populate('categoryId', 'name code')
      .populate('locationId', 'name code');

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Generate barcode if device doesn't have one
    if (!device.barcode) {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      device.barcode = `BC-${timestamp.slice(-8)}-${random}`;
      await device.save();
    }

    const label = {
      assetTag: device.assetTag || '',
      name: device.name,
      serialNumber: device.serialNumber || '',
      barcode: device.barcode,
      category: device.categoryId?.name || '',
      manufacturer: device.manufacturer || '',
      model: device.model || '',
      location: device.locationId?.name || '',
      purchaseDate: device.purchaseDate
        ? new Date(device.purchaseDate).toISOString().split('T')[0]
        : '',
      status: device.status,
      generatedAt: new Date()
    };

    res.json(label);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UC-12: Bulk Print Asset Labels - Generate labels for multiple devices
exports.bulkPrintAssetLabels = async (req, res) => {
  try {
    const { deviceIds } = req.body;

    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ message: 'deviceIds must be a non-empty array' });
    }

    const devices = await Device.find({ _id: { $in: deviceIds } })
      .populate('categoryId', 'name code')
      .populate('locationId', 'name code');

    const labels = [];
    for (const device of devices) {
      // Auto-generate barcode if missing
      if (!device.barcode) {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        device.barcode = `BC-${timestamp.slice(-8)}-${random}`;
        await device.save();
      }

      labels.push({
        deviceId: device._id,
        assetTag: device.assetTag || '',
        name: device.name,
        serialNumber: device.serialNumber || '',
        barcode: device.barcode,
        category: device.categoryId?.name || '',
        manufacturer: device.manufacturer || '',
        model: device.model || '',
        location: device.locationId?.name || '',
        purchaseDate: device.purchaseDate
          ? new Date(device.purchaseDate).toISOString().split('T')[0]
          : '',
        status: device.status
      });
    }

    res.json({
      count: labels.length,
      generatedAt: new Date(),
      labels
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
