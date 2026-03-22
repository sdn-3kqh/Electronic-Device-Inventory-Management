const AuditLog = require('../models/AuditLog');

/**
 * UC-45: Export Audit Trail to CSV
 * Admin only - exports filtered audit logs as CSV download
 */
exports.exportAuditLogs = async (req, res, next) => {
  try {
    const { action, module: moduleName, userId, fromDate, toDate } = req.query;

    const query = {};
    
    // Inventory Manager can only export device-related audit logs
    if (req.user.role === 'inventory_manager') {
      query.module = { $in: ['device', 'Device', 'devices', 'Devices'] };
    }
    
    if (action) query.action = action;
    if (moduleName) {
      if (req.user.role === 'inventory_manager') {
        const allowed = ['device', 'Device', 'devices', 'Devices'];
        if (!allowed.includes(moduleName)) {
          return res.status(403).json({ message: 'You can only export device-related audit logs' });
        }
      }
      query.module = moduleName;
    }
    if (userId) query.userId = userId;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .lean();

    // Build CSV
    const headers = ['Date', 'Action', 'Module', 'User', 'Email', 'Role', 'Status', 'IP Address', 'Description'];
    const rows = logs.map(log => {
      const userName = log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'System';
      const email = log.userId?.email || '';
      const role = log.userId?.role || '';
      return [
        new Date(log.createdAt).toISOString(),
        log.action || '',
        log.module || '',
        userName,
        email,
        role,
        log.status || '',
        log.ipAddress || '',
        (log.description || '').replace(/"/g, '""')
      ].map(v => `"${v}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch system and audit logs securely.
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      module: moduleName,
      userId,
      fromDate,
      toDate
    } = req.query;

    const query = {};

    // Inventory Manager can only see device-related audit logs
    if (req.user.role === 'inventory_manager') {
      query.module = { $in: ['device', 'Device', 'devices', 'Devices'] };
    }

    if (action) {
      query.action = action;
    }

    if (moduleName) {
      // IM: only allow device module filter
      if (req.user.role === 'inventory_manager') {
        const allowed = ['device', 'Device', 'devices', 'Devices'];
        if (!allowed.includes(moduleName)) {
          return res.status(403).json({ message: 'You can only view device-related audit logs' });
        }
      }
      query.module = moduleName;
    }

    if (userId) {
      query.userId = userId;
    }

    // Date range filtering
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(toDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch the logs and the total count concurrently
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'firstName lastName email role status')
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: logs || [], // Ensure fallback to empty array if no logs
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid query parameters provided', error: error.message });
    }
    next(error);
  }
};
