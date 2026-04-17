const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const rutas = require('./src/routes/rutasCreacion');
const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const usersRoutes = require('./src/routes/users.routes');
const { swaggerSpec } = require('./src/config/swagger');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).trim() === '') {
  console.error(
    '[WorkHub] Define JWT_SECRET en .env (cadena larga aleatoria). Sin eso, el login falla al firmar el JWT.'
  );
  process.exit(1);
}

// Opcional: JWT_EXPIRES_IN, FRONTEND_ORIGIN (CORS), ADMIN_EMAILS (correos admin, separados por coma)

const app = express();
const port = 5500;

// credentials: 'include' en el frontend exige origen concreto (no *) y credentials: true aquí
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'WorkHub API' }));
app.get('/api/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', rutas);

if (!process.env.ADMIN_EMAILS || !String(process.env.ADMIN_EMAILS).trim()) {
  console.warn(
    '[WorkHub] ADMIN_EMAILS vacío: nadie podrá usar POST /api/admin/assign-password hasta configurarlo. Usa scripts/set-user-password.js para el primer admin.'
  );
}

app.get('/', (req, res) => {
  res.send('Server inicializado y api funcionando');
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
