const { sql } = require('../config/db.js');

class ModeloUsuario {
  static async encontralPorMail(mail) {
    if(!mail){
      return []
    }else{
      const [usuario] = await sql`SELECT * FROM "Usuario" WHERE correo_institucional = ${mail}`;
      return usuario;
    }
  };
}

module.exports = ModeloUsuario;