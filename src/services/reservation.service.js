const { sql } = require('../config/db');
const modeloUsuario = require('../models/modeloUsuario');
const modeloReserva = require('../models/modeloReserva');
const { RESERVATION_STATUS } = require('../constants/reservationStatus');
const { normalizeTimeLabel, intervalsOverlap, toMinutes } = require('../utils/timeRange');
const spacesService = require('./spaces.service');

/** YYYY-MM-DD, primeros 10 de ISO, o Date local (sin horas raras en string arbitrario). */
function normalizeFechaReserva(v) {
  if (v == null) return '';
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const head = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;
  return '';
}

/** Límite PostgreSQL `integer` (int4); ids de tablas y FK deben caber aquí. */
const MAX_PG_INT = 2147483647;

function isValidPgInt32(n) {
  const x = Number(n);
  return Number.isFinite(x) && Number.isInteger(x) && x > 0 && x <= MAX_PG_INT;
}

const fetchReservations = async (userId, status) => {
  try {
    let result;

    if (status) {
      result = await sql`
        SELECT 
          r.id_reserva,
          r.fecha_reserva,
          r.hora_inicio,
          r.hora_fin,
          r.estado_reserva,
          r.tipo_reserva,

          e.nombre_espacio,
          e.codigo_espacio,

          z.nombre_zona,
          z.edificio,

          t.nombre_tipo

        FROM "Reserva" r
        JOIN "Espacio" e ON r.id_espacio = e.id_espacio
        JOIN "Zona" z ON e.id_zona = z.id_zona
        JOIN "Tipo_Espacio" t ON e.id_tipo_espacio = t.id_tipo_espacio

        WHERE r.id_usuario = ${userId}
        AND r.estado_reserva = ${status}

        ORDER BY r.fecha_creacion DESC
      `;
    } else {
      result = await sql`
        SELECT 
          r.id_reserva,
          r.fecha_reserva,
          r.hora_inicio,
          r.hora_fin,
          r.estado_reserva,
          r.tipo_reserva,

          e.nombre_espacio,
          e.codigo_espacio,

          z.nombre_zona,
          z.edificio,

          t.nombre_tipo

        FROM "Reserva" r
        JOIN "Espacio" e ON r.id_espacio = e.id_espacio
        JOIN "Zona" z ON e.id_zona = z.id_zona
        JOIN "Tipo_Espacio" t ON e.id_tipo_espacio = t.id_tipo_espacio

        WHERE r.id_usuario = ${userId}

        ORDER BY r.fecha_creacion DESC
      `;
    }

    return result;

  } catch (error) {
    console.error("DB ERROR:", error);
    throw error;
  }
};


const fetchAllReservas = async () => {
  try {
    const result = await sql`SELECT * FROM "Reserva"`;
    return result;
  } catch (error) {
    console.error('DB ERROR en fetchAllReservas:', error);
    throw error;
  }
};

const updateReserva = async ({ id_reserva, fecha_reserva, hora_inicio, hora_fin, estado_reserva, tipo_reserva }) => {
  // 1. Verificar que la reserva existe
  const reserva = await modeloReserva.encontrarPorId(id_reserva);
  if (!reserva || reserva.length === 0) {
    return { ok: false, status: 404, message: 'Reserva no encontrada' };
  }

  // 2. Ejecutar el UPDATE
  try {
    await sql`
      UPDATE "Reserva"
      SET
        fecha_reserva  = ${fecha_reserva},
        hora_inicio    = ${hora_inicio},
        hora_fin       = ${hora_fin},
        estado_reserva = ${estado_reserva},
        tipo_reserva   = ${tipo_reserva}
      WHERE id_reserva = ${id_reserva}
      RETURNING *
    `;
    return { ok: true, status: 200, message: 'Reserva actualizada exitosamente' };
  } catch (error) {
    console.error('DB ERROR en updateReserva:', error);
    throw error;
  }
};

