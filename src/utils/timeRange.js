/**
 * Utilidades para comparar ventanas de tiempo en formato HH:mm u HH:mm:ss.
 */

function normalizeTimeLabel(t) {
  if (t == null) return '';
  if (typeof t !== 'string' && typeof t !== 'number') return '';
  const trimmed = String(t).trim();
  const parts = trimmed.split(':');
  if (parts.length < 2) return '';
  const h = String(parseInt(parts[0], 10)).padStart(2, '0');
  const m = String(parseInt(parts[1], 10)).padStart(2, '0');
  return `${h}:${m}`;
}

function toMinutes(timeLabel) {
  const n = normalizeTimeLabel(timeLabel);
  if (!n) return NaN;
  const [h, m] = n.split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}

/** Solape inclusivo-estándar: [a0,a1) vs [b0,b1) usa a0 < b1 && b0 < a1 */
function intervalsOverlap(timeStartA, timeEndA, timeStartB, timeEndB) {
  const a0 = toMinutes(timeStartA);
  const a1 = toMinutes(timeEndA);
  const b0 = toMinutes(timeStartB);
  const b1 = toMinutes(timeEndB);
  if ([a0, a1, b0, b1].some((x) => Number.isNaN(x))) return false;
  return a0 < b1 && b0 < a1;
}

function formatFromMinutes(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

module.exports = {
  normalizeTimeLabel,
  toMinutes,
  intervalsOverlap,
  formatFromMinutes,
};
