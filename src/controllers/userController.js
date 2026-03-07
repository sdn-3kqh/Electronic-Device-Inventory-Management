const User = require('../models/User');


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
      delete updates.password; // không cho update password ở đây

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