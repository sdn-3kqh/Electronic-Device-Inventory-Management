// controllers/deviceController.js
const Device = require('../models/Device');
const Assignment = require('../models/Assignment'); // Để check assignment khi delete

// Add Device (UC-05)
exports.addDevice = async (req, res) => {
  try {
    const {
      assetTag, serialNumber, name, categoryId, manufacturer, model,
      specifications, purchaseDate, purchasePrice, currentValue,
      salvageValue, locationId, status, condition, barcode, imageUrl
    } = req.body;

    // Check if serialNumber is unique (BR-004)
    const existingDevice = await Device.findOne({ serialNumber });
    if (existingDevice) {
      return res.status(400).json({ message: 'Serial number must be unique' });
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
    const { status, categoryId, locationId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (categoryId) filter.categoryId = categoryId;
    if (locationId) filter.locationId = locationId;

    const devices = await Device.find(filter)
      .populate('categoryId', 'name')
      .populate('locationId', 'name');
    res.json(devices);
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

// Additional: Get All Devices (for listing)
exports.getAllDevices = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'staff') {
      const assignments = await Assignment.find({ 'assignedTo.userId': req.user.id, status: { $in: ['pending', 'acknowledged', 'active'] } });
      const assignedDeviceIds = assignments.map(a => a.deviceId);
      query._id = { $in: assignedDeviceIds };
    }
    const devices = await Device.find(query)
      .populate('categoryId', 'name')
      .populate('locationId', 'name')
      .sort({ createdAt: -1 });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};