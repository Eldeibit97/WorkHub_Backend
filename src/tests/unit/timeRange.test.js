'use strict';
/**
 * TC-JAI-09 / TC-JAI-10 — Utilidades de tiempo
 * Cubre: src/utils/timeRange.js
 */
const { normalizeTimeLabel, toMinutes, intervalsOverlap, formatFromMinutes } = require('../../utils/timeRange');

describe('normalizeTimeLabel', () => {
  test('formatea H:m a HH:mm', () => {
    expect(normalizeTimeLabel('9:5')).toBe('09:05');
    expect(normalizeTimeLabel('14:30')).toBe('14:30');
  });
  test('elimina segundos de HH:mm:ss', () => {
    expect(normalizeTimeLabel('08:00:00')).toBe('08:00');
  });
  test('retorna string vacío para null/undefined', () => {
    expect(normalizeTimeLabel(null)).toBe('');
    expect(normalizeTimeLabel(undefined)).toBe('');
  });
  test('retorna string vacío para formato inválido', () => {
    expect(normalizeTimeLabel('abc')).toBe('');
  });
});

describe('toMinutes', () => {
  test('convierte correctamente 08:00 → 480', () => {
    expect(toMinutes('08:00')).toBe(480);
    expect(toMinutes('09:30')).toBe(570);
    expect(toMinutes('00:00')).toBe(0);
  });
  test('retorna NaN para entrada inválida', () => {
    expect(toMinutes('')).toBeNaN();
    expect(toMinutes('invalid')).toBeNaN();
  });
});

describe('intervalsOverlap', () => {
  test('TC-DAV-04: detecta solapamiento', () => {
    expect(intervalsOverlap('08:00', '10:00', '09:00', '11:00')).toBe(true);
  });
  test('TC-DAV-04: intervalos contiguos NO solapan', () => {
    expect(intervalsOverlap('08:00', '09:00', '09:00', '10:00')).toBe(false);
  });
  test('retorna false para tiempos inválidos', () => {
    expect(intervalsOverlap('', '', '', '')).toBe(false);
  });
  test('detecta solapamiento cuando uno contiene al otro', () => {
    expect(intervalsOverlap('08:00', '12:00', '09:00', '11:00')).toBe(true);
  });
});

describe('formatFromMinutes', () => {
  test('convierte minutos a HH:mm', () => {
    expect(formatFromMinutes(480)).toBe('08:00');
    expect(formatFromMinutes(570)).toBe('09:30');
    expect(formatFromMinutes(0)).toBe('00:00');
  });
});
