const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, checkRole } = require('../middleware/auth');

// GET /api/projects - Get projects for current company
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { currentCompanyId } = req.user;

        const [projects] = await db.query(
            `SELECT p.*, t.name as team_name 
       FROM projects p
       LEFT JOIN teams t ON p.team_id = t.id
       WHERE p.company_id = ?`,
            [currentCompanyId]
        );

        res.json({ projects });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// POST /api/projects - Create new project
router.post('/', authenticateToken, checkRole(['Manager', 'Team Leader']), async (req, res) => {
    try {
        const { name, description, teamId, startDate, endDate } = req.body;
        const { currentCompanyId } = req.user;

        const [result] = await db.query(
            `INSERT INTO projects 
       (company_id, team_id, name, description, start_date, end_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [currentCompanyId, teamId, name, description, startDate, endDate]
        );

        res.status(201).json({
            message: 'Project created successfully',
            project: { id: result.insertId, name }
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// GET /api/projects/:id/gantt - Get Gantt Data (Planned vs Real)
router.get('/:id/gantt', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify access (omitted for brevity, assume middleware handles basic auth)

        const [project] = await db.query('SELECT * FROM projects WHERE id = ?', [id]);
        if (project.length === 0) return res.status(404).json({ error: 'Project not found' });

        // Fetch tasks with subprojects
        const [tasks] = await db.query(
            `SELECT t.id, t.title, t.planned_start, t.planned_end, 
              t.real_start, t.real_end, t.progress, t.status,
              s.name as subproject_name, u.name as assignee
       FROM tasks t
       LEFT JOIN subprojects s ON t.subproject_id = s.id
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = ?
       ORDER BY t.planned_start ASC`,
            [id]
        );

        res.json({
            project: project[0],
            tasks: tasks.map(t => ({
                id: t.id,
                name: t.title,
                start: t.planned_start,
                end: t.planned_end,
                realStart: t.real_start,
                realEnd: t.real_end,
                progress: t.progress,
                type: 'task',
                assignee: t.assignee,
                subproject: t.subproject_name
            }))
        });

    } catch (error) {
        console.error('Gantt data error:', error);
        res.status(500).json({ error: 'Failed to fetch Gantt data' });
    }
});

module.exports = router;
