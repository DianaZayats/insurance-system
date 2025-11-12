-- Insurance Agents Work Accounting Information System
-- Seed Data Script

-- Reset sequences
ALTER SEQUENCE seq_branch_id RESTART START WITH 1;
ALTER SEQUENCE seq_client_id RESTART START WITH 1;
ALTER SEQUENCE seq_agent_id RESTART START WITH 1;
ALTER SEQUENCE seq_insurance_type_id RESTART START WITH 1;
ALTER SEQUENCE seq_contract_id RESTART START WITH 1;
ALTER SEQUENCE seq_case_id RESTART START WITH 1;
ALTER SEQUENCE seq_user_id RESTART START WITH 1;
ALTER SEQUENCE seq_audit_log_id RESTART START WITH 1;

-- Branches
INSERT INTO Branch (BranchID, Name) VALUES (seq_branch_id.NEXTVAL, 'Central Office');
INSERT INTO Branch (BranchID, Name) VALUES (seq_branch_id.NEXTVAL, 'North Branch');
INSERT INTO Branch (BranchID, Name) VALUES (seq_branch_id.NEXTVAL, 'South Branch');
INSERT INTO Branch (BranchID, Name) VALUES (seq_branch_id.NEXTVAL, 'East Branch');
INSERT INTO Branch (BranchID, Name) VALUES (seq_branch_id.NEXTVAL, 'West Branch');

-- Insurance Types (7 types with varying rates)
INSERT INTO InsuranceType (InsuranceTypeID, Name, Description, BaseRate, PayoutCoeff, AgentPercentDefault) VALUES
(seq_insurance_type_id.NEXTVAL, 'Auto Insurance', 'Comprehensive vehicle insurance coverage', 0.0250, 0.8500, 0.1200);
INSERT INTO InsuranceType (InsuranceTypeID, Name, Description, BaseRate, PayoutCoeff, AgentPercentDefault) VALUES
(seq_insurance_type_id.NEXTVAL, 'Home Insurance', 'Property and contents insurance', 0.0180, 0.9000, 0.1000);
INSERT INTO InsuranceType (InsuranceTypeID, Name, Description, BaseRate, PayoutCoeff, AgentPercentDefault) VALUES
(seq_insurance_type_id.NEXTVAL, 'Health Insurance', 'Medical and health coverage', 0.0300, 0.8000, 0.1500);
INSERT INTO InsuranceType (InsuranceTypeID, Name, Description, BaseRate, PayoutCoeff, AgentPercentDefault) VALUES
(seq_insurance_type_id.NEXTVAL, 'Life Insurance', 'Term and whole life policies', 0.0150, 1.0000, 0.2000);
INSERT INTO InsuranceType (InsuranceTypeID, Name, Description, BaseRate, PayoutCoeff, AgentPercentDefault) VALUES
(seq_insurance_type_id.NEXTVAL, 'Travel Insurance', 'Travel and trip cancellation coverage', 0.0400, 0.7500, 0.1800);
INSERT INTO InsuranceType (InsuranceTypeID, Name, Description, BaseRate, PayoutCoeff, AgentPercentDefault) VALUES
(seq_insurance_type_id.NEXTVAL, 'Business Insurance', 'Commercial property and liability', 0.0220, 0.8800, 0.1100);
INSERT INTO InsuranceType (InsuranceTypeID, Name, Description, BaseRate, PayoutCoeff, AgentPercentDefault) VALUES
(seq_insurance_type_id.NEXTVAL, 'Pet Insurance', 'Veterinary and pet health coverage', 0.0350, 0.7000, 0.1600);

