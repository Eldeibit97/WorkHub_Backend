const { sql } = require('../config/db');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function clampCount(value) {
  const n = Number(value) || 0;
  return n < 0 ? 0 : n;
}

function parseISODateOnly(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function build7DaySeriesMap(rows) {
  const map = new Map();
  for (const row of rows) {
    map.set(row.date, clampCount(row.count));
  }
  return map;
}

function resolveWindow(fromRaw, toRaw) {
  const from = fromRaw === undefined ? null : parseISODateOnly(fromRaw);
  const to = toRaw === undefined ? null : parseISODateOnly(toRaw);

  if ((fromRaw !== undefined && !from) || (toRaw !== undefined && !to)) {
    return { ok: false, status: 422, message: 'from/to deben tener formato YYYY-MM-DD' };
  }

  const today = parseISODateOnly(toISODate(new Date()));
  const effectiveTo = to || today;
  const effectiveFrom = from || addDays(effectiveTo, -29);

  if (effectiveFrom > effectiveTo) {
    return { ok: false, status: 422, message: '`from` no puede ser mayor que `to`' };
  }

  const barEnd = effectiveTo;
  const barStart = addDays(barEnd, -6);

  return {
    ok: true,
    effectiveFrom: toISODate(effectiveFrom),
    effectiveTo: toISODate(effectiveTo),
    barStart: toISODate(barStart),
    barEnd: toISODate(barEnd),
  };
}

async function getAdminStats({ from, to }) {
  const window = resolveWindow(from, to);
  if (!window.ok) return window;

  const [usersCount] = await sql`SELECT COUNT(*)::int AS users FROM "Usuario"`;
  const [activeCount] = await sql`
    SELECT COUNT(*)::int AS active
      FROM "Reserva"
     WHERE estado_reserva IN ('ACTIVO', 'CHECKED_IN')
  `;
  const [availableCount] = await sql`
    SELECT COUNT(*)::int AS available
      FROM "Espacio"
     WHERE activo = TRUE AND estado_actual = 'DISPONIBLE'
  `;
  const [cancelledCount] = await sql`
    SELECT COUNT(*)::int AS cancelled
      FROM "Reserva"
     WHERE estado_reserva = 'CANCELADO'
  `;

  const reservationsByStatusRaw = await sql`
    SELECT estado_reserva AS status, COUNT(*)::int AS count
      FROM "Reserva"
     WHERE DATE(fecha_reserva) BETWEEN ${window.effectiveFrom}::date AND ${window.effectiveTo}::date
     GROUP BY estado_reserva
     ORDER BY COUNT(*) DESC
  `;

  const usersByRoleRaw = await sql`
    SELECT rol AS role, COUNT(*)::int AS count
      FROM "Usuario"
     GROUP BY rol
     ORDER BY COUNT(*) DESC
  `;

  const reservationsLast7Raw = await sql`
    SELECT TO_CHAR(DATE(fecha_reserva), 'YYYY-MM-DD') AS date,
           COUNT(*)::int AS count
      FROM "Reserva"
     WHERE DATE(fecha_reserva) BETWEEN ${window.barStart}::date AND ${window.barEnd}::date
     GROUP BY DATE(fecha_reserva)
     ORDER BY DATE(fecha_reserva)
  `;

  const occupancyByZoneRaw = await sql`
    WITH spaces_per_zone AS (
      SELECT z.nombre_zona AS zone, COUNT(*)::int AS total
        FROM "Espacio" e
        JOIN "Zona" z ON z.id_zona = e.id_zona
       WHERE e.activo = TRUE
       GROUP BY z.nombre_zona
    ),
    occupied_per_zone AS (
      SELECT z.nombre_zona AS zone, COUNT(*)::int AS occupied
        FROM "Reserva" r
        JOIN "Espacio" e ON e.id_espacio = r.id_espacio
        JOIN "Zona" z ON z.id_zona = e.id_zona
       WHERE r.estado_reserva IN ('ACTIVO', 'CHECKED_IN')
         AND DATE(r.fecha_reserva) = CURRENT_DATE
       GROUP BY z.nombre_zona
    )
    SELECT s.zone, COALESCE(o.occupied, 0)::int AS occupied, s.total
      FROM spaces_per_zone s
      LEFT JOIN occupied_per_zone o ON o.zone = s.zone
     ORDER BY s.zone
  `;

  const seriesMap = build7DaySeriesMap(reservationsLast7Raw);
  const reservationsLast7Days = [];
  for (let i = 0; i < 7; i += 1) {
    const date = toISODate(addDays(parseISODateOnly(window.barStart), i));
    reservationsLast7Days.push({
      date,
      count: clampCount(seriesMap.get(date) || 0),
    });
  }

  return {
    ok: true,
    data: {
      totals: {
        users: clampCount(usersCount?.users),
        activeReservations: clampCount(activeCount?.active),
        availableSpaces: clampCount(availableCount?.available),
        cancelledReservations: clampCount(cancelledCount?.cancelled),
      },
      reservationsByStatus: reservationsByStatusRaw.map((row) => ({
        status: row.status,
        count: clampCount(row.count),
      })),
      usersByRole: usersByRoleRaw.map((row) => ({
        role: row.role,
        count: clampCount(row.count),
      })),
      reservationsLast7Days,
      occupancyByZone: occupancyByZoneRaw.map((row) => {
        const total = clampCount(row.total);
        const occupied = Math.min(clampCount(row.occupied), total);
        return { zone: row.zone, occupied, total };
      }),
    },
  };
}

module.exports = { getAdminStats };
