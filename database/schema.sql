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

-- Послідовності
CREATE SEQUENCE seq_branch_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_client_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_agent_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_insurance_type_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_contract_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_case_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_user_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_audit_log_id START WITH 1 INCREMENT BY 1;

-- Таблиці
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
    CONSTRAINT fk_case_contract FOREIGN KEY (ContractID) REFERENCES Contract(ContractID),
    CONSTRAINT chk_accrued_payment CHECK (AccruedPayment >= 0)
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

-- Індекси для зовнішніх ключів та часто використовуваних полів
-- Contract table indexes
CREATE INDEX idx_contract_clientid ON Contract(ClientID);
CREATE INDEX idx_contract_agentid ON Contract(AgentID);
CREATE INDEX idx_contract_insurancetypeid ON Contract(InsuranceTypeID);
CREATE INDEX idx_contract_status ON Contract(Status);
CREATE INDEX idx_contract_dates ON Contract(StartDate, EndDate);

-- InsuranceCase table indexes
CREATE INDEX idx_case_contractid ON InsuranceCase(ContractID);
CREATE INDEX idx_case_date ON InsuranceCase(CaseDate);

-- Agent table indexes
CREATE INDEX idx_agent_branchid ON Agent(BranchID);

-- Audit_Log table indexes
CREATE INDEX idx_audit_entity ON Audit_Log(Entity, EntityID);
CREATE INDEX idx_audit_changedby ON Audit_Log(ChangedBy);
CREATE INDEX idx_audit_changed_at ON Audit_Log(ChangedAt);

-- Функція розрахунку страхового внеску
-- Бізнес-правило: ContributionAmount = InsuranceAmount * BaseRate
-- Використовується тригером trg_calculate_contribution для автоматичного розрахунку внеску
-- при створенні або оновленні договору
CREATE OR REPLACE FUNCTION CalculateContribution(
    p_insurance_amount IN NUMBER,
    p_base_rate IN NUMBER
) RETURN NUMBER IS
BEGIN
    RETURN ROUND(p_insurance_amount * p_base_rate, 2);
END;
/

-- Функція розрахунку нарахованої виплати та встановлення AccruedDate
-- Бізнес-правило: AccruedPayment = InsuranceAmount * DamageLevel * PayoutCoeff
-- Обмеження: виплата не може перевищувати суму страхування
-- Використовується тригером trg_calculate_case_payment для автоматичного розрахунку
-- при створенні або оновленні страхового випадку
CREATE OR REPLACE FUNCTION CalculateAccruedPayment(
    p_insurance_amount IN NUMBER,
    p_damage_level IN NUMBER,
    p_payout_coeff IN NUMBER
) RETURN NUMBER IS
    v_payment NUMBER;
BEGIN
    v_payment := ROUND(p_insurance_amount * p_damage_level * p_payout_coeff, 2);
    -- Обмеження виплати сумою страхування
    IF v_payment > p_insurance_amount THEN
        v_payment := p_insurance_amount;
    END IF;
    RETURN v_payment;
END;
/

-- Функція перевірки можливості створити договір (правило блокування)
-- Бізнес-правило: клієнт не може створити новий договір, якщо кількість випадків
-- перевищує 50% від кількості його договорів (не Draft)
-- Повертає 1 якщо можна створити, 0 якщо заборонено
-- Використовується тригером trg_contract_uplift_and_validation для валідації
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
        RETURN 1; -- Можна створити, якщо немає договорів
    END IF;
    
    IF v_case_count > (v_contract_count * 0.5) THEN
        RETURN 0; -- Заборонено створювати
    END IF;
    
    RETURN 1; -- Можна створити
END;
/

-- Функція розрахунку підвищення (uplift) для лояльних клієнтів
-- Бізнес-правило: підвищення страхової суми для клієнтів з багатьма договорами
-- - 10% підвищення: якщо >4 активних договорів АБО >=20 загальних договорів
-- - 5% підвищення: якщо >2 активних договорів АБО >=10 загальних договорів
-- Використовується тригером trg_contract_uplift_and_validation при створенні договору
CREATE OR REPLACE FUNCTION CalculateUplift(
    p_client_id IN INTEGER
) RETURN NUMBER IS
    v_active_count INTEGER;
    v_total_count INTEGER;
    v_uplift NUMBER := 0;
