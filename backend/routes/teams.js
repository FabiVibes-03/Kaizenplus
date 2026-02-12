const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, checkRole } = require('../middleware/auth');

// GET /api/teams - Get all teams for current company
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { currentCompanyId } = req.user;

        const [teams] = await db.query(
            `SELECT t.*, COUNT(tm.user_id) as member_count 
       FROM teams t
       LEFT JOIN team_members tm ON t.id = tm.team_id
       WHERE t.company_id = ?
       GROUP BY t.id`,
            [currentCompanyId]
        );

        res.json({ teams });
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// POST /api/teams - Create new team
router.post('/', authenticateToken, checkRole(['Manager']), async (req, res) => {
    try {
        const { name, description } = req.body;
        const { currentCompanyId } = req.user;

        const [result] = await db.query(
            'INSERT INTO teams (company_id, name, description, created_at) VALUES (?, ?, ?, NOW())',
            [currentCompanyId, name, description]
        );

        res.status(201).json({
            message: 'Team created successfully',
            team: { id: result.insertId, name }
        });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

// POST /api/teams/:id/members - Add member to team
router.post('/:id/members', authenticateToken, checkRole(['Manager', 'Team Leader']), async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role } = req.body; // 'Lead', 'Member'

        // Verify team belongs to current company
        const [team] = await db.query('SELECT id FROM teams WHERE id = ? AND company_id = ?',
            [id, req.user.currentCompanyId]);

        if (team.length === 0) return res.status(404).json({ error: 'Team not found' });

        await db.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
            [id, userId, role]
        );

        res.status(201).json({ message: 'Member added to team' });
    } catch (error) {
        console.error('Add team member error:', error);
        res.status(500).json({ error: 'Failed to add team member' });
    }
});

module.exports = router;
