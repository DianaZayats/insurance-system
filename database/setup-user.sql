-- Setup script to create user and run schema/seed
-- This is run automatically by Oracle container initialization
-- Or can be run manually: sqlplus sys/Oracle123@XE as sysdba @setup-user.sql

-- Create user
CREATE USER INSURANCE_USER IDENTIFIED BY Insurance123;

-- Grant privileges
GRANT CONNECT, RESOURCE TO INSURANCE_USER;
GRANT UNLIMITED TABLESPACE TO INSURANCE_USER;
GRANT CREATE SESSION TO INSURANCE_USER;
GRANT CREATE TABLE TO INSURANCE_USER;
GRANT CREATE SEQUENCE TO INSURANCE_USER;
GRANT CREATE PROCEDURE TO INSURANCE_USER;
GRANT CREATE TRIGGER TO INSURANCE_USER;
GRANT CREATE FUNCTION TO INSURANCE_USER;

-- Switch to user schema
ALTER SESSION SET CURRENT_SCHEMA = INSURANCE_USER;

-- Note: Schema and seed will be run automatically by Docker
-- If running manually, execute:
-- @schema.sql
-- @seed.sql

COMMIT;

