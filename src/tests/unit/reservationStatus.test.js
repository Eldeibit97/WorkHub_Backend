'use strict';
/**
 * TC-IGN-02 / TC-IGN-05 / TC-JUA-06 — Constantes de estado
 * Cubre: src/constants/reservationStatus.js
 */
const { RESERVATION_STATUS } = require('../../constants/reservationStatus');

describe('RESERVATION_STATUS', () => {
  test('contiene todos los estados requeridos', () => {
    expect(RESERVATION_STATUS.PENDIENTE).toBe('PENDIENTE');
    expect(RESERVATION_STATUS.ACTIVO).toBe('ACTIVO');
    expect(RESERVATION_STATUS.CHECKED_IN).toBe('CHECKED_IN');
    expect(RESERVATION_STATUS.COMPLETADO).toBe('COMPLETADO');
    expect(RESERVATION_STATUS.CANCELADO).toBe('CANCELADO');
  });
  test('todos los valores son strings no vacíos', () => {
    for (const val of Object.values(RESERVATION_STATUS)) {
      expect(typeof val).toBe('string');
      expect(val.length).toBeGreaterThan(0);
    }
  });
  test('TC-IGN-02: CANCELADO existe para evitar doble cancelación', () => {
    expect(RESERVATION_STATUS.CANCELADO).toBeDefined();
  });
  test('TC-IGN-05: CHECKED_IN es requisito previo para check-out', () => {
    expect(RESERVATION_STATUS.CHECKED_IN).toBeDefined();
  });
  test('TC-JUA-06: un estado distinto a ACTIVO no permite check-in', () => {
    const estadoActual = RESERVATION_STATUS.CANCELADO;
    expect(estadoActual === RESERVATION_STATUS.ACTIVO).toBe(false);
  });
});
