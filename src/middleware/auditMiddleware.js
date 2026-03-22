const AuditLog = require('../models/AuditLog');

/**
 * Audit Logging Middleware
 * Automatically captures changes (POST, PUT, PATCH, DELETE) and logs them to the database.
 */
const auditLogger = (req, res, next) => {
  // Skip logging for GET requests
  if (req.method === 'GET') {
    return next();
  }

  // Determine Module based on the base URL / route segment
  let moduleName = 'SYSTEM';
  const url = req.originalUrl || req.url;

  if (url.includes('/api/auth')) moduleName = 'AUTH';
  else if (url.includes('/api/devices') || url.includes('/devices')) moduleName = 'DEVICE';
  else if (url.includes('/api/users')) moduleName = 'USER';
  else if (url.includes('/api/assignments')) moduleName = 'ASSIGNMENT';
  else if (url.includes('/api/maintenance')) moduleName = 'MAINTENANCE';
  else if (url.includes('/api/warranties')) moduleName = 'WARRANTY';
  else if (url.includes('/api/locations')) moduleName = 'LOCATION';
  else if (url.includes('/api/categories')) moduleName = 'CATEGORY';
  else if (url.includes('/api/depreciation')) moduleName = 'DEPRECIATION';
  else if (url.includes('/api/system')) moduleName = 'SYSTEM';
  else if (url.includes('/api/audit-logs')) moduleName = 'AUDIT_LOG';

  // Determine Action based on HTTP method
  let actionName = 'UNKNOWN';
  if (req.method === 'POST') {
    actionName = `CREATE_${moduleName}`;
    if (url.includes('/signin') || url.includes('/login')) actionName = 'LOGIN';
    if (url.includes('/register')) actionName = 'REGISTER';
    if (url.includes('/signout') || url.includes('/logout')) actionName = 'LOGOUT';
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    actionName = `UPDATE_${moduleName}`;
  } else if (req.method === 'DELETE') {
    actionName = `DELETE_${moduleName}`;
  }

  // Intercept res.json to capture the response body.
  // This is needed for auth endpoints (login/register) where the userId
  // only exists in the response, not on req.user (no token on the request yet).
  let responseBody = null;
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    const status = res.statusCode >= 200 && res.statusCode < 400 ? 'SUCCESS' : 'FAILED';

    // 1. Try req.user first (set by authenticate middleware for protected routes).
    //    JWT payload shape: { userId, email, role }
    let userId = (req.user && (req.user.userId || req.user._id)) || req.userId || null;

    // 2. For auth endpoints (login/register), the userId comes back in the response body.
    //    Response shape: { user: { id: '...' } }
    if (!userId && responseBody) {
      userId =
        responseBody?.user?.id ||
        responseBody?.user?._id ||
        responseBody?.userId ||
        null;
    }

    const log = new AuditLog({
      userId,
      action: actionName,
      module: moduleName,
      description: `${actionName} operation performed on ${req.method} ${url}`,
      ipAddress: req.ip || req.socket?.remoteAddress,
      status
    });

    log.save().catch(err => {
      console.error('AuditLog save error:', err);
    });
  });

  next();
};

module.exports = auditLogger;

