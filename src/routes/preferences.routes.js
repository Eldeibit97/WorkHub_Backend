const express = require('express');
const router = express.Router();
const queries = require('../controllers/preferences.controller');

router.get('/preferencias/historial/:userId', queries.getReservationHistory);

router.get('/preferencias/inferidas/:userId', queries.getInferredPreferences);

module.exports = router;