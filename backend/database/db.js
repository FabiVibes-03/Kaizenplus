const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection pool for Hostinger
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306, // Confirmed by user
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Connected to Hostinger MySQL Database');
        console.log(`📊 Database: ${process.env.DB_NAME}`);
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:');
        console.error('   Host:', process.env.DB_HOST);
        console.error('   User:', process.env.DB_USER);
        console.error('   Error:', err.message);

        if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ETIMEDOUT') {
            console.error('⚠️  HINT: Make sure your current IP address is whitelisted in Hostinger "Remote MySQL" settings.');
            console.error('⚠️  HINT: Or ensure you are using the correct password.');
        }
    });

module.exports = pool;
