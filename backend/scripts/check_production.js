const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

console.log('--- Production Readiness Check ---');

// 1. Check Env Vars
const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missingVars = requiredVars.filter(k => !process.env[k]);

if (missingVars.length > 0) {
    console.error('❌ Missing Environment Variables:', missingVars.join(', '));
} else {
    console.log('✅ Environment Variables Present');
}

// 2. Check Database Whitelist Hint
if (process.env.DB_HOST !== 'localhost') {
    console.log('ℹ️  Running with Remote DB Host:', process.env.DB_HOST);
    console.log('   Ensure this IP is whitelisted in Hostinger Remote MySQL.');
}

// 3. Check for node_modules in backend (Warn for upload)
if (fs.existsSync('../node_modules')) {
    console.log('⚠️  node_modules folder detected.');
    console.log('   Remember to EXCLUDE this folder when zipping for Hostinger upload.');
    console.log('   You will run "NPM Install" in the Hostinger panel instead.');
}

// 4. Check Frontend Build Config
const nextConfig = fs.readFileSync('../../web/next.config.mjs', 'utf8');
if (!nextConfig.includes("output: 'export'")) {
    console.log('⚠️  Next.js Static Export Config missing.');
    console.log('   Add "output: \'export\'" to web/next.config.mjs for specific shared hosts if needed.');
} else {
    console.log('✅ Next.js Config looks ready for static export');
}

console.log('----------------------------------');
console.log('Read docs/DEPLOYMENT.md for step-by-step instructions.');
