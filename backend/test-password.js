const bcrypt = require('bcrypt');

async function testPassword() {
    const password = '123456';
    const hashFromDB = '$2b$10$xzl6eTG.yb1iaL.i3tHhM.FEkjYvSfZF7pzKI8HJBnKRMZ2FfQKa.';

    console.log('Testing password:', password);
    console.log('Hash from DB:', hashFromDB);

    const isValid = await bcrypt.compare(password, hashFromDB);
    console.log('Password valid:', isValid);

    // Generate new hash
    const newHash = await bcrypt.hash(password, 10);
    console.log('\nNew hash for 123456:', newHash);

    // Test new hash
    const newHashValid = await bcrypt.compare(password, newHash);
    console.log('New hash valid:', newHashValid);
}

testPassword().catch(console.error);
