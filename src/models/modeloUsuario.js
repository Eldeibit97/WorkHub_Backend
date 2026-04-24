const { sql } = require('../config/db.js');

class ModeloUsuario {
  static async encontrarPorMail(mail) {
    try {
      if (!mail) {
        throw new Error('No se proporciono un correo')
        return {id_usuario: -1};
      }
      const rows = await sql`SELECT id_usuario FROM "Usuario" WHERE correo_institucional = ${mail}`;
      if(!rows.length){
        throw new Error('El correo no esta registrado o no existe');
      }
      return rows[0];
    } catch (error) {
      console.error(error.message ? error.message : 'Hubo un error al buscar el correo');
      return {id_usuario: -1};
    }
  }

  static async actualizarPasswordHash(id_usuario, hash) {
    await sql`UPDATE "Usuario" SET password_hash = ${hash} WHERE id_usuario = ${id_usuario}`;
  }
}

module.exports = ModeloUsuario;