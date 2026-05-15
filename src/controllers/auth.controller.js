const authService = require('../services/auth.service');
const ModeloUsuario = require('../models/modeloUsuario');
const {
  regenerateSession,
  assignUserToSession,
  destroySession,
} = require('../config/session');

const getMe = async (req, res) => {
  try {
    const id = req.user?.sub;
    if (id == null || !Number.isFinite(Number(id))) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const row = await ModeloUsuario.encontrarPorId(Number(id));
    if (!row) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = authService.publicUser(row);
    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

const login = async (req, res) => {
  try {
    const body = req.body || {};
    const correoRaw =
      body.correo_institucional ?? body.email ?? body.correo ?? body.mail;
    const passwordRaw = body.password;

    const correo_institucional =
      typeof correoRaw === 'string' ? correoRaw.trim().toLowerCase() : '';
    const password = typeof passwordRaw === 'string' ? passwordRaw : '';

    if (!correo_institucional || !password) {
      return res.status(400).json({
        message:
          'Se requieren correo (correo_institucional, email o mail) y password',
      });
    }

    const result = await authService.login(correo_institucional, password);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    await regenerateSession(req);
    assignUserToSession(req, result.user);

    return res.status(200).json({ token: result.token, user: result.user });
  } catch (error) {
    if (error.code === 'JWT_CONFIG') {
      return res.status(500).json({ message: 'Error de configuración del servidor' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

const logout = async (req, res) => {
  try {
    if (!req.session) {
      return res.status(204).send();
    }
    await destroySession(req);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo cerrar sesión' });
  }
};

module.exports = { getMe, login, logout };
