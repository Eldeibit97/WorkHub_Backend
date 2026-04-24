// Redirige al nuevo middleware unificado para no romper rutas existentes
const { authenticate, authorize } = require('./authenticate');

// requireAdmin ahora es simplemente authenticate + authorize('admin')
function requireAdmin(req, res, next) {
  authenticate(req, res, () => {
    authorize('admin')(req, res, next);
  });
}

module.exports = { requireAdmin };
