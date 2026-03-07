const mongoose = require('mongoose');
const Device = require('../models/Device');
const SystemSettings = require('../models/SystemSettings');
const fs = require('fs');
const path = require('path');

// Health check endpoint
exports.healthCheck = async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbConnected = dbState === 1; // 1 = connected

    // Get system stats
    const deviceCount = await Device.countDocuments();
    const settings = await SystemSettings.findOne({ key: 'system_status' });

    const healthStatus = {
      status: dbConnected ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState]
      },
      application: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      data: {
        deviceCount,
        lastChecked: new Date()
      }
    };

    // Return appropriate status code
    const statusCode = dbConnected ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Get system settings
exports.getSystemSettings = async (req, res) => {
  try {
    const { key } = req.query;
    
    let settings;
    if (key) {
      settings = await SystemSettings.findOne({ key });
      if (!settings) {
        return res.status(404).json({ message: `Setting '${key}' not found` });
      }
    } else {
      settings = await SystemSettings.find().sort({ key: 1 });
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create or update system setting
exports.updateSystemSetting = async (req, res) => {
  try {
    const { key, value, description } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ message: 'key and value are required' });
    }

    let setting = await SystemSettings.findOne({ key });
    
    if (setting) {
      setting.value = value;
      if (description !== undefined) setting.description = description;
    } else {
      setting = new SystemSettings({ key, value, description });
    }

    await setting.save();
    res.json(setting);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete system setting
exports.deleteSystemSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await SystemSettings.findOneAndDelete({ key });
    
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create backup (export all data to JSON)
exports.createBackup = async (req, res) => {
  try {
    const Device = require('../models/Device');
    const DeviceCategory = require('../models/DeviceCategory');
    const Location = require('../models/Location');
    const Department = require('../models/Department');
    const Warranty = require('../models/Warranty');
    const WarrantyClaim = require('../models/WarrantyClaim');
    const Assignment = require('../models/Assignment');
    const User = require('../models/User');

    // Collect all data
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      collections: {
        devices: await Device.find().lean(),
        categories: await DeviceCategory.find().lean(),
        locations: await Location.find().lean(),
        departments: await Department.find().lean(),
        warranties: await Warranty.find().lean(),
        warrantyClaims: await WarrantyClaim.find().lean(),
        assignments: await Assignment.find().lean(),
        users: await User.find().select('-password').lean()
      }
    };

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Save backup to file
    const filename = `backup-${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    // Save backup record to database
    await SystemSettings.findOneAndUpdate(
      { key: 'last_backup' },
      { 
        value: {
          filename,
          timestamp: backup.timestamp,
          size: fs.statSync(filepath).size
        }
      },
      { upsert: true }
    );

    res.json({
      message: 'Backup created successfully',
      filename,
      timestamp: backup.timestamp,
      collections: Object.keys(backup.collections).map(col => ({
        name: col,
        count: backup.collections[col].length
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get backup list
exports.getBackupList = async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    
    if (!fs.existsSync(backupDir)) {
      return res.json({ backups: [] });
    }

    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => {
        const filepath = path.join(backupDir, f);
        const stats = fs.statSync(filepath);
        return {
          filename: f,
          size: stats.size,
          created: stats.mtime,
          sizeInMB: (stats.size / (1024 * 1024)).toFixed(2)
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({ backups: files, total: files.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download backup
exports.downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    const backupDir = path.join(__dirname, '../../backups');
    const filepath = path.join(backupDir, filename);

    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filepath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete backup
exports.deleteBackup = async (req, res) => {
  try {
    const { filename } = req.params;

    // Validate filename
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    const backupDir = path.join(__dirname, '../../backups');
    const filepath = path.join(backupDir, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    fs.unlinkSync(filepath);
    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Database statistics
exports.getDatabaseStats = async (req, res) => {
  try {
    const Device = require('../models/Device');
    const DeviceCategory = require('../models/DeviceCategory');
    const Location = require('../models/Location');
    const Department = require('../models/Department');
    const Warranty = require('../models/Warranty');
    const Assignment = require('../models/Assignment');
    const User = require('../models/User');

    const stats = {
      devices: await Device.countDocuments(),
      categories: await DeviceCategory.countDocuments(),
      locations: await Location.countDocuments(),
      departments: await Department.countDocuments(),
      warranties: await Warranty.countDocuments(),
      assignments: await Assignment.countDocuments(),
      users: await User.countDocuments(),
      timestamp: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get system logs (if implemented)
exports.getSystemLogs = async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;

    // For now, return a placeholder
    // In a real implementation, you would query audit logs
    res.json({
      message: 'System logs functionality',
      note: 'Implement audit logging to track system operations',
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
