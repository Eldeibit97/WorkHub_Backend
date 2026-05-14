const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const queries = require('../controllers/reservation.controller');

router.post('/reservando', queries.createReserva);
router.get('/reservas', queries.getReservas);

router.post(
  '/reservas/batch',
  authenticate,
  authorize('admin', 'employee'),
  queries.batchCreateReservas
);

router.put('/reservas/update', queries.updateReserva);
router.get('/reservas/consulta', queries.getReservations);
router.get('/reservas/disponibilidad', queries.checkAvailability);
router.get('/reservas/:id_reserva', queries.getReservaByID);

router.get('/usuarios', queries.getUsers);

router.put('/reservas/check-in', queries.checkInReserva);
router.put('/reservas/check-out', queries.checkOutReserva);

module.exports = router;