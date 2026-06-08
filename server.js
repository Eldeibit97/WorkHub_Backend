const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server: SocketIO } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const reservationRoutes = require('./src/routes/reservation.routes');
const spacesRoutes = require('./src/routes/spaces.routes');
const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const usersRoutes = require('./src/routes/users.routes');
const preferencesRoutes = require('./src/routes/preferences.routes');
const { swaggerSpec } = require('./src/config/swagger');
const initializeWebSocket = require('./src/config/websocket');
const dotenv = require('dotenv');

dotenv.config();

const dotenv = require('dotenv');
dotenv.config();

if (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).trim() === '') {
  console.error(
    '[WorkHub] Define JWT_SECRET en .env (cadena larga aleatoria). Sin eso, el login falla al firmar el JWT.'
  );
  process.exit(1);
}

if (!process.env.SESSION_SECRET || String(process.env.SESSION_SECRET).trim() === '') {
  console.error(
    '[WorkHub] Define SESSION_SECRET en .env (cadena larga aleatoria, distinta de JWT_SECRET) para la cookie de sesión.'
  );
  process.exit(1);
}

const { createSessionMiddleware } = require('./src/config/session');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5500;

// Socket.io con CORS
const io = new SocketIO(server, {
  cors: {
    origin: (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST']
  }
});

initializeWebSocket(io);

// Guardar io en app para acceso en controllers
app.set('io', io);

if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

const allowedOrigins = (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigin =
  allowedOrigins.length === 0
    ? 'http://localhost:5173'
    : (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(
          new Error(`CORS bloqueado para origin: ${origin}. Configura FRONTEND_ORIGINS.`)
        );
      };

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.text({ type: 'text/plain', limit: '1mb' })); // Para sendBeacon
app.use(express.raw({ type: 'application/octet-stream', limit: '1mb' })); // Para binarios si los hay
app.use(createSessionMiddleware());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'WorkHub API' }));
app.get('/api/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', preferencesRoutes);
app.use('/api', spacesRoutes);
app.use('/api', reservationRoutes);

if (!process.env.ADMIN_EMAILS || !String(process.env.ADMIN_EMAILS).trim()) {
  console.warn(
    '[WorkHub] ADMIN_EMAILS vacío: nadie podrá usar POST /api/admin/assign-password hasta configurarlo. Usa scripts/set-user-password.js para el primer admin.'
  );
}

app.get('/', (req, res) => {
  res.send('Server inicializado y api funcionando');
});

server.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
  console.log(`WebSocket activo en ws://localhost:${port}`);
});

// Exportar io para uso en otros módulos si es necesario
module.exports = { app, io };