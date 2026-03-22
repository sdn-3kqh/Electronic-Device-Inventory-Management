const Department = require('../models/Department');
const User = require('../models/User');

// Create Department
exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    // Check unique name
    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: 'Department name already exists' });
    }

    // Check unique code if provided
    if (code) {
      const existingCode = await Department.findOne({ code });
      if (existingCode) {
        return res.status(409).json({ message: 'Department code already exists' });
      }
    }

    const department = new Department({ name, code, description });
    await department.save();
    res.status(201).json(department);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get All Departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Department by ID
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update Department
exports.updateDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    // Check unique name if updating
    if (name) {
      const existing = await Department.findOne({ name, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(409).json({ message: 'Department name already exists' });
      }
    }

    // Check unique code if updating
    if (code) {
      const existingCode = await Department.findOne({ code, _id: { $ne: req.params.id } });
      if (existingCode) {
        return res.status(409).json({ message: 'Department code already exists' });
      }
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, code, description },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(department);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Department
exports.deleteDepartment = async (req, res) => {
  try {
    // Check if any users belong to this department
    const usersInDept = await User.countDocuments({ departmentId: req.params.id });
    if (usersInDept > 0) {
      return res.status(400).json({
        message: `Cannot delete department with ${usersInDept} active user(s). Reassign users first.`
      });
    }

    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
