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
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'date parameter is required (YYYY-MM-DD)' });
    }

    const availability = await fetchAvailability(date);

    res.json(availability);

  }
  catch (error) {
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
    console.log('Codigo y mensaje', response.status, response.message);
    res.status(response.status).json({ message: response.message })
  } catch (error) {
    console.error('Error creando la reserva', error);
    res.status(400).json({ message: "Error al crear la reserva" });
  }
};

module.exports = { getReservations, getUsers, getReservas, getReservaByID, updateReserva, createReserva, checkAvailability };