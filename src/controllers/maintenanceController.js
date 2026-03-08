const MaintenanceRecord = require('../models/MaintenanceRecord');
const Device = require('../models/Device');

const populateMaintenance = (query) => {
  return query
    .populate('deviceId', 'name serialNumber assetTag status')
    .populate('performedBy', 'firstName lastName email')
    .populate('requestedBy', 'firstName lastName email');
};

// UC-21: Record Maintenance (Admin, IM)
exports.recordMaintenance = async (req, res) => {
  try {
    const { deviceId, type, description, cost, notes, performedBy } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: 'deviceId is required' });
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const record = new MaintenanceRecord({
      deviceId,
      type: type || 'corrective',
      status: 'completed',
      completedDate: new Date(),
      performedBy: performedBy || req.user.userId,
      requestedBy: req.user.userId,
      description,
      cost: cost || 0,
      notes: notes || ''
    });

    await record.save();
    const populated = await populateMaintenance(MaintenanceRecord.findById(record._id));
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// UC-22: Request Maintenance (All roles - staff can request)
exports.requestMaintenance = async (req, res) => {
  try {
    const { deviceId, type, description, notes } = req.body;

    if (!deviceId || !description) {
      return res.status(400).json({ message: 'deviceId and description are required' });
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const record = new MaintenanceRecord({
      deviceId,
      type: type || 'corrective',
      status: 'scheduled',
      requestedBy: req.user.userId,
      description,
      notes: notes || ''
    });

    await record.save();

    // BR-028: Thiết bị đang bảo trì hiển thị status "In Maintenance"
    device.status = 'in_maintenance';
    await device.save();

    const populated = await populateMaintenance(MaintenanceRecord.findById(record._id));
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// UC-23: Schedule Maintenance (Admin, IM)
exports.scheduleMaintenance = async (req, res) => {
  try {
    const { deviceId, type, scheduledDate, description, performedBy, notes } = req.body;

    if (!deviceId || !scheduledDate) {
      return res.status(400).json({ message: 'deviceId and scheduledDate are required' });
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (new Date(scheduledDate) < new Date()) {
      return res.status(400).json({ message: 'Scheduled date cannot be in the past' });
    }

    const record = new MaintenanceRecord({
      deviceId,
      type: type || 'preventive',
      status: 'scheduled',
      scheduledDate: new Date(scheduledDate),
      performedBy: performedBy || undefined,
      requestedBy: req.user.userId,
      description: description || '',
      notes: notes || ''
    });

    await record.save();
    const populated = await populateMaintenance(MaintenanceRecord.findById(record._id));
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// UC-24: Complete Maintenance (Admin, IM)
exports.completeMaintenance = async (req, res) => {
  try {
    const record = await MaintenanceRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    if (record.status === 'completed') {
      return res.status(400).json({ message: 'Maintenance is already completed' });
    }

    if (record.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot complete a cancelled maintenance' });
    }

    const { cost, notes, performedBy } = req.body;

    record.status = 'completed';
    record.completedDate = new Date();
    if (cost !== undefined) record.cost = cost;
    if (notes) record.notes = (record.notes ? record.notes + '\n' : '') + notes;
    if (performedBy) record.performedBy = performedBy;
    if (!record.performedBy) record.performedBy = req.user.userId;

    await record.save();

    // Restore device status to available (unless it's assigned)
    const device = await Device.findById(record.deviceId);
    if (device && device.status === 'in_maintenance') {
      device.status = 'available';
      await device.save();
    }

    const populated = await populateMaintenance(MaintenanceRecord.findById(record._id));
    res.json({ message: 'Maintenance completed', record: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UC-25: View Maintenance History (by device)
exports.getMaintenanceHistory = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const history = await populateMaintenance(
      MaintenanceRecord.find({ deviceId }).sort({ createdAt: -1 })
    );

    res.json({ deviceId, deviceName: device.name, total: history.length, history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Additional: Get all maintenance records with filters and pagination
exports.getAllMaintenance = async (req, res) => {
  try {
    const { status, type, deviceId, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (deviceId) filter.deviceId = deviceId;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const records = await populateMaintenance(
      MaintenanceRecord.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 })
    );

    const total = await MaintenanceRecord.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: records,
      pagination: { page: pageNum, limit: limitNum, total, totalPages }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Additional: Get maintenance record by ID
exports.getMaintenanceById = async (req, res) => {
  try {
    const record = await populateMaintenance(MaintenanceRecord.findById(req.params.id));
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Additional: Update maintenance record
exports.updateMaintenance = async (req, res) => {
  try {
    const updates = req.body;
    // Don't allow changing status directly here - use complete/cancel endpoints
    delete updates.status;
    delete updates.completedDate;

    const record = await MaintenanceRecord.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    const populated = await populateMaintenance(MaintenanceRecord.findById(record._id));
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Additional: Cancel maintenance
exports.cancelMaintenance = async (req, res) => {
  try {
    const record = await MaintenanceRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    if (record.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed maintenance' });
    }

    record.status = 'cancelled';
    if (req.body.notes) {
      record.notes = (record.notes ? record.notes + '\n' : '') + `[Cancelled] ${req.body.notes}`;
    }
    await record.save();

    // Restore device status if it was in maintenance
    const device = await Device.findById(record.deviceId);
    if (device && device.status === 'in_maintenance') {
      device.status = 'available';
      await device.save();
    }

    const populated = await populateMaintenance(MaintenanceRecord.findById(record._id));
    res.json({ message: 'Maintenance cancelled', record: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Additional: Get upcoming scheduled maintenance
exports.getUpcomingMaintenance = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const records = await populateMaintenance(
      MaintenanceRecord.find({
        status: 'scheduled',
        scheduledDate: { $gte: now, $lte: futureDate }
      }).sort({ scheduledDate: 1 })
    );

    res.json({ total: records.length, days: parseInt(days), records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