BEGIN
    -- Підрахунок активних договорів
    SELECT COUNT(*) INTO v_active_count
    FROM Contract
    WHERE ClientID = p_client_id AND Status = 'Active';
    
    -- Підрахунок усіх договорів (не Draft)
    SELECT COUNT(*) INTO v_total_count
    FROM Contract
    WHERE ClientID = p_client_id AND Status != 'Draft';
    
    -- Правила підвищення
    IF (v_active_count > 4 OR v_total_count >= 20) THEN
        v_uplift := 0.10; -- 10%
    ELSIF (v_active_count > 2 OR v_total_count >= 10) THEN
        v_uplift := 0.05; -- 5%
    END IF;
    
    RETURN v_uplift;
END;
/

-- Тригер: автоматичний розрахунок AccruedPayment та AccruedDate у InsuranceCase
-- Бізнес-правило: при створенні/оновленні випадку автоматично розраховується
-- нарахована виплата на основі суми страхування, рівня збитку та коефіцієнта виплати
-- Встановлює AccruedDate = поточна дата
-- Використовує функцію CalculateAccruedPayment
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

-- Тригер: автоматичний розрахунок ContributionAmount у Contract
-- Бізнес-правило: при створенні/оновленні договору автоматично розраховується
-- страховий внесок на основі суми страхування та базової ставки типу страхування
-- Використовує функцію CalculateContribution
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

-- Тригер: застосування uplift та перевірка правила блокування при створенні договору
-- Бізнес-правила:
-- 1. Перевіряє можливість створення договору (CanCreateContract) - блокує якщо клієнт має
--    занадто багато випадків відносно договорів
-- 2. Застосовує підвищення (uplift) для лояльних клієнтів, якщо статус не Draft
-- 3. Встановлює AgentPercent за замовчуванням з InsuranceType, якщо не вказано
-- Використовує функції CanCreateContract та CalculateUplift
CREATE OR REPLACE TRIGGER trg_contract_uplift_and_validation
BEFORE INSERT ON Contract
FOR EACH ROW
DECLARE
    v_uplift NUMBER;
    v_can_create NUMBER;
    v_agent_percent_default NUMBER;
BEGIN
    -- Перевірка правила блокування
    v_can_create := CanCreateContract(:NEW.ClientID);
    IF v_can_create = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Cannot create contract: client has too many insurance cases relative to contracts');
    END IF;
    
    -- Застосування uplift, якщо договір не Draft
    IF :NEW.Status != 'Draft' THEN
        v_uplift := CalculateUplift(:NEW.ClientID);
        IF v_uplift > 0 THEN
            :NEW.InsuranceAmount := ROUND(:NEW.InsuranceAmount * (1 + v_uplift), 2);
        END IF;
    END IF;
    
    -- Встановлення AgentPercent за замовчуванням, якщо не вказано
    IF :NEW.AgentPercent IS NULL THEN
        SELECT AgentPercentDefault INTO v_agent_percent_default
        FROM InsuranceType
        WHERE InsuranceTypeID = :NEW.InsuranceTypeID;
        :NEW.AgentPercent := v_agent_percent_default;
    END IF;
END;
/

-- Тригер: перерахунок внеску після застосування uplift
CREATE OR REPLACE TRIGGER trg_recalculate_contribution_after_uplift
AFTER INSERT OR UPDATE OF InsuranceAmount, InsuranceTypeID ON Contract
FOR EACH ROW
BEGIN
    -- Contribution перераховує інший тригер
    NULL;
END;
/

-- Пакет для зберігання контексту користувача для аудиту
-- Дозволяє тригерам отримувати UserID користувача, який виконує операцію
CREATE OR REPLACE PACKAGE AuditContext AS
    PROCEDURE SetUserID(p_user_id IN INTEGER);
    FUNCTION GetUserID RETURN INTEGER;
END AuditContext;
/

CREATE OR REPLACE PACKAGE BODY AuditContext AS
    g_user_id INTEGER := NULL;
    
    PROCEDURE SetUserID(p_user_id IN INTEGER) IS
    BEGIN
        g_user_id := p_user_id;
    END SetUserID;
    
    FUNCTION GetUserID RETURN INTEGER IS
    BEGIN
        RETURN g_user_id;
    END GetUserID;
END AuditContext;
/

