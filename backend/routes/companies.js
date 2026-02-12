const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, checkRole } = require('../middleware/auth');

// GET /api/companies - Get all companies (Manager only)
router.get('/', authenticateToken, checkRole(['Manager']), async (req, res) => {
    try {
        const [companies] = await db.query(
            'SELECT id, name, created_at FROM companies ORDER BY name'
        );

        res.json({ companies });
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

// GET /api/companies/:id - Get company details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify user has access to this company
        const [access] = await db.query(
            `SELECT role FROM user_company_roles 
       WHERE user_id = ? AND company_id = ?`,
            [req.user.id, id]
        );

        if (access.length === 0) {
            return res.status(403).json({ error: 'No access to this company' });
        }

        const [companies] = await db.query(
            'SELECT id, name, created_at FROM companies WHERE id = ?',
            [id]
        );

        if (companies.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Get company members
        const [members] = await db.query(
            `SELECT u.id, u.name, u.email, ucr.role 
       FROM users u
       INNER JOIN user_company_roles ucr ON u.id = ucr.user_id
       WHERE ucr.company_id = ?
       ORDER BY u.name`,
            [id]
        );

        res.json({
            company: companies[0],
            members: members,
            userRole: access[0].role
        });
    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ error: 'Failed to fetch company' });
    }
});

// POST /api/companies - Create new company (Manager only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Company name required' });
        }

        // Create company
        const [result] = await db.query(
            'INSERT INTO companies (name, created_at) VALUES (?, NOW())',
            [name]
        );

        const companyId = result.insertId;

        // Add creator as Manager
        await db.query(
            'INSERT INTO user_company_roles (user_id, company_id, role) VALUES (?, ?, ?)',
            [req.user.id, companyId, 'Manager']
        );

        res.status(201).json({
            message: 'Company created successfully',
            company: { id: companyId, name }
        });
    } catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({ error: 'Failed to create company' });
    }
});

// POST /api/companies/:id/members - Add member to company (Manager/Team Leader)
router.post('/:id/members', authenticateToken, checkRole(['Manager', 'Team Leader']), async (req, res) => {
    try {
        const { id: companyId } = req.params;
        const { userId, role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ error: 'User ID and role required' });
        }

        const validRoles = ['Manager', 'Team Leader', 'Collaborator', 'Spectator'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role', validRoles });
        }

        // Check if user exists
        const [users] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already a member
        const [existing] = await db.query(
            'SELECT id FROM user_company_roles WHERE user_id = ? AND company_id = ?',
            [userId, companyId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'User already a member of this company' });
        }

        // Add member
        await db.query(
            'INSERT INTO user_company_roles (user_id, company_id, role) VALUES (?, ?, ?)',
            [userId, companyId, role]
        );

        res.status(201).json({ message: 'Member added successfully' });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

module.exports = router;
