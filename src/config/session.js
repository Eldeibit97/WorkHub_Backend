const session = require('express-session');
const pg = require('pg');
const connectPgSimple = require('connect-pg-simple')(session);

/** Nombre de cookie alineado con documentación para el frontend. */
const SESSION_COOKIE_NAME = 'workhub.sid';

function parseSessionMaxAgeMs() {
  const raw = process.env.SESSION_MAX_AGE_MS;
  const ms = raw ? parseInt(String(raw), 10) : NaN;
  if (Number.isFinite(ms) && ms > 0) {
    return ms;
  }
  return 8 * 60 * 60 * 1000;
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function sessionCookieOptions() {
  const prod = isProduction();
  const sameSiteEnv = process.env.SESSION_COOKIE_SAMESITE;
  let sameSite = prod ? 'none' : 'lax';
  if (sameSiteEnv === 'lax' || sameSiteEnv === 'strict' || sameSiteEnv === 'none') {
    sameSite = sameSiteEnv;
  }
  let secure = prod;
  if (process.env.SESSION_COOKIE_SECURE === 'true') {
    secure = true;
  }
  if (process.env.SESSION_COOKIE_SECURE === 'false') {
    secure = false;
  }
  if (sameSite === 'none') {
    secure = true;
  }
  return {
    httpOnly: true,
    maxAge: parseSessionMaxAgeMs(),
    secure,
    sameSite,
    path: '/',
  };
}

/**
 * Pool dedicado para el store de sesiones (connect-pg-simple).
 * No reutilizar el cliente Neon serverless `sql` aquí.
 */
function createSessionPool() {
  return new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

function createSessionMiddleware() {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || String(sessionSecret).trim() === '') {
    throw new Error(
      'SESSION_SECRET no está definido. Añádelo a .env (cadena aleatoria, distinta de JWT_SECRET).'
    );
  }

  const pool = createSessionPool();
  const store = new connectPgSimple({
    pool,
    createTableIfMissing: true,
    tableName: 'session',
  });

  const cookie = sessionCookieOptions();

  return session({
    name: SESSION_COOKIE_NAME,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store,
    cookie,
  });
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function assignUserToSession(req, user) {
  req.session.userId = user.id_usuario;
  req.session.correo = user.correo_institucional;
  req.session.rol = user.rol;
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

module.exports = {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  createSessionMiddleware,
  regenerateSession,
  assignUserToSession,
  destroySession,
};
