'use strict';
/**
 * TC-JAI-03 / TC-JAI-04 / TC-HEC-07 — Endpoints admin: acceso y roles
 * Cubre: GET /api/admin/users, GET /api/admin/roles
 */
jest.mock('../../config/db', () => ({ sql: jest.fn() }));
jest.mock('../../models/modeloUsuario');
jest.mock('../../services/purplePoints.service', () => ({
  earnForCreate: jest.fn(), earnForCheckout: jest.fn(),
}));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({}) })),
}));
jest.mock('../../services/adminUsers.service', () => ({
  listUsers:    jest.fn(),
  createUser:   jest.fn(),
  parseId:      jest.fn(),
  ALLOWED_ROLES: ['admin', 'employee'],
}));
jest.mock('../../services/admin.service', () => ({
  assignPassword: jest.fn(),
  MIN_PASSWORD_LENGTH: 8,
}));
jest.mock('../../services/adminStats.service', () => ({
  getAdminStats:          jest.fn(),
  getNoShowHeatmap:       jest.fn(),
  getNoShowFloorHeatmap:  jest.fn(),
  getNoShowByUser:        jest.fn(),
}));
jest.mock('../../services/adminReservations.service', () => ({
  listReservations:   jest.fn(),
  cancelReservation:  jest.fn(),
}));
jest.mock('../../services/floorLayout.service', () => ({
  saveFloorLayout: jest.fn(),
}));

const request          = require('supertest');
const jwt              = require('jsonwebtoken');
const adminUsersService = require('../../services/adminUsers.service');
const app              = require('./testApp');

const makeToken = (rol, id = 1) =>
  jwt.sign({ sub: id, correo: `${rol}@acn.com`, rol },
    process.env.JWT_SECRET, { expiresIn: '1h' });

describe('GET /api/admin/users', () => {
  beforeEach(() => jest.clearAllMocks());

  test('TC-HEC-07 / TC-JAI-04: sin token → 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  test('TC-JAI-04: rol employee → 403', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${makeToken('employee', 2)}`);
    expect(res.status).toBe(403);
  });

  test('TC-JAI-03: admin → 200 con lista de usuarios', async () => {
    adminUsersService.listUsers.mockResolvedValue({
      ok: true,
      data: { users: [{ id_usuario: 1, nombre: 'Admin', rol: 'admin' }], total: 1 },
    });
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${makeToken('admin', 1)}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/admin/roles', () => {
  test('TC-JAI-03: admin → 200 con catálogo de roles', async () => {
    const res = await request(app)
      .get('/api/admin/roles')
      .set('Authorization', `Bearer ${makeToken('admin', 1)}`);
    expect(res.status).toBe(200);
    expect(res.body.roles).toBeDefined();
    expect(Array.isArray(res.body.roles)).toBe(true);
  });

  test('TC-JAI-04: employee → 403', async () => {
    const res = await request(app)
      .get('/api/admin/roles')
      .set('Authorization', `Bearer ${makeToken('employee', 2)}`);
    expect(res.status).toBe(403);
  });

  test('TC-HEC-07: sin token → 401', async () => {
    const res = await request(app).get('/api/admin/roles');
    expect(res.status).toBe(401);
  });
});
