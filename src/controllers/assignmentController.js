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

//
// Dev3 Week 1 - New controller functions (getAllAssignments, getAssignmentById, updateAssignment, transferDevice)
//
const User = require('../models/User');
const Department = require('../models/Department');

exports.getAllAssignments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, deviceId, userId, departmentId, dateFrom, dateTo, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};

    if (req.user.role === 'staff') {
      query['assignedTo.userId'] = req.user.userId;
    } else {
      if (status) query.status = status;
      if (deviceId) query.deviceId = deviceId;
      if (userId) query['assignedTo.userId'] = userId;
      if (departmentId) query['assignedTo.departmentId'] = departmentId;
      if (dateFrom || dateTo) {
        query.assignmentDate = {};
        if (dateFrom) query.assignmentDate.$gte = new Date(dateFrom);
        if (dateTo) query.assignmentDate.$lte = new Date(dateTo);
      }
    }

    if (search && req.user.role !== 'staff') {
      const devices = await Device.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const deviceIds = devices.map(d => d._id);
      const userIds = users.map(u => u._id);
      query.$or = [
        { deviceId: { $in: deviceIds } },
        { 'assignedTo.userId': { $in: userIds } }
      ];
    }

    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;
    const sortOption = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [assignments, total] = await Promise.all([
      Assignment.find(query)
        .populate('deviceId', 'name assetTag serialNumber status')
        .populate('assignedTo.userId', 'firstName lastName email')
        .populate('assignedTo.departmentId', 'name code')
        .populate('assignedBy', 'firstName lastName')
        .sort(sortOption)
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Assignment.countDocuments(query)
    ]);

    res.json({
      assignments,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('deviceId')
      .populate('assignedTo.userId', 'firstName lastName email')
      .populate('assignedTo.departmentId', 'name code')
      .populate('assignedBy', 'firstName lastName email');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (req.user.role === 'staff') {
      const assigneeUserId = assignment.assignedTo?.userId?._id?.toString() || assignment.assignedTo?.userId?.toString();
      if (assigneeUserId && assigneeUserId !== req.user.userId.toString()) {
        return res.status(403).json({ message: 'You can only view your own assignments' });
      }
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    if (assignment.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending assignments can be updated' });
    }
    if (req.body.notes !== undefined) {
      assignment.notes = req.body.notes;
    }
    await assignment.save();

    const populated = await Assignment.findById(assignment._id)
      .populate('deviceId', 'name assetTag serialNumber status')
      .populate('assignedTo.userId', 'firstName lastName email')
      .populate('assignedTo.departmentId', 'name code')
      .populate('assignedBy', 'firstName lastName');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.transferDevice = async (req, res) => {
  try {
    const { newUserId, newDepartmentId, notes } = req.body;
    const assignedBy = req.user.userId;

    if (!newUserId && !newDepartmentId) {
      return res.status(400).json({ message: 'Either newUserId or newDepartmentId is required' });
    }
    if (newUserId && newDepartmentId) {
      return res.status(400).json({ message: 'Provide only newUserId OR newDepartmentId, not both' });
    }

    const currentAssignment = await Assignment.findById(req.params.id).populate('deviceId');
    if (!currentAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    if (currentAssignment.status === 'returned') {
      return res.status(400).json({ message: 'Cannot transfer from already returned assignment' });
    }

    const device = await Device.findById(currentAssignment.deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    if (newUserId) {
      const user = await User.findById(newUserId);
      if (!user) return res.status(404).json({ message: 'New user not found' });
      if (user.status === 'inactive') return res.status(400).json({ message: 'Cannot transfer to inactive user' });
    }
    if (newDepartmentId) {
      const department = await Department.findById(newDepartmentId);
      if (!department) return res.status(404).json({ message: 'New department not found' });
    }

    currentAssignment.status = 'returned';
    currentAssignment.returnDate = new Date();
    await currentAssignment.save();

    const newAssignment = new Assignment({
      deviceId: device._id,
      assignedTo: { userId: newUserId || undefined, departmentId: newDepartmentId || undefined },
      assignedBy,
      notes: notes || 'Transferred from previous assignment'
    });
    await newAssignment.save();

    const populated = await Assignment.findById(newAssignment._id)
      .populate('deviceId', 'name assetTag serialNumber status')
      .populate('assignedTo.userId', 'firstName lastName email')
      .populate('assignedTo.departmentId', 'name code')
      .populate('assignedBy', 'firstName lastName');

    res.status(201).json({
      message: 'Device transferred successfully',
      previousAssignment: currentAssignment,
      newAssignment: populated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//

