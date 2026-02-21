require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { generateRandomPassword } = require('../utils/passwordHelper');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@edims.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      process.exit(0);
    }

    // Generate random password
    const password = generateRandomPassword(12);

    // Create admin user
    const admin = new User({
      email: 'admin@edims.com',
      password: password,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      status: 'active'
    });

    await admin.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('================================');
    console.log('Email:', admin.email);
    console.log('Password:', password);
    console.log('Role:', admin.role);
    console.log('================================');
    console.log('\n⚠️  IMPORTANT: Save this password securely and change it after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
