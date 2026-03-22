const AuditLog = require('../models/AuditLog');

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

    if (action) {
      query.action = action;
    }

    if (moduleName) {
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
