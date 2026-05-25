'use strict';

const modeloReserva  = require('../models/modeloReserva.js');
const reservationSvc = require('../services/reservation.service.js');
const {
  fetchAvailabilityWindow,
  createReservationsBatch,
} = reservationSvc;

const getUsers = async (req, res) => {
  try {
    const { sql } = require('../config/db.js');
    const users = await sql`SELECT * FROM "Usuario"`;
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// ─── GET /reservas ────────────────────────────────────────────────────────────
const getReservas = async (req, res) => {
  try {
    const reservas = await reservationSvc.fetchAllReservas();
    res.json(reservas);
  } catch (error) {
    console.error('Error fetching all reservas:', error);
    res.status(500).json({ message: 'Error al obtener reservas' });
  }
};

// ─── GET /reservas/consulta?userId=&status= ──────────────────────────────────
const getReservations = async (req, res) => {
  try {
    const { userId, status } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const reservations = await reservationSvc.fetchReservations(userId, status);
    res.json(reservations);

  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Error fetching reservations' });
  }
};

// ─── GET /reservas/:id_reserva ────────────────────────────────────────────────
const getReservaByID = async (req, res) => {
  try {
    const { id_reserva } = req.params;

    if (!id_reserva) {
      return res.status(400).json({ error: 'ID de reserva no proporcionado' });
    }

    const reserva = await modeloReserva.encontrarPorId(id_reserva);

    if (!reserva || reserva.length === 0) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    }

    res.json(reserva);

  } catch (error) {
    console.error('Error fetching reserva by ID:', error);
    res.status(500).json({ message: 'Error al obtener la reserva' });
  }
};

// ─── PUT /reservas/update ─────────────────────────────────────────────────────
const updateReserva = async (req, res) => {
  const {
    id_reserva, id_usuario, fecha_reserva,
    hora_inicio, hora_fin, estado_reserva, tipo_reserva,
  } = req.body;

  // Validación de campos requeridos
  if (!id_reserva || !id_usuario || !fecha_reserva ||
      !hora_inicio || !hora_fin || !estado_reserva || !tipo_reserva) {
    return res.status(400).json({ error: 'Datos incompletos para actualizar la reserva' });
  }

  try {
    const result = await reservationSvc.updateReserva({
      id_reserva, fecha_reserva,
      hora_inicio, hora_fin, estado_reserva, tipo_reserva,
    });

    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: result.message });

  } catch (error) {
    console.error('Error al actualizar la reserva:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la reserva' });
  }
};

// ─── GET /reservas/disponibilidad?date=&zona= ────────────────────────────────
const checkAvailability = async (req, res) => {
  try {
    const q = req.query || {};
    const fecha = q.fecha ?? q.date;
    const zonaRaw = q.zonaId ?? q.zona;
    const horaInicio = q.horaInicio;
    const horaFin = q.horaFin;

    if (fecha != null && fecha !== '' && zonaRaw != null && zonaRaw !== '') {
      const hasWindow = horaInicio != null && horaInicio !== '' && horaFin != null && horaFin !== '';
      if (hasWindow) {
        const zonaId = parseInt(String(zonaRaw), 10);
        if (!Number.isFinite(zonaId)) {
          return res.status(400).json({ message: 'zonaId inválido' });
        }
        try {
          const availability = await fetchAvailabilityWindow(
            zonaId,
            String(fecha),
            String(horaInicio),
            String(horaFin)
          );
          return res.json(availability);
        } catch (err) {
          if (err.status === 400) {
            return res.status(400).json({ message: err.message });
          }
          throw err;
        }
      }
    }

    const date = q.date ?? q.fecha;
    const zona = q.zona ?? q.zonaId;
    if (!date || zona === undefined || zona === null || zona === '') {
      return res.status(400).json({
        message:
          'Faltan parámetros: date/fecha (YYYY-MM-DD) y zona/zonaId; con horaInicio y horaFin se usa disponibilidad por franja',
      });
    }

    const availability = await fetchAvailability(date, zona);
    return res.json(availability);
  } catch (error) {
    console.error('Error checking availability:', error);
    return res.status(500).json({ message: 'Error checking availability' });
  }
};

