'use strict';
/**
 * App Express mínima para Supertest.
 * Reemplaza NeonSessionStore y DB para correr sin Neon.
 */

// ── Mocks ANTES de cualquier require que toque Neon ─────────────────────────
jest.mock('../../stores/neonSessionStore', () => {
  const session = require('express-session');
  class NeonSessionStore extends session.Store {
    constructor() { super(); }
    get(sid, cb)          { cb(null, null); }
    set(sid, sess, cb)    { cb(null); }
    destroy(sid, cb)      { cb(null); }
    touch(sid, sess, cb)  { cb(null); }
  }
  return { NeonSessionStore };
});

jest.mock('../../config/db', () => ({ sql: jest.fn() }));

// ── App ──────────────────────────────────────────────────────────────────────
const express = require('express');
const { createSessionMiddleware } = require('../../config/session');

const app = express();
app.use(express.json());
app.use(createSessionMiddleware());

// Rutas reales
app.use('/api/auth',    require('../../routes/auth.routes'));
app.use('/api',         require('../../routes/reservation.routes'));
app.use('/api/admin',   require('../../routes/admin.routes'));
app.use('/api/pp',      require('../../routes/purplePoints.routes'));

app.get('/', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
