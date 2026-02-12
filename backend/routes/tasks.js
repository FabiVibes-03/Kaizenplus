const express = require('express');
const router = express.Router();
const Joi = require('joi');
const db = require('../database/db');
const { authenticateToken, checkRole, checkProjectAccess } = require('../middleware/auth');

// Validation schemas
const taskSchema = Joi.object({
    projectId: Joi.number().required(),
    subprojectId: Joi.number().optional(),
    title: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    assignedTo: Joi.number().required(),
    plannedStart: Joi.date().required(),
    plannedEnd: Joi.date().required(),
    isExtra: Joi.boolean().default(false)
});

// GET /api/tasks/project/:projectId - Get Gantt tasks for a project
router.get('/project/:projectId', authenticateToken, checkProjectAccess, async (req, res) => {
    try {
        const { projectId } = req.params;

        const [tasks] = await db.query(
            `SELECT t.*, u.name as assigned_user_name, s.name as subproject_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN subprojects s ON t.subproject_id = s.id
       WHERE t.project_id = ?
       ORDER BY t.planned_start ASC`,
            [projectId]
        );

        res.json({ tasks });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// POST /api/tasks - Create new task
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { error, value } = taskSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { projectId, subprojectId, title, description, assignedTo, plannedStart, plannedEnd, isExtra } = value;

        // Check permissions
        // Collaborators can ONLY create "Extra" tasks (which need approval)
        // Managers/Teams Leaders can create any task
        const userRole = req.user.role; // From checkRole middleware (needs to be applied on route or globally)

        // IMPORTANT: Verify user belongs to project first
        // This logic assumes checkProjectAccess or similar run before, but we can do it inline or trust middleware

        let status = 'Todo';
        let approvalStatus = 'Approved'; // Default for planned tasks by Managers

        if (userRole === 'Collaborator') {
            if (!isExtra) {
                return res.status(403).json({ error: 'Collaborators can only create Extra Tasks' });
            }
            approvalStatus = 'Pending';
            // Normalize dates for extra tasks if needed, or allow them to propose
        } else if (isExtra) {
            // Leaders creating an extra task is auto-approved
            approvalStatus = 'Approved';
        }

        const [result] = await db.query(
            `INSERT INTO tasks 
       (project_id, subproject_id, title, description, assigned_to, created_by, 
        planned_start, planned_end, is_extra, approval_status, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [projectId, subprojectId || null, title, description, assignedTo, req.user.id,
                plannedStart, plannedEnd, isExtra, approvalStatus, status]
        );

        // If extra task by collaborator, create notification for Team Leader
        if (approvalStatus === 'Pending') {
            // Find Team Leaders for this project's company
            // This is a simplified logic, ideally we find the project manager
            const [leaders] = await db.query(
                `SELECT user_id FROM user_company_roles WHERE role IN ('Manager', 'Team Leader') AND company_id = ?`,
                [req.user.currentCompanyId]
            );

            for (const leader of leaders) {
                await db.query(
                    `INSERT INTO notifications (user_id, type, message, related_id, is_read, created_at)
            VALUES (?, 'EXTRA_TASK_APPROVAL', ?, ?, false, NOW())`,
                    [leader.user_id, `New extra task approval request: ${title}`, result.insertId]
                );
            }
        }

        res.status(201).json({
            message: 'Task created successfully',
            taskId: result.insertId,
            approvalStatus
        });

    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PATCH /api/tasks/:id/lock - Update task details (Locking Logic Applied)
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userRole = req.user.role;

        // Get current task
        const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
        if (tasks.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const task = tasks[0];

        // LOCKING RULE:
        // If task is "Planned" and "Submitted/Active", Collaborators can NOT edit dates/title.
        // They can only update status/progress (via Daily flow ideally, but maybe here too).

        // Define forbidden fields for Collaborators
        const lockedFields = ['planned_start', 'planned_end', 'title', 'assigned_to'];

        if (userRole === 'Collaborator') {
            const attemptedLockedUpdate = Object.keys(updates).some(key => lockedFields.includes(key));
            if (attemptedLockedUpdate) {
                return res.status(403).json({ error: 'Collaborators cannot edit locked fields (Dates, Title, Assignment)' });
            }
        }

        // Construct update query dynamically
        const allowedUpdates = ['title', 'description', 'planned_start', 'planned_end', 'real_start', 'real_end', 'status', 'progress', 'approval_status'];
        const fieldsToUpdate = [];
        const values = [];

        for (const key of Object.keys(updates)) {
            if (allowedUpdates.includes(key)) {
                fieldsToUpdate.push(`${key} = ?`);
                values.push(updates[key]);
            }
        }

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        values.push(id);

        await db.query(
            `UPDATE tasks SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Task updated successfully' });

    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// POST /api/tasks/:id/approve - Approve Extra Task
router.post('/:id/approve', authenticateToken, checkRole(['Manager', 'Team Leader']), async (req, res) => {
    try {
        const { id } = req.params;
        const { approved } = req.body; // true or false

        const status = approved ? 'Approved' : 'Rejected';

        await db.query(
            'UPDATE tasks SET approval_status = ? WHERE id = ? AND is_extra = true',
            [status, id]
        );

        // Notify creator
        // ... feature to be added

        res.json({ message: `Task ${status}` });
    } catch (error) {
        console.error('Approve task error:', error);
        res.status(500).json({ error: 'Failed to approve task' });
    }
});

module.exports = router;
