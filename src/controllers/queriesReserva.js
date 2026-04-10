const { sql } = require('../config/db.js');
const modeloUsuario = require('../models/modeloUsuario.js')

exports.createReservaOficina = async (req,res) => {
    const { mail, fecha, espacio, hora_llegada, hora_salida, fecha_creacion} = req.body;
    const usuario = await modeloUsuario.encontralPorMail(mail);
    if(!mail || !fecha || !espacio || !hora_llegada || !hora_salida){
      res.status(404).json({error: "Todos los campos deben ser llenados"})
    }

    if (!usuario || usuario.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Usuario con ese correo no fue encontrado" 
      });
    }

    try{
      const query = await sql`INSERT INTO "Reserva" (id_usuario, id_espacio, fecha_reserva, hora_inicio, hora_fin, estado_reserva, fecha_creacion, tipo_reserva)
                              VALUES (${usuario["id_usuario"]}, ${espacio}, ${fecha}, ${hora_llegada}, ${hora_salida}, 'ACTIVO', ${fecha_creacion}, 'INDIVIDUAL')`;
      res.status(201).json({mensaje: "Reserva creada exitosamente"})
    }catch(error){
      console.error('Error creando la reserva', error)
      res.status(500).json({error: "Error al crear reserva"});
    }
};

/*exports.createReservaEstacionamiento() = async (req, res) => {
  Por hacer
};*/