-- Тригер: аудит змін Contract
-- Логує всі зміни (INSERT, UPDATE, DELETE) в таблиці Contract до Audit_Log
-- Зберігає Entity='Contract', EntityID, Action, ChangedBy, та JSON Payload з ключовими даними
-- Використовується для відстеження історії змін договорів
CREATE OR REPLACE TRIGGER trg_audit_contract
AFTER INSERT OR UPDATE OR DELETE ON Contract
FOR EACH ROW
DECLARE
    v_action VARCHAR2(20);
    v_payload CLOB;
    v_changed_by INTEGER;
BEGIN
    v_changed_by := AuditContext.GetUserID();
    
    IF INSERTING THEN
        v_action := 'INSERT';
        v_payload := '{"ContractID":' || :NEW.ContractID || ',"ClientID":' || :NEW.ClientID || ',"AgentID":' || :NEW.AgentID || ',"InsuranceAmount":' || :NEW.InsuranceAmount || ',"Status":"' || :NEW.Status || '"}';
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_payload := '{"ContractID":' || :NEW.ContractID || ',"Status":"' || :NEW.Status || '","InsuranceAmount":' || :NEW.InsuranceAmount || '}';
    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_payload := '{"ContractID":' || :OLD.ContractID || '}';
    END IF;
    
    INSERT INTO Audit_Log (LogID, Entity, EntityID, Action, ChangedBy, Payload)
    VALUES (seq_audit_log_id.NEXTVAL, 'Contract', COALESCE(:NEW.ContractID, :OLD.ContractID), v_action, v_changed_by, v_payload);
END;
/

-- Тригер: аудит змін InsuranceCase
-- Логує всі зміни (INSERT, UPDATE, DELETE) в таблиці InsuranceCase до Audit_Log
-- Зберігає Entity='InsuranceCase', EntityID, Action, ChangedBy, та JSON Payload з ключовими даними
-- Використовується для відстеження історії змін страхових випадків
CREATE OR REPLACE TRIGGER trg_audit_case
AFTER INSERT OR UPDATE OR DELETE ON InsuranceCase
FOR EACH ROW
DECLARE
    v_action VARCHAR2(20);
    v_payload CLOB;
    v_changed_by INTEGER;
BEGIN
    v_changed_by := AuditContext.GetUserID();
    
    IF INSERTING THEN
        v_action := 'INSERT';
        v_payload := '{"CaseID":' || :NEW.CaseID || ',"ContractID":' || :NEW.ContractID || ',"CaseDate":"' || TO_CHAR(:NEW.CaseDate, 'YYYY-MM-DD') || '","DamageLevel":' || :NEW.DamageLevel || '}';
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_payload := '{"CaseID":' || :NEW.CaseID || ',"PaymentDate":"' || TO_CHAR(:NEW.PaymentDate, 'YYYY-MM-DD') || '","AccruedPayment":' || NVL(:NEW.AccruedPayment, 0) || '}';
    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_payload := '{"CaseID":' || :OLD.CaseID || '}';
    END IF;
    
    INSERT INTO Audit_Log (LogID, Entity, EntityID, Action, ChangedBy, Payload)
    VALUES (seq_audit_log_id.NEXTVAL, 'InsuranceCase', COALESCE(:NEW.CaseID, :OLD.CaseID), v_action, v_changed_by, v_payload);
END;
/

-- Тригер: аудит змін Client
-- Логує всі зміни (INSERT, UPDATE, DELETE) в таблиці Client до Audit_Log
CREATE OR REPLACE TRIGGER trg_audit_client
AFTER INSERT OR UPDATE OR DELETE ON Client
FOR EACH ROW
DECLARE
    v_action VARCHAR2(20);
    v_payload CLOB;
    v_changed_by INTEGER;
BEGIN
    v_changed_by := AuditContext.GetUserID();
    
    IF INSERTING THEN
        v_action := 'INSERT';
        v_payload := '{"ClientID":' || :NEW.ClientID || ',"LastName":"' || :NEW.LastName || '","FirstName":"' || :NEW.FirstName || '","Email":"' || NVL(:NEW.Email, '') || '"}';
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_payload := '{"ClientID":' || :NEW.ClientID || ',"LastName":"' || :NEW.LastName || '","FirstName":"' || :NEW.FirstName || '","Email":"' || NVL(:NEW.Email, '') || '"}';
    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_payload := '{"ClientID":' || :OLD.ClientID || '}';
    END IF;
    
    INSERT INTO Audit_Log (LogID, Entity, EntityID, Action, ChangedBy, Payload)
    VALUES (seq_audit_log_id.NEXTVAL, 'Client', COALESCE(:NEW.ClientID, :OLD.ClientID), v_action, v_changed_by, v_payload);
