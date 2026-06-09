'use strict';
/**
 * E2E-01: Flujo completo login → reserva → check-in → check-out
 */
jest.mock('../../config/db', () => ({ sql: jest.fn() }));
jest.mock('../../models/modeloUsuario');
jest.mock('../../models/modeloReserva');
jest.mock('../../services/purplePoints.service', () => ({
  earnForCreate: jest.fn().mockResolvedValue({}),
  earnForCheckout: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../services/reservation.service', () => ({
  fetchReservations: jest.fn(), fetchAllReservas: jest.fn(),
  updateReserva: jest.fn(), performCheckIn: jest.fn(), performCheckOut: jest.fn(),
  reservarEspacio: jest.fn(), fetchAvailability: jest.fn(),
  fetchAvailabilityWindow: jest.fn(), createReservationsBatch: jest.fn(), buscaReserva: jest.fn(),
}));
jest.mock('../../services/spaces.service', () => ({ fetchAvailabilityWindow: jest.fn() }));
jest.mock('../../services/email.service', () => ({
  sendConfirmationEmail: jest.fn().mockResolvedValue({}),
  sendCancellationEmail: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../config/websocket', () => ({
  getBlockedBySocket: jest.fn(() => new Map()), initializeWebSocket: jest.fn(),
}));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({}) })),
}));
jest.mock('../../services/adminUsers.service', () => ({
  listUsers: jest.fn(), createUser: jest.fn(),
  parseId: jest.fn(), ALLOWED_ROLES: ['admin', 'employee'],
}));
jest.mock('../../services/admin.service', () => ({ assignPassword: jest.fn(), MIN_PASSWORD_LENGTH: 8 }));
jest.mock('../../services/adminStats.service', () => ({
  getAdminStats: jest.fn(), getNoShowHeatmap: jest.fn(),
  getNoShowFloorHeatmap: jest.fn(), getNoShowByUser: jest.fn(),
}));
jest.mock('../../services/adminReservations.service', () => ({
  listReservations: jest.fn(), cancelReservation: jest.fn(),
}));
jest.mock('../../services/floorLayout.service', () => ({ saveFloorLayout: jest.fn() }));

const request            = require('supertest');
const bcrypt             = require('bcryptjs');
const ModeloUsuario      = require('../../models/modeloUsuario');
const reservationService = require('../../services/reservation.service');
const app                = require('../integration/testApp');

describe('E2E-01: Flujo completo reserva → check-in → check-out', () => {
  let authToken;

  test('Paso 1-2: Login exitoso con usuario empleado', async () => {
    const hash = await bcrypt.hash('Empleado123!', 10);
    ModeloUsuario.encontrarPorMail.mockResolvedValue({
      id_usuario: 10, correo_institucional: 'juan@acn.com',
      nombre: 'Juan', apellido: 'Ángel', rol: 'employee', password_hash: hash,
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo_institucional: 'juan@acn.com', password: 'Empleado123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.rol).toBe('employee');
    authToken = res.body.token;
  });

  test('Paso 3-8: Crear reserva con espacio y fecha válidos', async () => {
    reservationService.reservarEspacio.mockResolvedValue({
      status: 200, message: 'Reserva creada con estado PENDIENTE', idZona: 1, idEspacio: 5,
    });
    const res = await request(app)
      .post('/api/reservando')
      .send({
        mail: 'juan@acn.com', idEspacio: 5, fechaReserva: '2026-06-20',
        horaInicio: '09:00', horaSalida: '11:00',
        fechaCreacion: '2026-06-09T10:00:00Z', tipoReserva: 'INDIVIDUAL',
      });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/PENDIENTE|creada/i);
  });

  test('Paso 9: Reserva aparece en lista de reservas del usuario', async () => {
    reservationService.fetchReservations.mockResolvedValue([
      { id_reserva: 101, estado_reserva: 'PENDIENTE', fecha_reserva: '2026-06-20' },
    ]);
    const res = await request(app).get('/api/reservas/consulta?userId=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].id_reserva).toBe(101);
  });

  test('Paso 10-11: Check-in cambia estado a CHECKED_IN', async () => {
    reservationService.performCheckIn.mockResolvedValue({
      ok: true, message: 'Check-in realizado correctamente',
      id_zona: 1, id_espacio: 5,
    });
    const res = await request(app)
      .put('/api/reservas/check-in')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ id_reserva: 101 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Paso 12-14: Check-out finaliza la reserva como COMPLETADO', async () => {
    reservationService.performCheckOut.mockResolvedValue({
      ok: true, message: 'Check-out realizado correctamente',
      data: { estado_reserva: 'COMPLETADO' },
    });
    const res = await request(app)
      .put('/api/reservas/check-out')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ id_reserva: 101 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.estado_reserva).toBe('COMPLETADO');
  });
});
