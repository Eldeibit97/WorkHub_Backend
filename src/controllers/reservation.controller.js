'use strict';

const { sql } = require('../config/db.js');
const modeloReserva = require('../models/modeloReserva.js');
const { withParkingLock } = require('../utils/parkingLock.js');
const reservationSvc = require('../services/reservation.service.js');
const ModeloReserva = require('../models/modeloReserva.js');
const {
  fetchAvailability,
  fetchAvailabilityWindow,
  createReservationsBatch,
} = reservationSvc;

// Obtener el mapa de espacios bloqueados por socket
let blockedBySocket = null;
const getBlockedBySocket = () => {
  if (!blockedBySocket) {
    try {
      const wsModule = require('../config/websocket.js');
      blockedBySocket = wsModule.getBlockedBySocket?.() || new Map();
    } catch (err) {
      blockedBySocket = new Map();
    }
  }
  return blockedBySocket;
};

const getUsers = async (req, res) => {
  try {
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

    return res.status(200).json(reserva);
  } catch (error) {
    console.error('Error fetching reserva by ID:', error);
    return res.status(500).json({ message: 'Error al obtener la reserva' });
  }
};

const getReservaDetails = async (req, res) => {
  try {
    const { id_reserva } = req.params;

    if (!id_reserva) {
      return res.status(400).json({ error: 'ID de reserva no proporcionado' });
    }

    const reserva = await modeloReserva.detallesPorId(id_reserva);

    if (!reserva || reserva.length === 0) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    }

    return res.status(200).json(reserva[0]);
  } catch (error) {
    console.error('Error fetching reserva by ID:', error);
    return res.status(500).json({ message: 'Error al obtener la reserva' });
  }
}

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
        // Importar el mapa de bloqueados (desde websocket.js)
        const blockedBySocket = new Map();
        
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

    if (!datos.mail || !datos.fechaReserva || !datos.idEspacio ||
      !datos.horaInicio || !datos.horaSalida || !datos.fechaCreacion) {
      return res.status(400).json({ message: 'Todos los campos deben ser llenados' });
    }

    const response = await reservationSvc.reservarEspacio(datos);
    
    // Emitir evento WebSocket si la reserva fue exitosa
    if (response.status === 200 && response.idZona && response.idEspacio) {
      const io = req.app.get('io');
      if (io) {
        io.to(`zona-${response.idZona}`).emit('availability:changed', {
          zonaId: response.idZona,
          timestamp: new Date().toISOString(),
          tipo: 'availability:changed',
          espacios: [{ idEspacio: response.idEspacio, estado: 'OCUPADO' }]
        });
        console.log(`[WebSocket] Emitido availability:changed para zona ${response.idZona}, espacio ${response.idEspacio} → OCUPADO`);
      }
    }
    
    res.status(response.status).json({ status: response.status, message: response.message });

  } catch (error) {
    console.error('Error creando la reserva', error);
    res.status(400).json({ status: 400, message: 'Error al crear la reserva' });
  }
};

const createReservaEstacionamiento = async (req, res) => {
  try {
    const datos = req.body || {};
    if (!datos || Object.keys(datos).length === 0) throw new Error('No se envio datos de una reserva');
    const uid = Number(req.user.sub);

    const result = await reservarEspacio(uid, datos);

    if (!result || !result.success) {
      return res.status(result?.status || 400).json({
        success: false,
        message: result?.message || 'No se pudo crear la reserva'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Reserva de estacionamiento creada exitosamente',
      data: result.data
    });
  } catch (error) {
    console.error('Error al crear reserva de estacionamiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la reserva de estacionamiento',
      error: error.message
    });
  };
};

const getCapacidad = async (req, res) => {
  const { fecha, horaInicio, horaFin } = req.query;
  
  if (!fecha || !horaInicio || !horaFin) {
    return res.status(400).json({ error: 'Parámetros requeridos: fecha, horaInicio, horaFin' });
  }
  
  try {
    const zonas = await ModeloReserva.obtenerCapacidadPorZona({ fecha, horaInicio, horaFin });
    res.json(zonas);
  } catch (err) {
    console.error('[parking/capacidad]', err);
    res.status(500).json({ error: 'Error al obtener capacidad' });
  }
};

