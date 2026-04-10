const express = require('express');
const queries = require('../controllers/queriesReserva.js');

const router = express.Router();

router.get('/reservando', queries.createReservaOficina);

module.exports = router;