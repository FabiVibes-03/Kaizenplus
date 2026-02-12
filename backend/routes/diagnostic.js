const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Test database connection
router.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({
            success: true,
            message: 'Database connection successful',
            result: rows[0].result,
            env: {
                DB_HOST: process.env.DB_HOST ? 'Set' : 'Missing',
                DB_USER: process.env.DB_USER ? 'Set' : 'Missing',
                DB_NAME: process.env.DB_NAME ? 'Set' : 'Missing',
                DB_PORT: process.env.DB_PORT || 'Default (3306)',
                NODE_ENV: process.env.NODE_ENV
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message,
            code: error.code,
            env: {
                DB_HOST: process.env.DB_HOST ? 'Set' : 'Missing',
                DB_USER: process.env.DB_USER ? 'Set' : 'Missing',
                DB_NAME: process.env.DB_NAME ? 'Set' : 'Missing',
                DB_PORT: process.env.DB_PORT || 'Default (3306)',
                NODE_ENV: process.env.NODE_ENV
            }
        });
    }
});

module.exports = router;
