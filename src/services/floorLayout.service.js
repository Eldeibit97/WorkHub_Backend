const { sql } = require('../config/db');
const { isValidPgInt32, parsePgIntId } = require('../utils/pgInt');
const spacesService = require('./spaces.service');

const ALLOWED_TIPOS = spacesService.ALLOWED_TIPO_ESPACIO_IDS;
const ALLOWED_SHAPES = ['circle', 'rect'];

function fail(status, message) {
  return { ok: false, status, message };
}

function pickString(v, maxLen = 500) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function pickNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeEspacioInput(raw, index) {
  const idEspacio = raw.idEspacio ?? raw.id_espacio;
  const parsedId =
    idEspacio != null && idEspacio !== '' ? parsePgIntId(idEspacio) : null;

  if (idEspacio != null && idEspacio !== '' && Number.isNaN(parsedId)) {
    return {
      error: `espacios[${index}]: idEspacio inválido (debe ser id de base de datos, no un timestamp)`,
    };
  }

  const codigo = pickString(raw.codigoEspacio ?? raw.codigo_espacio, 64);
  const nombre = pickString(raw.nombreEspacio ?? raw.nombre_espacio, 200);
  const idTipo = parseInt(String(raw.idTipoEspacio ?? raw.id_tipo_espacio ?? ''), 10);
  const shape = pickString(raw.shape, 32)?.toLowerCase();

  if (!codigo) {
    return { error: `espacios[${index}]: codigoEspacio es requerido` };
  }
  if (!nombre) {
    return { error: `espacios[${index}]: nombreEspacio es requerido` };
  }
  if (!ALLOWED_TIPOS.includes(idTipo)) {
    return { error: `espacios[${index}]: idTipoEspacio debe ser 1, 2 o 5` };
  }
  if (!shape || !ALLOWED_SHAPES.includes(shape)) {
    return { error: `espacios[${index}]: shape debe ser "circle" o "rect"` };
  }

  const x = pickNum(raw.x);
  const y = pickNum(raw.y);
  const r = pickNum(raw.r);
  const w = pickNum(raw.w);
  const h = pickNum(raw.h);

  if ([x, y].some((n) => Number.isNaN(n))) {
    return { error: `espacios[${index}]: x e y son requeridos y deben ser numéricos` };
  }

  if (shape === 'circle') {
    if (Number.isNaN(r) || r <= 0) {
      return { error: `espacios[${index}]: shape circle requiere r > 0` };
    }
    return {
      item: {
        idEspacio: parsedId,
        codigoEspacio: codigo,
        nombreEspacio: nombre,
        idTipoEspacio: idTipo,
        shape,
        x,
        y,
        r,
        w: null,
        h: null,
      },
    };
  }

  if ([w, h].some((n) => Number.isNaN(n) || n <= 0)) {
    return { error: `espacios[${index}]: shape rect requiere w y h > 0` };
  }

  return {
    item: {
      idEspacio: parsedId,
      codigoEspacio: codigo,
      nombreEspacio: nombre,
      idTipoEspacio: idTipo,
      shape,
      x,
      y,
      r: null,
      w,
      h,
    },
  };
}

async function espacioBelongsToZona(idEspacio, zonaId) {
  const rows = await sql`
    SELECT id_espacio FROM public."Espacio"
     WHERE id_espacio = ${idEspacio} AND id_zona = ${zonaId}
     LIMIT 1
  `;
  return rows.length > 0;
}

async function hasBlockingReservations(idEspacio) {
  const rows = await sql`
    SELECT 1
      FROM public."Reserva" r
     WHERE r.id_espacio = ${idEspacio}
       AND r.estado_reserva IN ('PENDIENTE', 'ACTIVO', 'CHECKED_IN')
       AND r.fecha_reserva >= CURRENT_DATE
     LIMIT 1
  `;
  return rows.length > 0;
}

function extractReturnedId(result) {
  if (Array.isArray(result) && result[0]?.id_espacio != null) {
    return result[0].id_espacio;
  }
  if (result?.rows?.[0]?.id_espacio != null) {
    return result.rows[0].id_espacio;
  }
  if (result?.id_espacio != null) {
    return result.id_espacio;
  }
  return null;
}

/**
 * Guarda layout de zona + CRUD de espacios en una transacción.
 */
