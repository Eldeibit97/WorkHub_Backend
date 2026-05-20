/** PostgreSQL `integer` (int4) — ids de PK/FK deben caber aquí. */
const MAX_PG_INT = 2147483647;

function isValidPgInt32(n) {
  const x = Number(n);
  return Number.isFinite(x) && Number.isInteger(x) && x > 0 && x <= MAX_PG_INT;
}

function parsePgIntId(raw) {
  if (raw === undefined || raw === null || raw === '') return NaN;
  const x = parseInt(String(raw), 10);
  return isValidPgInt32(x) ? x : NaN;
}

module.exports = { MAX_PG_INT, isValidPgInt32, parsePgIntId };
