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
}

module.exports = ModeloReserva;