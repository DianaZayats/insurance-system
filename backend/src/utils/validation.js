const { body, query, param, validationResult } = require('express-validator');

/**
 * Обробити помилки валідації
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: {
                code: 'VALIDATION',
                message: 'Validation failed',
                details: errors.array()
            }
        });
    }
    next();
};

/**
 * Загальні правила валідації
 */
const commonRules = {
    pagination: [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    id: [
        param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
    ]
};

/**
 * Правила валідації клієнтів
 */
const clientRules = {
    create: [
        body('lastName').notEmpty().trim().withMessage('LastName is required'),
        body('firstName').notEmpty().trim().withMessage('FirstName is required'),
        body('middleName').optional().trim(),
        body('address').optional().trim(),
        body('phone').optional().trim().matches(/^\+?[\d\s-()]+$/).withMessage('Invalid phone format'),
        body('email').optional().trim().isEmail().withMessage('Invalid email format'),
        body().custom((value) => {
            if (!value.phone && !value.email) {
                throw new Error('Потрібно вказати хоча б телефон або email');
            }
            return true;
        })
    ],
    update: [
        body('lastName').optional().notEmpty().trim(),
        body('firstName').optional().notEmpty().trim(),
        body('middleName').optional().trim(),
        body('address').optional().trim(),
        body('phone').optional().trim().matches(/^\+?[\d\s-()]+$/),
        body('email').optional().trim().isEmail(),
        body().custom((value) => {
            // Під час оновлення бажано залишити хоча б один спосіб зв’язку
            // (правило також перевіряється на рівні БД)
            return true;
        })
    ]
};

/**
 * Правила валідації договорів
 */
const contractRules = {
    create: [
        body('clientId').isInt({ min: 1 }).withMessage('ClientID is required'),
        body('agentId').isInt({ min: 1 }).withMessage('AgentID is required'),
        body('insuranceTypeId').isInt({ min: 1 }).withMessage('InsuranceTypeID is required'),
        body('startDate').isISO8601().withMessage('StartDate must be a valid date'),
        body('endDate').isISO8601().withMessage('EndDate must be a valid date'),
        body('insuranceAmount').isFloat({ min: 0.01 }).withMessage('InsuranceAmount must be positive'),
        body('agentPercent').optional().isFloat({ min: 0, max: 1 }),
        body('status').optional().isIn(['Draft', 'Active', 'Suspended', 'Cancelled', 'Completed']),
        body().custom((value) => {
            if (new Date(value.endDate) <= new Date(value.startDate)) {
                throw new Error('EndDate має бути пізнішим за StartDate');
            }
            return true;
        })
    ],
    update: [
        body('clientId').optional().isInt({ min: 1 }),
        body('agentId').optional().isInt({ min: 1 }),
        body('insuranceTypeId').optional().isInt({ min: 1 }),
        body('startDate').optional().isISO8601(),
        body('endDate').optional().isISO8601(),
        body('insuranceAmount').optional().isFloat({ min: 0.01 }),
        body('agentPercent').optional().isFloat({ min: 0, max: 1 }),
        body('status').optional().isIn(['Draft', 'Active', 'Suspended', 'Cancelled', 'Completed'])
    ]
};

/**
 * Правила валідації страхових випадків
 */
const caseRules = {
    create: [
        body('contractId').isInt({ min: 1 }).withMessage('ContractID is required'),
        body('caseDate').isISO8601().withMessage('CaseDate must be a valid date'),
        body('actNumber').notEmpty().trim().withMessage('ActNumber is required'),
        body('damageLevel').isFloat({ min: 0, max: 1 }).withMessage('DamageLevel must be between 0 and 1'),
        body('paymentDate').optional().isISO8601()
    ],
    update: [
        body('contractId').optional().isInt({ min: 1 }),
        body('caseDate').optional().isISO8601(),
        body('actNumber').optional().notEmpty().trim(),
        body('damageLevel').optional().isFloat({ min: 0, max: 1 }),
        body('paymentDate').optional().isISO8601()
    ]
};

module.exports = {
    handleValidationErrors,
    commonRules,
    clientRules,
    contractRules,
    caseRules
};