const performCheckIn = async (id_reserva) => {
  // 1. Buscar reserva
  const reserva = await modeloReserva.encontrarPorId(id_reserva);
  if (!reserva || reserva.length === 0) {
    return { ok: false, status: 404, message: 'Reserva no encontrada' };
  }

  const r = reserva[0];

  // 2. Validar estado
  if (r.estado_reserva === RESERVATION_STATUS.CHECKED_IN) {
    return { ok: false, status: 400, message: 'Ya se hizo check-in en esta reserva' };
  }
  if (r.estado_reserva !== RESERVATION_STATUS.ACTIVO) {
    return { ok: false, status: 400, message: 'La reserva no está activa' };
  }

  // 3. Validar ventana de tiempo (15 min antes – 30 min después de hora_inicio)
  const ahora        = new Date();
  const fechaReserva = new Date(r.fecha_reserva);
  const [hora, minutos, segundos] = r.hora_inicio.split(':');
  fechaReserva.setHours(parseInt(hora), parseInt(minutos), parseInt(segundos || 0));

  const MINUTOS_ANTES  = 15 * 60 * 1000;
  const MINUTOS_DESPUES = 30 * 60 * 1000;
  const inicioVentana  = new Date(fechaReserva.getTime() - MINUTOS_ANTES);
  const finVentana     = new Date(fechaReserva.getTime() + MINUTOS_DESPUES);

  if (ahora < inicioVentana || ahora > finVentana) {
    return { ok: false, status: 400, message: 'Fuera de la ventana permitida para check-in' };
  }

  // 4. Actualizar estado
  try {
    await sql`
      UPDATE "Reserva"
      SET
        estado_reserva = ${RESERVATION_STATUS.CHECKED_IN},
        check_in       = NOW(),
        fecha_edicion  = NOW()
      WHERE id_reserva = ${id_reserva}
    `;
    return { ok: true, status: 200, message: 'Check-in realizado correctamente' };
  } catch (error) {
    console.error('DB ERROR en performCheckIn:', error);
    throw error;
  }
};

const performCheckOut = async (id_reserva) => {
  try {
    // 1. Intentar UPDATE directo (solo si está en CHECKED_IN)
    const result = await sql`
      UPDATE "Reserva"
      SET
        estado_reserva = ${RESERVATION_STATUS.COMPLETADO},
        check_out      = CURRENT_TIMESTAMP,
        fecha_edicion  = CURRENT_TIMESTAMP
      WHERE id_reserva  = ${id_reserva}
        AND estado_reserva = ${RESERVATION_STATUS.CHECKED_IN}
      RETURNING *
    `;

    if (result && result.length > 0) {
      return { ok: true, status: 200, message: 'Check-out realizado correctamente', data: result[0] };
    }

    // 2. El UPDATE no afectó filas: diagnosticar por qué
    const reservaCheck = await modeloReserva.encontrarPorId(id_reserva);
    if (!reservaCheck || reservaCheck.length === 0) {
      return { ok: false, status: 404, message: 'Reserva no encontrada' };
    }

    const estadoActual = reservaCheck[0].estado_reserva;

    if (estadoActual === RESERVATION_STATUS.COMPLETADO) {
      return { ok: false, status: 400, message: 'El check-out ya fue realizado previamente' };
    }
    if (estadoActual === RESERVATION_STATUS.ACTIVO) {
      return { ok: false, status: 400, message: 'No puedes hacer check-out porque aún no has hecho check-in' };
    }

    return { ok: false, status: 400, message: `No se puede hacer check-out desde el estado: ${estadoActual}` };

  } catch (error) {
    console.error('DB ERROR en performCheckOut:', error);
    throw error;
  }
};

