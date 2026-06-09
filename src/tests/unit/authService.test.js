'use strict';
/**
 * TC-HEC-03 / TC-HEC-04 / TC-HEC-05 — Servicio de autenticación (mock DB)
 * Cubre: src/services/auth.service.js
 */
jest.mock('../../config/db', () => ({ sql: jest.fn() }));
jest.mock('../../models/modeloUsuario');

const ModeloUsuario = require('../../models/modeloUsuario');
const authService   = require('../../services/auth.service');

describe('auth.service — login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('TC-HEC-04: usuario inexistente → 401', async () => {
    ModeloUsuario.encontrarPorMail.mockResolvedValue({ id_usuario: -1 });
    const result = await authService.login('noexiste@acn.com', 'cualquier');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });

  test('TC-HEC-04: contraseña incorrecta → 401', async () => {
    const bcrypt = require('bcryptjs');
    const hash   = await bcrypt.hash('correcta', 10);
    ModeloUsuario.encontrarPorMail.mockResolvedValue({
      id_usuario: 2, correo_institucional: 'test@acn.com',
      nombre: 'Test', apellido: 'User', rol: 'employee', password_hash: hash,
    });
    const result = await authService.login('test@acn.com', 'incorrecta');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });

  test('TC-HEC-03: credenciales válidas → token + usuario sin password_hash', async () => {
    const bcrypt = require('bcryptjs');
    const hash   = await bcrypt.hash('Password1!', 10);
    ModeloUsuario.encontrarPorMail.mockResolvedValue({
      id_usuario: 42, correo_institucional: 'jaime@acn.com',
      nombre: 'Jaime', apellido: 'Gámez', rol: 'admin', password_hash: hash,
    });
    const result = await authService.login('jaime@acn.com', 'Password1!');
    expect(result.ok).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.user.correo_institucional).toBe('jaime@acn.com');
    expect(result.user.rol).toBe('admin');
    expect(result.user.password_hash).toBeUndefined();
  });

  test('TC-HEC-05: el token es verificable con JWT_SECRET e incluye rol', async () => {
    const jwt    = require('jsonwebtoken');
    const bcrypt = require('bcryptjs');
    const hash   = await bcrypt.hash('Password1!', 10);
    ModeloUsuario.encontrarPorMail.mockResolvedValue({
      id_usuario: 42, correo_institucional: 'jaime@acn.com',
      nombre: 'Jaime', apellido: 'Gámez', rol: 'admin', password_hash: hash,
    });
    const result  = await authService.login('jaime@acn.com', 'Password1!');
    const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
    expect(decoded.correo).toBe('jaime@acn.com');
    expect(decoded.rol).toBe('admin');
    expect(decoded.sub).toBe(42);
  });

  test('cuenta sin password_hash → 403', async () => {
    ModeloUsuario.encontrarPorMail.mockResolvedValue({
      id_usuario: 5, correo_institucional: 'sin@acn.com',
      nombre: 'Sin', apellido: 'Pass', rol: 'employee', password_hash: null,
    });
    const result = await authService.login('sin@acn.com', 'algo');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });
});
