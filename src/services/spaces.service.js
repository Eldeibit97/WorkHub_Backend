const { sql } = require('../config/db.js');
const {
  normalizeTimeLabel,
  intervalsOverlap,
  formatFromMinutes,
  toMinutes,
} = require('../utils/timeRange');

const DEFAULT_SCHEDULE = {
  startHour: 8,
  endHour: 18,
  slotMinutes: 120,
};

function parseZonaId(raw) {
  if (raw === undefined || raw === null || raw === '') return NaN;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : NaN;
}

async function listZonas() {
  const rows = await sql`
    SELECT
      z.id_zona,
      z.nombre_zona,
      z.edificio,
      z.descripcion,
      z.codigo_zona,
      z.view_box,
      z.background
  FROM public."Zona" z
  WHERE z.edificio = 'ATC Monterrey'
  ORDER BY z.edificio NULLS LAST, z.nombre_zona
  `;
  return rows.map((z) => ({
    idZona: z.id_zona,
    nombreZona: z.nombre_zona,
    edificio: z.edificio,
    descripcion: z.descripcion,
    codigoZona: z.codigo_zona,
    viewBox: z.view_box,
    background: z.background,
    id_zona: z.id_zona,
    nombre_zona: z.nombre_zona,
    codigo_zona: z.codigo_zona,
    view_box: z.view_box,
  }));
}

async function listSpacesByZona(zonaId) {
  const rows = await sql`
    SELECT
      e.id_espacio,
      e.id_zona,
      e.codigo_espacio,
      e.nombre_espacio,
      e.id_tipo_espacio,
      e.activo,
      e.estado_actual,
      e.shape,
      e.x,
      e.y,
      e.r,
      e.w,
      e.h,
      te.nombre_tipo,
      z.nombre_zona,
      z.edificio
    FROM public."Espacio" e
    JOIN public."Tipo_Espacio" te ON te.id_tipo_espacio = e.id_tipo_espacio
    JOIN public."Zona" z ON z.id_zona = e.id_zona
   WHERE e.id_zona = ${zonaId}
     AND e.activo = true
   ORDER BY e.codigo_espacio ASC
  `;
  return rows.map((e) => ({
    idEspacio: e.id_espacio,
    zonaId: e.id_zona,
    codigoEspacio: e.codigo_espacio,
    nombreEspacio: e.nombre_espacio,
    idTipoEspacio: e.id_tipo_espacio,
    tipo: e.nombre_tipo,
    nombreTipo: e.nombre_tipo,
    activo: e.activo,
    estadoActual: e.estado_actual,
    nombreZona: e.nombre_zona,
    edificio: e.edificio,
    shape: e.shape,
    x: e.x != null ? Number(e.x) : null,
    y: e.y != null ? Number(e.y) : null,
    r: e.r != null ? Number(e.r) : null,
    w: e.w != null ? Number(e.w) : null,
    h: e.h != null ? Number(e.h) : null,
    id_espacio: e.id_espacio,
    id_zona: e.id_zona,
    codigo_espacio: e.codigo_espacio,
    nombre_espacio: e.nombre_espacio,
    nombre_zona: e.nombre_zona,
  }));
}

const ALLOWED_TIPO_ESPACIO_IDS = [1, 2, 5];

async function listTiposEspacio() {
  const rows = await sql`
    SELECT id_tipo_espacio, nombre_tipo
      FROM public."Tipo_Espacio"
     WHERE id_tipo_espacio IN (1, 2, 5)
     ORDER BY id_tipo_espacio ASC
  `;
  return rows.map((t) => ({
    idTipoEspacio: t.id_tipo_espacio,
    nombreTipo: t.nombre_tipo,
    id_tipo_espacio: t.id_tipo_espacio,
    nombre_tipo: t.nombre_tipo,
  }));
}

/**
 * Disponibilidad por zona y franja horaria (solape con reservas activas).
 */