-- Agents (12 agents across branches)
INSERT INTO Agent (AgentID, FullName, Phone, Email, HireDate, BranchID) VALUES
(seq_agent_id.NEXTVAL, 'John Smith', '+1-555-0101', 'john.smith@insurance.com', DATE '2020-01-15', 1);
INSERT INTO Agent (AgentID, FullName, Phone, Email, HireDate, BranchID) VALUES
(seq_agent_id.NEXTVAL, 'Sarah Johnson', '+1-555-0102', 'sarah.johnson@insurance.com', DATE '2019-03-20', 1);
INSERT INTO Agent (AgentID, FullName, Phone, Email, HireDate, BranchID) VALUES
(seq_agent_id.NEXTVAL, 'Michael Brown', '+1-555-0103', 'michael.brown@insurance.com', DATE '2021-06-10', 2);
INSERT INTO Agent (AgentID, FullName, Phone, Email, HireDate, BranchID) VALUES
(seq_agent_id.NEXTVAL, 'Emily Davis', '+1-555-0104', 'emily.davis@insurance.com', DATE '2020-09-05', 2);
INSERT INTO Agent (AgentID, FullName, Phone, Email, HireDate, BranchID) VALUES
(seq_agent_id.NEXTVAL, 'David Wilson', '+1-555-0105', 'david.wilson@insurance.com', DATE '2018-11-12', 3);
INSERT INTO Agent (AgentID, FullName, Phone, Email, HireDate, BranchID) VALUES
(seq_agent_id.NEXTVAL, 'Lisa Anderson', '+1-555-0106', 'lisa.anderson@insurance.com', DATE '2022-02-28', 3);
INSERT INTO Agent (AgentID, FullName, Phone, Email, HireDate, BranchID) VALUES
(seq_agent_id.NEXTVAL, 'Robert Taylor', '+1-555-0107', 'robert.taylor@insurance.com', DATE '2019-07-18', 4);
INSERT INTO Agent (AgentID, FullName, Phone, Email, HireDate, BranchID) VALUES
(seq_agent_id.NEXTVAL, 'Jennifer Martinez', '+1-555-0108', 'jennifer.martinez@insurance.com', DATE '2021-04-22', 4);
INSERT INTO Agent (AgentID, FullName, Phone, Email, HireDate, BranchID) VALUES
(seq_agent_id.NEXTVAL, 'William Thomas', '+1-555-0109', 'william.thomas@insurance.com', DATE '2020-10-30', 5);
INSERT INTO Agent (AgentID, FullName, Phone, Email, HireDate, BranchID) VALUES
(seq_agent_id.NEXTVAL, 'Amanda Garcia', '+1-555-0110', 'amanda.garcia@insurance.com', DATE '2022-01-14', 5);
INSERT INTO Agent (AgentID, FullName, Phone, Email, HireDate, BranchID) VALUES
(seq_agent_id.NEXTVAL, 'James Rodriguez', '+1-555-0111', 'james.rodriguez@insurance.com', DATE '2019-05-08', 1);
INSERT INTO Agent (AgentID, FullName, Phone, Email, HireDate, BranchID) VALUES
(seq_agent_id.NEXTVAL, 'Patricia Lee', '+1-555-0112', 'patricia.lee@insurance.com', DATE '2021-08-25', 2);

-- Clients (75 clients with varied data)
-- First batch: 25 clients
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Adams', 'Alice', 'Marie', '123 Main St, New York, NY 10001', '+1-555-1001', 'alice.adams@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Baker', 'Bob', 'James', '456 Oak Ave, Los Angeles, CA 90001', '+1-555-1002', 'bob.baker@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Clark', 'Carol', 'Ann', '789 Pine Rd, Chicago, IL 60601', '+1-555-1003', 'carol.clark@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Davis', 'Daniel', 'Paul', '321 Elm St, Houston, TX 77001', '+1-555-1004', 'daniel.davis@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Evans', 'Emma', 'Rose', '654 Maple Dr, Phoenix, AZ 85001', '+1-555-1005', 'emma.evans@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Foster', 'Frank', 'Michael', '987 Cedar Ln, Philadelphia, PA 19101', '+1-555-1006', 'frank.foster@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Green', 'Grace', 'Elizabeth', '147 Birch Way, San Antonio, TX 78201', '+1-555-1007', 'grace.green@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Harris', 'Henry', 'Robert', '258 Spruce Ct, San Diego, CA 92101', '+1-555-1008', 'henry.harris@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Irwin', 'Ivy', 'Louise', '369 Willow St, Dallas, TX 75201', '+1-555-1009', 'ivy.irwin@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Jackson', 'Jack', 'William', '741 Ash Ave, San Jose, CA 95101', '+1-555-1010', 'jack.jackson@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'King', 'Karen', 'Susan', '852 Poplar Rd, Austin, TX 78701', '+1-555-1011', 'karen.king@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Lewis', 'Larry', 'Edward', '963 Fir Dr, Jacksonville, FL 32201', '+1-555-1012', 'larry.lewis@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Moore', 'Mary', 'Patricia', '159 Cherry Ln, Fort Worth, TX 76101', '+1-555-1013', 'mary.moore@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Nelson', 'Nancy', 'Jean', '357 Walnut St, Columbus, OH 43201', '+1-555-1014', 'nancy.nelson@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Owens', 'Oliver', 'Thomas', '468 Chestnut Ave, Charlotte, NC 28201', '+1-555-1015', 'oliver.owens@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Parker', 'Patricia', 'Ann', '579 Hickory Rd, San Francisco, CA 94101', '+1-555-1016', 'patricia.parker@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Quinn', 'Quinn', 'Joseph', '680 Sycamore Dr, Indianapolis, IN 46201', '+1-555-1017', 'quinn.quinn@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Roberts', 'Rachel', 'Marie', '791 Magnolia Way, Seattle, WA 98101', '+1-555-1018', 'rachel.roberts@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Stewart', 'Steven', 'David', '802 Dogwood Ct, Denver, CO 80201', '+1-555-1019', 'steven.stewart@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Turner', 'Tina', 'Marie', '913 Redwood St, Washington, DC 20001', '+1-555-1020', 'tina.turner@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Underwood', 'Ursula', 'Jane', '124 Cypress Ave, Boston, MA 02101', '+1-555-1021', 'ursula.underwood@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Vance', 'Victor', 'Charles', '235 Hemlock Rd, El Paso, TX 79901', '+1-555-1022', 'victor.vance@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Walker', 'Wendy', 'Lee', '346 Juniper Dr, Detroit, MI 48201', '+1-555-1023', 'wendy.walker@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Xavier', 'Xavier', 'Mark', '457 Larch Ln, Nashville, TN 37201', '+1-555-1024', 'xavier.xavier@email.com');
INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email) VALUES
(seq_client_id.NEXTVAL, 'Young', 'Yvonne', 'Rose', '568 Mahogany Way, Memphis, TN 38101', '+1-555-1025', 'yvonne.young@email.com');

