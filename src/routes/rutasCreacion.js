const express = require('express');
const queries = require('../controllers/queriesReserva.js');

const router = express.Router();

router.get('/reservando', queries.createReservaOficina);

router.get('/reserva', queries.getReservaByID);

router.get('/reservas', queries.getReservas);

router.put('/reserva/update', queries.updateReserva);

module.exports = router;