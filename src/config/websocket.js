const jwt = require('jsonwebtoken');

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
    console.log(`[WebSocket] Usuario ${socket.userEmail} conectado: ${socket.id}`);

    // Cuando usuario entra a una zona
    socket.on('join-zona', ({ zonaId }) => {
      const room = `zona-${zonaId}`;
      socket.join(room);
      console.log(`[WebSocket] ${socket.userEmail} se unió a ${room}`);
    });

    // Cuando usuario sale de una zona
    socket.on('leave-zona', ({ zonaId }) => {
      const room = `zona-${zonaId}`;
      socket.leave(room);
      console.log(`[WebSocket] ${socket.userEmail} salió de ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Usuario ${socket.userEmail} desconectado`);
    });
  });

  return io;
};