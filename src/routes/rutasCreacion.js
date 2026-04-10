const express = require('express');
const queries = require('../controllers/queries.js');

const router = express.Router();

router.get('/users', queries.getUsers);

router.get('/reserva', queries.getReservaByID);

router.get('/reservas', queries.getReservas);

router.put('/reserva/update', queries.updateReserva);

module.exports = router;