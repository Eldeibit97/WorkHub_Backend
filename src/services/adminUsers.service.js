const bcrypt = require('bcryptjs');
const ModeloUsuario = require('../models/modeloUsuario');
const { ALLOWED_ROLES, isAllowedRole } = require('../constants/roles');
const { MIN_PASSWORD_LENGTH } = require('./admin.service');

const BCRYPT_ROUNDS = 12;

function normalizeCorreo(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().toLowerCase();
}

function parseId(param) {
  const parsed = parseInt(param, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function isPgUniqueViolation(err) {
  return Boolean(err && err.code === '23505');
}

function allowImportPasswordHash() {
  const raw = process.env.ALLOW_IMPORT_PASSWORD_HASH || '';
  const normalized = String(raw).trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function looksLikeBcryptHash(raw) {
  return typeof raw === 'string' && /^\$2[aby]\$\d{2}\$.+/.test(raw.trim());
}

async function assertCanRemoveAdminPrivileges(targetUserId, nextRol) {
  const target = await ModeloUsuario.encontrarPorId(targetUserId);
  if (!target) {
    return { ok: false, status: 404, message: 'Usuario no encontrado' };
  }

  if (target.rol !== 'admin') {
    return { ok: true };
  }

  if (nextRol === 'admin') {
    return { ok: true };
  }

  const adminCount = await ModeloUsuario.contarPorRol('admin');
  if (adminCount <= 1) {
    return {
      ok: false,
      status: 400,
      message: 'No se puede quitar el último administrador del sistema',
    };
  }

  return { ok: true };
}

async function listUsers({ page, pageSize, search, role }) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 12));
  const roleFilter = typeof role === 'string' ? role.trim() : '';
  const searchTerm = typeof search === 'string' ? search : '';
  const offset = (p - 1) * ps;

  if (roleFilter && !isAllowedRole(roleFilter)) {
    return { ok: false, status: 400, message: 'Filtro role inválido' };
  }

  const { rows, total } = await ModeloUsuario.listarPaginado({
    search: searchTerm,
    roleFilter,
    limit: ps,
    offset,
  });

  return {
    ok: true,
    data: {
      usuarios: rows,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / ps),
    },
  };
}

async function createUser(body) {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const apellido = typeof body.apellido === 'string' ? body.apellido.trim() : '';
  const correo_institucional = normalizeCorreo(body.correo_institucional);
  const rol = typeof body.rol === 'string' ? body.rol.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!nombre || !apellido || !correo_institucional) {
    return {
      ok: false,
      status: 400,
      message: 'nombre, apellido y correo_institucional son requeridos',
    };
  }

  if (!isAllowedRole(rol)) {
    return {
      ok: false,
      status: 400,
      message: `Rol inválido. Valores permitidos: ${ALLOWED_ROLES.join(', ')}`,
    };
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      status: 400,
      message: `password es requerida y debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
    };
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const usuario = await ModeloUsuario.crearUsuario({
      nombre,
      apellido,
      correo_institucional,
      password_hash,
      rol,
    });
    return { ok: true, status: 201, usuario };
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      return {
        ok: false,
        status: 409,
        message: 'Ya existe un usuario con ese correo_institucional',
      };
    }
    throw error;
  }
}

async function updateUserProfile(id_usuario, body) {
  const current = await ModeloUsuario.encontrarPorId(id_usuario);
  if (!current) {
    return { ok: false, status: 404, message: 'Usuario no encontrado' };
  }

  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : current.nombre;
  const apellido = typeof body.apellido === 'string' ? body.apellido.trim() : current.apellido;
  const correo_institucional =
    typeof body.correo_institucional === 'string'
      ? normalizeCorreo(body.correo_institucional)
      : normalizeCorreo(current.correo_institucional);

  if (!nombre || !apellido || !correo_institucional) {
    return {
      ok: false,
      status: 400,
      message: 'nombre, apellido y correo_institucional no pueden quedar vacíos',
    };
  }

  try {
    const usuario = await ModeloUsuario.actualizarPerfil(
      id_usuario,
      nombre,
      apellido,
      correo_institucional
    );
    return { ok: true, usuario };
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      return {
        ok: false,
        status: 409,
        message: 'Ya existe un usuario con ese correo_institucional',
      };
    }
    throw error;
  }
}

async function updatePassword(id_usuario, password) {
  const user = await ModeloUsuario.encontrarPorId(id_usuario);
  if (!user) {
    return { ok: false, status: 404, message: 'Usuario no encontrado' };
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      status: 400,
      message: `password debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
    };
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await ModeloUsuario.actualizarPasswordHash(id_usuario, hash);
  return { ok: true };
}

