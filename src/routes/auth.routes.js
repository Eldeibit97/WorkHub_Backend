const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { getMe, login, logout } = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

module.exports = router;
