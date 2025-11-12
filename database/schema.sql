-- Insurance Agents Work Accounting Information System
-- Oracle Database Schema

-- Drop existing objects (for clean setup)
BEGIN
   FOR cur_rec IN (SELECT object_name, object_type FROM user_objects WHERE object_type IN ('TABLE','VIEW','PACKAGE','SEQUENCE','PROCEDURE','FUNCTION','TRIGGER') AND object_name NOT LIKE 'BIN$%')
   LOOP
      BEGIN
         IF cur_rec.object_type = 'TABLE'
         THEN
            EXECUTE IMMEDIATE 'DROP TABLE ' || cur_rec.object_name || ' CASCADE CONSTRAINTS';
         ELSIF cur_rec.object_type = 'VIEW'
         THEN
            EXECUTE IMMEDIATE 'DROP VIEW ' || cur_rec.object_name;
         ELSIF cur_rec.object_type = 'PACKAGE'
         THEN
            EXECUTE IMMEDIATE 'DROP PACKAGE ' || cur_rec.object_name;
         ELSIF cur_rec.object_type = 'SEQUENCE'
         THEN
            EXECUTE IMMEDIATE 'DROP SEQUENCE ' || cur_rec.object_name;
         ELSIF cur_rec.object_type = 'PROCEDURE'
         THEN
            EXECUTE IMMEDIATE 'DROP PROCEDURE ' || cur_rec.object_name;
         ELSIF cur_rec.object_type = 'FUNCTION'
         THEN
            EXECUTE IMMEDIATE 'DROP FUNCTION ' || cur_rec.object_name;
         ELSIF cur_rec.object_type = 'TRIGGER'
         THEN
            EXECUTE IMMEDIATE 'DROP TRIGGER ' || cur_rec.object_name;
         END IF;
      EXCEPTION
         WHEN OTHERS THEN NULL;
      END;
   END LOOP;
END;
/

-- Sequences
CREATE SEQUENCE seq_branch_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_client_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_agent_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_insurance_type_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_contract_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_case_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_user_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_audit_log_id START WITH 1 INCREMENT BY 1;

-- Tables
CREATE TABLE Branch (
    BranchID INTEGER PRIMARY KEY,
    Name VARCHAR2(100) NOT NULL UNIQUE
);

CREATE TABLE Client (
    ClientID INTEGER PRIMARY KEY,
    LastName VARCHAR2(100) NOT NULL,
    FirstName VARCHAR2(100) NOT NULL,
    MiddleName VARCHAR2(100),
    Address VARCHAR2(500),
    Phone VARCHAR2(20),
    Email VARCHAR2(100),
    CONSTRAINT chk_client_contact CHECK (Phone IS NOT NULL OR Email IS NOT NULL),
    CONSTRAINT uk_client_phone UNIQUE (Phone),
    CONSTRAINT uk_client_email UNIQUE (Email)
);

CREATE TABLE Agent (
    AgentID INTEGER PRIMARY KEY,
    FullName VARCHAR2(200) NOT NULL,
    Phone VARCHAR2(20),
    Email VARCHAR2(100),
    HireDate DATE NOT NULL,
    BranchID INTEGER,
    CONSTRAINT fk_agent_branch FOREIGN KEY (BranchID) REFERENCES Branch(BranchID),
    CONSTRAINT uk_agent_phone UNIQUE (Phone),
    CONSTRAINT uk_agent_email UNIQUE (Email)
);

CREATE TABLE InsuranceType (
    InsuranceTypeID INTEGER PRIMARY KEY,
    Name VARCHAR2(100) NOT NULL UNIQUE,
    Description VARCHAR2(500),
    BaseRate NUMBER(5,4) NOT NULL CHECK (BaseRate > 0 AND BaseRate <= 1),
    PayoutCoeff NUMBER(5,4) NOT NULL CHECK (PayoutCoeff > 0),
    AgentPercentDefault NUMBER(5,4) NOT NULL CHECK (AgentPercentDefault >= 0 AND AgentPercentDefault <= 1)
);

CREATE TABLE Contract (
    ContractID INTEGER PRIMARY KEY,
    ClientID INTEGER NOT NULL,
    AgentID INTEGER NOT NULL,
    InsuranceTypeID INTEGER NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    InsuranceAmount NUMBER(12,2) NOT NULL CHECK (InsuranceAmount > 0),
    ContributionAmount NUMBER(12,2) NOT NULL CHECK (ContributionAmount >= 0),
    AgentPercent NUMBER(5,4) NOT NULL CHECK (AgentPercent >= 0 AND AgentPercent <= 1),
    Status VARCHAR2(20) NOT NULL CHECK (Status IN ('Draft', 'Active', 'Suspended', 'Cancelled', 'Completed')),
    CONSTRAINT fk_contract_client FOREIGN KEY (ClientID) REFERENCES Client(ClientID),
    CONSTRAINT fk_contract_agent FOREIGN KEY (AgentID) REFERENCES Agent(AgentID),
    CONSTRAINT fk_contract_type FOREIGN KEY (InsuranceTypeID) REFERENCES InsuranceType(InsuranceTypeID),
    CONSTRAINT chk_contract_dates CHECK (EndDate > StartDate)
);

