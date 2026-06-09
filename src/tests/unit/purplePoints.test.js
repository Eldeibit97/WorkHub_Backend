'use strict';
/**
 * TC-HEC-10 (gamificación) — Purple Points: lógica de cálculo de puntos
 * Cubre: src/constants/purplePointTypes.js
 */
const { PP_TYPES, EARN_AMOUNTS, earnAmount } = require('../../constants/purplePointTypes');

describe('Purple Points — earnAmount', () => {
  test('EARN_CREATE para INDIVIDUAL da 50 puntos', () => {
    expect(earnAmount(PP_TYPES.EARN_CREATE, 'INDIVIDUAL')).toBe(50);
  });
  test('EARN_CREATE para ESTACIONAMIENTO da 30 puntos', () => {
    expect(earnAmount(PP_TYPES.EARN_CREATE, 'ESTACIONAMIENTO')).toBe(30);
  });
  test('EARN_CHECKOUT para INDIVIDUAL da 25 puntos', () => {
    expect(earnAmount(PP_TYPES.EARN_CHECKOUT, 'INDIVIDUAL')).toBe(25);
  });
  test('EARN_CHECKOUT para ESTACIONAMIENTO da 15 puntos', () => {
    expect(earnAmount(PP_TYPES.EARN_CHECKOUT, 'ESTACIONAMIENTO')).toBe(15);
  });
  test('tipo desconocido usa fallback INDIVIDUAL', () => {
    expect(earnAmount(PP_TYPES.EARN_CREATE, 'DESCONOCIDO')).toBe(50);
  });
  test('tipo de transacción inválido retorna 0', () => {
    expect(earnAmount('TIPO_INVALIDO', 'INDIVIDUAL')).toBe(0);
  });
  test('PP_TYPES contiene todos los tipos esperados', () => {
    expect(PP_TYPES.EARN_CREATE).toBeDefined();
    expect(PP_TYPES.EARN_CHECKOUT).toBeDefined();
    expect(PP_TYPES.PURCHASE).toBeDefined();
    expect(PP_TYPES.ADMIN_ADJUST).toBeDefined();
  });
  test('EARN_AMOUNTS tiene estructura correcta', () => {
    expect(EARN_AMOUNTS.EARN_CREATE.INDIVIDUAL).toBe(50);
    expect(EARN_AMOUNTS.EARN_CHECKOUT.INDIVIDUAL).toBe(25);
  });
});
