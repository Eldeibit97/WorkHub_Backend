const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'WorkHub API',
      version: '1.0.0',
      description: 'Backend WorkHub — reservas y autenticación',
    },
    servers: [
      {
        url: 'http://localhost:5500',
        description: 'Desarrollo local',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Login, sesión por cookie y JWT' },
      { name: 'Admin', description: 'Asignación de contraseñas (solo administradores)' },
      { name: 'Reservas', description: 'Reservas de oficina' },
      { name: 'Preferencias', description: 'Historial y preferencias inferidas del usuario' },
      { name: 'Health', description: 'Estado del servicio' },
      { name: 'PurplePoints', description: 'Mercado de personalización y saldo de Purple Points' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Token de POST /api/auth/login (migración). También se acepta cookie de sesión workhub.sid con credenciales.',
        },
        sessionCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'workhub.sid',
          description: 'Sesión establecida por POST /api/auth/login con credentials: include en el cliente.',
        },
      },
    },
  },
  apis: [path.join(__dirname, '../docs/openapi-paths.js')],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
