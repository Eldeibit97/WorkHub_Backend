const { sql } = require('../config/db.js');

const fetchReservationHistory = async (userId) => {
    try {
        result = await sql`
        SELECT
            r.id_reserva,
            r.fecha_reserva,
            r.hora_inicio,
            r.hora_fin,
            r.estado_reserva,
            r.tipo_reserva,
            r.check_in,
            r.check_out,
            r.observaciones,

            -- Space details
            e.codigo_espacio,
            e.nombre_espacio,
            e.estado_actual,

            -- Space type
            te.nombre_tipo,
            te.descripcion AS tipo_descripcion,

            -- Zone
            z.nombre_zona,
            z.descripcion AS zona_descripcion,
            z.edificio

        FROM public."Reserva" r
        JOIN public."Espacio" e    ON r.id_espacio    = e.id_espacio
        JOIN public."Tipo_Espacio" te ON e.id_tipo_espacio = te.id_tipo_espacio
        JOIN public."Zona" z       ON e.id_zona       = z.id_zona

        WHERE r.id_usuario = ${userId}
        AND r.estado_reserva NOT IN ('CANCELADO', 'EXPIRADO')

        ORDER BY r.fecha_reserva DESC
        LIMIT 10;
        `;
        return result;
    }
    catch (error){
        console.error("Error fetching reservation history:",error);
        throw error;
    }
}

const fetchInferredPreferences = async (userId) => {
    try {
        result = await sql`
        SELECT
            u.id_usuario,
            u.nombre,
            u.apellido,
            u.correo_institucional,
            u.rol,

            -- Most booked space type
            (
                SELECT te.nombre_tipo
                FROM public."Reserva" r2
                JOIN public."Espacio" e2    ON r2.id_espacio     = e2.id_espacio
                JOIN public."Tipo_Espacio" te ON e2.id_tipo_espacio = te.id_tipo_espacio
                WHERE r2.id_usuario = u.id_usuario
                AND r2.estado_reserva NOT IN ('CANCELADO', 'EXPIRADO')
                GROUP BY te.nombre_tipo
                ORDER BY COUNT(*) DESC
                LIMIT 1
            ) AS preferred_space_type,

            -- Most booked zone
            (
                SELECT z.nombre_zona
                FROM public."Reserva" r3
                JOIN public."Espacio" e3 ON r3.id_espacio = e3.id_espacio
                JOIN public."Zona" z    ON e3.id_zona     = z.id_zona
                WHERE r3.id_usuario = u.id_usuario
                AND r3.estado_reserva NOT IN ('CANCELADO', 'EXPIRADO')
                GROUP BY z.nombre_zona
                ORDER BY COUNT(*) DESC
                LIMIT 1
            ) AS preferred_zone,

            -- Most frequent day of week
            (
                SELECT TO_CHAR(r4.fecha_reserva, 'Day')
                FROM public."Reserva" r4
                WHERE r4.id_usuario = u.id_usuario
                AND r4.estado_reserva NOT IN ('CANCELADO', 'EXPIRADO')
                GROUP BY TO_CHAR(r4.fecha_reserva, 'Day'),
                        EXTRACT(DOW FROM r4.fecha_reserva)
                ORDER BY COUNT(*) DESC
                LIMIT 1
            ) AS preferred_day,

            -- Usual arrival time
            (
                SELECT AVG(
                    EXTRACT(HOUR FROM r5.hora_inicio) * 60 +
                    EXTRACT(MINUTE FROM r5.hora_inicio)
                )::INT
                FROM public."Reserva" r5
                WHERE r5.id_usuario = u.id_usuario
                AND r5.estado_reserva NOT IN ('CANCELADO', 'EXPIRADO')
            ) AS avg_arrival_minute,  -- divide by 60 in app to get hour

            -- Total reservations made
            (
                SELECT COUNT(*)
                FROM public."Reserva" r6
                WHERE r6.id_usuario = u.id_usuario
            ) AS total_reservations,

            -- No show count
            (
                SELECT COUNT(*)
                FROM public."Reserva" r7
                WHERE r7.id_usuario = u.id_usuario
                AND r7.estado_reserva = 'EXPIRADO'
                AND r7.check_in IS NULL
            ) AS no_show_count

        FROM public."Usuario" u
        WHERE u.id_usuario = ${userId};
        `;
        return result;
    }
    catch (error){
        console.error("Error fetching inferred preferences:",error);
        throw error;
    }
}

module.exports = { fetchReservationHistory, fetchInferredPreferences };