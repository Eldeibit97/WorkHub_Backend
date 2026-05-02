const ALLOWED_ROLES = ['admin', 'employee'];

function isAllowedRole(rol) {
  return typeof rol === 'string' && ALLOWED_ROLES.includes(rol.trim());
}

module.exports = { ALLOWED_ROLES, isAllowedRole };
