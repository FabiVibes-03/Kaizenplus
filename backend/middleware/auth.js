const jwt = require('jsonwebtoken');
const db = require('../database/db');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            currentCompanyId: decoded.companyId
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// Middleware to check user role in current company context
const checkRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const { id: userId, currentCompanyId } = req.user;

            if (!currentCompanyId) {
                return res.status(400).json({ error: 'No company context selected' });
            }

            // Query user role in current company
            const [rows] = await db.query(
                `SELECT role FROM user_company_roles 
         WHERE user_id = ? AND company_id = ?`,
                [userId, currentCompanyId]
            );

            if (rows.length === 0) {
                return res.status(403).json({ error: 'User not authorized in this company' });
            }

            const userRole = rows[0].role;

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    required: allowedRoles,
                    current: userRole
                });
            }

            req.user.role = userRole;
            next();
        } catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};

// Middleware to check project membership
const checkProjectAccess = async (req, res, next) => {
    try {
        const { id: userId } = req.user;
        const projectId = req.params.projectId || req.body.projectId;

        if (!projectId) {
            return res.status(400).json({ error: 'Project ID required' });
        }

        const [rows] = await db.query(
            `SELECT role FROM project_members 
       WHERE user_id = ? AND project_id = ?`,
            [userId, projectId]
        );

        if (rows.length === 0) {
            return res.status(403).json({ error: 'No access to this project' });
        }

        req.user.projectRole = rows[0].role;
        next();
    } catch (error) {
        console.error('Project access check error:', error);
        res.status(500).json({ error: 'Access check failed' });
    }
};

module.exports = {
    authenticateToken,
    checkRole,
    checkProjectAccess
};
