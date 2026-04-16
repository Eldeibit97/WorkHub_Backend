const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ModeloUsuario = require('../models/modeloUsuario');

const BCRYPT_ROUNDS = 12;

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('JWT_SECRET is not configured');
    err.code = 'JWT_CONFIG';
    throw err;
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  return jwt.sign(
    { sub: user.id_usuario, correo: user.correo_institucional },
    secret,
    { expiresIn }
  );
}

function publicUser(user) {
  return {
    id_usuario: user.id_usuario,
    nombre: user.nombre,
    apellido: user.apellido,
    correo_institucional: user.correo_institucional,
  };
}

async function login(correo_institucional, password) {
  const user = await ModeloUsuario.encontralPorMail(correo_institucional);
  if (!user) {
    return { ok: false, status: 401, message: 'Credenciales inválidas' };
  }

  if (user.password_hash == null || user.password_hash === '') {
    return {
      ok: false,
      status: 403,
      message: 'Cuenta sin contraseña asignada. Contacte al administrador.',
    };
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return { ok: false, status: 401, message: 'Credenciales inválidas' };
  }

  const token = signToken(user);
  return { ok: true, token, user: publicUser(user) };
}

module.exports = { login };
