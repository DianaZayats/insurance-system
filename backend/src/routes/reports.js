const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/max-contribution-month',
    authorize('Admin', 'Agent'),
    reportController.maxContributionMonth
);

router.get('/agent-income',
    authorize('Admin', 'Agent'),
    reportController.agentIncome
);

router.get('/most-demanded-type-per-client',
    authorize('Admin', 'Agent', 'Client'),
    reportController.mostDemandedTypePerClient
);

router.get('/active-contracts',
    authorize('Admin', 'Agent', 'Client'),
    reportController.activeContracts
);

router.get('/case-extremes',
    authorize('Admin', 'Agent'),
    reportController.caseExtremes
);

router.get('/all-types-used-clients',
    authorize('Admin', 'Agent'),
    reportController.allTypesUsedClients
);

router.get('/export.csv',
    authorize('Admin', 'Agent', 'Client'),
    reportController.exportCSV
);

module.exports = router;

