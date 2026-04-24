const { sql } = require('../config/db.js');
const modeloReserva = require('../models/modeloReserva.js');

exports.getUsers = async (req,res) => {
    const users = await sql`SELECT * FROM "Usuario"`;
    res.json(users)
};

exports.getReservas = async (req,res) => {
    const reservas = await sql`SELECT * FROM "Reserva"`;
    res.json(reservas)
};

exports.getReservaByID = async (req,res) => {
    const { id_reserva } = req.params;

    if (id_reserva === undefined) {
        return res.status(400).json({ error: 'ID de reserva no proporcionado' });
    }

    const reserva = await modeloReserva.encontrarPorId(id_reserva);

    if(!reserva || reserva.length === 0){ 
        return res.status(404).json({ 
            success: false,
            message: 'Reserva con este ID no encontrada'
        });
    } else {
        res.json(reserva);
    }
};

exports.updateReserva = async (req, res) => {
    const {id_reserva, id_usuario, id_espacio, fecha_reserva, hora_inicio, hora_fin, estado_reserva, fecha_creacion, tipo_reserva} = req.body;
    
    if (id_reserva === undefined || !id_usuario || !id_espacio || !fecha_reserva || !hora_inicio || !hora_fin || !estado_reserva || !fecha_creacion || !tipo_reserva) {
        res.status(400).json({ error: 'Datos incompletos para actualizar la reserva' });
        return;
    }

    const reservas = await modeloReserva.encontrarPorId(id_reserva);


    if (!reservas || reservas.length === 0) {
        return res.status(404).json({ 
        success: false,
        error: "Reserva con ese ID no fue encontrado" 
      });
    }

    try {
        const query = await sql`UPDATE "Reserva" 
        SET id_espacio = ${id_espacio}, fecha_reserva = ${fecha_reserva}, hora_inicio = ${hora_inicio}, hora_fin = ${hora_fin}, estado_reserva = ${estado_reserva}, fecha_creacion = ${fecha_creacion}, tipo_reserva = ${tipo_reserva}
        WHERE id_reserva = ${id_reserva} RETURNING *`;
        res.json({ 
            success: true,
            message: 'Reserva actualizada exitosamente'
        });
    }catch (error) {
        console.error('Error al actualizar la reserva:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error al actualizar la reserva'
        });
    }
};
exports.deleteReserva = async (req, res) => {
    const { id_reserva } = req.params; 

    try {
        const result = await sql`DELETE FROM "Reserva" WHERE id_reserva = ${id_reserva} RETURNING *`;

        if (result.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No se encontró la reserva para eliminar' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Reserva eliminada correctamente' 
        });
    } catch (error) {
        console.error('Error al eliminar:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor al eliminar' 
        });
    }
};
