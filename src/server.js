require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
// const deviceRoutes = require('./routes/deviceRoutes');
// const deviceCategoryRoutes = require('./routes/deviceCategoryRoutes');
// const assignmentRoutes = require('./routes/assignmentRoutes');
// const maintenanceRoutes = require('./routes/maintenanceRoutes');
// const warrantyRoutes = require('./routes/warrantyRoutes');
// const depreciationRoutes = require('./routes/depreciationRoutes');
// const dashboardRoutes = require('./routes/dashboardRoutes');
// const reportRoutes = require('./routes/reportRoutes');
// const userRoutes = require('./routes/userRoutes');
// const departmentRoutes = require('./routes/departmentRoutes');
// const locationRoutes = require('./routes/locationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
// app.use('/api/devices', deviceRoutes);
// app.use('/api/device-categories', deviceCategoryRoutes);
// app.use('/api/assignments', assignmentRoutes);
// app.use('/api/maintenance', maintenanceRoutes);
// app.use('/api/warranties', warrantyRoutes);
// app.use('/api/depreciation', depreciationRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/departments', departmentRoutes);
// app.use('/api/locations', locationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Electronic Device Inventory Management API is running' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
