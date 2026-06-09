'use strict';
/**
 * TC-HEC-03 / TC-HEC-04 / TC-HEC-05 / TC-HEC-07 — Endpoints de autenticación
 * Cubre: POST /api/auth/login, GET /api/auth/me
 */
jest.mock('../../config/db', () => ({ sql: jest.fn() }));
jest.mock('../../models/modeloUsuario');
jest.mock('../../services/purplePoints.service', () => ({
  earnForCreate:   jest.fn().mockResolvedValue({}),
  earnForCheckout: jest.fn().mockResolvedValue({}),
}));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({}) })),
}));

const request       = require('supertest');
const bcrypt        = require('bcryptjs');
const jwt           = require('jsonwebtoken');
const ModeloUsuario = require('../../models/modeloUsuario');
const app           = require('./testApp');

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('TC-HEC-03: credenciales válidas → 200 + token + rol', async () => {
    const hash = await bcrypt.hash('Password1!', 10);
    ModeloUsuario.encontrarPorMail.mockResolvedValue({
      id_usuario: 1, correo_institucional: 'admin@acn.com',
      nombre: 'Admin', apellido: 'Test', rol: 'admin', password_hash: hash,
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo_institucional: 'admin@acn.com', password: 'Password1!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.rol).toBe('admin');
  });

  test('TC-HEC-04: contraseña incorrecta → 401', async () => {
    const hash = await bcrypt.hash('correcta', 10);
    ModeloUsuario.encontrarPorMail.mockResolvedValue({
      id_usuario: 2, correo_institucional: 'emp@acn.com',
      nombre: 'Emp', apellido: 'Test', rol: 'employee', password_hash: hash,
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo_institucional: 'emp@acn.com', password: 'incorrecta' });
    expect(res.status).toBe(401);
  });

  test('TC-HEC-04: usuario inexistente → 401', async () => {
    ModeloUsuario.encontrarPorMail.mockResolvedValue({ id_usuario: -1 });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo_institucional: 'noexiste@acn.com', password: 'algo' });
    expect(res.status).toBe(401);
  });

  test('sin body → 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  test('TC-HEC-05: sin token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('TC-HEC-05: token válido → 200 con datos del usuario', async () => {
    const token = jwt.sign(
      { sub: 1, correo: 'admin@acn.com', rol: 'admin' },
      process.env.JWT_SECRET, { expiresIn: '1h' }
    );
    ModeloUsuario.encontrarPorId = jest.fn().mockResolvedValue({
      id_usuario: 1, correo_institucional: 'admin@acn.com',
      nombre: 'Admin', apellido: 'Test', rol: 'admin',
    });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.rol).toBe('admin');
  });
});
