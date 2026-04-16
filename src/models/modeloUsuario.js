const { sql } = require('../config/db.js');

class ModeloUsuario {
  static async encontralPorMail(mail) {
    if (!mail) {
      return undefined;
    }
    const rows = await sql`SELECT * FROM "Usuario" WHERE correo_institucional = ${mail}`;
    return rows[0];
  }

  static async actualizarPasswordHash(id_usuario, hash) {
    await sql`UPDATE "Usuario" SET password_hash = ${hash} WHERE id_usuario = ${id_usuario}`;
  }
}

module.exports = ModeloUsuario;
