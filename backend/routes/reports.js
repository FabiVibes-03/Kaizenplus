const express = require('express');
const router = express.Router();
const db = require('../database/db');
const metricsCalculator = require('../services/metricsCalculator');
const { authenticateToken, checkRole } = require('../middleware/auth');

// GET /api/reports/dashboard - Overview for Dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];

        // Personal Metrics
        const userMetrics = await metricsCalculator.calculateUserMetrics(userId, startDate, endDate);
        const collabMetrics = await metricsCalculator.calculateCollaborationMetrics(userId, startDate, endDate);

        res.json({
            period: 'Last 30 Days',
            productivity: userMetrics,
            collaboration: collabMetrics
        });
    } catch (error) {
        console.error('Dashboard report error:', error);
        res.status(500).json({ error: 'Failed to generate dashboard report' });
    }
});

// GET /api/reports/project/:id - Detailed Project Health Report (Client view)
router.get('/project/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check access (middleware should handle strict checks)

        const healthMetrics = await metricsCalculator.calculateProjectHealth(id);

        // Get team leaderboard for this project
        const [leaderboard] = await db.query(
            `SELECT u.name, COUNT(t.id) as completed_tasks
       FROM tasks t
       JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = ? AND t.status = 'Done'
       GROUP BY u.id
       ORDER BY completed_tasks DESC
       LIMIT 5`,
            [id]
        );

        res.json({
            projectHealth: healthMetrics,
            topPerformers: leaderboard
        });
    } catch (error) {
        console.error('Project report error:', error);
        res.status(500).json({ error: 'Failed to generate project report' });
    }
});

module.exports = router;