async function saveFloorLayout(zonaId, body) {
  if (!isValidPgInt32(zonaId)) {
    return fail(400, 'id de zona inválido');
  }

  const zonaRows = await sql`
    SELECT id_zona FROM public."Zona" WHERE id_zona = ${zonaId} LIMIT 1
  `;
  if (!zonaRows.length) {
    return fail(404, 'Zona no encontrada');
  }

  const payload = body && typeof body === 'object' ? body : {};
  const codigoZona = pickString(payload.codigoZona ?? payload.codigo_zona, 64);
  const viewBox = pickString(payload.viewBox ?? payload.view_box, 128);
  const background = pickString(payload.background, 2000);
  const rawEspacios = Array.isArray(payload.espacios) ? payload.espacios : [];
  const rawEliminar = Array.isArray(payload.eliminarIds)
    ? payload.eliminarIds
    : Array.isArray(payload.eliminar_ids)
      ? payload.eliminar_ids
      : [];

  const espacios = [];
  for (let i = 0; i < rawEspacios.length; i++) {
    const norm = normalizeEspacioInput(rawEspacios[i], i);
    if (norm.error) return fail(400, norm.error);
    espacios.push(norm.item);
  }

  const codigosEnPayload = new Set();
  for (const e of espacios) {
    const key = e.codigoEspacio.toLowerCase();
    if (codigosEnPayload.has(key)) {
      return fail(409, `Código duplicado en el payload: ${e.codigoEspacio}`);
    }
    codigosEnPayload.add(key);
  }

  const eliminarIds = [];
  for (const rawId of rawEliminar) {
    const id = parsePgIntId(rawId);
    if (Number.isNaN(id)) {
      return fail(400, 'eliminarIds contiene un id inválido');
    }
    if (!eliminarIds.includes(id)) eliminarIds.push(id);
  }

  for (const e of espacios) {
    if (e.idEspacio != null) {
      const belongs = await espacioBelongsToZona(e.idEspacio, zonaId);
      if (!belongs) {
        return fail(400, `El espacio ${e.idEspacio} no pertenece a la zona ${zonaId}`);
      }
    }
  }

  for (const id of eliminarIds) {
    const belongs = await espacioBelongsToZona(id, zonaId);
    if (!belongs) {
      return fail(400, `No se puede eliminar ${id}: no pertenece a la zona`);
    }
    const blocked = await hasBlockingReservations(id);
    if (blocked) {
      return fail(
        409,
        `No se puede desactivar el espacio ${id}: tiene reservas activas o futuras`
      );
    }
  }

  const existingCodes = await sql`
    SELECT id_espacio, LOWER(codigo_espacio) AS codigo
      FROM public."Espacio"
     WHERE id_zona = ${zonaId}
       AND activo = true
  `;
  const codeToId = new Map(existingCodes.map((r) => [r.codigo, r.id_espacio]));

  for (const e of espacios) {
    const key = e.codigoEspacio.toLowerCase();
    const owner = codeToId.get(key);
    if (owner != null && owner !== e.idEspacio) {
      return fail(409, `codigoEspacio "${e.codigoEspacio}" ya existe en esta zona`);
    }
  }

  const stmts = [];
  stmts.push(sql`
    UPDATE public."Zona"
       SET codigo_zona = ${codigoZona},
           view_box = ${viewBox},
           background = ${background}
     WHERE id_zona = ${zonaId}
  `);

  let actualizados = 0;
  const insertStmtIndexes = [];

  for (const e of espacios) {
    if (e.idEspacio != null) {
      actualizados += 1;
      stmts.push(sql`
        UPDATE public."Espacio"
           SET codigo_espacio = ${e.codigoEspacio},
               nombre_espacio = ${e.nombreEspacio},
               id_tipo_espacio = ${e.idTipoEspacio},
               shape = ${e.shape},
               x = ${e.x},
               y = ${e.y},
               r = ${e.r},
               w = ${e.w},
               h = ${e.h},
               activo = true
         WHERE id_espacio = ${e.idEspacio}
           AND id_zona = ${zonaId}
      `);
    } else {
      insertStmtIndexes.push(stmts.length);
      stmts.push(sql`
        INSERT INTO public."Espacio" (
          codigo_espacio,
          nombre_espacio,
          id_tipo_espacio,
          id_zona,
          estado_actual,
          activo,
          shape,
          x,
          y,
          r,
          w,
          h
        ) VALUES (
          ${e.codigoEspacio},
          ${e.nombreEspacio},
          ${e.idTipoEspacio},
          ${zonaId},
          'DISPONIBLE',
          true,
          ${e.shape},
          ${e.x},
          ${e.y},
          ${e.r},
          ${e.w},
          ${e.h}
        )
        RETURNING id_espacio
      `);
    }
  }

    stmts.push(sql`
    UPDATE public."Espacio"
      SET activo = false
    WHERE id_espacio = ANY(${eliminarIds})
      AND id_zona = ${zonaId}
  `);

  try {
    const txResults =
      stmts.length > 1 ? await sql.transaction(stmts) : [await stmts[0]];

    const creados = insertStmtIndexes
      .map((idx) => extractReturnedId(txResults[idx]))
      .filter((id) => id != null)
      .map((idEspacio) => ({ idEspacio }));

    const espaciosActualizados = await spacesService.listSpacesByZona(zonaId);
    const zonaRow = await sql`
      SELECT id_zona, nombre_zona, edificio, descripcion, codigo_zona, view_box, background
        FROM public."Zona"
       WHERE id_zona = ${zonaId}
       LIMIT 1
    `;
    const z = zonaRow[0];

    return {
      ok: true,
      status: 200,
      data: {
        idZona: zonaId,
        actualizados,
        creados,
        desactivados: eliminarIds,
        zona: {
          idZona: z.id_zona,
          nombreZona: z.nombre_zona,
          edificio: z.edificio,
          descripcion: z.descripcion,
          codigoZona: z.codigo_zona,
          viewBox: z.view_box,
          background: z.background,
        },
        espacios: espaciosActualizados,
        tiposEspacio: await spacesService.listTiposEspacio(),
      },
    };
  } catch (error) {
    console.error('saveFloorLayout', error);
    if (error.code === '23505') {
      return fail(409, 'Código de espacio duplicado en la base de datos');
    }
    return fail(500, 'Error al guardar el layout del piso');
  }
}

module.exports = {
  saveFloorLayout,
  ALLOWED_TIPOS,
  ALLOWED_SHAPES,
};
