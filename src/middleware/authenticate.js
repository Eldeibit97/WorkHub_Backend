const jwt = require('jsonwebtoken');
const ModeloUsuario = require('../models/modeloUsuario');

/** PostgreSQL `integer` / int4 máximo (ids de usuario deben caber aquí). */
const MAX_PG_INT = 2147483647;

function isValidUserId(n) {
  const x = Number(n);
  return Number.isInteger(x) && x > 0 && x <= MAX_PG_INT;
}

/** sub de JWT suele ser string; algunos clientes antiguos mandaban timestamps en sub. */
function userIdFromJwtPayload(payload) {
  const candidates = [
    payload.id_usuario,
    payload.userId,
    payload.sub,
  ];
  for (const c of candidates) {
    if (c == null || c === '') continue;
    const x = Number(c);
    if (isValidUserId(x)) return x;
  }
  return null;
}

/**
 * Prioridad: 1) cookie de sesión (express-session). 2) Authorization Bearer (migración JWT).
 * Tras login con éxito, req.session contiene userId, correo, rol.
 */
async function authenticate(req, res, next) {
  try {
    const rawSessionUid = req.session?.userId;
    if (rawSessionUid != null) {
      const uid = Number(rawSessionUid);
      if (isValidUserId(uid)) {
        req.user = {
          sub: uid,
          correo: req.session.correo,
          rol: req.session.rol,
        };
        return next();
      }
      return res.status(401).json({
        message: 'Sesión inválida (identificador de usuario corrupto). Vuelve a iniciar sesión.',
      });
    }

    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Sesión o token requerido' });
    }

    const token = auth.slice(7).trim();

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }

    let sub = userIdFromJwtPayload(payload);
    let correo = payload.correo;
    let rol = payload.rol;

    if (sub == null && correo) {
      const user = await ModeloUsuario.encontrarPorMail(correo);
      if (user && isValidUserId(user.id_usuario)) {
        sub = user.id_usuario;
        correo = user.correo_institucional ?? correo;
        rol = user.rol ?? rol;
      }
    }

    if (sub == null || !isValidUserId(sub)) {
      return res.status(401).json({
        message:
          'Token inválido: el identificador de usuario no es válido. Cierra sesión y vuelve a entrar con un token emitido por este API.',
      });
    }

    req.user = {
      sub,
      correo,
      rol,
    };
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Restringe el acceso a uno o más roles.
 * Siempre debe ir DESPUÉS de authenticate.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