END;
/

-- Тригер: аудит змін Agent
-- Логує всі зміни (INSERT, UPDATE, DELETE) в таблиці Agent до Audit_Log
CREATE OR REPLACE TRIGGER trg_audit_agent
AFTER INSERT OR UPDATE OR DELETE ON Agent
FOR EACH ROW
DECLARE
    v_action VARCHAR2(20);
    v_payload CLOB;
    v_changed_by INTEGER;
BEGIN
    v_changed_by := AuditContext.GetUserID();
    
    IF INSERTING THEN
        v_action := 'INSERT';
        v_payload := '{"AgentID":' || :NEW.AgentID || ',"FullName":"' || :NEW.FullName || '","BranchID":' || NVL(:NEW.BranchID, 0) || ',"Email":"' || NVL(:NEW.Email, '') || '"}';
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_payload := '{"AgentID":' || :NEW.AgentID || ',"FullName":"' || :NEW.FullName || '","BranchID":' || NVL(:NEW.BranchID, 0) || '}';
    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_payload := '{"AgentID":' || :OLD.AgentID || '}';
    END IF;
    
    INSERT INTO Audit_Log (LogID, Entity, EntityID, Action, ChangedBy, Payload)
    VALUES (seq_audit_log_id.NEXTVAL, 'Agent', COALESCE(:NEW.AgentID, :OLD.AgentID), v_action, v_changed_by, v_payload);
END;
/

-- Тригер: аудит змін Branch
-- Логує всі зміни (INSERT, UPDATE, DELETE) в таблиці Branch до Audit_Log
CREATE OR REPLACE TRIGGER trg_audit_branch
AFTER INSERT OR UPDATE OR DELETE ON Branch
FOR EACH ROW
DECLARE
    v_action VARCHAR2(20);
    v_payload CLOB;
    v_changed_by INTEGER;
BEGIN
    v_changed_by := AuditContext.GetUserID();
    
    IF INSERTING THEN
        v_action := 'INSERT';
        v_payload := '{"BranchID":' || :NEW.BranchID || ',"Name":"' || :NEW.Name || '"}';
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_payload := '{"BranchID":' || :NEW.BranchID || ',"Name":"' || :NEW.Name || '"}';
    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_payload := '{"BranchID":' || :OLD.BranchID || '}';
    END IF;
    
    INSERT INTO Audit_Log (LogID, Entity, EntityID, Action, ChangedBy, Payload)
    VALUES (seq_audit_log_id.NEXTVAL, 'Branch', COALESCE(:NEW.BranchID, :OLD.BranchID), v_action, v_changed_by, v_payload);
END;
/

-- Тригер: аудит змін InsuranceType
-- Логує всі зміни (INSERT, UPDATE, DELETE) в таблиці InsuranceType до Audit_Log
CREATE OR REPLACE TRIGGER trg_audit_insurance_type
AFTER INSERT OR UPDATE OR DELETE ON InsuranceType
FOR EACH ROW
DECLARE
    v_action VARCHAR2(20);
    v_payload CLOB;
    v_changed_by INTEGER;
BEGIN
    v_changed_by := AuditContext.GetUserID();
    
    IF INSERTING THEN
        v_action := 'INSERT';
        v_payload := '{"InsuranceTypeID":' || :NEW.InsuranceTypeID || ',"Name":"' || :NEW.Name || '","BaseRate":' || :NEW.BaseRate || '}';
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_payload := '{"InsuranceTypeID":' || :NEW.InsuranceTypeID || ',"Name":"' || :NEW.Name || '","BaseRate":' || :NEW.BaseRate || '}';
    ELSIF DELETING THEN
        v_action := 'DELETE';
        v_payload := '{"InsuranceTypeID":' || :OLD.InsuranceTypeID || '}';
    END IF;
    
    INSERT INTO Audit_Log (LogID, Entity, EntityID, Action, ChangedBy, Payload)
    VALUES (seq_audit_log_id.NEXTVAL, 'InsuranceType', COALESCE(:NEW.InsuranceTypeID, :OLD.InsuranceTypeID), v_action, v_changed_by, v_payload);
END;
/

COMMIT;

