const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Validation schemas
const registerSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Helper function to generate tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
            companyId: user.companyId || null
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    return { accessToken, refreshToken };
};

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
    try {
        // Validate input
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { name, email, password } = value;

        // Check if user already exists
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())',
            [name, email, hashedPassword]
        );

        const userId = result.insertId;

        // Generate tokens
        const tokens = generateTokens({ id: userId, email });

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: userId, name, email },
            ...tokens
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
    try {
        // Validate input
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, password } = value;

        // Find user
        const [users] = await db.query(
            'SELECT id, name, email, password, is_global_admin FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Get user's companies and roles
        const [companies] = await db.query(
            `SELECT c.id, c.name, ucr.role 
       FROM companies c
       INNER JOIN user_company_roles ucr ON c.id = ucr.company_id
       WHERE ucr.user_id = ?`,
            [user.id]
        );

        // Generate tokens (with first company as default context)
        const defaultCompanyId = companies.length > 0 ? companies[0].id : null;
        const tokens = generateTokens({
            id: user.id,
            email: user.email,
            companyId: defaultCompanyId
        });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                is_global_admin: user.is_global_admin // Expose admin flag
            },
            companies: companies.map(c => ({
                id: c.id,
                name: c.name,
                role: c.role
            })),
            currentCompany: companies.length > 0 ? companies[0] : null,
            ...tokens
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/switch-company - Switch active company context
router.post('/switch-company', authenticateToken, async (req, res) => {
    try {
        const { companyId } = req.body;
        const userId = req.user.id;

        if (!companyId) {
            return res.status(400).json({ error: 'Company ID required' });
        }

        // Verify user has access to this company
        const [access] = await db.query(
            `SELECT c.id, c.name, ucr.role 
       FROM companies c
       INNER JOIN user_company_roles ucr ON c.id = ucr.company_id
       WHERE ucr.user_id = ? AND c.id = ?`,
            [userId, companyId]
        );

        if (access.length === 0) {
            return res.status(403).json({ error: 'No access to this company' });
        }

        // Generate new token with updated company context
        const tokens = generateTokens({
            id: userId,
            email: req.user.email,
            companyId: companyId
        });

        res.json({
            message: 'Company context switched',
            currentCompany: {
                id: access[0].id,
                name: access[0].name,
                role: access[0].role
            },
            ...tokens
        });
    } catch (error) {
        console.error('Switch company error:', error);
        res.status(500).json({ error: 'Failed to switch company' });
    }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, name, email, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get companies
        const [companies] = await db.query(
            `SELECT c.id, c.name, ucr.role 
       FROM companies c
       INNER JOIN user_company_roles ucr ON c.id = ucr.company_id
       WHERE ucr.user_id = ?`,
            [req.user.id]
        );

        res.json({
            user: users[0],
            companies: companies,
            currentCompanyId: req.user.currentCompanyId
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        // Get user
        const [users] = await db.query(
            'SELECT id, email FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate new tokens
        const tokens = generateTokens(users[0]);

        res.json(tokens);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Refresh token expired' });
        }
        res.status(403).json({ error: 'Invalid refresh token' });
    }
});

module.exports = router;