const fetchAvailability = async (date, id_zona) => {
  try {
    const result = await sql`
      SELECT
        e.id_espacio,
        e.codigo_espacio,
        e.nombre_espacio,
        te.nombre_tipo AS tipo,
        z.nombre_zona,
        EXISTS (
          SELECT 1 
          FROM public."Reserva" r
          WHERE r.id_espacio = e.id_espacio
            AND DATE(r.fecha_reserva) = ${date}
            AND r.estado_reserva IN ('PENDIENTE', 'ACTIVO', 'CHECKED_IN')
        ) AS ocupado
      FROM public."Espacio" e
      JOIN public."Tipo_Espacio" te ON e.id_tipo_espacio = te.id_tipo_espacio
      JOIN public."Zona" z ON e.id_zona = z.id_zona
      WHERE e.activo = true
        AND e.id_zona = ${id_zona}
      ORDER BY e.codigo_espacio ASC;
    `;

    return result;
  } catch (error) {
    console.error("Error checking availability in Service:", error);
    throw error;
  }
};

const reservarEspacio = async (datosReserva) => {
  const usuario = await modeloUsuario.encontrarPorMail(datosReserva.mail);
  if (usuario.id_usuario === -1) {
    return {
      status: 400,
      message: 'El correo con el que se intenta reservar no esta registrado en la plataforma'
    };
  }
  const datosCorrectos = { ...datosReserva, idUsuario: usuario.id_usuario };
  const respuesta = await modeloReserva.crearReserva(datosCorrectos);
  if (respuesta) {
    return {
      status: 200,
      message: 'La reserva se creo de manera correcta'
    };
  }
  return {
    status: 400,
    message: 'Hubo un error al crear la reserva'
  };
};

async function hasConflictingReservation(idEspacio, fecha, horaInicio, horaFin) {
  const hi = normalizeTimeLabel(horaInicio);
  const hf = normalizeTimeLabel(horaFin);
  const rows = await sql`
    SELECT 1
      FROM public."Reserva" r
     WHERE r.id_espacio = ${idEspacio}
       AND DATE(r.fecha_reserva) = ${fecha}::date
       AND r.estado_reserva IN ('PENDIENTE', 'ACTIVO', 'CHECKED_IN')
       AND r.hora_inicio::time < ${hf}::time
       AND r.hora_fin::time > ${hi}::time
     LIMIT 1
  `;
  return rows.length > 0;
}

