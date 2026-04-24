const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const { listarUsuarios, reasignarRol } = require('../controllers/users.controller');

// Solo admins pueden listar usuarios y reasignar roles
router.get('/',        authenticate, authorize('admin'), listarUsuarios);
router.patch('/:id/rol', authenticate, authorize('admin'), reasignarRol);

module.exports = router;
