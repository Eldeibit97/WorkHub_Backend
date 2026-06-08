const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const { requireAdmin } = require('../middleware/requireAdmin');
const pp = require('../controllers/purplePoints.controller');

const requireMember = [authenticate, authorize('admin', 'employee')];

router.get('/balance',          ...requireMember, pp.getBalance);
router.get('/transactions',     ...requireMember, pp.getTransactions);
router.post('/purchase',        ...requireMember, pp.purchaseItem);
router.post('/equip',           ...requireMember, pp.equipItem);
router.post('/admin/adjust',    requireAdmin,     pp.adminAdjust);

module.exports = router;