function validateBatchNoInternalOverlap(normalizedItems) {
  const byKey = new Map();
  for (const it of normalizedItems) {
    const key = `${it.idEspacio}|${it.fechaReserva}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(it);
  }
  for (const list of byKey.values()) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        if (
          intervalsOverlap(
            list[i].horaInicio,
            list[i].horaSalida,
            list[j].horaInicio,
            list[j].horaSalida
          )
        ) {
          return {
            ok: false,
            message: 'Hay reservas solapadas en el mismo espacio y fecha en el lote'
          };
        }
      }
    }
  }
  return { ok: true };
}

function collectReturningIds(transactionResults) {
  const ids = [];
  for (const r of transactionResults) {
    if (Array.isArray(r) && r[0]?.id_reserva != null) {
      ids.push(r[0].id_reserva);
    } else if (r?.rows?.[0]?.id_reserva != null) {
      ids.push(r.rows[0].id_reserva);
    } else if (r?.id_reserva != null) {
      ids.push(r.id_reserva);
    }
  }
  return ids;
}

/**
 * Crear varias reservas en una transacción (usuario tomado del JWT).
 */
async function createReservationsBatch(idUsuario, items) {
  const uidNum = Number(idUsuario);
  if (!isValidPgInt32(uidNum)) {
    return { ok: false, status: 401, message: 'Usuario no válido en token' };
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, status: 400, message: 'reservas debe ser un array no vacío' };
  }

  const normalized = [];
  for (const raw of items) {
    const idEspacio = parseInt(
      raw.idEspacio ?? raw.id_espacio ?? raw.spaceId ?? raw.espacioId,
      10
    );
    const fechaReserva = normalizeFechaReserva(
      raw.fechaReserva ?? raw.fecha_reserva ?? raw.fecha ?? raw.date
    );
    const horaInicio = normalizeTimeLabel(
      raw.horaInicio ?? raw.hora_inicio ?? raw.startTime
    );
    const horaSalida = normalizeTimeLabel(
      raw.horaSalida ?? raw.hora_salida ?? raw.hora_fin ?? raw.horaFin ?? raw.endTime
    );
    const tipoReserva = raw.tipoReserva ?? raw.tipo_reserva ?? 'INDIVIDUAL';

    if (!isValidPgInt32(idEspacio) || !fechaReserva || !horaInicio || !horaSalida) {
      return {
        ok: false,
        status: 400,
        message:
          'Cada reserva requiere idEspacio (id numérico del espacio en BD, no un timestamp), fechaReserva (YYYY-MM-DD), horaInicio y horaSalida (HH:mm)'
      };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fechaReserva))) {
      return { ok: false, status: 400, message: 'fechaReserva debe ser YYYY-MM-DD' };
    }
    if (toMinutes(horaInicio) >= toMinutes(horaSalida)) {
      return {
        ok: false,
        status: 400,
        message: 'horaInicio debe ser anterior a horaSalida en cada reserva'
      };
    }
    normalized.push({
      idEspacio,
      fechaReserva: String(fechaReserva),
      horaInicio,
      horaSalida,
      tipoReserva: String(tipoReserva)
    });
  }

  const internal = validateBatchNoInternalOverlap(normalized);
  if (!internal.ok) {
    return { ok: false, status: 400, message: internal.message };
  }

  const uniqueSpaces = [...new Set(normalized.map((x) => x.idEspacio))];
  for (const id of uniqueSpaces) {
    const sp = await sql`
      SELECT id_espacio
        FROM public."Espacio"
       WHERE id_espacio = ${id}
         AND activo = true
       LIMIT 1
    `;
    if (!sp.length) {
      return {
        ok: false,
        status: 400,
        message: `Espacio ${id} no existe o está inactivo`
      };
    }
  }

  for (const it of normalized) {
    const conflict = await hasConflictingReservation(
      it.idEspacio,
      it.fechaReserva,
      it.horaInicio,
      it.horaSalida
    );
    if (conflict) {
      return {
        ok: false,
        status: 409,
        message: `Conflicto de horario en espacio ${it.idEspacio} el ${it.fechaReserva}`
      };
    }
  }

  const uid = uidNum;
  const stmts = normalized.map(
    (it) => sql`
    INSERT INTO public."Reserva" (
      id_usuario, id_espacio, fecha_reserva, hora_inicio, hora_fin,
      estado_reserva, fecha_creacion, tipo_reserva
    ) VALUES (
      ${uid},
      ${it.idEspacio},
      ${it.fechaReserva}::date,
      ${it.horaInicio},
      ${it.horaSalida},
      'PENDIENTE',
      NOW(),
      ${it.tipoReserva}
    )
    RETURNING id_reserva
  `
  );

  try {
    const results = await sql.transaction(stmts);
    const ids = collectReturningIds(results);
    if (ids.length !== normalized.length) {
      return { ok: false, status: 500, message: 'No se pudieron obtener todos los id de reserva' };
    }
    return { ok: true, status: 201, ids };
  } catch (error) {
    console.error('createReservationsBatch', error);
    return { ok: false, status: 500, message: 'Error al guardar las reservas' };
  }
}

const buscaReserva = async (datos) => {
  try {
    const hasActive = await sql`SELECT EXISTS (SELECT 1 FROM "Reserva" WHERE id_usuario = ${datos.user_id} AND "fecha_reserva" BETWEEN ${datos.today} AND ${datos.rango} AND estado_reserva IN ('ACTIVO', 'PENDIENTE'));`;
    return hasActive[0].exists;
  } catch (error) {
    console.error('Ocurrio un error al buscar reservas pendientes o activas');
    throw error;
  }
}

module.exports = {
  fetchReservations,
  fetchAvailability,
  reservarEspacio,
  createReservationsBatch,
  fetchAvailabilityWindow: spacesService.fetchAvailabilityWindow,
  fetchAllReservas,
  updateReserva,
  performCheckIn,
  performCheckOut,
  buscaReserva
};