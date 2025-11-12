const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const branchRoutes = require('./branches');
const clientRoutes = require('./clients');
const agentRoutes = require('./agents');
const insuranceTypeRoutes = require('./insuranceTypes');
const contractRoutes = require('./contracts');
const caseRoutes = require('./cases');
const reportRoutes = require('./reports');

router.use('/auth', authRoutes);
router.use('/branches', branchRoutes);
router.use('/clients', clientRoutes);
router.use('/agents', agentRoutes);
router.use('/insurance-types', insuranceTypeRoutes);
router.use('/contracts', contractRoutes);
router.use('/cases', caseRoutes);
router.use('/reports', reportRoutes);

// Status options endpoint
router.get('/status-options', (req, res) => {
    res.json(['Draft', 'Active', 'Suspended', 'Cancelled', 'Completed']);
});

module.exports = router;

