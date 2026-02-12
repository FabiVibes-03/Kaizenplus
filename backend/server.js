const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Import
const db = require('./database/db');

// Import Routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const taskRoutes = require('./routes/tasks');
const dailyRoutes = require('./routes/daily');
const teamRoutes = require('./routes/teams');
const projectRoutes = require('./routes/projects');
const reportRoutes = require('./routes/reports');

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Kaizen+ API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', require('./routes/admin'));

app.get('/api', (req, res) => {
    res.json({
        message: 'Kaizen+ API v1.0',
        endpoints: {
            auth: '/api/auth',
            companies: '/api/companies',
            projects: '/api/projects',
            tasks: '/api/tasks',
            daily: '/api/daily',
            gantt: '/api/gantt',
            reports: '/api/reports'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Kaizen+ Backend running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
