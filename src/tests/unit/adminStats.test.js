'use strict';
/**
 * TC-JAI-09 / TC-JAI-10 / TC-ULI-03 / TC-ULI-04 — resolveWindow (adminStats)
 * Cubre lógica pura extraída de src/services/adminStats.service.js
 */
jest.mock('../../config/db', () => ({ sql: jest.fn() }));

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseISODateOnly(raw) {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(`${t}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function toISODate(d) { return d.toISOString().slice(0, 10); }
function addDays(d, n) { return new Date(d.getTime() + n * MS_PER_DAY); }

function resolveWindow(fromRaw, toRaw) {
  const from = fromRaw === undefined ? null : parseISODateOnly(fromRaw);
  const to   = toRaw   === undefined ? null : parseISODateOnly(toRaw);
  if ((fromRaw !== undefined && !from) || (toRaw !== undefined && !to))
    return { ok: false, status: 422, message: 'from/to deben tener formato YYYY-MM-DD' };
  const today = parseISODateOnly(toISODate(new Date()));
  const effectiveTo   = to   || today;
  const effectiveFrom = from || addDays(effectiveTo, -29);
  if (effectiveFrom > effectiveTo)
    return { ok: false, status: 422, message: '`from` no puede ser mayor que `to`' };
  return {
    ok: true,
    effectiveFrom: toISODate(effectiveFrom),
    effectiveTo:   toISODate(effectiveTo),
    barStart: toISODate(addDays(effectiveTo, -6)),
    barEnd:   toISODate(effectiveTo),
  };
}

describe('resolveWindow (adminStats)', () => {
  test('TC-JAI-09: fechas explícitas → ventana válida', () => {
    const r = resolveWindow('2026-05-01', '2026-05-31');
    expect(r.ok).toBe(true);
    expect(r.effectiveFrom).toBe('2026-05-01');
    expect(r.effectiveTo).toBe('2026-05-31');
  });
  test('TC-JAI-10: sin parámetros → ventana de 30 días', () => {
    const r = resolveWindow(undefined, undefined);
    expect(r.ok).toBe(true);
    const diff = (new Date(r.effectiveTo) - new Date(r.effectiveFrom)) / MS_PER_DAY;
    expect(diff).toBe(29);
  });
  test('TC-ULI-03: from > to → error 422', () => {
    const r = resolveWindow('2026-06-30', '2026-06-01');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
  });
  test('TC-ULI-04: formato inválido → error 422', () => {
    const r = resolveWindow('06/01/2026', undefined);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
  });
  test('TC-JAI-01: barStart es exactamente 6 días antes de barEnd', () => {
    const r = resolveWindow('2026-05-01', '2026-05-31');
    const diff = (new Date(r.barEnd) - new Date(r.barStart)) / MS_PER_DAY;
    expect(diff).toBe(6);
  });
});
