const { sql } = require('../config/db');

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

const fetchAvailability = async (date) => {
    try {
        result = await sql`
        SELECT
            e.id_espacio,
            e.codigo_espacio,
            e.nombre_espacio,
            e.estado_actual,

            te.nombre_tipo,

            z.nombre_zona,
            z.edificio

        FROM public."Espacio" e
        JOIN public."Tipo_Espacio" te ON e.id_tipo_espacio = te.id_tipo_espacio
        JOIN public."Zona" z          ON e.id_zona         = z.id_zona

        WHERE e.activo = true
        AND e.estado_actual = 'DISPONIBLE'
        AND e.id_espacio NOT IN (
            SELECT r.id_espacio
            FROM public."Reserva" r
            WHERE DATE(r.fecha_reserva) = ${date}        -- date param: YYYY-MM-DD
                AND r.estado_reserva IN ('PENDIENTE', 'ACTIVO', 'CHECKED_IN')
        )

        ORDER BY z.nombre_zona, e.nombre_espacio;
        `
        return result;
    }
    catch (error){
        console.error("Error checking availability:",error);
        throw error;
    }
}

module.exports = { fetchReservations, fetchAvailability };