const jwt = require('jsonwebtoken');

/**
 * Prioridad: 1) cookie de sesión (express-session). 2) Authorization Bearer (migración JWT).
 * Tras login con éxito, req.session contiene userId, correo, rol.
 */
function authenticate(req, res, next) {
  const userId = req.session?.userId;
  if (userId != null && Number.isFinite(Number(userId))) {
    req.user = {
      sub: Number(userId),
      correo: req.session.correo,
      rol: req.session.rol,
    };
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Sesión o token requerido' });
  }

  const token = auth.slice(7).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      sub: payload.sub,
      correo: payload.correo,
      rol: payload.rol,
    };
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
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
