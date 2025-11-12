-- Create Database User - Run these commands in SQL*Plus
-- Connect as: sqlplus sys/Oracle123@XE as sysdba

-- Skip DROP if user doesn't exist, just create it:
CREATE USER INSURANCE_USER IDENTIFIED BY Insurance123;

-- Grant privileges
GRANT CONNECT, RESOURCE, UNLIMITED TABLESPACE TO INSURANCE_USER;
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE PROCEDURE, CREATE TRIGGER, CREATE FUNCTION TO INSURANCE_USER;

-- Exit
exit;


