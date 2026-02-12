const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcrypt');

// Test login flow step by step
router.post('/test-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Step 1: Find user
        const [users] = await db.query(
            'SELECT id, name, email, password, is_global_admin FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.json({
                step: 1,
                success: false,
                message: 'User not found',
                email: email
            });
        }

        const user = users[0];

        // Step 2: Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.json({
                step: 2,
                success: false,
                message: 'Invalid password',
                user: { id: user.id, email: user.email }
            });
        }

        // Step 3: Get companies
        const [companies] = await db.query(
            `SELECT c.id, c.name, ucr.role 
             FROM companies c
             INNER JOIN user_company_roles ucr ON c.id = ucr.company_id
             WHERE ucr.user_id = ?`,
            [user.id]
        );

        res.json({
            step: 3,
            success: true,
            message: 'All steps passed',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                is_global_admin: user.is_global_admin
            },
            companies: companies,
            companiesCount: companies.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
