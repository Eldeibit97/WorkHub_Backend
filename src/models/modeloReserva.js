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
    static async crearReserva(datosReserva) {
        try {
            const rows = await sql`
              INSERT INTO "Reserva" (id_usuario, id_espacio, fecha_reserva, hora_inicio, hora_fin, estado_reserva, fecha_creacion, tipo_reserva)
              VALUES (${datosReserva.idUsuario}, ${datosReserva.idEspacio}, ${datosReserva.fechaReserva}, ${datosReserva.horaInicio}, ${datosReserva.horaSalida}, 'PENDIENTE', ${datosReserva.fechaCreacion}, ${datosReserva.tipoReserva})
              RETURNING id_reserva
            `;
            const idReserva = rows.length > 0 ? rows[0].id_reserva : null;

            // Actualizar estado_actual del espacio a OCUPADO
            await sql`
                UPDATE "Espacio"
                SET
                    estado_actual = 'OCUPADO',
                    fecha_edicion = NOW()
                WHERE id_espacio = ${datosReserva.idEspacio}
            `;

            // Obtener id_zona del espacio para WebSocket
            const zoneInfo = await sql`SELECT id_zona FROM "Espacio" WHERE id_espacio = ${datosReserva.idEspacio}`;
            const id_zona = zoneInfo[0]?.id_zona;

            return {
                success: true,
                idReserva,
                idEspacio: datosReserva.idEspacio,
                idZona: id_zona
            };

        } catch (error) {
            console.log('No se realizo la reserva', error);
            return null;
        }
    };
}

module.exports = ModeloReserva;