# Database Setup

## Files

- `schema.sql` - Database schema with tables, constraints, triggers, and procedures
- `seed.sql` - Demo data for testing
- `init.sql` - Initialization script (creates user and runs schema/seed)

## Manual Setup

If not using Docker, you can set up the database manually:

1. Connect to Oracle as SYSDBA:
   ```bash
   sqlplus sys/Oracle123@XE as sysdba
   ```

2. Run the initialization script:
   ```sql
   @init.sql
   ```

   Or run individually:
   ```sql
   -- Create user
   CREATE USER INSURANCE_USER IDENTIFIED BY Insurance123;
   GRANT CONNECT, RESOURCE, UNLIMITED TABLESPACE TO INSURANCE_USER;
   
   -- Switch to user
   ALTER SESSION SET CURRENT_SCHEMA = INSURANCE_USER;
   
   -- Run schema
   @schema.sql
   
   -- Run seed
   @seed.sql
   ```

## Password Hashes

The seed data includes placeholder password hashes. For production:
1. Generate proper bcrypt hashes using Node.js:
   ```javascript
   const bcrypt = require('bcrypt');
   const hash = await bcrypt.hash('yourpassword', 10);
   ```
2. Update the seed.sql file with the generated hashes

## Business Rules

The database enforces:
- Auto-calculation of ContributionAmount and AccruedPayment
- Contract uplift rules (+5% or +10% based on client contract count)
- Ban rule (cannot create contract if cases > 50% of contracts)
- All constraints and validations as specified

