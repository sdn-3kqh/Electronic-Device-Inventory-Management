const Warranty = require('../models/Warranty');
const WarrantyClaim = require('../models/WarrantyClaim');
const Device = require('../models/Device');

// Create Warranty
exports.createWarranty = async (req, res) => {
  try {
    const { deviceId, type, provider, startDate, endDate, coverage, cost } = req.body;

    // Validate device exists
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Check if warranty already exists for this device
    const existingWarranty = await Warranty.findOne({ deviceId, status: 'active' });
    if (existingWarranty) {
      return res.status(400).json({ message: 'Active warranty already exists for this device' });
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Determine status based on endDate
    let status = 'active';
    if (endDate && new Date(endDate) < new Date()) {
      status = 'expired';
    }

    const warranty = new Warranty({
      deviceId,
      type,
      provider,
      startDate,
      endDate,
      coverage,
      cost,
      status
    });

    await warranty.save();
    await warranty.populate('deviceId', 'name serialNumber assetTag');
    
    res.status(201).json(warranty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all warranties
exports.getAllWarranties = async (req, res) => {
  try {
    const { status, deviceId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (deviceId) filter.deviceId = deviceId;

    const warranties = await Warranty.find(filter)
      .populate('deviceId', 'name serialNumber assetTag')
      .sort({ createdAt: -1 });
    
    res.json(warranties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get warranty by ID
exports.getWarrantyById = async (req, res) => {
  try {
    const warranty = await Warranty.findById(req.params.id)
      .populate('deviceId', 'name serialNumber assetTag model manufacturer');
    
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    res.json(warranty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update warranty
exports.updateWarranty = async (req, res) => {
  try {
    const { type, provider, startDate, endDate, coverage, cost, status } = req.body;
    const updates = { type, provider, startDate, endDate, coverage, cost, status };

    // Remove undefined fields
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    // Validate dates if being updated
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Auto-update status based on endDate if endDate is updated
    if (endDate && !status) {
      updates.status = new Date(endDate) < new Date() ? 'expired' : 'active';
    }

    const warranty = await Warranty.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('deviceId', 'name serialNumber assetTag');

    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    res.json(warranty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete warranty
exports.deleteWarranty = async (req, res) => {
  try {
    const warranty = await Warranty.findByIdAndDelete(req.params.id);
    
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    res.json({ message: 'Warranty deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get expiring warranties (within 30 days)
exports.getExpiringWarranties = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const warranties = await Warranty.find({
      status: 'active',
      endDate: { $gte: now, $lte: futureDate }
    })
      .populate('deviceId', 'name serialNumber assetTag')
      .sort({ endDate: 1 });

    res.json(warranties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Refresh warranty status (check if any have expired)
exports.refreshWarrantyStatus = async (req, res) => {
  try {
    const now = new Date();
    
    const result = await Warranty.updateMany(
      { status: 'active', endDate: { $lt: now } },
      { status: 'expired' }
    );

    res.json({ 
      message: 'Warranty status updated',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create warranty claim
exports.createWarrantyClaim = async (req, res) => {
  try {
    const { warrantyId, deviceId, issue } = req.body;

    // Validate warranty exists
    const warranty = await Warranty.findById(warrantyId);
    if (!warranty) {
      return res.status(404).json({ message: 'Warranty not found' });
    }

    // Check warranty is active
    if (warranty.status !== 'active') {
      return res.status(400).json({ message: 'Cannot claim on expired or cancelled warranty' });
    }

    // Generate claim number
    const count = await WarrantyClaim.countDocuments();
    const claimNumber = `WC-${Date.now()}-${count + 1}`;

    const claim = new WarrantyClaim({
      warrantyId,
      deviceId,
      claimNumber,
      filedBy: req.user.id,
      filedDate: new Date(),
      issue,
      status: 'filed'
    });

    await claim.save();
    await claim.populate([
      { path: 'warrantyId' },
      { path: 'deviceId', select: 'name serialNumber assetTag' },
      { path: 'filedBy', select: 'name email' }
    ]);

    res.status(201).json(claim);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all warranty claims
exports.getAllWarrantyClaims = async (req, res) => {
  try {
    const { status, warrantyId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (warrantyId) filter.warrantyId = warrantyId;

    const claims = await WarrantyClaim.find(filter)
      .populate('warrantyId')
      .populate('deviceId', 'name serialNumber assetTag')
      .populate('filedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get warranty claim by ID
exports.getWarrantyClaimById = async (req, res) => {
  try {
    const claim = await WarrantyClaim.findById(req.params.id)
      .populate('warrantyId')
      .populate('deviceId', 'name serialNumber assetTag model manufacturer')
      .populate('filedBy', 'name email phone');

    if (!claim) {
      return res.status(404).json({ message: 'Warranty claim not found' });
    }

    res.json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update warranty claim status
exports.updateWarrantyClaim = async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const updates = {};
    
    if (status) updates.status = status;
    if (resolution) updates.resolution = resolution;

    const claim = await WarrantyClaim.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('warrantyId')
      .populate('deviceId', 'name serialNumber assetTag')
      .populate('filedBy', 'name email');

    if (!claim) {
      return res.status(404).json({ message: 'Warranty claim not found' });
    }

    res.json(claim);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete warranty claim
exports.deleteWarrantyClaim = async (req, res) => {
  try {
    const claim = await WarrantyClaim.findByIdAndDelete(req.params.id);
    
    if (!claim) {
      return res.status(404).json({ message: 'Warranty claim not found' });
    }

    res.json({ message: 'Warranty claim deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
