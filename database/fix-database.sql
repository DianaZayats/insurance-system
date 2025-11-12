-- Fix Database User and Schema
-- Run this as SYSDBA to create the user and initialize the database

-- Connect as: sqlplus sys/Oracle123@XE as sysdba

-- Drop user if exists (to start fresh)
DROP USER INSURANCE_USER CASCADE;

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

-- Now run schema.sql and seed.sql from INSURANCE_USER schema
-- Or continue with the rest of the initialization

COMMIT;


