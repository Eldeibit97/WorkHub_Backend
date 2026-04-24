const express = require('express');
const router = express.Router();
const queries = require('../controllers/reservation.controller');

router.post('/reservando', queries.createReservaOficina);

router.get('/reservas', queries.getReservas);

router.put('/reservas/update', queries.updateReserva);

router.get('/reservas/consulta', queries.getReservations);

router.get('/reservas/disponibilidad', queries.checkAvailability);

router.get('/reservas/:id_reserva', queries.getReservaByID);

router.get('/usuarios', queries.getUsers);

router.put('/reservas/check-in', queries.checkInReserva);

module.exports = router;