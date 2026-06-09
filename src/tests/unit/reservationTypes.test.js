'use strict';
/**
 * TC-DAV-09 — Constantes de tipos de reserva (nuevo en v2)
 * Cubre: src/constants/reservationTypes.js
 */
const { RESERVATION_TYPES } = require('../../constants/reservationTypes');

describe('RESERVATION_TYPES', () => {
  test('contiene INDIVIDUAL y ESTACIONAMIENTO', () => {
    expect(RESERVATION_TYPES.INDIVIDUAL).toBe('INDIVIDUAL');
    expect(RESERVATION_TYPES.ESTACIONAMIENTO).toBe('ESTACIONAMIENTO');
  });
  test('TC-DAV-09: tipo ESTACIONAMIENTO es válido para crear una reserva', () => {
    const tipo = RESERVATION_TYPES.ESTACIONAMIENTO;
    expect(typeof tipo).toBe('string');
    expect(tipo).toBe('ESTACIONAMIENTO');
  });
  test('los valores son strings en mayúsculas', () => {
    for (const val of Object.values(RESERVATION_TYPES)) {
      expect(val).toBe(val.toUpperCase());
    }
  });
});
