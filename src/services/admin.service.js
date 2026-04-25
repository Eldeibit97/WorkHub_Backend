const bcrypt = require('bcryptjs');
const ModeloUsuario = require('../models/modeloUsuario');

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

async function assignPasswordByEmail(correo_institucional, password) {
  const user = await ModeloUsuario.encontrarPorMail(correo_institucional);
  if (!user || user.id_usuario === -1) {
    return { ok: false, status: 404, message: 'Usuario no encontrado' };
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await ModeloUsuario.actualizarPasswordHash(user.id_usuario, hash);

  return {
    ok: true,
    user: {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      apellido: user.apellido,
      correo_institucional: user.correo_institucional,
    },
  };
}

module.exports = { assignPasswordByEmail, MIN_PASSWORD_LENGTH };
