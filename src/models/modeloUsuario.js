const { sql } = require('../config/db.js');

class ModeloUsuario {

  // Devuelve el usuario completo (incluyendo password_hash) o undefined si no se encuentra
  static async encontralPorMail(mail) {
    if (!mail) return undefined;
    const rows = await sql`
      SELECT * 
        FROM "Usuario" 
        WHERE correo_institucional = ${mail}
    `;
    return rows[0];
  }

  // Devuelve el usuario completo (incluyendo password_hash) o undefined si no se encuentra
  static async encontrarPorId(id_usuario) {
    if (!id_usuario) return undefined;
    const rows = await sql`
      SELECT * 
        FROM "Usuario" 
        WHERE id_usuario = ${id_usuario}
    `;
    return rows[0];
  }

  // Asigna una contraseña a un usuario que no tenía (usado para el primer admin)
  static async actualizarPasswordHash(id_usuario, hash) {
    await sql`
      UPDATE "Usuario" 
        SET password_hash = ${hash} 
        WHERE id_usuario = ${id_usuario}
    `;
  }

  // NUEVO: actualizar el rol de un usuario
  static async actualizarRol(id_usuario, rol) {
    const rows = await sql`
      UPDATE "Usuario"
        SET rol = ${rol}
        WHERE id_usuario = ${id_usuario}
      RETURNING id_usuario, nombre, apellido, correo_institucional, rol
    `;
    return rows[0];
  }

  // NUEVO: listar todos los usuarios (para el panel admin)
  static async listarTodos() {
    return await sql`
      SELECT id_usuario, nombre, apellido, correo_institucional, rol
        FROM "Usuario"
        ORDER BY nombre
    `;
  }
}

module.exports = ModeloUsuario;