CREATE TABLE InsuranceCase (
    CaseID INTEGER PRIMARY KEY,
    ContractID INTEGER NOT NULL,
    CaseDate DATE NOT NULL,
    ActNumber VARCHAR2(50) NOT NULL,
    DamageLevel NUMBER(3,2) NOT NULL CHECK (DamageLevel >= 0 AND DamageLevel <= 1),
    AccruedPayment NUMBER(12,2),
    AccruedDate DATE,
    PaymentDate DATE,
    CONSTRAINT fk_case_contract FOREIGN KEY (ContractID) REFERENCES Contract(ContractID)
);

CREATE TABLE Users (
    UserID INTEGER PRIMARY KEY,
    Email VARCHAR2(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR2(255) NOT NULL,
    Role VARCHAR2(20) NOT NULL CHECK (Role IN ('Admin', 'Agent', 'Client')),
    AgentID INTEGER,
    CONSTRAINT fk_user_agent FOREIGN KEY (AgentID) REFERENCES Agent(AgentID)
);

CREATE TABLE Audit_Log (
    LogID INTEGER PRIMARY KEY,
    Entity VARCHAR2(50) NOT NULL,
    EntityID INTEGER NOT NULL,
    Action VARCHAR2(20) NOT NULL,
    ChangedBy INTEGER,
    ChangedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Payload CLOB,
    CONSTRAINT fk_audit_user FOREIGN KEY (ChangedBy) REFERENCES Users(UserID)
);

-- Indexes for performance
CREATE INDEX idx_contract_client ON Contract(ClientID);
CREATE INDEX idx_contract_agent ON Contract(AgentID);
CREATE INDEX idx_contract_status ON Contract(Status);
CREATE INDEX idx_contract_dates ON Contract(StartDate, EndDate);
CREATE INDEX idx_case_contract ON InsuranceCase(ContractID);
CREATE INDEX idx_case_date ON InsuranceCase(CaseDate);
CREATE INDEX idx_audit_entity ON Audit_Log(Entity, EntityID);
CREATE INDEX idx_audit_changed_at ON Audit_Log(ChangedAt);

-- Function to calculate contribution amount
CREATE OR REPLACE FUNCTION CalculateContribution(
    p_insurance_amount IN NUMBER,
    p_base_rate IN NUMBER
) RETURN NUMBER IS
BEGIN
    RETURN ROUND(p_insurance_amount * p_base_rate, 2);
END;
/

-- Function to calculate accrued payment
CREATE OR REPLACE FUNCTION CalculateAccruedPayment(
    p_insurance_amount IN NUMBER,
    p_damage_level IN NUMBER,
    p_payout_coeff IN NUMBER
) RETURN NUMBER IS
    v_payment NUMBER;
BEGIN
    v_payment := ROUND(p_insurance_amount * p_damage_level * p_payout_coeff, 2);
    -- Cap by insurance amount
    IF v_payment > p_insurance_amount THEN
        v_payment := p_insurance_amount;
    END IF;
    RETURN v_payment;
END;
/

-- Function to check if client can create contract (ban rule)
CREATE OR REPLACE FUNCTION CanCreateContract(
    p_client_id IN INTEGER
) RETURN NUMBER IS
    v_case_count INTEGER;
    v_contract_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_case_count
    FROM InsuranceCase ic
    JOIN Contract c ON ic.ContractID = c.ContractID
    WHERE c.ClientID = p_client_id;
    
    SELECT COUNT(*) INTO v_contract_count
    FROM Contract
    WHERE ClientID = p_client_id AND Status != 'Draft';
    
    IF v_contract_count = 0 THEN
        RETURN 1; -- Can create if no contracts
    END IF;
    
    IF v_case_count > (v_contract_count * 0.5) THEN
        RETURN 0; -- Cannot create
    END IF;
    
    RETURN 1; -- Can create
END;
/

-- Function to calculate contract uplift
CREATE OR REPLACE FUNCTION CalculateUplift(
    p_client_id IN INTEGER
) RETURN NUMBER IS
    v_active_count INTEGER;
    v_total_count INTEGER;
    v_uplift NUMBER := 0;
BEGIN
    -- Count active contracts
    SELECT COUNT(*) INTO v_active_count
    FROM Contract
    WHERE ClientID = p_client_id AND Status = 'Active';
    
    -- Count total non-Draft contracts
    SELECT COUNT(*) INTO v_total_count
    FROM Contract
    WHERE ClientID = p_client_id AND Status != 'Draft';
    
    -- Apply uplift rules
    IF (v_active_count > 4 OR v_total_count >= 20) THEN
        v_uplift := 0.10; -- 10%
    ELSIF (v_active_count > 2 OR v_total_count >= 10) THEN
        v_uplift := 0.05; -- 5%
    END IF;
    
    RETURN v_uplift;
END;
/

-- Trigger: Auto-calculate AccruedPayment and AccruedDate on InsuranceCase
CREATE OR REPLACE TRIGGER trg_calculate_case_payment
BEFORE INSERT OR UPDATE OF ContractID, DamageLevel ON InsuranceCase
FOR EACH ROW
DECLARE
    v_insurance_amount NUMBER;
    v_payout_coeff NUMBER;
BEGIN
    IF :NEW.ContractID IS NOT NULL AND :NEW.DamageLevel IS NOT NULL THEN
        SELECT c.InsuranceAmount, it.PayoutCoeff
        INTO v_insurance_amount, v_payout_coeff
        FROM Contract c
        JOIN InsuranceType it ON c.InsuranceTypeID = it.InsuranceTypeID
        WHERE c.ContractID = :NEW.ContractID;
        
        :NEW.AccruedPayment := CalculateAccruedPayment(v_insurance_amount, :NEW.DamageLevel, v_payout_coeff);
        :NEW.AccruedDate := SYSDATE;
    END IF;
END;
/

-- Trigger: Auto-calculate ContributionAmount on Contract
CREATE OR REPLACE TRIGGER trg_calculate_contribution
BEFORE INSERT OR UPDATE OF InsuranceAmount, InsuranceTypeID ON Contract
FOR EACH ROW
DECLARE
    v_base_rate NUMBER;
BEGIN
    IF :NEW.InsuranceTypeID IS NOT NULL AND :NEW.InsuranceAmount IS NOT NULL THEN
        SELECT BaseRate INTO v_base_rate
        FROM InsuranceType
        WHERE InsuranceTypeID = :NEW.InsuranceTypeID;
        
        :NEW.ContributionAmount := CalculateContribution(:NEW.InsuranceAmount, v_base_rate);
    END IF;
END;
/

-- Trigger: Apply uplift and validate ban rule on Contract creation
CREATE OR REPLACE TRIGGER trg_contract_uplift_and_validation
BEFORE INSERT ON Contract
FOR EACH ROW
DECLARE
    v_uplift NUMBER;
    v_can_create NUMBER;
    v_agent_percent_default NUMBER;
BEGIN
    -- Check ban rule
    v_can_create := CanCreateContract(:NEW.ClientID);
    IF v_can_create = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Cannot create contract: client has too many insurance cases relative to contracts');
    END IF;
    
    -- Apply uplift if not Draft
    IF :NEW.Status != 'Draft' THEN
        v_uplift := CalculateUplift(:NEW.ClientID);
        IF v_uplift > 0 THEN
            :NEW.InsuranceAmount := ROUND(:NEW.InsuranceAmount * (1 + v_uplift), 2);
        END IF;
    END IF;
    
    -- Set default AgentPercent if not provided
    IF :NEW.AgentPercent IS NULL THEN
        SELECT AgentPercentDefault INTO v_agent_percent_default
        FROM InsuranceType
        WHERE InsuranceTypeID = :NEW.InsuranceTypeID;
        :NEW.AgentPercent := v_agent_percent_default;
    END IF;
END;
/

-- Trigger: Recalculate contribution after uplift
CREATE OR REPLACE TRIGGER trg_recalculate_contribution_after_uplift
AFTER INSERT OR UPDATE OF InsuranceAmount, InsuranceTypeID ON Contract
FOR EACH ROW
BEGIN
    -- Contribution is recalculated by trg_calculate_contribution
    NULL;
END;
/

-- Trigger: Audit log for Contract changes
CREATE OR REPLACE TRIGGER trg_audit_contract
AFTER INSERT OR UPDATE OR DELETE ON Contract
FOR EACH ROW
DECLARE
    v_action VARCHAR2(20);
    v_payload CLOB;
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_payload := '{"ContractID":' || :NEW.ContractID || ',"ClientID":' || :NEW.ClientID || ',"AgentID":' || :NEW.AgentID || '}';
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_payload := '{"ContractID":' || :NEW.ContractID || ',"Status":"' || :NEW.Status || '"}';
    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_payload := '{"ContractID":' || :OLD.ContractID || '}';
    END IF;
    
    INSERT INTO Audit_Log (LogID, Entity, EntityID, Action, Payload)
    VALUES (seq_audit_log_id.NEXTVAL, 'Contract', COALESCE(:NEW.ContractID, :OLD.ContractID), v_action, v_payload);
END;
/

-- Trigger: Audit log for InsuranceCase changes
CREATE OR REPLACE TRIGGER trg_audit_case
AFTER INSERT OR UPDATE OR DELETE ON InsuranceCase
FOR EACH ROW
DECLARE
    v_action VARCHAR2(20);
    v_payload CLOB;
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_payload := '{"CaseID":' || :NEW.CaseID || ',"ContractID":' || :NEW.ContractID || '}';
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_payload := '{"CaseID":' || :NEW.CaseID || ',"PaymentDate":"' || TO_CHAR(:NEW.PaymentDate, 'YYYY-MM-DD') || '"}';
    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_payload := '{"CaseID":' || :OLD.CaseID || '}';
    END IF;
    
    INSERT INTO Audit_Log (LogID, Entity, EntityID, Action, Payload)
    VALUES (seq_audit_log_id.NEXTVAL, 'InsuranceCase', COALESCE(:NEW.CaseID, :OLD.CaseID), v_action, v_payload);
END;
/

COMMIT;