-- Continue with more clients (50 more to reach 75 total)
-- Using a PL/SQL block for efficiency
BEGIN
    FOR i IN 26..75 LOOP
        INSERT INTO Client (ClientID, LastName, FirstName, MiddleName, Address, Phone, Email)
        VALUES (
            seq_client_id.NEXTVAL,
            'Client' || i,
            'First' || i,
            'Middle' || i,
            'Address ' || i || ', City, State ' || MOD(i, 50) || '001',
            '+1-555-' || LPAD(1000 + i, 4, '0'),
            'client' || i || '@email.com'
        );
    END LOOP;
END;
/

-- Special client: Client with all insurance types (ClientID = 1, will be used later)
-- Special client: Client that will be blocked (ClientID = 2, will have many cases)

-- Users (Admin, Agents, Clients)
-- Note: Password hashes are bcrypt hashes for 'admin123', 'agent123', 'client123'
-- These will be generated by the backend on first login or can be pre-generated
-- For demo purposes, using placeholder hashes - in production, use proper bcrypt

-- Admin user (password: admin123)
-- Hash: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO Users (UserID, Email, PasswordHash, Role, AgentID) VALUES
(seq_user_id.NEXTVAL, 'admin@insurance.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', NULL);

-- Agent users (password: agent123)
-- Hash: $2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq
-- Note: These are placeholder hashes. In production, generate proper bcrypt hashes
INSERT INTO Users (UserID, Email, PasswordHash, Role, AgentID) VALUES
(seq_user_id.NEXTVAL, 'john.smith@insurance.com', '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Agent', 1);
INSERT INTO Users (UserID, Email, PasswordHash, Role, AgentID) VALUES
(seq_user_id.NEXTVAL, 'sarah.johnson@insurance.com', '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Agent', 2);
INSERT INTO Users (UserID, Email, PasswordHash, Role, AgentID) VALUES
(seq_user_id.NEXTVAL, 'michael.brown@insurance.com', '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Agent', 3);

