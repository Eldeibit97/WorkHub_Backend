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
            const inserted = await sql`INSERT INTO "Reserva" (id_usuario, id_espacio, fecha_reserva, hora_inicio, hora_fin, estado_reserva, fecha_creacion, tipo_reserva)
                  VALUES (${datosReserva.idUsuario}, ${datosReserva.idEspacio}, ${datosReserva.fechaReserva}, ${datosReserva.horaInicio}, ${datosReserva.horaSalida}, 'PENDIENTE', ${datosReserva.fechaCreacion}, ${datosReserva.tipoReserva})`;
            return true;
        } catch (error) {
            console.log('No se realizo la reserva', error);
            return false;
        }
    };

    static async verificarReservaActiva(id_usuario) {
        if (!id_usuario) {
            return [];
        } else {
            try {
                const hasActive = await sql`SELECT EXISTS (SELECT 1 FROM "Reserva" WHERE id_usuario = ${id_usuario} AND estado_reserva IN ('ACTIVO', 'PENDIENTE'));`;
                return hasActive[0].exists;
            } catch (error) {
                console.error('Ocurrio un error al buscar reservas pendientes o activas');
                throw error;
            }
        }
    }
}

module.exports = ModeloReserva;