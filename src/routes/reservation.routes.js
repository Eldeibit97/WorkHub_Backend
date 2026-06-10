const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const queries = require('../controllers/reservation.controller');

router.post('/reservarEstacionamiento', 
  authenticate, 
  authorize('admin','employee'), 
  queries.reservarEstacionamiento);
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
router.get('/reservas/detalles/:id_reserva', queries.getReservaDetails);
router.get('/reservas/tieneReserva/:id_usuario', queries.tieneReserva);
router.get('/reservas/:id_reserva', queries.getReservaByID);

router.get('/parking/capacidad', queries.getCapacidad);

router.get('/usuarios', queries.getUsers);

router.put('/reservas/check-in', queries.checkInReserva);
router.put('/reservas/check-out', queries.checkOutReserva);


module.exports = router;