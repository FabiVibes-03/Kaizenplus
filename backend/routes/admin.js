const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');

// Apply admin check to all routes
router.use(authenticateToken, requireAdmin);

// GET /api/admin/users - List all users
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, is_global_admin, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ error: 'Failed to list users' });
    }
});

// POST /api/admin/users - Create new user
router.post('/users', async (req, res) => {
    try {
        const { name, email, password, isAdmin } = req.body;

        // Basic validation
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check existence
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (name, email, password, is_global_admin, created_at) VALUES (?, ?, ?, ?, NOW())',
            [name, email, hashedPassword, isAdmin || false]
        );

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }

        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// GET /api/admin/companies
router.get('/companies', async (req, res) => {
    try {
        const [companies] = await db.query(`
            SELECT c.*, COUNT(ucr.user_id) as member_count 
            FROM companies c 
            LEFT JOIN user_company_roles ucr ON c.id = ucr.company_id 
            GROUP BY c.id
        `);
        res.json(companies);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

// POST /api/admin/companies
router.post('/companies', async (req, res) => {
    try {
        const { name, plan } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });

        await db.query('INSERT INTO companies (name, plan, created_at) VALUES (?, ?, NOW())', [name, plan || 'free']);
        res.status(201).json({ message: 'Company created' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create company' });
    }
});

module.exports = router;
