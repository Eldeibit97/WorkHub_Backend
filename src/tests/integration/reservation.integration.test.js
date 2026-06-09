'use strict';
/**
 * TC-DAV-01/02/03/04/09 / TC-IGN-01/04 / TC-JAI-01/02 / TC-JUA-03/04/05/08
 * TC-ULI-01/02/03 — Endpoints de reservas
 */
jest.mock('../../config/db', () => ({ sql: jest.fn() }));
jest.mock('../../models/modeloUsuario');
jest.mock('../../models/modeloReserva');
jest.mock('../../services/purplePoints.service', () => ({
  earnForCreate:   jest.fn().mockResolvedValue({}),
  earnForCheckout: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../services/reservation.service', () => ({
  fetchReservations:       jest.fn(),
  fetchAllReservas:        jest.fn(),
  updateReserva:           jest.fn(),
  performCheckIn:          jest.fn(),
  performCheckOut:         jest.fn(),
  reservarEspacio:         jest.fn(),
  fetchAvailability:       jest.fn(),
  fetchAvailabilityWindow: jest.fn(),
  createReservationsBatch: jest.fn(),
  buscaReserva:            jest.fn(),
}));
jest.mock('../../services/spaces.service', () => ({
  fetchAvailabilityWindow: jest.fn(),
}));
jest.mock('../../services/email.service', () => ({
  sendConfirmationEmail: jest.fn().mockResolvedValue({}),
  sendCancellationEmail: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../config/websocket', () => ({
  getBlockedBySocket:   jest.fn(() => new Map()),
  initializeWebSocket:  jest.fn(),
}));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({}) })),
}));
// Mocks de admin (necesarios porque testApp monta admin.routes)
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
const jwt                = require('jsonwebtoken');
const reservationService = require('../../services/reservation.service');
const app                = require('./testApp');

const makeToken = (rol = 'employee', id = 5) =>
  jwt.sign({ sub: id, correo: 'test@acn.com', rol },
    process.env.JWT_SECRET, { expiresIn: '1h' });

