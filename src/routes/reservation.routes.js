const express = require('express');
const router = express.Router();
const { getReservations } = require('../controllers/reservation.controller');

router.get('/', getReservations);

module.exports = router;