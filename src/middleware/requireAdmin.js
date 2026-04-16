const jwt = require('jsonwebtoken');

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const token = auth.slice(7).trim();
  const admins = parseAdminEmails();
  if (admins.length === 0) {
    return res.status(503).json({
      message:
        'Administración no configurada (defina ADMIN_EMAILS en el servidor)',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const correo = String(payload.correo || '').trim().toLowerCase();
    if (!correo || !admins.includes(correo)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    req.admin = { sub: payload.sub, correo: payload.correo };
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

module.exports = { requireAdmin, parseAdminEmails };
