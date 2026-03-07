const Warranty = require('../models/Warranty');
const Device = require('../models/Device');

/**
 * Check and update warranty expiration status
 * This should be run periodically (e.g., daily via cron job)
 */
exports.refreshWarrantyStatus = async () => {
  try {
    console.log('Starting warranty status refresh...');
    
    const now = new Date();
    
    // Find all active warranties with endDate in the past
    const result = await Warranty.updateMany(
      { status: 'active', endDate: { $lt: now } },
      { status: 'expired' }
    );

    console.log(`Warranty refresh completed. Updated ${result.modifiedCount} warranties.`);
    return { success: true, updatedCount: result.modifiedCount };
  } catch (error) {
    console.error('Error in warranty status refresh:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get warranties expiring within X days
 */
exports.getExpiringWarranties = async (days = 30) => {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const warranties = await Warranty.find({
      status: 'active',
      endDate: { $gte: now, $lte: futureDate }
    })
      .populate('deviceId', 'name serialNumber assetTag')
      .sort({ endDate: 1 });

    return {
      success: true,
      count: warranties.length,
      warranties
    };
  } catch (error) {
    console.error('Error getting expiring warranties:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get warranty summary for a device
 */
exports.getDeviceWarrantySummary = async (deviceId) => {
  try {
    const device = await Device.findById(deviceId).populate('categoryId', 'name');
    if (!device) {
      return { error: 'Device not found' };
    }

    const warranties = await Warranty.find({ deviceId })
      .sort({ createdAt: -1 });

    const summary = {
      deviceId,
      deviceName: device.name,
      category: device.categoryId?.name,
      warranties: warranties.map(w => ({
        _id: w._id,
        type: w.type,
        provider: w.provider,
        startDate: w.startDate,
        endDate: w.endDate,
        coverage: w.coverage,
        cost: w.cost,
        status: w.status,
        daysRemaining: w.status === 'active' 
          ? Math.ceil((new Date(w.endDate) - new Date()) / (1000 * 60 * 60 * 24))
          : 0,
        isExpiringSoon: w.status === 'active' && 
                       Math.ceil((new Date(w.endDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 30
      })),
      activeWarrantyCount: warranties.filter(w => w.status === 'active').length,
      totalCost: warranties.reduce((sum, w) => sum + (w.cost || 0), 0)
    };

    return summary;
  } catch (error) {
    console.error('Error getting warranty summary:', error);
    return { error: error.message };
  }
};

/**
 * Get warranty expiration alerts
 */
exports.getWarrantyAlerts = async (options = {}) => {
  try {
    const { daysThreshold = 30, includeExpired = false } = options;
    const now = new Date();

    let filter = { status: 'active' };

    if (includeExpired) {
      filter = {};
    }

    const warranties = await Warranty.find(filter)
      .populate('deviceId', 'name serialNumber assetTag')
      .sort({ endDate: 1 });

    const alerts = warranties
      .map(warranty => {
        const daysRemaining = Math.ceil((new Date(warranty.endDate) - now) / (1000 * 60 * 60 * 24));
        
        return {
          warrantyId: warranty._id,
          deviceId: warranty.deviceId._id,
          deviceName: warranty.deviceId.name,
          warrantyType: warranty.type,
          provider: warranty.provider,
          endDate: warranty.endDate,
          daysRemaining,
          status: warranty.status,
          alertLevel: warranty.status === 'expired' 
            ? 'EXPIRED'
            : daysRemaining <= 7 
            ? 'CRITICAL'
            : daysRemaining <= 30 
            ? 'WARNING'
            : 'OK'
        };
      })
      .filter(alert => {
        if (alert.alertLevel === 'OK') {
          return false; // Skip OK alerts unless requested
        }
        return true;
      });

    return {
      success: true,
      total: alerts.length,
      critical: alerts.filter(a => a.alertLevel === 'CRITICAL').length,
      warning: alerts.filter(a => a.alertLevel === 'WARNING').length,
      expired: alerts.filter(a => a.alertLevel === 'EXPIRED').length,
      alerts: alerts.sort((a, b) => {
        // Sort by alert level (EXPIRED, CRITICAL, WARNING)
        const levels = { EXPIRED: 0, CRITICAL: 1, WARNING: 2 };
        return levels[a.alertLevel] - levels[b.alertLevel];
      })
    };
  } catch (error) {
    console.error('Error getting warranty alerts:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get warranty report
 */
exports.getWarrantyReport = async () => {
  try {
    const now = new Date();

    const warranties = await Warranty.find()
      .populate('deviceId', 'name serialNumber assetTag category')
      .sort({ createdAt: -1 });

    const report = {
      timestamp: now,
      summary: {
        total: warranties.length,
        active: 0,
        expired: 0,
        cancelled: 0,
        totalCost: 0,
        expiringWithin30Days: 0,
        expiringWithin7Days: 0
      },
      warranties: warranties.map(w => {
        const daysRemaining = w.status === 'active'
          ? Math.ceil((new Date(w.endDate) - now) / (1000 * 60 * 60 * 24))
          : null;

        return {
          _id: w._id,
          device: w.deviceId.name,
          serialNumber: w.deviceId.serialNumber,
          type: w.type,
          provider: w.provider,
          startDate: w.startDate,
          endDate: w.endDate,
          daysRemaining,
          cost: w.cost,
          status: w.status
        };
      })
    };

    // Calculate summary
    report.warranties.forEach(w => {
      if (w.status === 'active') report.summary.active++;
      if (w.status === 'expired') report.summary.expired++;
      if (w.status === 'cancelled') report.summary.cancelled++;
      
      report.summary.totalCost += w.cost || 0;
      
      if (w.daysRemaining !== null) {
        if (w.daysRemaining <= 30) report.summary.expiringWithin30Days++;
        if (w.daysRemaining <= 7) report.summary.expiringWithin7Days++;
      }
    });

    return report;
  } catch (error) {
    console.error('Error generating warranty report:', error);
    return { error: error.message };
  }
};
