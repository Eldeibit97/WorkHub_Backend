const { sql } = require('../config/db.js');

class ModeloReserva {
  static async encontrarPorId(id) {
    if(!id){
      return []
    }else{
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
        if(!id_usuario){
            return []
        }else{
            try {
                const reservas = await sql`SELECT * FROM "Reserva" WHERE id_usuario = ${id_usuario}`;
                return reservas;
            } catch (error) {
                console.error('Error al encontrar las reservas por ID de usuario:', error);
                throw error;
            }        
        }
    }
}

module.exports = ModeloReserva;