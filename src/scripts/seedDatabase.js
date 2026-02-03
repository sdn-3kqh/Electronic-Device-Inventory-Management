require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Location = require('../models/Location');
const DeviceCategory = require('../models/DeviceCategory');
const DepreciationRule = require('../models/DepreciationRule');
const Device = require('../models/Device');
const Assignment = require('../models/Assignment');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Warranty = require('../models/Warranty');
const WarrantyClaim = require('../models/WarrantyClaim');

const seedDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await Location.deleteMany({});
    await DeviceCategory.deleteMany({});
    await DepreciationRule.deleteMany({});
    await Device.deleteMany({});
    await Assignment.deleteMany({});
    await MaintenanceRecord.deleteMany({});
    await Warranty.deleteMany({});
    await WarrantyClaim.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // 1. Create Departments
    console.log('📁 Creating departments...');
    const departments = await Department.insertMany([
      { name: 'Information Technology', code: 'IT', description: 'IT Department' },
      { name: 'Human Resources', code: 'HR', description: 'HR Department' },
      { name: 'Finance', code: 'FIN', description: 'Finance Department' },
      { name: 'Marketing', code: 'MKT', description: 'Marketing Department' },
      { name: 'Operations', code: 'OPS', description: 'Operations Department' }
    ]);
    console.log(`✅ Created ${departments.length} departments\n`);

    // 2. Create Users
    console.log('👥 Creating users...');
    const users = await User.insertMany([
      {
        email: 'admin@company.com',
        password: 'Admin@123',
        firstName: 'John',
        lastName: 'Admin',
        role: 'admin',
        departmentId: departments[0]._id,
        status: 'active'
      },
      {
        email: 'manager@company.com',
        password: 'Manager@123',
        firstName: 'Sarah',
        lastName: 'Manager',
        role: 'inventory_manager',
        departmentId: departments[0]._id,
        status: 'active'
      },
      {
        email: 'staff1@company.com',
        password: 'Staff@123',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'staff',
        departmentId: departments[1]._id,
        status: 'active'
      },
      {
        email: 'staff2@company.com',
        password: 'Staff@123',
        firstName: 'Emily',
        lastName: 'Davis',
        role: 'staff',
        departmentId: departments[2]._id,
        status: 'active'
      },
      {
        email: 'staff3@company.com',
        password: 'Staff@123',
        firstName: 'David',
        lastName: 'Wilson',
        role: 'staff',
        departmentId: departments[3]._id,
        status: 'active'
      }
    ]);
    console.log(`✅ Created ${users.length} users\n`);

    // 3. Create Locations
    console.log('📍 Creating locations...');
    const locations = await Location.insertMany([
      { name: 'Main Building', code: 'MB', type: 'building', address: '123 Main St' },
      { name: 'Floor 1', code: 'MB-F1', type: 'floor', parentId: null },
      { name: 'Floor 2', code: 'MB-F2', type: 'floor', parentId: null },
      { name: 'IT Room 101', code: 'MB-F1-R101', type: 'room', parentId: null },
      { name: 'Conference Room 201', code: 'MB-F2-R201', type: 'room', parentId: null },
      { name: 'Office 202', code: 'MB-F2-R202', type: 'room', parentId: null }
    ]);
    console.log(`✅ Created ${locations.length} locations\n`);

    // 4. Create Device Categories (without depreciation rules first)
    console.log('📦 Creating device categories...');
    const categories = await DeviceCategory.insertMany([
      {
        name: 'Laptop',
        code: 'LAP',
        description: 'Laptop computers',
        customFields: [
          { fieldName: 'RAM', fieldType: 'text', required: true },
          { fieldName: 'Storage', fieldType: 'text', required: true },
          { fieldName: 'Processor', fieldType: 'text', required: true }
        ]
      },
      {
        name: 'Desktop',
        code: 'DSK',
        description: 'Desktop computers',
        customFields: [
          { fieldName: 'RAM', fieldType: 'text', required: true },
          { fieldName: 'Storage', fieldType: 'text', required: true }
        ]
      },
      {
        name: 'Monitor',
        code: 'MON',
        description: 'Computer monitors',
        customFields: [
          { fieldName: 'Screen Size', fieldType: 'text', required: true },
          { fieldName: 'Resolution', fieldType: 'text', required: true }
        ]
      },
      {
        name: 'Printer',
        code: 'PRT',
        description: 'Printers and scanners',
        customFields: [
          { fieldName: 'Print Type', fieldType: 'text', required: true }
        ]
      },
      {
        name: 'Mobile Phone',
        code: 'PHN',
        description: 'Mobile phones and tablets',
        customFields: [
          { fieldName: 'Storage', fieldType: 'text', required: true },
          { fieldName: 'OS', fieldType: 'text', required: true }
        ]
      }
    ]);
    console.log(`✅ Created ${categories.length} device categories\n`);

    // 5. Create Depreciation Rules
    console.log('📉 Creating depreciation rules...');
    const depreciationRules = await DepreciationRule.insertMany([
      {
        categoryId: categories[0]._id,
        method: 'straight_line',
        usefulLifeYears: 3,
        salvageValuePercent: 10,
        depreciationRate: 30
      },
      {
        categoryId: categories[1]._id,
        method: 'straight_line',
        usefulLifeYears: 5,
        salvageValuePercent: 10,
        depreciationRate: 18
      },
      {
        categoryId: categories[2]._id,
        method: 'declining_balance',
        usefulLifeYears: 4,
        salvageValuePercent: 15,
        depreciationRate: 25
      }
    ]);
    console.log(`✅ Created ${depreciationRules.length} depreciation rules\n`);

    // Update categories with depreciation rules
    await DeviceCategory.findByIdAndUpdate(categories[0]._id, { depreciationRuleId: depreciationRules[0]._id });
    await DeviceCategory.findByIdAndUpdate(categories[1]._id, { depreciationRuleId: depreciationRules[1]._id });
    await DeviceCategory.findByIdAndUpdate(categories[2]._id, { depreciationRuleId: depreciationRules[2]._id });

    // 6. Create Devices
    console.log('💻 Creating devices...');
    const devices = await Device.insertMany([
      {
        assetTag: 'LAP-2024-001',
        serialNumber: 'SN-LAP-001-2024',
        name: 'Dell Latitude 5420',
        categoryId: categories[0]._id,
        manufacturer: 'Dell',
        model: 'Latitude 5420',
        specifications: {
          RAM: '16GB DDR4',
          Storage: '512GB SSD',
          Processor: 'Intel Core i7-1185G7'
        },
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 1200,
        currentValue: 1000,
        salvageValue: 120,
        locationId: locations[3]._id,
        status: 'available',
        condition: 'good',
        barcode: 'BC-LAP-001'
      },
      {
        assetTag: 'LAP-2024-002',
        serialNumber: 'SN-LAP-002-2024',
        name: 'HP EliteBook 840',
        categoryId: categories[0]._id,
        manufacturer: 'HP',
        model: 'EliteBook 840 G8',
        specifications: {
          RAM: '16GB DDR4',
          Storage: '512GB SSD',
          Processor: 'Intel Core i5-1135G7'
        },
        purchaseDate: new Date('2024-02-10'),
        purchasePrice: 1100,
        currentValue: 950,
        salvageValue: 110,
        locationId: locations[3]._id,
        status: 'assigned',
        condition: 'good',
        barcode: 'BC-LAP-002'
      },
      {
        assetTag: 'DSK-2023-001',
        serialNumber: 'SN-DSK-001-2023',
        name: 'Dell OptiPlex 7090',
        categoryId: categories[1]._id,
        manufacturer: 'Dell',
        model: 'OptiPlex 7090',
        specifications: {
          RAM: '32GB DDR4',
          Storage: '1TB SSD'
        },
        purchaseDate: new Date('2023-06-20'),
        purchasePrice: 1500,
        currentValue: 1200,
        salvageValue: 150,
        locationId: locations[5]._id,
        status: 'assigned',
        condition: 'good',
        barcode: 'BC-DSK-001'
      },
      {
        assetTag: 'MON-2024-001',
        serialNumber: 'SN-MON-001-2024',
        name: 'Dell UltraSharp U2720Q',
        categoryId: categories[2]._id,
        manufacturer: 'Dell',
        model: 'UltraSharp U2720Q',
        specifications: {
          'Screen Size': '27 inches',
          Resolution: '4K UHD (3840x2160)'
        },
        purchaseDate: new Date('2024-03-01'),
        purchasePrice: 600,
        currentValue: 550,
        salvageValue: 90,
        locationId: locations[5]._id,
        status: 'available',
        condition: 'new',
        barcode: 'BC-MON-001'
      },
      {
        assetTag: 'MON-2024-002',
        serialNumber: 'SN-MON-002-2024',
        name: 'LG 27UK850-W',
        categoryId: categories[2]._id,
        manufacturer: 'LG',
        model: '27UK850-W',
        specifications: {
          'Screen Size': '27 inches',
          Resolution: '4K UHD (3840x2160)'
        },
        purchaseDate: new Date('2024-03-05'),
        purchasePrice: 550,
        currentValue: 500,
        salvageValue: 82.5,
        locationId: locations[4]._id,
        status: 'assigned',
        condition: 'new',
        barcode: 'BC-MON-002'
      },
      {
        assetTag: 'PRT-2023-001',
        serialNumber: 'SN-PRT-001-2023',
        name: 'HP LaserJet Pro M404dn',
        categoryId: categories[3]._id,
        manufacturer: 'HP',
        model: 'LaserJet Pro M404dn',
        specifications: {
          'Print Type': 'Laser Monochrome'
        },
        purchaseDate: new Date('2023-09-15'),
        purchasePrice: 400,
        currentValue: 320,
        salvageValue: 40,
        locationId: locations[3]._id,
        status: 'available',
        condition: 'good',
        barcode: 'BC-PRT-001'
      },
      {
        assetTag: 'PHN-2024-001',
        serialNumber: 'SN-PHN-001-2024',
        name: 'iPhone 14 Pro',
        categoryId: categories[4]._id,
        manufacturer: 'Apple',
        model: 'iPhone 14 Pro',
        specifications: {
          Storage: '256GB',
          OS: 'iOS 17'
        },
        purchaseDate: new Date('2024-01-20'),
        purchasePrice: 1000,
        currentValue: 850,
        salvageValue: 100,
        locationId: locations[3]._id,
        status: 'assigned',
        condition: 'good',
        barcode: 'BC-PHN-001'
      },
      {
        assetTag: 'LAP-2023-003',
        serialNumber: 'SN-LAP-003-2023',
        name: 'MacBook Pro 14"',
        categoryId: categories[0]._id,
        manufacturer: 'Apple',
        model: 'MacBook Pro 14" M2',
        specifications: {
          RAM: '16GB Unified Memory',
          Storage: '512GB SSD',
          Processor: 'Apple M2 Pro'
        },
        purchaseDate: new Date('2023-11-10'),
        purchasePrice: 2000,
        currentValue: 1700,
        salvageValue: 200,
        locationId: locations[3]._id,
        status: 'in_maintenance',
        condition: 'good',
        barcode: 'BC-LAP-003'
      }
    ]);
    console.log(`✅ Created ${devices.length} devices\n`);

    // 7. Create Assignments
    console.log('📋 Creating assignments...');
    const assignments = await Assignment.insertMany([
      {
        deviceId: devices[1]._id, // HP EliteBook
        assignedTo: { userId: users[2]._id },
        assignedBy: users[1]._id,
        assignmentDate: new Date('2024-02-15'),
        status: 'active',
        acknowledgedAt: new Date('2024-02-15'),
        notes: 'For daily work'
      },
      {
        deviceId: devices[2]._id, // Dell OptiPlex
        assignedTo: { userId: users[3]._id },
        assignedBy: users[1]._id,
        assignmentDate: new Date('2023-07-01'),
        status: 'active',
        acknowledgedAt: new Date('2023-07-01'),
        notes: 'Finance department workstation'
      },
      {
        deviceId: devices[4]._id, // LG Monitor
        assignedTo: { departmentId: departments[3]._id },
        assignedBy: users[1]._id,
        assignmentDate: new Date('2024-03-10'),
        status: 'active',
        acknowledgedAt: new Date('2024-03-10'),
        notes: 'Marketing department conference room'
      },
      {
        deviceId: devices[6]._id, // iPhone
        assignedTo: { userId: users[4]._id },
        assignedBy: users[0]._id,
        assignmentDate: new Date('2024-01-25'),
        status: 'active',
        acknowledgedAt: new Date('2024-01-25'),
        notes: 'Company phone'
      }
    ]);
    console.log(`✅ Created ${assignments.length} assignments\n`);

    // 8. Create Warranties
    console.log('🛡️  Creating warranties...');
    const warranties = await Warranty.insertMany([
      {
        deviceId: devices[0]._id,
        type: 'manufacturer',
        provider: 'Dell',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2027-01-15'),
        coverage: '3-year manufacturer warranty',
        cost: 0,
        status: 'active'
      },
      {
        deviceId: devices[1]._id,
        type: 'manufacturer',
        provider: 'HP',
        startDate: new Date('2024-02-10'),
        endDate: new Date('2027-02-10'),
        coverage: '3-year manufacturer warranty',
        cost: 0,
        status: 'active'
      },
      {
        deviceId: devices[2]._id,
        type: 'extended',
        provider: 'Dell Premium Support',
        startDate: new Date('2023-06-20'),
        endDate: new Date('2026-06-20'),
        coverage: 'Extended warranty with on-site support',
        cost: 200,
        status: 'active'
      },
      {
        deviceId: devices[7]._id,
        type: 'manufacturer',
        provider: 'Apple',
        startDate: new Date('2023-11-10'),
        endDate: new Date('2024-11-10'),
        coverage: '1-year limited warranty',
        cost: 0,
        status: 'active'
      }
    ]);
    console.log(`✅ Created ${warranties.length} warranties\n`);

    // 9. Create Warranty Claims
    console.log('📝 Creating warranty claims...');
    const warrantyClaims = await WarrantyClaim.insertMany([
      {
        warrantyId: warranties[3]._id,
        deviceId: devices[7]._id,
        claimNumber: 'CLM20240101',
        filedBy: users[1]._id,
        filedDate: new Date('2024-10-15'),
        issue: 'Battery draining quickly',
        status: 'in_review',
        resolution: ''
      }
    ]);
    console.log(`✅ Created ${warrantyClaims.length} warranty claims\n`);

    // 10. Create Maintenance Records
    console.log('🔧 Creating maintenance records...');
    const maintenanceRecords = await MaintenanceRecord.insertMany([
      {
        deviceId: devices[7]._id,
        type: 'corrective',
        status: 'in_progress',
        scheduledDate: new Date('2024-10-20'),
        performedBy: users[1]._id,
        requestedBy: users[1]._id,
        description: 'Battery replacement',
        cost: 150,
        notes: 'Under warranty claim'
      },
      {
        deviceId: devices[2]._id,
        type: 'preventive',
        status: 'completed',
        scheduledDate: new Date('2024-09-01'),
        completedDate: new Date('2024-09-01'),
        performedBy: users[1]._id,
        requestedBy: users[1]._id,
        description: 'Regular system cleaning and updates',
        cost: 0,
        notes: 'Routine maintenance'
      },
      {
        deviceId: devices[5]._id,
        type: 'preventive',
        status: 'scheduled',
        scheduledDate: new Date('2025-03-15'),
        performedBy: users[1]._id,
        requestedBy: users[1]._id,
        description: 'Printer maintenance and toner replacement',
        cost: 80,
        notes: 'Scheduled quarterly maintenance'
      }
    ]);
    console.log(`✅ Created ${maintenanceRecords.length} maintenance records\n`);

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - ${departments.length} Departments`);
    console.log(`   - ${users.length} Users`);
    console.log(`   - ${locations.length} Locations`);
    console.log(`   - ${categories.length} Device Categories`);
    console.log(`   - ${depreciationRules.length} Depreciation Rules`);
    console.log(`   - ${devices.length} Devices`);
    console.log(`   - ${assignments.length} Assignments`);
    console.log(`   - ${warranties.length} Warranties`);
    console.log(`   - ${warrantyClaims.length} Warranty Claims`);
    console.log(`   - ${maintenanceRecords.length} Maintenance Records\n`);

    console.log('👤 Test User Credentials:');
    console.log('   Admin:');
    console.log('     Email: admin@company.com');
    console.log('     Password: Admin@123');
    console.log('   Inventory Manager:');
    console.log('     Email: manager@company.com');
    console.log('     Password: Manager@123');
    console.log('   Staff:');
    console.log('     Email: staff1@company.com');
    console.log('     Password: Staff@123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
