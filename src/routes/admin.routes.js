const express = require('express');
const { requireAdmin } = require('../middleware/requireAdmin');
const { assignPassword } = require('../controllers/admin.controller');
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
} = require('../controllers/adminUsers.controller');

const router = express.Router();

router.get('/roles', requireAdmin, getRolesCatalog);
router.get('/stats', requireAdmin, getAdminStats);

router.get('/users', requireAdmin, listAdminUsers);
router.post('/users/import-csv', requireAdmin, importUsersCsv);
router.post('/users', requireAdmin, createAdminUser);
router.patch('/users/:id/password', requireAdmin, patchUserPassword);
router.patch('/users/:id/roles', requireAdmin, patchUserRoles);
router.patch('/users/:id', requireAdmin, patchUserProfile);
router.delete('/users/:id', requireAdmin, deleteAdminUser);

router.post('/assign-password', requireAdmin, assignPassword);

module.exports = router;
