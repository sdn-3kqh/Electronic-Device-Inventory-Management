require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const deviceCategoryRoutes = require('./routes/deviceCategoryRoutes');
const userRoutes = require('./routes/userRoutes');
// Dev3 Week 1
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const warrantyRoutes = require('./routes/warrantyRoutes');
const depreciationRoutes = require('./routes/depreciationRoutes');
const systemRoutes = require('./routes/systemRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
// const userRoutes = require('./routes/userRoutes');
// const departmentRoutes = require('./routes/departmentRoutes');
const locationRoutes = require('./routes/locationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Audit Logger Middleware
const auditLogger = require('./middleware/auditMiddleware');
app.use(auditLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
// also allow base '/devices' for compatibility with hardcoded examples/legacy clients
app.use('/devices', deviceRoutes);
app.use('/api/categories', deviceCategoryRoutes);
// Dev3 Week 1
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/warranties', warrantyRoutes);
app.use('/api/depreciation', depreciationRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Electronic Device Inventory Management API is running' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
