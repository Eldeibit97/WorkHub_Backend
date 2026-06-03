const express = require('express');
const { requireAdmin } = require('../middleware/requireAdmin');
const { assignPassword } = require('../controllers/admin.controller');
const { putFloorLayout } = require('../controllers/floorLayout.controller');
const {
  listUserReservations,
  cancelUserReservation,
} = require('../controllers/adminReservations.controller');
const {
  getRolesCatalog,
  listAdminUsers,
  createAdminUser,
  patchUserProfile,
  patchUserPassword,
  patchUserRoles,
  deleteAdminUser,
  importUsersCsv,
  getAdminStats,
  getNoShowHeatmap,
  getNoShowFloorHeatmap,
  getNoShowByUser,
} = require('../controllers/adminUsers.controller');

const router = express.Router();

router.get('/roles', requireAdmin, getRolesCatalog);
router.get('/stats', requireAdmin, getAdminStats);
router.get('/no-shows/heatmap', requireAdmin, getNoShowHeatmap);
router.get('/no-shows/floor-heatmap', requireAdmin, getNoShowFloorHeatmap);
router.get('/no-shows/by-user', requireAdmin, getNoShowByUser);
router.get('/users', requireAdmin, listAdminUsers);
router.post('/users/import-csv', requireAdmin, importUsersCsv);
router.post('/users', requireAdmin, createAdminUser);
router.get('/users/:id/reservations', requireAdmin, listUserReservations);
router.patch('/users/:id/reservations/:reservationId/cancel', requireAdmin, cancelUserReservation);
router.patch('/users/:id/password', requireAdmin, patchUserPassword);
router.patch('/users/:id/roles', requireAdmin, patchUserRoles);
router.patch('/users/:id', requireAdmin, patchUserProfile);
router.delete('/users/:id', requireAdmin, deleteAdminUser);

router.post('/assign-password', requireAdmin, assignPassword);

router.put('/zonas/:id/floor-layout', requireAdmin, putFloorLayout);

module.exports = router;
