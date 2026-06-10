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
 *     description: >
 *       Devuelve la disponibilidad de espacios para una fecha y zona dadas.
 *       Si se añaden horaInicio y horaFin se filtra por franja horaria.
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: '2026-04-23'
 *         description: Fecha a consultar (YYYY-MM-DD)
 *       - in: query
 *         name: zona
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID de la zona (también acepta zonaId)
 *       - in: query
 *         name: horaInicio
 *         required: false
 *         schema:
 *           type: string
 *           example: '08:00'
 *         description: Hora de inicio de franja (HH:MM). Requiere horaFin.
 *       - in: query
 *         name: horaFin
 *         required: false
 *         schema:
 *           type: string
 *           example: '10:00'
 *         description: Hora de fin de franja (HH:MM). Requiere horaInicio.
 *     responses:
 *       200:
 *         description: Datos de disponibilidad
 *       400:
 *         description: Faltan parámetros date/fecha y zona/zonaId
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
 *
 * /api/admin/roles:
 *   get:
 *     tags: [Admin]
 *     summary: Catálogo de roles disponibles
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Lista de roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [admin, employee]
 *       403:
 *         description: Acceso denegado
 *
 * /api/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Estadísticas generales del sistema
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: Fecha de inicio del rango (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: Fecha de fin del rango (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Estadísticas del sistema
 *       400:
 *         description: Rango de fechas inválido
 *       403:
 *         description: Acceso denegado
 *
 * /api/admin/no-shows/heatmap:
 *   get:
 *     tags: [Admin]
 *     summary: Heatmap de no-shows por día/hora
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Datos del heatmap
 *       403:
 *         description: Acceso denegado
 *
 * /api/admin/no-shows/floor-heatmap:
 *   get:
 *     tags: [Admin]
 *     summary: Heatmap de no-shows por espacio en un piso
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: zonaId
 *         required: true
 *         schema: { type: integer }
 *         description: ID de la zona (piso)
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Datos del heatmap por espacio
 *       400:
 *         description: zonaId inválido
 *       403:
 *         description: Acceso denegado
 *
 * /api/admin/no-shows/by-user:
 *   get:
 *     tags: [Admin]
 *     summary: No-shows agrupados por usuario
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Lista de usuarios con conteo de no-shows
 *       403:
 *         description: Acceso denegado
 *
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Listar usuarios (paginado)
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 12 }
 *         description: Máximo 100
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Buscar por nombre, apellido o correo
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, employee] }
 *     responses:
 *       200:
 *         description: Página de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuarios:
 *                   type: array
 *                   items: { type: object }
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       400:
 *         description: Filtro role inválido
 *       403:
 *         description: Acceso denegado
 *   post:
 *     tags: [Admin]
 *     summary: Crear usuario
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, apellido, correo_institucional, rol, password]
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               correo_institucional:
 *                 type: string
 *                 format: email
 *               rol:
 *                 type: string
 *                 enum: [admin, employee]
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario: { type: object }
 *       400:
 *         description: Campos requeridos faltantes o rol inválido
 *       403:
 *         description: Acceso denegado
 *       409:
 *         description: Correo ya registrado
 *
 * /api/admin/users/import-csv:
 *   post:
 *     tags: [Admin]
 *     summary: Importar usuarios desde CSV (array JSON)
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [users]
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nombre: { type: string }
 *                     apellido: { type: string }
 *                     correo_institucional: { type: string, format: email }
 *                     rol: { type: string, enum: [admin, employee] }
 *                     password: { type: string }
 *     responses:
 *       200:
 *         description: Resultado del import (creados, omitidos, errores)
 *       400:
 *         description: users debe ser un array
 *       403:
 *         description: Acceso denegado
 *
 * /api/admin/users/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Actualizar perfil de usuario
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *               apellido: { type: string }
 *               correo_institucional: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario: { type: object }
 *       400:
 *         description: id inválido
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: Correo ya en uso
 *   delete:
 *     tags: [Admin]
 *     summary: Eliminar usuario
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Usuario eliminado
 *       400:
 *         description: id inválido o último administrador
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Usuario no encontrado
 *
 * /api/admin/users/{id}/password:
 *   patch:
 *     tags: [Admin]
 *     summary: Cambiar contraseña de un usuario
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       400:
 *         description: id inválido o contraseña muy corta
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Usuario no encontrado
 *
 * /api/admin/users/{id}/roles:
 *   patch:
 *     tags: [Admin]
 *     summary: Actualizar roles de un usuario
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roles]
 *             properties:
 *               roles:
 *                 type: array
 *                 items: { type: string, enum: [admin, employee] }
 *     responses:
 *       200:
 *         description: Roles actualizados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 usuario: { type: object }
 *       400:
 *         description: id inválido o no se puede quitar el último admin
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Usuario no encontrado
 *
 * /api/admin/users/{id}/reservations:
 *   get:
 *     tags: [Admin]
 *     summary: Listar reservas de un usuario (paginado)
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filtrar por estado (PENDIENTE, ACTIVO, CANCELADO, COMPLETADO, CHECKED_IN)
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200:
 *         description: Reservas del usuario
 *       400:
 *         description: Parámetros inválidos
 *       403:
 *         description: Acceso denegado
 *
 * /api/admin/users/{id}/reservations/{reservationId}/cancel:
 *   patch:
 *     tags: [Admin]
 *     summary: Cancelar una reserva de un usuario
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID del usuario
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Reserva cancelada correctamente
 *       400:
 *         description: Estado no cancelable
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Reserva no encontrada
 *
 * /api/reservas/batch:
 *   post:
 *     tags: [Reservas]
 *     summary: Crear múltiples reservas en lote
 *     description: Requiere autenticación con rol admin o employee.
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reservas]
 *             properties:
 *               reservas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     idEspacio: { type: integer }
 *                     fechaReserva: { type: string, format: date }
 *                     horaInicio: { type: string, example: '08:00' }
 *                     horaSalida: { type: string, example: '10:00' }
 *     responses:
 *       201:
 *         description: Reservas creadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 creadas: { type: integer }
 *                 ids: { type: array, items: { type: integer } }
 *                 reservas: { type: array, items: { type: object } }
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Sin autenticación
 *       403:
 *         description: Rol insuficiente
 *       500:
 *         description: Error al crear reservas
 *
 * /api/reservas/check-in:
 *   put:
 *     tags: [Reservas]
 *     summary: Realizar check-in de una reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_reserva]
 *             properties:
 *               id_reserva:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Check-in realizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *       400:
 *         description: id_reserva requerido o estado no válido para check-in
 *       404:
 *         description: Reserva no encontrada
 *       500:
 *         description: Error en check-in
 *
 * /api/reservas/check-out:
 *   put:
 *     tags: [Reservas]
 *     summary: Realizar check-out de una reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_reserva]
 *             properties:
 *               id_reserva:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Check-out realizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *       400:
 *         description: id_reserva requerido o estado no válido para check-out
 *       404:
 *         description: Reserva no encontrada
 *       500:
 *         description: Error en check-out
 *
 * /api/reservas/bloquear-temporal:
 *   post:
 *     tags: [Reservas]
 *     summary: Bloquear espacios temporalmente (5 min) durante el flujo de reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_espacios, id_zona]
 *             properties:
 *               id_espacios:
 *                 type: array
 *                 items: { type: integer }
 *               id_zona:
 *                 type: integer
 *               socketId:
 *                 type: string
 *                 description: Socket ID del cliente para liberar al desconectar
 *     responses:
 *       200:
 *         description: Espacios bloqueados temporalmente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *       400:
 *         description: id_espacios o id_zona requeridos
 *       500:
 *         description: Error bloqueando espacios
 *
 * /api/reservas/liberar-temporal:
 *   post:
 *     tags: [Reservas]
 *     summary: Liberar espacios bloqueados temporalmente
 *     description: También acepta texto plano (sendBeacon). Los campos pueden enviarse como id_espacios/id_zona o espacios/zonaId.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_espacios:
 *                 type: array
 *                 items: { type: integer }
 *               id_zona:
 *                 type: integer
 *               socketId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Espacios liberados
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error liberando espacios
 *
 * /api/reservas/tiene-reserva:
 *   get:
 *     tags: [Reservas]
 *     summary: Verificar si el usuario tiene una reserva activa
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha a verificar (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Resultado de la búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendiente: { type: boolean }
 *       400:
 *         description: Error al buscar reserva o parámetros faltantes
 *
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Listar todos los usuarios (solo admin)
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuarios:
 *                   type: array
 *                   items: { type: object }
 *       401:
 *         description: Sin autenticación
 *       403:
 *         description: Acceso denegado
 *       500:
 *         description: Error del servidor
 *
 * /api/users/{id}/rol:
 *   patch:
 *     tags: [Users]
 *     summary: Reasignar rol a un usuario (solo admin)
 *     security:
 *       - bearerAuth: []
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rol]
 *             properties:
 *               rol:
 *                 type: string
 *                 enum: [admin, employee]
 *     responses:
 *       200:
 *         description: Rol actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 usuario: { type: object }
 *       400:
 *         description: Rol inválido o intento de quitarse el propio rol admin
 *       401:
 *         description: Sin autenticación
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Usuario no encontrado
 *
 * /api/zonas:
 *   get:
 *     tags: [Espacios]
 *     summary: Listar todas las zonas
 *     responses:
 *       200:
 *         description: Lista de zonas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idZona:        { type: integer }
 *                   nombreZona:    { type: string }
 *                   edificio:      { type: string, nullable: true }
 *                   descripcion:   { type: string, nullable: true }
 *                   codigoZona:    { type: string, nullable: true }
 *                   viewBox:       { type: string, nullable: true }
 *                   background:    { type: string, nullable: true }
 *       500:
 *         description: Error al listar zonas
 *
 * /api/spaces:
 *   get:
 *     tags: [Espacios]
 *     summary: Listar espacios activos de una zona
 *     parameters:
 *       - in: query
 *         name: zonaId
 *         required: true
 *         schema: { type: integer }
 *         description: ID de la zona
 *     responses:
 *       200:
 *         description: Lista de espacios activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idEspacio:      { type: integer }
 *                   zonaId:         { type: integer }
 *                   codigoEspacio:  { type: string }
 *                   nombreEspacio:  { type: string }
 *                   idTipoEspacio:  { type: integer }
 *                   tipo:           { type: string }
 *                   activo:         { type: boolean }
 *                   estadoActual:   { type: string }
 *                   nombreZona:     { type: string }
 *                   edificio:       { type: string, nullable: true }
 *                   shape:          { type: string, enum: [circle, rect] }
 *                   x:              { type: number, nullable: true }
 *                   y:              { type: number, nullable: true }
 *                   r:              { type: number, nullable: true }
 *                   w:              { type: number, nullable: true }
 *                   h:              { type: number, nullable: true }
 *       400:
 *         description: zonaId es requerido (número)
 *       404:
 *         description: Zona no encontrada
 *       500:
 *         description: Error al listar espacios
 *
 * /api/spaces/availability:
 *   get:
 *     tags: [Espacios]
 *     summary: Disponibilidad de espacios por zona y franja horaria
 *     parameters:
 *       - in: query
 *         name: zonaId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema: { type: string, format: date, example: '2026-06-09' }
 *       - in: query
 *         name: horaInicio
 *         required: true
 *         schema: { type: string, example: '08:00' }
 *       - in: query
 *         name: horaFin
 *         required: true
 *         schema: { type: string, example: '10:00' }
 *     responses:
 *       200:
 *         description: Mapa de idEspacio → estado (DISPONIBLE | OCUPADO | BLOQUEADO_TEMPORAL)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: string
 *                 enum: [DISPONIBLE, OCUPADO, BLOQUEADO_TEMPORAL]
 *       400:
 *         description: Parámetros requeridos faltantes o inválidos
 *       404:
 *         description: Zona no encontrada
 *       500:
 *         description: Error al consultar disponibilidad
 *
 * /api/spaces/{idEspacio}/schedule:
 *   get:
 *     tags: [Espacios]
 *     summary: Bloques de agenda de un espacio para una fecha
 *     parameters:
 *       - in: path
 *         name: idEspacio
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema: { type: string, format: date, example: '2026-06-09' }
 *     responses:
 *       200:
 *         description: Bloques horarios del espacio (LIBRE | OCUPADO)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   inicio:  { type: string, example: '08:00' }
 *                   fin:     { type: string, example: '10:00' }
 *                   estado:  { type: string, enum: [LIBRE, OCUPADO] }
 *       400:
 *         description: id de espacio o fecha inválidos
 *       404:
 *         description: Espacio no encontrado
 *       500:
 *         description: Error al obtener horario
 */

module.exports = {};
