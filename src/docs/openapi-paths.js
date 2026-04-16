/**
 * @openapi
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Comprobación del servidor
 *     responses:
 *       200:
 *         description: Texto plano de estado
 *
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     description: Requiere que un administrador haya asignado contraseña (POST /api/admin/assign-password) o uso del script scripts/set-user-password.js.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo_institucional, password]
 *             properties:
 *               correo_institucional:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: JWT y datos públicos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id_usuario:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     apellido:
 *                       type: string
 *                     correo_institucional:
 *                       type: string
 *       400:
 *         description: Faltan correo o contraseña
 *       401:
 *         description: Credenciales inválidas
 *       403:
 *         description: Cuenta sin contraseña asignada
 *
 * /api/admin/assign-password:
 *   post:
 *     tags: [Admin]
 *     summary: Asignar contraseña a un usuario existente
 *     description: El correo del JWT debe estar en ADMIN_EMAILS del servidor.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo_institucional, password, confirmPassword]
 *             properties:
 *               correo_institucional:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña guardada (hash en BD)
 *       400:
 *         description: Validación (coincidencia, longitud mínima, campos)
 *       401:
 *         description: Sin token o token inválido
 *       403:
 *         description: No es administrador
 *       404:
 *         description: Correo no existe en Usuario
 *       503:
 *         description: ADMIN_EMAILS no configurado
 *
 * /api/reservando:
 *   post:
 *     tags: [Reservas]
 *     summary: Crear reserva de oficina
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mail, fecha, espacio, hora_llegada, hora_salida]
 *             properties:
 *               mail:
 *                 type: string
 *                 format: email
 *               fecha:
 *                 type: string
 *               espacio:
 *                 type: integer
 *               hora_llegada:
 *                 type: string
 *               hora_salida:
 *                 type: string
 *               fecha_creacion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reserva creada
 *       404:
 *         description: Campos faltantes o usuario no encontrado
 *       500:
 *         description: Error al crear reserva
 *
 * /api/reservas:
 *   get:
 *     tags: [Reservas]
 *     summary: Listar todas las reservas
 *     responses:
 *       200:
 *         description: Lista de reservas
 *
 * /api/reserva:
 *   get:
 *     tags: [Reservas]
 *     summary: Obtener reserva por ID
 *     description: El controlador actual lee id_reserva desde el body (no es lo habitual en GET).
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_reserva:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Reserva encontrada
 *       400:
 *         description: ID no proporcionado
 *       404:
 *         description: Reserva no encontrada
 *
 * /api/reserva/update:
 *   put:
 *     tags: [Reservas]
 *     summary: Actualizar reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_reserva, id_usuario, id_espacio, fecha_reserva, hora_inicio, hora_fin, estado_reserva, fecha_creacion, tipo_reserva]
 *             properties:
 *               id_reserva:
 *                 type: integer
 *               id_usuario:
 *                 type: integer
 *               id_espacio:
 *                 type: integer
 *               fecha_reserva:
 *                 type: string
 *               hora_inicio:
 *                 type: string
 *               hora_fin:
 *                 type: string
 *               estado_reserva:
 *                 type: string
 *               fecha_creacion:
 *                 type: string
 *               tipo_reserva:
 *                 type: string
 *     responses:
 *       200:
 *         description: Actualización correcta
 *       400:
 *         description: Datos incompletos
 *       404:
 *         description: Reserva no encontrada
 *       500:
 *         description: Error del servidor
 */

module.exports = {};
