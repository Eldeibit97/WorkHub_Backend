const jwt = require('jsonwebtoken');
const { sql } = require('./db');

const blockedBySocket = new Map(); 
// Map<socketId, { zonaId, espacios: [id1, id2, ...] }>

const DEBUG_WS = process.env.DEBUG_WEBSOCKET === 'true';

module.exports = function initializeWebSocket(io) {

  // Middleware de autenticación para Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Token no proporcionado'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.sub;
      socket.userEmail = decoded.correo;

      next();
    } catch (err) {
      next(new Error('Token inválido'));
    }
  });

  // Conexiones
  io.on('connection', (socket) => {

    if (DEBUG_WS) {
      console.log(
        `[WebSocket] Usuario ${socket.userEmail} conectado: ${socket.id}`
      );
    }

    // Cuando usuario entra a una zona
    socket.on('join-zona', ({ zonaId }) => {

      const room = `zona-${zonaId}`;

      socket.join(room);

      socket.data = socket.data || {};
      socket.data.currentZona = zonaId;

      if (DEBUG_WS) {
        console.log(
          `[WebSocket] ${socket.userEmail} se unió a ${room}`
        );
      }
    });

    // Cuando usuario sale de una zona
    socket.on('leave-zona', ({ zonaId }) => {

      const room = `zona-${zonaId}`;

      socket.leave(room);

      if (DEBUG_WS) {
        console.log(
          `[WebSocket] ${socket.userEmail} salió de ${room}`
        );
      }
    });

    // Desconexión
    socket.on('disconnect', async () => {

      if (DEBUG_WS) {
        console.log(
          `[WebSocket] Usuario ${socket.userEmail} desconectado`
        );
      }

      // Liberar espacios bloqueados
      const blocked = blockedBySocket.get(socket.id);

      if (blocked && blocked.espacios && blocked.espacios.length > 0) {

        try {

          const { zonaId, espacios } = blocked;

          // Liberar en DB
          await sql`
            UPDATE "Espacio"
            SET estado_actual = 'DISPONIBLE'
            WHERE id_espacio = ANY(${espacios}::int[])
            AND estado_actual = 'BLOQUEADO_TEMPORAL'
          `;

          // Notificar a otros usuarios
          io.to(`zona-${zonaId}`).emit('availability:changed', {
            zonaId: Number(zonaId),
            timestamp: new Date().toISOString(),
            tipo: 'availability:changed',

            espacios: espacios.map((idEsp) => ({
              idEspacio: idEsp,
              estado: 'DISPONIBLE'
            }))
          });

          if (DEBUG_WS) {
            console.log(
              `[WebSocket] Liberados ${espacios.length} espacios en zona ${zonaId} (socket desconectado)`
            );
          }

          // Limpiar mapa
          blockedBySocket.delete(socket.id);

        } catch (err) {

          console.error(
            '[WebSocket] Error liberando espacios en disconnect:',
            err
          );
        }
      }
    });

  });

  // Exportar el mapa para que otros módulos puedan usarlo
  io.blockedBySocket = blockedBySocket;

  return io;
};

module.exports.getBlockedBySocket = () => blockedBySocket;