const express = require('express');

const queriesReserva = require('../controllers/queriesReserva.js');
const queries = require('../controllers/queries.js');


const router = express.Router();

router.post('/reservando', queriesReserva.createReservaOficina);

router.get('/reservas', queries.getReservas);


router.put('/reserva/update', queries.updateReserva);

router.delete('/reserva/:id_reserva', queries.deleteReserva);

module.exports = router;