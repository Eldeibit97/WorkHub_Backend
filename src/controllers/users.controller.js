const ModeloUsuario = require('../models/modeloUsuario');

const ROLES_VALIDOS = ['employee', 'admin'];

/** GET /api/users  — lista todos los usuarios (solo admin) */
const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await ModeloUsuario.listarTodos();
    return res.status(200).json({ usuarios });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

/** PATCH /api/users/:id/rol  — reasignar rol (solo admin) */
// Body: { rol: 'employee' | 'admin' }
const reasignarRol = async (req, res) => {
  try {
    const id_usuario = parseInt(req.params.id, 10);
    const { rol } = req.body || {};

    if (!rol || !ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({
        message: `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}`,
      });
    }

    // Un admin no puede quitarse su propio rol
    if (req.user.sub === id_usuario && rol === 'employee') {
      return res.status(400).json({
        message: 'No puedes quitarte el rol de admin a ti mismo',
      });
    }

    // Actualiza el rol en la base de datos
    const usuarioActualizado = await ModeloUsuario.actualizarRol(id_usuario, rol);

    if (!usuarioActualizado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      message: 'Rol actualizado correctamente',
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = { listarUsuarios, reasignarRol };
