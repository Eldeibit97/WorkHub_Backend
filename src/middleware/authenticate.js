const jwt = require('jsonwebtoken');

/**
 * Verifica el JWT y adjunta req.user = { sub, correo, rol }
 * Úsalo en cualquier ruta que requiera sesión iniciada.
 */
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const token = auth.slice(7).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      sub: payload.sub,
      correo: payload.correo,
      rol: payload.rol,       // 'employee' | 'admin'
    };
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

/**
 * Restringe el acceso a uno o más roles.
 * Siempre debe ir DESPUÉS de authenticate.
 *
 * Ejemplo de uso:
 *   router.get('/dashboard', authenticate, authorize('admin'), controller)
 *   router.get('/reservas',  authenticate, authorize('admin', 'employee'), controller)
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
