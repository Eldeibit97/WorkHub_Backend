const authService = require('../services/auth.service');

const login = async (req, res) => {
  try {
    const { correo_institucional, password } = req.body;
    if (!correo_institucional || !password) {
      return res.status(400).json({
        message: 'correo_institucional y password son requeridos',
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