async function updateRoles(id_usuario, roles, actorSub) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return { ok: false, status: 400, message: 'Se requiere roles como array no vacío' };
  }

  const rol = typeof roles[0] === 'string' ? roles[0].trim() : '';
  if (!isAllowedRole(rol)) {
    return {
      ok: false,
      status: 400,
      message: `Rol inválido. Valores permitidos: ${ALLOWED_ROLES.join(', ')}`,
    };
  }

  if (actorSub === id_usuario && rol === 'employee') {
    return { ok: false, status: 400, message: 'No puedes quitarte el rol de admin a ti mismo' };
  }

  const gate = await assertCanRemoveAdminPrivileges(id_usuario, rol);
  if (!gate.ok) {
    return gate;
  }

  const usuario = await ModeloUsuario.actualizarRol(id_usuario, rol);
  if (!usuario) {
    return { ok: false, status: 404, message: 'Usuario no encontrado' };
  }
  return { ok: true, usuario };
}

async function deleteUser(id_usuario, actorSub) {
  if (actorSub === id_usuario) {
    return { ok: false, status: 400, message: 'No puedes eliminar tu propio usuario' };
  }

  const target = await ModeloUsuario.encontrarPorId(id_usuario);
  if (!target) {
    return { ok: false, status: 404, message: 'Usuario no encontrado' };
  }

  if (target.rol === 'admin') {
    const adminCount = await ModeloUsuario.contarPorRol('admin');
    if (adminCount <= 1) {
      return {
        ok: false,
        status: 400,
        message: 'No se puede eliminar el último administrador del sistema',
      };
    }
  }

  await ModeloUsuario.eliminarPorId(id_usuario);
  return { ok: true };
}

async function importCsv(users) {
  const summary = { created: 0, updated: 0, rejected: 0 };
  const rows = [];
  const allowHash = allowImportPasswordHash();

  for (let i = 0; i < users.length; i += 1) {
    const raw = users[i] || {};
    const index = i + 1;

    const nombre = typeof raw.nombre === 'string' ? raw.nombre.trim() : '';
    const apellido = typeof raw.apellido === 'string' ? raw.apellido.trim() : '';
    const correo_institucional = normalizeCorreo(raw.correo_institucional);
    const rol = typeof raw.rol === 'string' ? raw.rol.trim() : '';
    const password = typeof raw.password === 'string' ? raw.password : '';
    const password_hash = typeof raw.password_hash === 'string' ? raw.password_hash.trim() : '';

    if (!nombre || !apellido || !correo_institucional || !rol) {
      summary.rejected += 1;
      rows.push({
        index,
        status: 'rejected',
        reason: 'Faltan nombre, apellido, correo_institucional o rol',
      });
      continue;
    }

    if (!isAllowedRole(rol)) {
      summary.rejected += 1;
      rows.push({ index, status: 'rejected', reason: `Rol inválido: ${rol}` });
      continue;
    }

    let resolvedHash = null;
    if (password) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        summary.rejected += 1;
        rows.push({
          index,
          status: 'rejected',
          reason: `Contraseña demasiado corta (mín. ${MIN_PASSWORD_LENGTH})`,
        });
        continue;
      }
      resolvedHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    } else if (password_hash) {
      if (!allowHash) {
        summary.rejected += 1;
        rows.push({
          index,
          status: 'rejected',
          reason: 'password_hash no permitido sin ALLOW_IMPORT_PASSWORD_HASH=true',
        });
        continue;
      }

      if (!looksLikeBcryptHash(password_hash)) {
        summary.rejected += 1;
        rows.push({
          index,
          status: 'rejected',
          reason: 'password_hash no parece un hash bcrypt válido',
        });
        continue;
      }

      resolvedHash = password_hash;
    }

    try {
      const existing = await ModeloUsuario.encontrarPorMail(correo_institucional);
      if (!existing || existing.id_usuario === -1) {
        await ModeloUsuario.crearUsuario({
          nombre,
          apellido,
          correo_institucional,
          password_hash: resolvedHash,
          rol,
        });
        summary.created += 1;
        rows.push({ index, status: 'created' });
        continue;
      }

      if (existing.rol !== rol) {
        const gate = await assertCanRemoveAdminPrivileges(existing.id_usuario, rol);
        if (!gate.ok) {
          summary.rejected += 1;
          rows.push({
            index,
            status: 'rejected',
            reason: gate.message || 'No permitido',
          });
          continue;
        }
      }

      await ModeloUsuario.actualizarPerfil(
        existing.id_usuario,
        nombre,
        apellido,
        correo_institucional
      );

      if (existing.rol !== rol) {
        await ModeloUsuario.actualizarRol(existing.id_usuario, rol);
      }

      if (resolvedHash) {
        await ModeloUsuario.actualizarPasswordHash(existing.id_usuario, resolvedHash);
      }

      summary.updated += 1;
      rows.push({ index, status: 'updated' });
    } catch (error) {
      if (isPgUniqueViolation(error)) {
        summary.rejected += 1;
        rows.push({ index, status: 'rejected', reason: 'Correo duplicado' });
      } else {
        summary.rejected += 1;
        rows.push({
          index,
          status: 'rejected',
          reason: error.message || 'Error al procesar la fila',
        });
      }
    }
  }

  return { summary, rows };
}

module.exports = {
  ALLOWED_ROLES,
  parseId,
  listUsers,
  createUser,
  updateUserProfile,
  updatePassword,
  updateRoles,
  deleteUser,
  importCsv,
};
