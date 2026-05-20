const express = require('express');
const spacesController = require('../controllers/spaces.controller');

const router = express.Router();

router.get('/tipos-espacio', spacesController.getTiposEspacio);
router.get('/zonas', spacesController.getZonas);
router.get('/spaces/availability', spacesController.getSpacesAvailability);
router.get('/spaces/:idEspacio/schedule', spacesController.getSpaceSchedule);
router.get('/spaces', spacesController.getSpaces);

module.exports = router;
