/**
 * Script to generate bcrypt hash for admin and update database
 * Run: node scripts/update-admin-password.js
 */

const bcrypt = require('bcrypt');
const oracledb = require('oracledb');

async function updateAdminPassword() {
    try {
        // Generate hash for admin
        const password = 'admin';
        const hash = await bcrypt.hash(password, 10);
        
        console.log('Generated hash for admin:');
        console.log(hash);
        console.log('\nSQL command to update database:');
        console.log(`UPDATE Users SET PasswordHash = '${hash}' WHERE Email = 'admin@insurance.com';`);
        console.log('\nOr run this in SQL*Plus:');
        console.log(`UPDATE Users SET PasswordHash = '${hash}' WHERE Email = 'admin@insurance.com';`);
        console.log('COMMIT;');
        
        // Optionally, if you want to connect and update directly:
        // Uncomment the code below if you want to update automatically
        
        /*
        oracledb.initOracleClient();
        const connection = await oracledb.getConnection({
            user: 'INSURANCE_USER',
            password: 'Insurance123',
            connectionString: 'localhost:1521/XEPDB1'
        });
        
        await connection.execute(
            `UPDATE Users SET PasswordHash = :hash WHERE Email = 'admin@insurance.com'`,
            { hash },
            { autoCommit: true }
        );
        
        console.log('\n✅ Password updated successfully in database!');
        await connection.close();
        */
        
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
}

updateAdminPassword();


