const db = require('../database/db');

class MetricsCalculator {

    // INDIVIDUAL PRODUCTIVITY METRICS
    async calculateUserMetrics(userId, startDate, endDate) {
        // 1. Tasks Completed
        const [tasksCompleted] = await db.query(
            `SELECT COUNT(*) as count 
       FROM tasks 
       WHERE assigned_to = ? AND status = 'Done' 
       AND real_end BETWEEN ? AND ?`,
            [userId, startDate, endDate]
        );

        // 2. On-Time Completion Rate
        // (Tasks finished on or before planned_end)
        const [onTimeTasks] = await db.query(
            `SELECT COUNT(*) as count 
       FROM tasks 
       WHERE assigned_to = ? AND status = 'Done' 
       AND real_end <= planned_end
       AND real_end BETWEEN ? AND ?`,
            [userId, startDate, endDate]
        );

        // 3. Extra Tasks Contributed
        const [extraTasks] = await db.query(
            `SELECT COUNT(*) as count 
       FROM tasks 
       WHERE assigned_to = ? AND is_extra = true 
       AND created_at BETWEEN ? AND ?`,
            [userId, startDate, endDate]
        );

        const totalCompleted = tasksCompleted[0].count;
        const onTimeRate = totalCompleted > 0 ? (onTimeTasks[0].count / totalCompleted) * 100 : 0;

        return {
            tasksCompleted: totalCompleted,
            onTimeCompletionRate: Math.round(onTimeRate),
            extraTasks: extraTasks[0].count
        };
    }

    // COLLABORATION METRICS (KUDOS)
    async calculateCollaborationMetrics(userId, startDate, endDate) {
        // 1. Kudos Received (Help Received)
        // Assuming we store this in daily_logs with type='HELP_RECEIVED' and related_user_id as helper
        // Or querying where they are the 'related_user_id' in a HELP_GIVEN log?
        // Let's stick to the log types we defined:
        // User A logs help from B: 
        //   Log 1 (User A): type=HELP_RECEIVED, related_user_id=B
        //   Log 2 (User B): type=HELP_GIVEN, related_user_id=A

        const [helpGiven] = await db.query(
            `SELECT COUNT(*) as count 
       FROM daily_logs 
       WHERE user_id = ? AND type = 'HELP_GIVEN'
       AND log_date BETWEEN ? AND ?`,
            [userId, startDate, endDate]
        );

        const [helpReceived] = await db.query(
            `SELECT COUNT(*) as count 
       FROM daily_logs 
       WHERE user_id = ? AND type = 'HELP_RECEIVED'
       AND log_date BETWEEN ? AND ?`,
            [userId, startDate, endDate]
        );

        return {
            helpGiven: helpGiven[0].count,
            helpReceived: helpReceived[0].count,
            collaborationScore: helpGiven[0].count * 5 // Simple point system
        };
    }

    // PROJECT HEALTH METRICS
    async calculateProjectHealth(projectId) {
        // 1. Overall Progress
        const [taskStats] = await db.query(
            `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) as blocked,
         AVG(progress) as avg_progress
       FROM tasks 
       WHERE project_id = ?`,
            [projectId]
        );

        const total = taskStats[0].total;
        const completed = taskStats[0].completed;
        const blocked = taskStats[0].blocked;

        // 2. Schedule Slippage (Tasks overdue)
        const [overdue] = await db.query(
            `SELECT COUNT(*) as count 
       FROM tasks 
       WHERE project_id = ? 
       AND status != 'Done' 
       AND planned_end < CURDATE()`,
            [projectId]
        );

        // Health Score Algorithm (Simple version)
        // Starts at 100. Deduct for blocked tasks and overdue tasks.
        let healthScore = 100;
        if (total > 0) {
            const blockedPenalty = (blocked / total) * 50; // Max 50 pts deduction
            const overduePenalty = (overdue[0].count / total) * 50; // Max 50 pts deduction
            healthScore = Math.max(0, 100 - blockedPenalty - overduePenalty);
        }

        return {
            totalTasks: total,
            completedTasks: completed,
            blockedTasks: blocked,
            overdueTasks: overdue[0].count,
            averageProgress: Math.round(taskStats[0].avg_progress || 0),
            healthScore: Math.round(healthScore)
        };
    }
}

module.exports = new MetricsCalculator();