async function fetchAvailabilityWindow(zonaId, fecha, horaInicio, horaFin) {
  const hi = normalizeTimeLabel(horaInicio);
  const hf = normalizeTimeLabel(horaFin);
  if (!hi || !hf) {
    const err = new Error('horaInicio y horaFin deben ser HH:mm');
    err.status = 400;
    throw err;
  }
  if (toMinutes(hi) >= toMinutes(hf)) {
    const err = new Error('horaInicio debe ser menor que horaFin');
    err.status = 400;
    throw err;
  }

  const rows = await sql`
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
           AND DATE(r.fecha_reserva) = ${fecha}::date
           AND r.estado_reserva IN ('PENDIENTE', 'ACTIVO', 'CHECKED_IN')
           AND r.hora_inicio::time < ${hf}::time
           AND r.hora_fin::time > ${hi}::time
      ) AS ocupado
    FROM public."Espacio" e
    JOIN public."Tipo_Espacio" te ON te.id_tipo_espacio = e.id_tipo_espacio
    JOIN public."Zona" z ON z.id_zona = e.id_zona
   WHERE e.activo = true
     AND e.id_zona = ${zonaId}
   ORDER BY e.codigo_espacio ASC
  `;

  return rows.map((r) => ({
    id_espacio: r.id_espacio,
    codigo_espacio: r.codigo_espacio,
    nombre_espacio: r.nombre_espacio,
    tipo: r.tipo,
    nombre_zona: r.nombre_zona,
    ocupado: r.ocupado === true || r.ocupado === 't' || r.ocupado === 'true',
  }));
}

async function fetchReservationsForSpaceDay(idEspacio, fecha) {
  return sql`
    SELECT r.hora_inicio, r.hora_fin
      FROM public."Reserva" r
     WHERE r.id_espacio = ${idEspacio}
       AND DATE(r.fecha_reserva) = ${fecha}::date
       AND r.estado_reserva IN ('PENDIENTE', 'ACTIVO', 'CHECKED_IN')
     ORDER BY r.hora_inicio::time ASC
  `;
}

/**
 * Bloques de agenda para el modal de detalle (estado LIBRE | OCUPADO).
 */
async function buildScheduleBlocks(idEspacio, fecha) {
  const reservas = await fetchReservationsForSpaceDay(idEspacio, fecha);
  const intervals = reservas.map((r) => ({
    inicio: normalizeTimeLabel(r.hora_inicio),
    fin: normalizeTimeLabel(r.hora_fin),
  })).filter((x) => x.inicio && x.fin);

  const { startHour, endHour, slotMinutes } = DEFAULT_SCHEDULE;
  const startMin = startHour * 60;
  const endMin = endHour * 60;
  const bloques = [];

  for (let m = startMin; m < endMin; m += slotMinutes) {
    const inicio = formatFromMinutes(m);
    const fin = formatFromMinutes(Math.min(m + slotMinutes, endMin));
    const ocupado = intervals.some((iv) =>
      intervalsOverlap(inicio, fin, iv.inicio, iv.fin)
    );
    bloques.push({
      inicio,
      fin,
      estado: ocupado ? 'OCUPADO' : 'LIBRE',
    });
  }

  return { bloques };
}

async function fetchParkingSpaces() {
  try{
    const spaces = await sql`SELECT z.nombre_zona AS "zona", COUNT(e.estado_actual) AS "espaciosDisponibles",  COUNT(e.id_espacio) AS "espaciosTotales" FROM "Espacio" e JOIN "Zona" z ON e.id_zona = z.id_zona WHERE z.nombre_zona LIKE 'E%' AND e.estado_actual = 'DISPONIBLE' GROUP BY z.nombre_zona;`;
    const zones = spaces.reduce((acc, {zona, espaciosDisponibles, espaciosTotales})=>{
      acc[zona] = {espaciosDisponibles, espaciosTotales};
      return acc;
    },{});
    return zones;
  }catch(error){
    throw new Error('No se pudo obtener los datos', error);
  };
}

module.exports = {
  listZonas,
  listSpacesByZona,
  listTiposEspacio,
  fetchAvailabilityWindow,
  buildScheduleBlocks,
  parseZonaId,
  ALLOWED_TIPO_ESPACIO_IDS,
  fetchParkingSpaces
};
