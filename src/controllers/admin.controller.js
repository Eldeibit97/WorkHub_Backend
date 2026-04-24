const adminService = require('../services/admin.service');

function normalizeCorreo(body) {
  const raw =
    body.correo_institucional ?? body.email ?? body.correo ?? body.mail;
  return typeof raw === 'string' ? raw.trim() : '';
}

const assignPassword = async (req, res) => {
  try {
    const correo_institucional = normalizeCorreo(req.body || {});
    const { password, confirmPassword } = req.body || {};

    const pass =
      typeof password === 'string' ? password : '';
    const confirm =
      typeof confirmPassword === 'string' ? confirmPassword : '';

    if (!correo_institucional) {
      return res.status(400).json({
        message: 'Se requiere correo (correo_institucional, email o mail)',
      });
    }

    if (!pass || !confirm) {
      return res.status(400).json({
        message: 'password y confirmPassword son requeridos',
      });
    }

    if (pass !== confirm) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden' });
    }

    if (pass.length < adminService.MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `La contraseña debe tener al menos ${adminService.MIN_PASSWORD_LENGTH} caracteres`,
      });
    }

    const result = await adminService.assignPasswordByEmail(
      correo_institucional,
      pass
    );

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.status(200).json({
      message: 'Contraseña asignada correctamente',
      user: result.user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = { assignPassword };
