const { sql } = require('../config/db');

function parseId(param) {
  const parsed = parseInt(param, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

const ALLOWED_STATUSES = ['PENDIENTE', 'ACTIVO', 'CANCELADO', 'COMPLETADO', 'CHECKED_IN'];

async function listUserReservations({ id_usuario, status, from, to, page, pageSize }) {
  const userId = parseId(id_usuario);
  if (!userId) return { ok: false, status: 400, message: 'id_usuario inválido' };

  const p  = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (p - 1) * ps;

  let statusList = [];
  if (typeof status === 'string' && status.trim()) {
    statusList = status.split(',').map(s => s.trim()).filter(s => ALLOWED_STATUSES.includes(s));
  }
  if (statusList.length === 0) statusList = ALLOWED_STATUSES;

  // ← CAMBIO: defaults en JS en lugar del IS NULL trick
  const fromDate = from || '1970-01-01';
  const toDate   = to   || '2999-12-31';

  const rows = await sql`
    SELECT
      r.id_reserva,
      r.fecha_reserva,
      r.hora_inicio,
      r.hora_fin,
      r.estado_reserva,
      r.tipo_reserva,
      r.fecha_creacion,
      e.id_espacio,
      e.nombre_espacio,
      e.codigo_espacio,
      z.nombre_zona,
      z.edificio
    FROM "Reserva" r
    JOIN "Espacio" e ON e.id_espacio = r.id_espacio
    JOIN "Zona"    z ON z.id_zona    = e.id_zona
    WHERE r.id_usuario = ${userId}
      AND r.estado_reserva = ANY(${statusList})
      AND DATE(r.fecha_reserva) >= ${fromDate}::date
      AND DATE(r.fecha_reserva) <= ${toDate}::date
    ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC
    LIMIT ${ps} OFFSET ${offset}
  `;

  const [countRow] = await sql`
    SELECT COUNT(*)::int AS total
    FROM "Reserva" r
    WHERE r.id_usuario = ${userId}
      AND r.estado_reserva = ANY(${statusList})
      AND DATE(r.fecha_reserva) >= ${fromDate}::date
      AND DATE(r.fecha_reserva) <= ${toDate}::date
  `;

  const total = countRow?.total ?? 0;

  return {
    ok: true,
    data: {
      reservaciones: rows,
      total,
      page: p,
      totalPages: total === 0 ? 0 : Math.ceil(total / ps),
    },
  };
}

async function cancelUserReservation(id_reserva, actorId) {
  const reservaId = parseId(id_reserva);
  if (!reservaId) return { ok: false, status: 400, message: 'id_reserva inválido' };

  const [reserva] = await sql`
    SELECT id_reserva, estado_reserva FROM "Reserva" WHERE id_reserva = ${reservaId}
  `;

  if (!reserva) return { ok: false, status: 404, message: 'Reserva no encontrada' };

  if (!['PENDIENTE', 'ACTIVO'].includes(reserva.estado_reserva)) {
    return {
      ok: false,
      status: 400,
      message: `No se puede cancelar una reserva en estado ${reserva.estado_reserva}`,
    };
  }

  await sql`
    UPDATE "Reserva"
    SET estado_reserva = 'CANCELADO', fecha_edicion = NOW()
    WHERE id_reserva = ${reservaId}
  `;

  return { ok: true };
}

module.exports = { listUserReservations, cancelUserReservation };