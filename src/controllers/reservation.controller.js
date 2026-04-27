const { sql } = require('../config/db.js');
const modeloUsuario = require('../models/modeloUsuario.js');
const modeloReserva = require('../models/modeloReserva.js');
const reservationService = require('../services/reservation.service.js');
const { fetchReservations, fetchAvailability } = require('../services/reservation.service');

const getUsers = async (req, res) => {
  const users = await sql`SELECT * FROM "Usuario"`;
  res.json(users)
};

const getReservations = async (req, res) => {
  try {
    const { userId, status } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const reservations = await fetchReservations(userId, status);

    res.json(reservations);

  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ message: 'Error fetching reservations' });
  }
};

const getReservas = async (req, res) => {
  const reservas = await sql`SELECT * FROM "Reserva"`;
  res.json(reservas)
};

const getReservaByID = async (req, res) => {
  const { id_reserva } = req.params;

  if (id_reserva === undefined) {
    return res.status(400).json({ error: 'ID de reserva no proporcionado' });
  }

  const reserva = await modeloReserva.encontrarPorId(id_reserva);

  if (!reserva || reserva.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Reserva con este ID no encontrada'
    });
  } else {
    res.json(reserva);
  }
};

const updateReserva = async (req, res) => {
  const { id_reserva, id_usuario, id_espacio, fecha_reserva, hora_inicio, hora_fin, estado_reserva, fecha_creacion, tipo_reserva } = req.body;

  if (id_reserva === undefined || !id_usuario || !id_espacio || !fecha_reserva || !hora_inicio || !hora_fin || !estado_reserva || !fecha_creacion || !tipo_reserva) {
    res.status(400).json({ error: 'Datos incompletos para actualizar la reserva' });
    return;
  }

  const reservas = await modeloReserva.encontrarPorId(id_reserva);


  if (!reservas || reservas.length === 0) {
    return res.status(404).json({
      success: false,
      error: "Reserva con ese ID no fue encontrado"
    });
  }

  try {
    const query = await sql`UPDATE "Reserva" 
        SET id_espacio = ${id_espacio}, fecha_reserva = ${fecha_reserva}, hora_inicio = ${hora_inicio}, hora_fin = ${hora_fin}, estado_reserva = ${estado_reserva}, fecha_creacion = ${fecha_creacion}, tipo_reserva = ${tipo_reserva}
        WHERE id_reserva = ${id_reserva} RETURNING *`;
    res.json({
      success: true,
      message: 'Reserva actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar la reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la reserva'
    });
  }
};

const checkAvailability = async (req, res) => {
    try {
        const { date, zona } = req.query; // <--- Agregamos 'zona'

        if (!date || !zona) {
            return res.status(400).json({ 
                message: 'Faltan parámetros: date (YYYY-MM-DD) y zona (ID de zona) son requeridos' 
            });
        }

        // Ahora le pasamos ambos parámetros al servicio
        const availability = await fetchAvailability(date, zona);

        res.json(availability);

    } catch (error) {
        console.error("Error checking availability:", error);
        res.status(500).json({ message: 'Error checking availability' });
    }
};

const createReserva = async (req, res) => {
  try {
    const datos = req.body || {};
    if (!datos) {
      res.status(204).json({ message: "No se enviaron datos por parte del usuario" });
    }
    if (!datos.mail || !datos.fechaReserva || !datos.idEspacio || !datos.horaInicio || !datos.horaSalida || !datos.fechaCreacion) {
      res.status(400).json({ message: "Todos los campos deben ser llenados" });
    }
    const response = await reservationService.reservarEspacio(datos);
    res.status(response.status).json({ message: response.message })
  } catch (error) {
    console.error('Error creando la reserva', error);
    res.status(400).json({ message: "Error al crear la reserva" });
  }
};

//Check-in reserva logica
const checkInReserva = async (req, res) => {
  try {
    const { id_reserva } = req.body;

    if (!id_reserva) {
      return res.status(400).json({ message: 'id_reserva es requerido' });
    }

    // 1. Buscar reserva
    const reserva = await modeloReserva.encontrarPorId(id_reserva);

    if (!reserva || reserva.length === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    const r = reserva[0];

    // 2. Validar estado
    if (r.estado_reserva === 'CHECKED_IN') {
        return res.status(400).json({ message: 'Ya se hizo check-in' });
    }

    if (r.estado_reserva !== 'ACTIVO') {
        return res.status(400).json({ message: 'La reserva no está activa' });
    }

    // 3. Validar ventana de tiempo (ej: 15 min antes y después)
    const ahora = new Date();

    const fechaReserva = new Date(r.fecha_reserva);

    const [hora, minutos, segundos] = r.hora_inicio.split(':');

    fechaReserva.setHours(parseInt(hora),parseInt(minutos),parseInt(segundos || 0));

    const antes = 15 * 60 * 1000;

    const despues = 30 * 60 * 1000;

    const inicioVentana = new Date(fechaReserva.getTime() - antes);
    const finVentana = new Date(fechaReserva.getTime() + despues);

    if (ahora < inicioVentana || ahora > finVentana) {
      return res.status(400).json({
        message: 'Fuera de la ventana permitida para check-in'
      });
    }

    // 4. Update
    await sql`
      UPDATE "Reserva"
      SET estado_reserva = 'CHECKED_IN',
          check_in = NOW(),
          fecha_edicion = NOW()
      WHERE id_reserva = ${id_reserva}
    `;

    res.json({
      success: true,
      message: 'Check-in realizado correctamente'
    });

  } catch (error) {
    console.error('Error en check-in:', error);
    res.status(500).json({ message: 'Error en check-in' });
  }
};

// Check-out reserva lógica
const checkOutReserva = async (req, res) => {
  try {
    const { id_reserva } = req.body; 

    if (!id_reserva) {
      return res.status(400).json({ success: false, message: 'id_reserva es requerido' });
    }

    const result = await sql`
      UPDATE "Reserva"
      SET estado_reserva = 'COMPLETADO',
          check_out = CURRENT_TIMESTAMP, /* CURRENT_TIMESTAMP es más estándar y seguro con timezones en SQL */
          fecha_edicion = CURRENT_TIMESTAMP
      WHERE id_reserva = ${id_reserva}
        AND estado_reserva = 'CHECKED_IN' /* REGLA ESTRICTA: Solo actualiza si ESTÁ en CHECKED_IN */
      RETURNING *;
    `;

    if (!result || result.length === 0) {
      
      const reservaCheck = await modeloReserva.encontrarPorId(id_reserva);
      
      if (!reservaCheck || reservaCheck.length === 0) {
        return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
      }

      const estadoActual = reservaCheck[0].estado_reserva;

      if (estadoActual === 'COMPLETADO') {
        return res.status(400).json({ success: false, message: 'El check-out ya fue realizado previamente' });
      }
      if (estadoActual === 'ACTIVO') {
        return res.status(400).json({ success: false, message: 'No puedes hacer check-out porque aún no has hecho check-in' });
      }
      
      return res.status(400).json({ success: false, message: `No se puede hacer check-out desde el estado: ${estadoActual}` });
    }

    res.json({
      success: true,
      message: 'Check-out realizado y espacio liberado correctamente',
      data: result[0]
    });

  } catch (error) {
    console.error('Error en check-out:', error);
    res.status(500).json({ success: false, message: 'Error interno al procesar el check-out' });
  }
};

module.exports = { getReservations, getUsers, getReservas, getReservaByID, updateReserva, checkAvailability, checkInReserva, createReserva, checkOutReserva };