const batchCreateReservas = async (req, res) => {
  try {
    const { reservas } = req.body || {};
    const result = await createReservationsBatch(req.user.sub, reservas);
    
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    // ✅ EMITIR EVENTO WEBSOCKET AQUÍ
    try {
      const io = req.app.get('io');
      if (io && result.ids.length > 0) {
        const { sql } = require('../config/db.js');
        
        // Obtener las zonas de los espacios creados
        const createdReservas = await sql`
          SELECT DISTINCT e.id_zona 
          FROM "Reserva" r
          JOIN "Espacio" e ON r.id_espacio = e.id_espacio
          WHERE r.id_reserva = ANY(${result.ids})
        `;
        
        // Emitir evento a cada zona afectada
        for (const zona of createdReservas) {
          io.to(`zona-${zona.id_zona}`).emit('availability:changed', {
            zonaId: zona.id_zona,
            timestamp: new Date().toISOString(),
            type: 'reservation_created'
          });
        }
        console.log(`[WebSocket] Emitido availability:changed para ${createdReservas.length} zona(s)`);
      }
    } catch (wsError) {
      console.warn('[WebSocket] Error emitiendo evento (pero reservas se crearon):', wsError);
    }

    return res.status(201).json({
      creadas: result.ids.length,
      ids: result.ids,
      reservas: result.ids.map((id) => ({ idReserva: id })),
    });
  } catch (error) {
    console.error('batchCreateReservas', error);
    return res.status(500).json({ message: 'Error al crear reservas' });
  }
};

// ─── POST /reservando ─────────────────────────────────────────────────────────
const createReserva = async (req, res) => {
  try {
    const datos = req.body || {};

    // CORRECCIÓN: se añaden `return` para detener la ejecución tras enviar respuesta
    if (!datos.mail || !datos.fechaReserva || !datos.idEspacio ||
        !datos.horaInicio || !datos.horaSalida || !datos.fechaCreacion) {
      return res.status(400).json({ message: 'Todos los campos deben ser llenados' });
    }

    const response = await reservationSvc.reservarEspacio(datos);
    res.status(response.status).json({ status: response.status, message: response.message });

  } catch (error) {
    console.error('Error creando la reserva', error);
    res.status(400).json({ status: 400, message: 'Error al crear la reserva' });
  }
};

// ─── POST /reservas/verifica reserva activa ───────────────────────────────────────────────────
const tieneReserva = async (req, res) => {
  try{
    const data = req.body;
    const pendiente = await reservationSvc.buscaReserva(data);
    res.status(200).json({pendiente: pendiente});
  }catch{
    console.error('Error al buscar si existe una reserva activa');
    res.status(400).json({error: 'Error al buscar si existe una reserva'});
  }
}

// ─── PUT /reservas/check-in ───────────────────────────────────────────────────
const checkInReserva = async (req, res) => {
  try {
    const { id_reserva } = req.body;

    if (!id_reserva) {
      return res.status(400).json({ message: 'id_reserva es requerido' });
    }

    const result = await reservationSvc.performCheckIn(id_reserva);

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    res.json({ success: true, message: result.message });

  } catch (error) {
    console.error('Error en check-in:', error);
    res.status(500).json({ message: 'Error en check-in' });
  }
};

// ─── PUT /reservas/check-out ──────────────────────────────────────────────────
const checkOutReserva = async (req, res) => {
  try {
    const { id_reserva } = req.body;

    if (!id_reserva) {
      return res.status(400).json({ success: false, message: 'id_reserva es requerido' });
    }

    const result = await reservationSvc.performCheckOut(id_reserva);

    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: result.message, data: result.data });

  } catch (error) {
    console.error('Error en check-out:', error);
    res.status(500).json({ success: false, message: 'Error interno al procesar el check-out' });
  }
};

module.exports = {
  getUsers,
  getReservas,
  getReservations,
  getReservaByID,
  updateReserva,
  checkAvailability,
  createReserva,
  checkInReserva,
  checkOutReserva,
  batchCreateReservas,
  tieneReserva
};
