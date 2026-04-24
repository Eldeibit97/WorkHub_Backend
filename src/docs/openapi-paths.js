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
 *             required: [mail, fechaReserva, idEspacio, horaInicio, horaSalida]
 *             properties:
 *               mail:
 *                 type: string
 *                 format: email
 *               fechaReserva:
 *                 type: string
 *               idEspacio:
 *                 type: integer
 *               horaInicio:
 *                 type: string
 *               horaSalida:
 *                 type: string
 *               fechaCreacion:
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
 * /api/reservas/{id_reserva}:
 *   get:
 *     tags: [Reservas]
 *     summary: Obtener reserva por ID
 *     parameters:
 *       - in: path
 *         name: id_reserva
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: Reserva encontrada
 *       400:
 *         description: ID no proporcionado
 *       404:
 *         description: Reserva no encontrada
 *
 * /api/reservas/update:
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
 *
 * /api/reservas/consulta:
 *   get:
 *     tags: [Reservas]
 *     summary: Consultar reservas de un usuario
 *     description: Devuelve todas las reservas del usuario indicado. Opcionalmente filtra por estado.
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario cuyas reservas se quieren consultar
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           example: activa
 *         description: Filtrar por estado de la reserva (ej. activa, cancelada, completada)
 *     responses:
 *       200:
 *         description: Lista de reservas del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_reserva:
 *                     type: integer
 *                   fecha_reserva:
 *                     type: string
 *                   hora_inicio:
 *                     type: string
 *                   hora_fin:
 *                     type: string
 *                   estado_reserva:
 *                     type: string
 *                   tipo_reserva:
 *                     type: string
 *                   nombre_espacio:
 *                     type: string
 *                   codigo_espacio:
 *                     type: string
 *                   nombre_zona:
 *                     type: string
 *                   edificio:
 *                     type: string
 *                   nombre_tipo:
 *                     type: string
 *       400:
 *         description: userId es requerido
 *       500:
 *         description: Error al consultar reservas
 *
 * /api/reservas/disponibilidad:
 *   get:
 *     tags: [Reservas]
 *     summary: Consultar disponibilidad de espacios
 *     description: Devuelve la disponibilidad de espacios para una fecha dada.
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: '2026-04-23'
 *         description: Fecha a consultar (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Datos de disponibilidad
 *       400:
 *         description: Parámetro date requerido
 *       500:
 *         description: Error al consultar disponibilidad
 *
 * /api/usuarios:
 *   get:
 *     tags: [Admin]
 *     summary: Listar todos los usuarios
 *     responses:
 *       200:
 *         description: Lista de todos los usuarios registrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *
 * /api/preferencias/historial/{userId}:
 *   get:
 *     tags: [Preferencias]
 *     summary: Historial de reservas del usuario
 *     description: Devuelve las últimas 10 reservas activas del usuario con detalles del espacio, tipo y zona.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Historial de reservas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_reserva:
 *                     type: integer
 *                   fecha_reserva:
 *                     type: string
 *                   hora_inicio:
 *                     type: string
 *                   hora_fin:
 *                     type: string
 *                   estado_reserva:
 *                     type: string
 *                   tipo_reserva:
 *                     type: string
 *                   check_in:
 *                     type: string
 *                   check_out:
 *                     type: string
 *                   observaciones:
 *                     type: string
 *                   codigo_espacio:
 *                     type: string
 *                   nombre_espacio:
 *                     type: string
 *                   estado_actual:
 *                     type: string
 *                   nombre_tipo:
 *                     type: string
 *                   tipo_descripcion:
 *                     type: string
 *                   nombre_zona:
 *                     type: string
 *                   zona_descripcion:
 *                     type: string
 *                   edificio:
 *                     type: string
 *       400:
 *         description: userId requerido
 *       500:
 *         description: Error al obtener historial
 *
 * /api/preferencias/inferidas/{userId}:
 *   get:
 *     tags: [Preferencias]
 *     summary: Preferencias inferidas del usuario
 *     description: Infiere las preferencias del usuario a partir de su historial de reservas (tipo de espacio, zona, día y hora habitual).
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Preferencias inferidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_usuario:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 apellido:
 *                   type: string
 *                 correo_institucional:
 *                   type: string
 *                 rol:
 *                   type: string
 *                 preferred_space_type:
 *                   type: string
 *                   description: Tipo de espacio más reservado
 *                 preferred_zone:
 *                   type: string
 *                   description: Zona más reservada
 *                 preferred_day:
 *                   type: string
 *                   description: Día de la semana más frecuente
 *                 avg_arrival_minute:
 *                   type: integer
 *                   description: Minuto promedio de llegada desde medianoche (dividir entre 60 para obtener hora)
 *                 total_reservations:
 *                   type: integer
 *                 no_show_count:
 *                   type: integer
 *       400:
 *         description: userId requerido
 *       500:
 *         description: Error al obtener preferencias inferidas
 */

module.exports = {};
