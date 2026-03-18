const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Device = require('../models/Device');


// =========================
// GET ALL USERS
// =========================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('departmentId', 'name');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =========================
// GET USER BY ID
// =========================
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('departmentId', 'name');

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// =========================
// CREATE USER (ADMIN)
// =========================
exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, departmentId, status } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: 'Email already exists' });

    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      departmentId,
      status
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// =========================
// UPDATE USER
// =========================
exports.updateUser = async (req, res) => {
  try {
    const updates = req.body;

    if (updates.password)
      delete updates.password;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// =========================
// DELETE USER
// =========================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// =========================
// ASSIGN ROLE (ADMIN ONLY)
// =========================
exports.assignRole = async (req, res) => {
  try {

    const { role } = req.body;

    const validRoles = ['admin', 'inventory_manager', 'staff'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({
        message: 'User not found'
      });

    user.role = role;

    await user.save();

    res.json({
      message: 'Role updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

// =========================
// DEACTIVATE USER (SOFT DELETE)
// =========================
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'inactive') {
      return res.status(400).json({ message: 'User is already inactive' });
    }

    // BR-1: Prevent deactivation if the user is the last active Admin
    if (user.role === 'admin') {
      const activeAdminCount = await User.countDocuments({ role: 'admin', status: 'active' });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ message: 'Cannot deactivate the last active administrator' });
      }
    }

    user.status = 'inactive';
    await user.save();

    // Post-conditions: Unassign all devices
    const activeAssignments = await Assignment.find({
      'assignedTo.userId': user._id,
      status: { $in: ['pending', 'acknowledged', 'active'] }
    });

    for (const assignment of activeAssignments) {
      assignment.status = 'returned';
      assignment.returnDate = new Date();
      assignment.notes = assignment.notes ? `${assignment.notes} | User deactivated` : 'User deactivated';
      await assignment.save();

      const device = await Device.findById(assignment.deviceId);
      if (device) {
        device.status = 'available';
        await device.save();
      }
    }

    res.json({ message: 'User deactivated successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};