/**
 * Script to generate bcrypt password hashes for seed data
 * Run: node scripts/generate-hashes.js
 */

const bcrypt = require('bcrypt');

async function generateHashes() {
    const passwords = {
        'admin': 'admin@insurance.com',
        'admin': 'agent users',
        'admin': 'client users'
    };

    console.log('Generated password hashes:\n');
    console.log('-- Use these in database/seed.sql\n');

    for (const [password, description] of Object.entries(passwords)) {
        const hash = await bcrypt.hash(password, 10);
        console.log(`-- ${description} (password: ${password})`);
        console.log(`-- Hash: ${hash}\n`);
    }
}

generateHashes().catch(console.error);

