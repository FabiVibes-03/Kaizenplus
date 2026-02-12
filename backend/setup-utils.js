const crypto = require('crypto');

// Generate random secrets
const jwtSecret = crypto.randomBytes(64).toString('hex');
const dbPassword = process.env.DB_PASSWORD || 'Check your Hostinger panel';

console.log('--- Configuration Helper ---');
console.log('Generated JWT Secret (Put this in .env):');
console.log(jwtSecret);
console.log('\nDatabase Config Check:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Pass: ${dbPassword ? '******' : 'MISSING'}`);
console.log('----------------------------');