const reservarEstacionamiento = async (req, res) => {
  const datos = req.body || {};
  if (!datos || Object.keys(datos).length === 0) throw new Error('No se envio datos de una reserva');
  const uid = Number(req.user.sub);

  try {
    const resultado = await withParkingLock(async () => {
      const espacio = await ModeloReserva.primerEspacioLibre({ fecha: datos.fechaReserva, horaInicio: datos.horaInicio, horaFin: datos.horaSalida })
      if (!espacio) {
        const err = new Error('SIN_ESPACIOS')
        err.code = 'SIN_ESPACIOS'
        throw err
      }
      datos['id_espacio'] = espacio.id_espacio;

      const reserva = await ModeloReserva.crearReservaEstacionamiento(uid, datos);
      return reserva;
    })

    // Emitir cambio via WebSocket usando el patrón de tu compañero
    try {
      const io = req.app.get('io')
      const ocupacion = await ModeloReserva.ocupacionDeZona(
        resultado.id_zona,
        { fecha: resultado.fecha_reserva, horaInicio: resultado.hora_inicio, horaFin: resultado.hora_fin }
      )
      // Tu compañero usa el room "zona-{id}" — usamos el mismo patrón
      io.to(`zona-${resultado.id_zona}`).emit('parking:occupancy-changed', {
        id_zona: resultado.id_zona,
        ...ocupacion,
      })
    } catch (wsErr) {
      console.error('[parking/reservar] WebSocket emit falló:', wsErr)
    }

    res.status(201).json(resultado)
  } catch (err) {
    if (err.code === 'SIN_ESPACIOS') {
      return res.status(409).json({ error: 'No hay espacios de estacionamiento disponibles' })
    }
    console.error('[parking/reservar]', err)
    res.status(500).json({ error: 'Error al crear la reserva' })
  }
};

// ─── POST /reservas/verifica reserva activa ───────────────────────────────────────────────────
const tieneReserva = async (req, res) => {
  try{
    const { userId, fecha } = req.query;
    if (!userId || !fecha) {
      return res.status(400).json({ error: 'userId y fecha son requeridos' });
    }
    const data = { user_id: userId, today: fecha };
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

    // Emitir evento WebSocket si el check-in fue exitoso
    if (result.id_zona && result.id_espacio) {
      const io = req.app.get('io');
      if (io) {
        io.to(`zona-${result.id_zona}`).emit('availability:changed', {
          zonaId: result.id_zona,
          timestamp: new Date().toISOString(),
          tipo: 'availability:changed',
          espacios: [{ idEspacio: result.id_espacio, estado: 'OCUPADO' }]
        });
        console.log(`[WebSocket] Emitido availability:changed para zona ${result.id_zona}, espacio ${result.id_espacio} → OCUPADO`);
      }
    }

    res.json({ success: true, message: result.message });

  } catch (error) {
    console.error('Error en check-in:', error);
    res.status(500).json({ message: 'Check-in Realizado con éxito' });
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

    // Emitir evento WebSocket (espejo exacto del check-in, estado → DISPONIBLE)
    if (result.id_zona && result.id_espacio) {
      const io = req.app.get('io');
      if (io) {
        io.to(`zona-${result.id_zona}`).emit('availability:changed', {
          zonaId: result.id_zona,
          timestamp: new Date().toISOString(),
          tipo: 'availability:changed',
          espacios: [{ idEspacio: result.id_espacio, estado: 'DISPONIBLE' }]
        });
        console.log(`[WebSocket] Emitido availability:changed para zona ${result.id_zona}, espacio ${result.id_espacio} → DISPONIBLE`);
      }
    }

    res.json({ success: true, message: result.message, data: result.data });

  } catch (error) {
    console.error('Error en check-out:', error);
    res.status(500).json({ success: false, message: 'Error interno al procesar el check-out' });
  }
};

// ─── POST /reservas/bloquear-temporal ─────────────────────────────────────
const bloquearEspacioTemporal = async (req, res) => {
  try {
    const { id_espacios, id_zona, socketId } = req.body;

    if (!id_espacios || !Array.isArray(id_espacios) || id_espacios.length === 0) {
      return res.status(400).json({ message: 'id_espacios es requerido (array)' });
    }

    if (!id_zona) {
      return res.status(400).json({ message: 'id_zona es requerido' });
    }

    // Bloquear espacios temporalmente
    for (const id_espacio of id_espacios) {
      await sql`
        UPDATE "Espacio"
        SET
          estado_actual = 'BLOQUEADO_TEMPORAL'
        WHERE id_espacio = ${id_espacio}
      `;
    }

    // Guardar en mapa (para liberar al desconectar si es necesario)
    if (socketId) {
      const blockedMap = getBlockedBySocket();
      blockedMap.set(socketId, { zonaId: id_zona, espacios: id_espacios });
      console.log(`[bloquearEspacioTemporal] Registrado socketId ${socketId} con ${id_espacios.length} espacios`);
    }

    // Al final de bloquearEspacioTemporal, DESPUÉS de actualizar la BD:
    const io = req.app.get('io');

    if (io) {
      io.to(`zona-${id_zona}`).emit('availability:changed', {
        zonaId: Number(id_zona),
        timestamp: new Date().toISOString(),
        tipo: 'availability:changed',
        espacios: id_espacios.map((idEsp) => ({
          idEspacio: idEsp,
          estado: 'BLOQUEADO_TEMPORAL'
        }))
      });
    }

    // Liberar automáticamente después de 5 minutos (igual que countdown del frontend)
    const TIMEOUT_MS = 300 * 1000; // 300 segundos = 5 minutos
    setTimeout(async () => {
      try {
        for (const id_espacio of id_espacios) {
          await sql`
            UPDATE "Espacio"
            SET estado_actual = 'DISPONIBLE'
            WHERE id_espacio = ${id_espacio}
              AND estado_actual = 'BLOQUEADO_TEMPORAL'
          `;
        }
        
        // Limpiar del mapa si pasó el timeout
        if (socketId) {
          const blockedMap = getBlockedBySocket();
          blockedMap.delete(socketId);
        }
        
        if (io) {
          io.to(`zona-${id_zona}`).emit('availability:changed', {
            zonaId: id_zona,
            timestamp: new Date().toISOString(),
            tipo: 'availability:changed',
            espacios: id_espacios.map(idEsp => ({ idEspacio: idEsp, estado: 'DISPONIBLE' }))
          });
          console.log(`[AutoRelease] Liberados espacios ${id_espacios.join(',')} después de 5 min`);
        }
      } catch (err) {
        console.error('[AutoRelease] Error:', err);
      }
    }, TIMEOUT_MS);

    res.json({ success: true, message: 'Espacios bloqueados temporalmente' });

  } catch (error) {
    console.error('Error bloqueando espacios:', error);
    res.status(500).json({ message: 'Error bloqueando espacios' });
  }
};