// ── TC-JAI-01 ────────────────────────────────────────────────────────────────
describe('TC-JAI-01: Conexión del backend con la base de datos', () => {
  test('módulo de DB exporta la función sql', () => {
    const db = require('../../config/db');
    expect(db).toBeDefined();
    expect(typeof db.sql).toBe('function');
  });
  test('la app responde en la ruta raíz', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ── TC-JAI-02 ────────────────────────────────────────────────────────────────
describe('TC-JAI-02: Insertar reserva y validar persistencia', () => {
  test('reservarEspacio es invocado con los datos correctos', async () => {
    reservationService.reservarEspacio.mockResolvedValue({
      status: 200, message: 'Reserva creada con estado PENDIENTE', idZona: 1, idEspacio: 3,
    });
    await request(app).post('/api/reservando').send({
      mail: 'juan@acn.com', idEspacio: 3,
      fechaReserva: '2026-06-25', horaInicio: '09:00',
      horaSalida: '11:00', fechaCreacion: '2026-06-09T10:00:00Z', tipoReserva: 'INDIVIDUAL',
    });
    expect(reservationService.reservarEspacio).toHaveBeenCalledTimes(1);
    const args = reservationService.reservarEspacio.mock.calls[0][0];
    expect(args.idEspacio).toBe(3);
    expect(args.fechaReserva).toBe('2026-06-25');
  });
  test('respuesta incluye mensaje de confirmación de reserva', async () => {
    reservationService.reservarEspacio.mockResolvedValue({
      status: 200, message: 'Reserva creada con estado PENDIENTE', idZona: 1, idEspacio: 3,
    });
    const res = await request(app).post('/api/reservando').send({
      mail: 'juan@acn.com', idEspacio: 3,
      fechaReserva: '2026-06-25', horaInicio: '09:00',
      horaSalida: '11:00', fechaCreacion: '2026-06-09T10:00:00Z', tipoReserva: 'INDIVIDUAL',
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/PENDIENTE|creada/i);
  });
});

// ── TC-DAV-01 / TC-DAV-02 / TC-DAV-03 ───────────────────────────────────────
describe('TC-DAV-01/02/03: Crear reserva — casos válidos e inválidos', () => {
  beforeEach(() => jest.clearAllMocks());

  test('TC-DAV-01: crea reserva con datos completos → 200', async () => {
    reservationService.reservarEspacio.mockResolvedValue({
      status: 200, message: 'Reserva creada', idZona: 2, idEspacio: 7,
    });
    const res = await request(app).post('/api/reservando').send({
      mail: 'david@acn.com', idEspacio: 7, fechaReserva: '2026-06-20',
      horaInicio: '10:00', horaSalida: '12:00',
      fechaCreacion: '2026-06-09T08:00:00Z', tipoReserva: 'INDIVIDUAL',
    });
    expect(res.status).toBe(200);
  });

  test('TC-DAV-02: sin idEspacio → 400', async () => {
    const res = await request(app).post('/api/reservando').send({
      mail: 'david@acn.com', fechaReserva: '2026-06-20',
      horaInicio: '10:00', horaSalida: '12:00', fechaCreacion: '2026-06-09T08:00:00Z',
    });
    expect(res.status).toBe(400);
  });

  test('TC-DAV-03: sin fechaReserva → 400', async () => {
    const res = await request(app).post('/api/reservando').send({
      mail: 'david@acn.com', idEspacio: 7,
      horaInicio: '10:00', horaSalida: '12:00', fechaCreacion: '2026-06-09T08:00:00Z',
    });
    expect(res.status).toBe(400);
  });
});

// ── TC-DAV-04 ────────────────────────────────────────────────────────────────
describe('TC-DAV-04: Evitar doble reserva en horario ocupado', () => {
  test('servicio retorna 409 → controller lo propaga', async () => {
    reservationService.reservarEspacio.mockResolvedValue({
      status: 409, message: 'El espacio ya está reservado en ese horario',
    });
    const res = await request(app).post('/api/reservando').send({
      mail: 'david@acn.com', idEspacio: 3, fechaReserva: '2026-06-20',
      horaInicio: '09:00', horaSalida: '11:00',
      fechaCreacion: '2026-06-09T10:00:00Z', tipoReserva: 'INDIVIDUAL',
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/reservado|ocupado/i);
  });
  test('intervalsOverlap detecta solapamiento antes de llegar a DB', () => {
    const { intervalsOverlap } = require('../../utils/timeRange');
    expect(intervalsOverlap('09:00', '11:00', '10:00', '12:00')).toBe(true);
  });
});

// ── TC-DAV-09 ────────────────────────────────────────────────────────────────
describe('TC-DAV-09: Crear reserva de estacionamiento', () => {
  beforeEach(() => jest.clearAllMocks());

  test('tipoReserva ESTACIONAMIENTO es aceptado y llega al servicio', async () => {
    reservationService.reservarEspacio.mockResolvedValue({
      status: 200, message: 'Reserva de estacionamiento creada', idZona: 5, idEspacio: 20,
    });
    const res = await request(app).post('/api/reservando').send({
      mail: 'david@acn.com', idEspacio: 20, fechaReserva: '2026-06-21',
      horaInicio: '08:00', horaSalida: '18:00',
      fechaCreacion: '2026-06-09T10:00:00Z', tipoReserva: 'ESTACIONAMIENTO',
    });
    expect(res.status).toBe(200);
    const args = reservationService.reservarEspacio.mock.calls[0][0];
    expect(args.tipoReserva).toBe('ESTACIONAMIENTO');
  });

  test('estacionamiento ocupado → 409', async () => {
    reservationService.reservarEspacio.mockResolvedValue({
      status: 409, message: 'El espacio de estacionamiento ya está reservado',
    });
    const res = await request(app).post('/api/reservando').send({
      mail: 'otro@acn.com', idEspacio: 20, fechaReserva: '2026-06-21',
      horaInicio: '08:00', horaSalida: '18:00',
      fechaCreacion: '2026-06-09T11:00:00Z', tipoReserva: 'ESTACIONAMIENTO',
    });
    expect(res.status).toBe(409);
  });
});

// ── TC-JUA-03 / TC-JUA-04 ────────────────────────────────────────────────────
describe('TC-JUA-03 / TC-JUA-04: Consultar reservas activas e historial', () => {
  beforeEach(() => jest.clearAllMocks());

  test('TC-JUA-03: reservas activas del usuario → array', async () => {
    reservationService.fetchReservations.mockResolvedValue([
      { id_reserva: 1, estado_reserva: 'ACTIVO' },
    ]);
    const res = await request(app).get('/api/reservas/consulta?userId=5&status=ACTIVO');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('TC-JUA-04: historial de reservas completadas → array', async () => {
    reservationService.fetchReservations.mockResolvedValue([
      { id_reserva: 2, estado_reserva: 'COMPLETADO' },
    ]);
    const res = await request(app).get('/api/reservas/consulta?userId=5&status=COMPLETADO');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('sin userId → 400', async () => {
    const res = await request(app).get('/api/reservas/consulta');
    expect(res.status).toBe(400);
  });
});

// ── TC-JUA-05 ────────────────────────────────────────────────────────────────
describe('TC-JUA-05: Check-in dentro del periodo permitido', () => {
  test('performCheckIn exitoso → 200', async () => {
    reservationService.performCheckIn.mockResolvedValue({
      ok: true, message: 'Check-in realizado correctamente',
      id_zona: 1, id_espacio: 3,
    });
    const res = await request(app)
      .put('/api/reservas/check-in')
      .send({ id_reserva: 1 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  test('TC-JUA-06: sin id_reserva → 400', async () => {
    const res = await request(app).put('/api/reservas/check-in').send({});
    expect(res.status).toBe(400);
  });
});

// ── TC-IGN-01 / TC-IGN-04 ────────────────────────────────────────────────────
describe('TC-IGN-01: Cancelar reserva pendiente', () => {
  const bodyBase = {
    id_reserva: 15, id_usuario: 5, fecha_reserva: '2026-06-22',
    hora_inicio: '09:00', hora_fin: '11:00',
    estado_reserva: 'CANCELADO', tipo_reserva: 'INDIVIDUAL',
  };
  test('TC-IGN-01: actualizar a CANCELADO → 200', async () => {
    reservationService.updateReserva.mockResolvedValue({
      ok: true, message: 'Reserva cancelada correctamente',
    });
    const res = await request(app).put('/api/reservas/update').send(bodyBase);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  test('TC-IGN-04: check-out (performCheckOut) → 200', async () => {
    reservationService.performCheckOut.mockResolvedValue({
      ok: true, message: 'Check-out realizado', data: {},
    });
    const res = await request(app).put('/api/reservas/check-out').send({ id_reserva: 15 });
    expect(res.status).toBe(200);
  });
  test('PUT update sin campos requeridos → 400', async () => {
    const res = await request(app).put('/api/reservas/update').send({ id_reserva: 15 });
    expect(res.status).toBe(400);
  });
  test('TC-ULI-03: servicio bloquea modificación → 422', async () => {
    reservationService.updateReserva.mockResolvedValue({
      ok: false, status: 422, message: 'No se puede modificar: límite de tiempo superado',
    });
    const res = await request(app).put('/api/reservas/update').send(bodyBase);
    expect(res.status).toBe(422);
  });
});

// ── TC-ULI-01 / TC-ULI-02 ────────────────────────────────────────────────────
describe('TC-ULI-01 / TC-ULI-02: Modificar fecha y espacio de reserva pendiente', () => {
  const bodyBase = {
    id_reserva: 15, id_usuario: 5, fecha_reserva: '2026-06-22',
    hora_inicio: '09:00', hora_fin: '11:00',
    estado_reserva: 'PENDIENTE', tipo_reserva: 'INDIVIDUAL',
  };
  beforeEach(() => jest.clearAllMocks());

  test('TC-ULI-01: nueva fecha → 200', async () => {
    reservationService.updateReserva.mockResolvedValue({
      ok: true, message: 'Reserva actualizada',
    });
    const res = await request(app).put('/api/reservas/update')
      .send({ ...bodyBase, fecha_reserva: '2026-06-28' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('TC-ULI-02: nuevo espacio → 200', async () => {
    reservationService.updateReserva.mockResolvedValue({
      ok: true, message: 'Espacio actualizado',
    });
    const res = await request(app).put('/api/reservas/update')
      .send({ ...bodyBase, id_espacio: 9 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ── TC-JUA-08 ────────────────────────────────────────────────────────────────
describe('TC-JUA-08: Crear reserva múltiple (batch)', () => {
  test('batch con token → 201 + IDs', async () => {
    const svc = require('../../services/reservation.service');
    svc.createReservationsBatch.mockResolvedValue({
      ok: true, ids: [101, 102, 103],
    });
    const res = await request(app)
      .post('/api/reservas/batch')
      .set('Authorization', `Bearer ${makeToken('employee', 5)}`)
      .send({
        reservas: [
          { idEspacio: 1, fechaReserva: '2026-06-20', horaInicio: '09:00', horaSalida: '11:00' },
          { idEspacio: 2, fechaReserva: '2026-06-20', horaInicio: '09:00', horaSalida: '11:00' },
          { idEspacio: 3, fechaReserva: '2026-06-20', horaInicio: '09:00', horaSalida: '11:00' },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.creadas).toBe(3);
    expect(res.body.ids).toEqual([101, 102, 103]);
  });

  test('batch sin token → 401', async () => {
    const res = await request(app).post('/api/reservas/batch').send({ reservas: [] });
    expect(res.status).toBe(401);
  });
});
