const jwt = require('jsonwebtoken');

const requireAdmin = (req, res, next) => {
    // Check if user object exists (populated by authenticateToken)
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Check custom flag. Note: We need to update authenticateToken to include this flag in the JWT or look it up.
    // Ideally, we look it up in DB to be secure, or trust the token if we regenerate it on role change.
    // For now, let's assume we will add is_global_admin to the token payload or query DB here.

    // Query DB is safer for "Super Admin" actions
    const db = require('../database/db');

    db.query('SELECT is_global_admin FROM users WHERE id = ?', [req.user.id])
        .then(([rows]) => {
            if (rows.length === 0 || !rows[0].is_global_admin) {
                return res.status(403).json({ error: 'Admin privileges required' });
            }
            next();
        })
        .catch(err => {
            console.error('Admin check error', err);
            res.status(500).json({ error: 'Server error during admin check' });
        });
};

module.exports = requireAdmin;