// ─── POST /reservas/liberar-temporal ──────────────────────────────────────
const liberarEspacioTemporal = async (req, res) => {
  try {
    let body = req.body;
    
    if (process.env.DEBUG_WEBSOCKET === 'true') {
      console.log('[liberarEspacioTemporal] Recibido body (tipo:', typeof body, '):', body);
    }
    
    // Si viene como text/plain (sendBeacon), parsear
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('[liberarEspacioTemporal] Error parseando JSON:', e.message);
        return res.status(400).json({ message: 'Body debe ser JSON válido', error: e.message });
      }
    }

    const { id_espacios, id_zona, espacios, zonaId, socketId } = body;

    // Normalizar nombres de campos (puede venir con diferentes nombres)
    const espaciosArray = id_espacios || espacios;
    const zonaIdNorm = id_zona || zonaId;

    if (process.env.DEBUG_WEBSOCKET === 'true') {
      console.log('[liberarEspacioTemporal] espaciosArray:', espaciosArray, 'zonaId:', zonaIdNorm);
    }

    let processedEspacios = espaciosArray;
    
    // Si viene como string, parsear
    if (typeof processedEspacios === 'string') {
      processedEspacios = processedEspacios.split(',').map(id => Number(id)).filter(id => !isNaN(id));
    }
    
    // Validar que sea array
    if (!Array.isArray(processedEspacios)) {
      processedEspacios = [processedEspacios].filter(id => !isNaN(Number(id))).map(Number);
    }

    if (!processedEspacios || processedEspacios.length === 0) {
      return res.status(400).json({ message: 'id_espacios es requerido (array o string)' });
    }

    let normalizedZona = Number(zonaIdNorm);
    if (!normalizedZona || isNaN(normalizedZona)) {
      return res.status(400).json({ message: 'id_zona es requerido (número)' });
    }

    if (process.env.DEBUG_WEBSOCKET === 'true') {
      console.log('[liberarEspacioTemporal] Procesando:', processedEspacios.length, 'espacios en zona', normalizedZona);
    }

    // Liberar espacios (volver a DISPONIBLE)
    for (const id_espacio of processedEspacios) {
      await sql`
        UPDATE "Espacio"
        SET
          estado_actual = 'OCUPADO'
        WHERE id_espacio = ${id_espacio}
      `;
    }
    // Emitir WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`zona-${normalizedZona}`).emit('availability:changed', {
        zonaId: normalizedZona,
        timestamp: new Date().toISOString(),
        tipo: 'availability:changed',
        espacios: processedEspacios.map(idEsp => ({ idEspacio: idEsp, estado: 'DISPONIBLE' }))
      });
      if (process.env.DEBUG_WEBSOCKET === 'true') {
        console.log(`[WebSocket] Liberados espacios ${processedEspacios.join(',')} en zona ${normalizedZona}`);
      }
    }

    res.json({ success: true, message: 'Espacios liberados', count: processedEspacios.length });
  } catch (error) {
    console.error('Error liberando espacios:', error);
    res.status(500).json({ message: 'Error liberando espacios', error: error.message });
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
  bloquearEspacioTemporal,
  liberarEspacioTemporal,
  tieneReserva,
  getReservaDetails,
  createReservaEstacionamiento,
  getCapacidad, 
  reservarEstacionamiento
};
