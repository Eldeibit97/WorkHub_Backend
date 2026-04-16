const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const rutas = require('./src/routes/rutasCreacion');
const authRoutes = require('./src/routes/auth.routes');
const { swaggerSpec } = require('./src/config/swagger');
const dotenv = require('dotenv');

dotenv.config();

// Auth: set JWT_SECRET (required) and optionally JWT_EXPIRES_IN (default 8h) in .env

const app = express();
const port = 5500;

app.use(cors());
app.use(express.json());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'WorkHub API' }));
app.get('/api/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

app.use('/api/auth', authRoutes);
app.use('/api', rutas);

app.get('/', (req, res) => {
  res.send('Server inicializado y api funcionando');
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