-- Client users (password: client123)
INSERT INTO Users (UserID, Email, PasswordHash, Role, AgentID) VALUES
(seq_user_id.NEXTVAL, 'alice.adams@email.com', '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Client', NULL);
INSERT INTO Users (UserID, Email, PasswordHash, Role, AgentID) VALUES
(seq_user_id.NEXTVAL, 'bob.baker@email.com', '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'Client', NULL);

-- Contracts (400+ contracts across different periods and statuses)
-- We'll create contracts with varied dates to support reports
-- Note: Uplift will be applied automatically by triggers for non-Draft contracts

-- Helper function to generate contracts
-- Creating contracts in batches for different months to ensure varied contribution totals

-- January 2024 contracts (50 contracts)
BEGIN
    FOR i IN 1..50 LOOP
        INSERT INTO Contract (ContractID, ClientID, AgentID, InsuranceTypeID, StartDate, EndDate, InsuranceAmount, Status)
        VALUES (
            seq_contract_id.NEXTVAL,
            MOD(i, 75) + 1,
            MOD(i, 12) + 1,
            MOD(i, 7) + 1,
            DATE '2024-01-01' + MOD(i, 15),
            DATE '2024-01-01' + MOD(i, 15) + 365,
            50000 + (i * 1000),
            CASE MOD(i, 5)
                WHEN 0 THEN 'Draft'
                WHEN 1 THEN 'Active'
                WHEN 2 THEN 'Active'
                WHEN 3 THEN 'Completed'
                ELSE 'Active'
            END
        );
    END LOOP;
END;
/

-- February 2024 contracts (60 contracts - higher volume for max contribution month)
BEGIN
    FOR i IN 1..60 LOOP
        INSERT INTO Contract (ContractID, ClientID, AgentID, InsuranceTypeID, StartDate, EndDate, InsuranceAmount, Status)
        VALUES (
            seq_contract_id.NEXTVAL,
            MOD(i + 10, 75) + 1,
            MOD(i + 2, 12) + 1,
            MOD(i + 1, 7) + 1,
            DATE '2024-02-01' + MOD(i, 15),
            DATE '2024-02-01' + MOD(i, 15) + 365,
            60000 + (i * 1200),
            CASE MOD(i, 4)
                WHEN 0 THEN 'Active'
                WHEN 1 THEN 'Active'
                WHEN 2 THEN 'Suspended'
                ELSE 'Active'
            END
        );
    END LOOP;
END;
/

-- March 2024 contracts (55 contracts)
BEGIN
    FOR i IN 1..55 LOOP
        INSERT INTO Contract (ContractID, ClientID, AgentID, InsuranceTypeID, StartDate, EndDate, InsuranceAmount, Status)
        VALUES (
            seq_contract_id.NEXTVAL,
            MOD(i + 20, 75) + 1,
            MOD(i + 3, 12) + 1,
            MOD(i + 2, 7) + 1,
            DATE '2024-03-01' + MOD(i, 15),
            DATE '2024-03-01' + MOD(i, 15) + 365,
            55000 + (i * 1100),
            CASE MOD(i, 5)
                WHEN 0 THEN 'Draft'
                WHEN 1 THEN 'Active'
                WHEN 2 THEN 'Active'
                WHEN 3 THEN 'Cancelled'
                ELSE 'Active'
            END
        );
    END LOOP;
END;
/

-- Previous month (November 2024) contracts for agent income report (40 contracts)
BEGIN
    FOR i IN 1..40 LOOP
        INSERT INTO Contract (ContractID, ClientID, AgentID, InsuranceTypeID, StartDate, EndDate, InsuranceAmount, Status)
        VALUES (
            seq_contract_id.NEXTVAL,
            MOD(i + 30, 75) + 1,
            MOD(i, 12) + 1,
            MOD(i, 7) + 1,
            DATE '2024-11-01' + MOD(i, 15),
            DATE '2024-11-01' + MOD(i, 15) + 365,
            70000 + (i * 1500),
            'Active'
        );
    END LOOP;
END;
/

-- December 2024 contracts (45 contracts)
BEGIN
    FOR i IN 1..45 LOOP
        INSERT INTO Contract (ContractID, ClientID, AgentID, InsuranceTypeID, StartDate, EndDate, InsuranceAmount, Status)
        VALUES (
            seq_contract_id.NEXTVAL,
            MOD(i + 40, 75) + 1,
            MOD(i + 5, 12) + 1,
            MOD(i + 3, 7) + 1,
            DATE '2024-12-01' + MOD(i, 15),
            DATE '2024-12-01' + MOD(i, 15) + 365,
            65000 + (i * 1300),
            CASE MOD(i, 3)
                WHEN 0 THEN 'Active'
                WHEN 1 THEN 'Active'
                ELSE 'Draft'
            END
        );
    END LOOP;
END;
/

-- More contracts across 2023 and early 2024 (150 contracts)
BEGIN
    FOR i IN 1..150 LOOP
        INSERT INTO Contract (ContractID, ClientID, AgentID, InsuranceTypeID, StartDate, EndDate, InsuranceAmount, Status)
        VALUES (
            seq_contract_id.NEXTVAL,
            MOD(i + 50, 75) + 1,
            MOD(i + 7, 12) + 1,
            MOD(i + 4, 7) + 1,
            DATE '2023-01-01' + MOD(i, 730),
            DATE '2023-01-01' + MOD(i, 730) + 365,
            45000 + (i * 800),
            CASE MOD(i, 6)
                WHEN 0 THEN 'Draft'
                WHEN 1 THEN 'Active'
                WHEN 2 THEN 'Active'
                WHEN 3 THEN 'Completed'
                WHEN 4 THEN 'Suspended'
                ELSE 'Active'
            END
        );
    END LOOP;
END;
/

-- Special: Client 1 with all insurance types (7 contracts, one for each type)
BEGIN
    FOR i IN 1..7 LOOP
        INSERT INTO Contract (ContractID, ClientID, AgentID, InsuranceTypeID, StartDate, EndDate, InsuranceAmount, Status)
        VALUES (
            seq_contract_id.NEXTVAL,
            1,
            MOD(i, 12) + 1,
            i,
            DATE '2024-01-01' + (i * 30),
            DATE '2024-01-01' + (i * 30) + 365,
            50000 + (i * 10000),
            'Active'
        );
    END LOOP;
END;
/

-- Special: Client 2 with many contracts and cases (to test ban rule)
-- Create 10 contracts for client 2
BEGIN
    FOR i IN 1..10 LOOP
        INSERT INTO Contract (ContractID, ClientID, AgentID, InsuranceTypeID, StartDate, EndDate, InsuranceAmount, Status)
        VALUES (
            seq_contract_id.NEXTVAL,
            2,
            MOD(i, 12) + 1,
            MOD(i, 7) + 1,
            DATE '2023-06-01' + (i * 30),
            DATE '2023-06-01' + (i * 30) + 365,
            40000 + (i * 5000),
            'Active'
        );
    END LOOP;
END;
/

-- Insurance Cases (150 cases with varied damage levels)
-- Regular cases (120 cases)
BEGIN
    FOR i IN 1..120 LOOP
        INSERT INTO InsuranceCase (CaseID, ContractID, CaseDate, ActNumber, DamageLevel, PaymentDate)
        VALUES (
            seq_case_id.NEXTVAL,
            MOD(i, 400) + 1,
            DATE '2024-01-01' + MOD(i, 300),
            'ACT-' || LPAD(i, 6, '0'),
            0.1 + (MOD(i, 90) / 100.0), -- Damage level between 0.1 and 1.0
            CASE MOD(i, 3)
                WHEN 0 THEN DATE '2024-01-01' + MOD(i, 300) + 7
                WHEN 1 THEN DATE '2024-01-01' + MOD(i, 300) + 14
                ELSE NULL
            END
        );
    END LOOP;
END;
/

-- Special: Client 2 with 6 cases (more than 50% of 10 contracts = 5, so should be blocked)
BEGIN
    FOR i IN 1..6 LOOP
        INSERT INTO InsuranceCase (CaseID, ContractID, CaseDate, ActNumber, DamageLevel, PaymentDate)
        VALUES (
            seq_case_id.NEXTVAL,
            (SELECT ContractID FROM Contract WHERE ClientID = 2 AND ROWNUM <= 1),
            DATE '2024-06-01' + (i * 15),
            'ACT-BLOCKED-' || LPAD(i, 3, '0'),
            0.2 + (i * 0.1),
            DATE '2024-06-01' + (i * 15) + 10
        );
    END LOOP;
END;
/

-- More cases for previous month (November 2024) - 20 cases
BEGIN
    FOR i IN 1..20 LOOP
        INSERT INTO InsuranceCase (CaseID, ContractID, CaseDate, ActNumber, DamageLevel, PaymentDate)
        VALUES (
            seq_case_id.NEXTVAL,
            (SELECT ContractID FROM Contract WHERE StartDate >= DATE '2024-11-01' AND StartDate < DATE '2024-12-01' AND ROWNUM <= 1),
            DATE '2024-11-01' + MOD(i, 20),
            'ACT-NOV-' || LPAD(i, 4, '0'),
            0.15 + (MOD(i, 80) / 100.0),
            DATE '2024-11-01' + MOD(i, 20) + 5
        );
    END LOOP;
END;
/

-- Additional cases to reach ~150 total
BEGIN
    FOR i IN 1..10 LOOP
        INSERT INTO InsuranceCase (CaseID, ContractID, CaseDate, ActNumber, DamageLevel, PaymentDate)
        VALUES (
            seq_case_id.NEXTVAL,
            MOD(i + 100, 400) + 1,
            DATE '2024-05-01' + MOD(i, 30),
            'ACT-EXTRA-' || LPAD(i, 4, '0'),
            0.2 + (MOD(i, 70) / 100.0),
            CASE MOD(i, 2)
                WHEN 0 THEN DATE '2024-05-01' + MOD(i, 30) + 10
                ELSE NULL
            END
        );
    END LOOP;
END;
/

COMMIT;

-- Note: Password hashes above are placeholders. In production, use proper bcrypt hashing.
-- Default passwords: admin123, agent123, client123

