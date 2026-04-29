const { sql } = require('../config/db.js');

class ModeloUsuario {
  static async encontrarPorMail(mail) {
    try {
      if (!mail) {
        throw new Error('No se proporciono un correo')
        return { id_usuario: -1 };
      }
      const normalized = typeof mail === 'string' ? mail.trim().toLowerCase() : '';
      const rows = await sql`
        SELECT id_usuario, password_hash, correo_institucional, nombre, apellido, rol
          FROM "Usuario"
         WHERE LOWER(TRIM(correo_institucional)) = ${normalized}
      `;
      if (!rows.length) {
        throw new Error('El correo no esta registrado o no existe');
      }
      return rows[0];
    } catch (error) {
      console.error(error.message ? error.message : 'Hubo un error al buscar el correo');
      return { id_usuario: -1 };
    }
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

  static async listarPaginado({ search, roleFilter, limit, offset }) {
    const s = typeof search === 'string' ? search.trim() : '';
    const r = typeof roleFilter === 'string' ? roleFilter.trim() : '';
    const pattern = s === '' ? null : `%${s}%`;

    let totalRows;
    let dataRows;

    if (!pattern && !r) {
      totalRows = await sql`SELECT COUNT(*)::int AS c FROM "Usuario"`;
      dataRows = await sql`
        SELECT id_usuario, nombre, apellido, correo_institucional, rol
          FROM "Usuario"
         ORDER BY id_usuario DESC
         LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (pattern && !r) {
      totalRows = await sql`
        SELECT COUNT(*)::int AS c
          FROM "Usuario"
         WHERE nombre ILIKE ${pattern}
            OR apellido ILIKE ${pattern}
            OR correo_institucional ILIKE ${pattern}
      `;
      dataRows = await sql`
        SELECT id_usuario, nombre, apellido, correo_institucional, rol
          FROM "Usuario"
         WHERE nombre ILIKE ${pattern}
            OR apellido ILIKE ${pattern}
            OR correo_institucional ILIKE ${pattern}
         ORDER BY id_usuario DESC
         LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (!pattern && r) {
      totalRows = await sql`
        SELECT COUNT(*)::int AS c FROM "Usuario" WHERE rol = ${r}
      `;
      dataRows = await sql`
        SELECT id_usuario, nombre, apellido, correo_institucional, rol
          FROM "Usuario"
         WHERE rol = ${r}
         ORDER BY id_usuario DESC
         LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      totalRows = await sql`
        SELECT COUNT(*)::int AS c
          FROM "Usuario"
         WHERE rol = ${r}
           AND (
                nombre ILIKE ${pattern}
             OR apellido ILIKE ${pattern}
             OR correo_institucional ILIKE ${pattern}
           )
      `;
      dataRows = await sql`
        SELECT id_usuario, nombre, apellido, correo_institucional, rol
          FROM "Usuario"
         WHERE rol = ${r}
           AND (
                nombre ILIKE ${pattern}
             OR apellido ILIKE ${pattern}
             OR correo_institucional ILIKE ${pattern}
           )
         ORDER BY id_usuario DESC
         LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    const total = totalRows[0]?.c ?? 0;
    return { rows: dataRows, total };
  }

  static async contarPorRol(rol) {
    const rows = await sql`
      SELECT COUNT(*)::int AS c FROM "Usuario" WHERE rol = ${rol}
    `;
    return rows[0]?.c ?? 0;
  }

  static async crearUsuario({ nombre, apellido, correo_institucional, password_hash, rol }) {
    const rows = await sql`
      INSERT INTO "Usuario" (nombre, apellido, correo_institucional, password_hash, rol)
      VALUES (${nombre}, ${apellido}, ${correo_institucional}, ${password_hash}, ${rol})
      RETURNING id_usuario, nombre, apellido, correo_institucional, rol
    `;
    return rows[0];
  }

  static async actualizarPerfil(id_usuario, nombre, apellido, correo_institucional) {
    const rows = await sql`
      UPDATE "Usuario"
         SET nombre = ${nombre},
             apellido = ${apellido},
             correo_institucional = ${correo_institucional}
       WHERE id_usuario = ${id_usuario}
   RETURNING id_usuario, nombre, apellido, correo_institucional, rol
    `;
    return rows[0];
  }

  static async eliminarPorId(id_usuario) {
    const rows = await sql`
      DELETE FROM "Usuario"
       WHERE id_usuario = ${id_usuario}
   RETURNING id_usuario, rol
    `;
    return rows[0];
  }
}

module.exports = ModeloUsuario;