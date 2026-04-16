const authService = require('../services/auth.service');

const login = async (req, res) => {
  try {
    const body = req.body || {};
    const correoRaw =
      body.correo_institucional ?? body.email ?? body.correo ?? body.mail;
    const passwordRaw = body.password;

    const correo_institucional =
      typeof correoRaw === 'string' ? correoRaw.trim() : '';
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

    return res.status(200).json({ token: result.token, user: result.user });
  } catch (error) {
    if (error.code === 'JWT_CONFIG') {
      return res.status(500).json({ message: 'Error de configuración del servidor' });
    }
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = { login };
