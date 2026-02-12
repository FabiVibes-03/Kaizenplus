require('dotenv').config({ path: '../.env' }); // Load env from parent dir
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
};

async function setupAdmin() {
    let connection;
    try {
        console.log('Connecting to database...', dbConfig.host);
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        // 1. Check/Add is_global_admin column
        console.log('Checking for is_global_admin column...');
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_global_admin'
        `, [dbConfig.database]);

        if (columns.length === 0) {
            console.log('Adding is_global_admin column to users table...');
            await connection.query('ALTER TABLE users ADD COLUMN is_global_admin BOOLEAN DEFAULT FALSE');
            console.log('Column added.');
        } else {
            console.log('Column is_global_admin already exists.');
        }

        // 2. Check/Create Admin User
        const adminEmail = 'admin@kaizen.com';
        const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [adminEmail]);

        if (users.length === 0) {
            console.log('Creating default admin user...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query(
                'INSERT INTO users (name, email, password, is_global_admin, created_at) VALUES (?, ?, ?, ?, NOW())',
                ['System Admin', adminEmail, hashedPassword, true]
            );
            console.log(`Admin user created: ${adminEmail} / admin123`);
        } else {
            console.log('Admin user already exists. Updating privileges...');
            await connection.query('UPDATE users SET is_global_admin = TRUE WHERE email = ?', [adminEmail]);
            console.log('Admin privileges ensured.');
        }

        console.log('Setup complete.');

    } catch (error) {
        console.error('Setup failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

setupAdmin();
