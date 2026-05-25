const adminUsersService = require('../services/adminUsers.service');
const adminStatsService = require('../services/adminStats.service');

function getRolesCatalog(req, res) {
  try {
    return res.status(200).json({ roles: adminUsersService.ALLOWED_ROLES });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function listAdminUsers(req, res) {
  try {
    const { page, pageSize, search, role } = req.query || {};
    const result = await adminUsersService.listUsers({
      page,
      pageSize,
      search,
      role,
    });

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function createAdminUser(req, res) {
  try {
    const result = await adminUsersService.createUser(req.body || {});
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(result.status).json({ usuario: result.usuario });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function patchUserProfile(req, res) {
  try {
    const id = adminUsersService.parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'id inválido' });
    }

    const result = await adminUsersService.updateUserProfile(id, req.body || {});
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.status(200).json({ usuario: result.usuario });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function patchUserPassword(req, res) {
  try {
    const id = adminUsersService.parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'id inválido' });
    }

    const { password } = req.body || {};
    const result = await adminUsersService.updatePassword(id, password);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(200).json({ message: 'Contraseña actualizada' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function patchUserRoles(req, res) {
  try {
    const id = adminUsersService.parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'id inválido' });
    }

    const { roles } = req.body || {};
    const result = await adminUsersService.updateRoles(id, roles, req.user.sub);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.status(200).json({
      message: 'Rol actualizado correctamente',
      usuario: result.usuario,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function deleteAdminUser(req, res) {
  try {
    const id = adminUsersService.parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'id inválido' });
    }

    const result = await adminUsersService.deleteUser(id, req.user.sub);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function importUsersCsv(req, res) {
  try {
    const { users } = req.body || {};
    if (!Array.isArray(users)) {
      return res.status(400).json({
        message: 'Se requiere body.users como array',
      });
    }

    const result = await adminUsersService.importCsv(users);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function getAdminStats(req, res) {
  try {
    const { from, to } = req.query || {};
    const result = await adminStatsService.getAdminStats({ from, to });

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function getNoShowHeatmap(req, res) {
  try {
    const { from, to } = req.query || {};
    const result = await adminStatsService.getNoShowHeatmap({ from, to });

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function getNoShowFloorHeatmap(req, res) {
  try {
    const { zonaId, from, to } = req.query || {};
    const result = await adminStatsService.getNoShowFloorHeatmap({ zonaId, from, to });

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = {
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
  getNoShowFloorHeatmap
};
