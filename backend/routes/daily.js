const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// STEP 1: PAST - GET /previous-pending
// Fetch yesterday's tasks that are not done
router.get('/step1/pending', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        // Find tasks assigned to user that are NOT done and planned end date was before today
        const [pending] = await db.query(
            `SELECT t.id, t.title, t.status, t.planned_end 
       FROM tasks t
       WHERE t.assigned_to = ? 
       AND t.status != 'Done'
       AND t.approval_status = 'Approved'`,
            [userId]
        );

        // Also look for pending_items table if we are tracking separately
        const [carriedOver] = await db.query(
            `SELECT * FROM pending_items WHERE user_id = ? AND resolved = false`,
            [userId]
        );

        res.json({
            pendingTasks: pending,
            carriedOverItems: carriedOver
        });
    } catch (error) {
        console.error('Daily Step 1 Error:', error);
        res.status(500).json({ error: 'Failed to fetch pending items' });
    }
});

// STEP 2: PRESENT - POST /step2/progress
// Update today's progress on Gantt tasks
router.post('/step2/progress', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { logs } = req.body;
        // logs = [{ taskId: 1, progress: 50, statusColor: 'Green/Yellow/Red', comment: '...' }]

        if (!Array.isArray(logs) || logs.length === 0) {
            return res.status(400).json({ error: 'No logs provided' });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const log of logs) {
                // 1. Insert into daily_logs
                await connection.query(
                    `INSERT INTO daily_logs 
           (user_id, task_id, progress_log, status_color, comment, log_date, created_at)
           VALUES (?, ?, ?, ?, ?, CURDATE(), NOW())`,
                    [userId, log.taskId, log.progress, log.statusColor, log.comment]
                );

                // 2. Update real task progress and Real Start/End dates
                // If it's the first log, set real_start
                if (log.startedToday) { // Flag from frontend
                    await connection.query(
                        `UPDATE tasks SET real_start = NOW() WHERE id = ? AND real_start IS NULL`,
                        [log.taskId]
                    );
                }

                // Always update progress
                await connection.query(
                    `UPDATE tasks SET progress = ? WHERE id = ?`,
                    [log.progress, log.taskId]
                );

                // If finished
                if (log.progress === 100) {
                    await connection.query(
                        `UPDATE tasks SET status = 'Done', real_end = NOW() WHERE id = ?`,
                        [log.taskId]
                    );
                }
            }

            await connection.commit();
            res.json({ message: 'Progress logged successfully' });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Daily Step 2 Error:', error);
        res.status(500).json({ error: 'Failed to log progress' });
    }
});

// STEP 3: KUDOS - POST /step3/kudos
// Register help received
router.post('/step3/kudos', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { kudos } = req.body;
        // kudos = [{ helperId: 2, taskId: 1, reason: 'Helped with DB schema' }]

        if (kudos && kudos.length > 0) {
            for (const kudo of kudos) {
                // Check self-kudos
                if (kudo.helperId === userId) continue;

                // In our schema, we can store this in daily_logs or a dedicated 'kudos' table/relation
                // Assuming 'daily_logs' has a 'helper_id' column or a separate table
                // Let's assume a 'kudos' table for cleaner tracking or repurpose daily_logs
                // Implementation Plan mentioned 'daily_logs' but 'kudos' concept

                // Create a log entry for the Helper to show they helped
                await db.query(
                    `INSERT INTO daily_logs 
                 (user_id, task_id, type, comment, related_user_id, log_date, created_at)
                 VALUES (?, ?, 'HELP_GIVEN', ?, ?, CURDATE(), NOW())`,
                    [kudo.helperId, kudo.taskId, `Helped ${req.user.email}: ${kudo.reason}`, userId]
                );

                // Create a log entry for the Receiver (User)
                await db.query(
                    `INSERT INTO daily_logs
                 (user_id, task_id, type, comment, related_user_id, log_date, created_at)
                 VALUES (?, ?, 'HELP_RECEIVED', ?, ?, CURDATE(), NOW())`,
                    [userId, kudo.taskId, `Received help from ${kudo.helperId}: ${kudo.reason}`, kudo.helperId]
                );
            }
        }

        res.json({ message: 'Daily report completed!' });

    } catch (error) {
        console.error('Daily Step 3 Error:', error);
        res.status(500).json({ error: 'Failed to save kudos' });
    }
});

module.exports = router;
