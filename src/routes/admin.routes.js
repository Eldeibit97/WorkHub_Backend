const express = require('express');
const { requireAdmin } = require('../middleware/requireAdmin');
const { assignPassword } = require('../controllers/admin.controller');

const router = express.Router();

router.post('/assign-password', requireAdmin, assignPassword);

module.exports = router;
