const express = require('express');
const queries = require('../controllers/queries.js');

const router = express.Router();

router.get('/users', queries.getUsers);

module.exports = router;