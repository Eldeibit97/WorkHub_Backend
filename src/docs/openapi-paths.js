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
 *         description: JWT (migración), usuario y cookie de sesión workhub.sid (usar fetch con credentials en el cliente)
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
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cerrar sesión
 *     description: Destruye la sesión en la base de datos y elimina la cookie workhub.sid. El cliente debe enviar cookies (credentials include). No requiere body.
 *     responses:
 *       204:
 *         description: Sesión cerrada
 *       500:
 *         description: Error al cerrar sesión
 *
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Usuario de la sesión actual
 *     description: Válido con cookie workhub.sid (credentials include) o Authorization Bearer. Útil para hidratar el estado en pestañas nuevas (sessionStorage no se comparte entre pestañas).
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Mismo shape que user en POST /api/auth/login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
 *                     rol:
 *                       type: string
 *       401:
 *         description: Sin sesión o token válido, o usuario inexistente
 *       500:
 *         description: Error del servidor
 *
 * /api/admin/assign-password:
 *   post:
 *     tags: [Admin]
 *     summary: Asignar contraseña a un usuario existente
 *     description: El usuario autenticado (cookie de sesión o JWT) debe estar en ADMIN_EMAILS del servidor.
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
 *             required: [id_reserva, id_usuario, fecha_reserva, hora_inicio, hora_fin, estado_reserva, tipo_reserva]
 *             properties:
 *               id_reserva:
 *                 type: integer
 *               id_usuario:
 *                 type: integer
 *               fecha_reserva:
 *                 type: string
 *               hora_inicio:
 *                 type: string
 *               hora_fin:
 *                 type: string
 *               estado_reserva:
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
 *
 * /api/tipos-espacio:
 *   get:
 *     tags: [Espacios]
 *     summary: Catálogo de tipos de espacio (editor y reservas)
 *     description: Solo tipos activos en producto — ids 1, 2 y 5.
 *     responses:
 *       200:
 *         description: Lista de tipos
 *
 * /api/admin/zonas/{id}/floor-layout:
 *   put:
 *     tags: [Admin]
 *     summary: Guardar layout de piso y CRUD de espacios
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: id_zona
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigoZona:
 *                 type: string
 *               viewBox:
 *                 type: string
 *               background:
 *                 type: string
 *               espacios:
 *                 type: array
 *                 items:
 *                   type: object
 *               eliminarIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Layout guardado (incluye espacios actualizados de la zona)
 *       400:
 *         description: Validación
 *       404:
 *         description: Zona no encontrada
 *       409:
 *         description: Código duplicado o reservas bloquean baja
 *
 * /api/purple-points/balance:
 *   get:
 *     tags: [PurplePoints]
 *     summary: Saldo, equipamiento activo e inventario del usuario
 *     description: Devuelve en una sola llamada todo lo necesario para inicializar el contexto de Purple Points en el frontend.
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Balance bundle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: integer
 *                   example: 350
 *                 equipped:
 *                   type: object
 *                   properties:
 *                     temaId:   { type: string, nullable: true, example: dracula }
 *                     avatarId: { type: string, nullable: true, example: null }
 *                     bannerId: { type: string, nullable: true, example: null }
 *                 inventory:
 *                   type: array
 *                   items: { type: string }
 *                   example: [dracula]
 *       401:
 *         description: Sesión o token requerido
 *
 * /api/purple-points/transactions:
 *   get:
 *     tags: [PurplePoints]
 *     summary: Historial paginado de transacciones
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Máximo 100
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Lista de transacciones y total
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       idTransaccion: { type: integer }
 *                       tipo:          { type: string, enum: [EARN_CREATE, EARN_CHECKOUT, PURCHASE, ADMIN_ADJUST] }
 *                       monto:         { type: integer, description: Positivo = ganancia, negativo = gasto }
 *                       descripcion:   { type: string, nullable: true }
 *                       creadoEn:      { type: string, format: date-time }
 *                 total:
 *                   type: integer
 *       401:
 *         description: Sesión o token requerido
 *
 * /api/purple-points/purchase:
 *   post:
 *     tags: [PurplePoints]
 *     summary: Compra un ítem del Mercado
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId]
 *             properties:
 *               itemId:
 *                 type: string
 *                 example: dracula
 *     responses:
 *       201:
 *         description: Compra exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:         { type: boolean }
 *                 newBalance: { type: integer }
 *                 itemId:     { type: string }
 *       400:
 *         description: itemId inválido o faltante
 *       401:
 *         description: Sesión o token requerido
 *       402:
 *         description: Saldo insuficiente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:    { type: string, example: insufficient_balance }
 *                 required: { type: integer }
 *                 current:  { type: integer }
 *       409:
 *         description: El ítem ya está en el inventario del usuario
 *
 * /api/purple-points/equip:
 *   post:
 *     tags: [PurplePoints]
 *     summary: Equipa o desequipa un ítem (tema, avatar o banner)
 *     description: Enviar itemId null en la categoría correspondiente para desequipar.
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category]
 *             properties:
 *               itemId:
 *                 type: string
 *                 nullable: true
 *                 example: dracula
 *               category:
 *                 type: string
 *                 enum: [theme, avatar, banner]
 *     responses:
 *       200:
 *         description: Ítem equipado (o desequipado)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 equipped:
 *                   type: object
 *                   properties:
 *                     temaId:   { type: string, nullable: true }
 *                     avatarId: { type: string, nullable: true }
 *                     bannerId: { type: string, nullable: true }
 *       400:
 *         description: category faltante o itemId inválido
 *       401:
 *         description: Sesión o token requerido
 *       403:
 *         description: El ítem no está en el inventario del usuario
 *
 * /api/purple-points/admin/adjust:
 *   post:
 *     tags: [PurplePoints]
 *     summary: Ajuste manual de saldo (solo admin)
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idUsuario, monto]
 *             properties:
 *               idUsuario:
 *                 type: integer
 *               monto:
 *                 type: integer
 *                 description: Positivo para crédito, negativo para débito
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Saldo ajustado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:         { type: boolean }
 *                 newBalance: { type: integer }
 *       400:
 *         description: Parámetros inválidos o saldo resultante negativo
 *       401:
 *         description: Sesión o token requerido
 *       403:
 *         description: Acceso denegado (se requiere rol admin)
 */

module.exports = {};
