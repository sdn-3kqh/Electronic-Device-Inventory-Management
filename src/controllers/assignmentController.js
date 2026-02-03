const Assignment = require('../models/Assignment');
const Device = require('../models/Device');

exports.assignDevice = async (req, res) => {
  try {
    const { deviceId, userId, departmentId, assignedBy, notes } = req.body;

    // Check if device exists and is available
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (device.status === 'assigned') {
      return res.status(400).json({ message: 'Device is already assigned' });
    }

    // Create assignment
    const assignment = new Assignment({
      deviceId,
      assignedTo: { userId, departmentId },
      assignedBy,
      notes
    });

    await assignment.save();

    // Update device status
    device.status = 'assigned';
    await device.save();

    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.unassignDevice = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    assignment.status = 'returned';
    assignment.returnDate = new Date();
    await assignment.save();

    // Update device status
    await Device.findByIdAndUpdate(assignment.deviceId, {
      status: 'available'
    });

    res.json({ message: 'Device unassigned successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acknowledgeAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    assignment.status = 'acknowledged';
    assignment.acknowledgedAt = new Date();
    await assignment.save();

    res.json({ message: 'Assignment acknowledged', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssignmentHistory = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const history = await Assignment.find({ deviceId })
      .populate('assignedTo.userId', 'firstName lastName email')
      .populate('assignedTo.departmentId', 'name code')
      .populate('assignedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserAssignments = async (req, res) => {
  try {
    const { userId } = req.params;
    const assignments = await Assignment.find({
      'assignedTo.userId': userId,
      status: { $in: ['pending', 'acknowledged', 'active'] }
    })
    .populate('deviceId')
    .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
