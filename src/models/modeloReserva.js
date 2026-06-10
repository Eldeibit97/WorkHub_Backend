const { sql } = require('../config/db.js');

class ModeloReserva {
    static async encontrarPorId(id) {
        if (!id) {
            return []
        } else {
            try {
                const reserva = await sql`SELECT * FROM "Reserva" WHERE id_reserva = ${id}`;
                return reserva;
            } catch (error) {
                console.error('Error al encontrar la reserva por ID:', error);
                throw error;
            }
        }
    };
    static async detallesPorId(id){
        if (!id) {
            return []
        } else {
            try {
                const reserva = await sql`SELECT r.id_reserva, u.correo_institucional, e.codigo_espacio, z.descripcion, r.fecha_reserva, r.hora_inicio, r.hora_fin, r.fecha_creacion FROM "Reserva" r JOIN "Usuario" u ON r.id_usuario = u.id_usuario JOIN "Espacio" e ON r.id_espacio = e.id_espacio JOIN "Zona" z ON e.id_zona = z.id_zona WHERE r.id_reserva = ${id};`;
                return reserva;
            } catch (error) {
                console.error('Error al encontrar la reserva por ID:', error);
                throw error;
            }
        }
    }
    static async encontrarPorIdUsuario(id_usuario) {
        if (!id_usuario) {
            return [];
        } else {
            try {
                const reservas = await sql`SELECT * FROM "Reserva" WHERE id_usuario = ${id_usuario}`;
                return reservas;
            } catch (error) {
                console.error('Error al encontrar las reservas por ID de usuario:', error);
                throw error;
            }
        }
    };
    static async crearReservaEstacionamiento(uid, datosReserva) {
        try {
            const inserted = await sql`INSERT INTO "Reserva" (id_usuario, id_espacio, fecha_reserva, hora_inicio, hora_fin, estado_reserva, fecha_creacion, tipo_reserva)
                  VALUES (${uid}, ${datosReserva.idEspacio}, ${datosReserva.fechaReserva}, ${datosReserva.horaInicio}, ${datosReserva.horaSalida}, 'PENDIENTE', ${datosReserva.fechaCreacion}, ${datosReserva.tipoReserva})`;
            const data = await sql`SELECT r.id_reserva, u.correo_institucional, e.codigo_espacio, z.descripcion, r.fecha_reserva, r.hora_inicio, r.hora_fin FROM "Reserva" r JOIN "Usuario" u ON r.id_usuario = u.id_usuario JOIN "Espacio" e ON r.id_espacio = e.id_espacio JOIN "Zona" z ON e.id_zona = z.id_zona WHERE r.estado_reserva = 'PENDIENTE' AND u.id_usuario = ${uid} AND r.fecha_reserva = ${datosReserva.fechaReserva} LIMIT 1;`;
            return data;
        } catch (error) {
            console.log('No se realizo la reserva', error);
            return;
        }
    };

 
  /**
   * Devuelve información completa de todas las zonas de estacionamiento,
   * incluyendo cuántos espacios tiene cada una y cuántos están ocupados
   * en el rango de fecha/hora solicitado.
   *
   * Usado para la pantalla de registro y para el WebSocket al emitir cambios.
   */
  static async obtenerCapacidadPorZona({ fecha, horaInicio, horaFin }) {
    const rows = await sql`
      SELECT
        z.id_zona,
        z.nombre         AS nombre_zona,
        z.codigo_zona,
        COUNT(e.id_espacio)::int                          AS total,
        COUNT(e.id_espacio) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM "Reserva" r
             WHERE r.id_espacio = e.id_espacio
               AND r.fecha      = ${fecha}
               AND r.hora_inicio < ${horaFin}
               AND r.hora_fin   > ${horaInicio}
          )
        )::int                                            AS ocupados
      FROM "Zona"    z
      JOIN "Espacio" e ON e.id_zona = z.id_zona
      JOIN "Tipo_Espacio" te ON te.id_tipo = e.id_tipo
      WHERE te.categoria = 'estacionamiento'
      GROUP BY z.id_zona, z.nombre, z.codigo_zona
      ORDER BY z.nombre
    `
    return rows.map((r) => ({
      ...r,
      disponibles: r.total - r.ocupados,
    }))
  }
 
  /**
   * Busca la primera zona de estacionamiento con espacio libre y
   * devuelve el id_espacio a reservar.
   *
   * El orden de búsqueda prioriza zonas gratuitas primero (si tienes
   * esa columna en Zona), luego por id_zona ascendente.
   *
   * Retorna null si no hay ningún espacio disponible.
   *
   * IMPORTANTE: Esta función debe ejecutarse siempre dentro de withParkingLock()
   * para evitar que dos llamadas simultáneas encuentren el mismo espacio libre.
   */
  static async primerEspacioLibre({ fecha, horaInicio, horaFin }) {
    const rows = await sql`
      SELECT
        e.id_espacio,
        e.codigo,
        e.nombre,
        z.id_zona,
        z.nombre  AS nombre_zona,
        z.codigo_zona
      FROM "Espacio" e
      JOIN "Zona"        z  ON z.id_zona  = e.id_zona
      JOIN "Tipo_Espacio" te ON te.id_tipo = e.id_tipo
      WHERE te.categoria = 'estacionamiento'
        AND NOT EXISTS (
          SELECT 1 FROM "Reserva" r
           WHERE r.id_espacio   = e.id_espacio
             AND r.fecha        = ${fecha}
             AND r.hora_inicio  < ${horaFin}
             AND r.hora_fin     > ${horaInicio}
        )
      ORDER BY
        z.id_zona ASC,   -- cambia este criterio si tienes zona gratuita vs pagada
        e.id_espacio ASC
      LIMIT 1
    `
    return rows[0] ?? null
  };
 
  /**
   * Crea la reserva para el espacio ya elegido.
   * Se llama dentro del lock, justo después de primerEspacioLibre().
   */
  static async crearReserva({ id_espacio, id_usuario, fecha, horaInicio, horaFin }) {
    const rows = await sql`
      INSERT INTO "Reserva" (id_espacio, id_usuario, fecha, hora_inicio, hora_fin)
      VALUES (${id_espacio}, ${id_usuario}, ${fecha}, ${horaInicio}, ${horaFin})
      RETURNING *
    `
    return rows[0]
  };
 
  /**
   * Snapshot de ocupación para una zona específica.
   * Se usa para emitir el evento WebSocket después de crear una reserva.
   */
  static async ocupacionDeZona(id_zona, { fecha, horaInicio, horaFin }) {
    const rows = await sql`
      SELECT
        COUNT(e.id_espacio)::int AS total,
        COUNT(e.id_espacio) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM "Reserva" r
             WHERE r.id_espacio  = e.id_espacio
               AND r.fecha       = ${fecha}
               AND r.hora_inicio < ${horaFin}
               AND r.hora_fin    > ${horaInicio}
          )
        )::int AS ocupados
      FROM "Espacio" e
      JOIN "Tipo_Espacio" te ON te.id_tipo = e.id_tipo
      WHERE e.id_zona = ${id_zona}
        AND te.categoria = 'estacionamiento'
    `
    const { total, ocupados } = rows[0]
    return { total, ocupados, disponibles: total - ocupados }
  };
}

module.exports = ModeloReserva;