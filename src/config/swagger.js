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
      { name: 'Auth', description: 'Login y JWT' },
      { name: 'Admin', description: 'Asignación de contraseñas (solo administradores)' },
      { name: 'Reservas', description: 'Reservas de oficina' },
      { name: 'Preferencias', description: 'Historial y preferencias inferidas del usuario' },
      { name: 'Health', description: 'Estado del servicio' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token devuelto por POST /api/auth/login',
        },
      },
    },
  },
  apis: [path.join(__dirname, '../docs/openapi-paths.js')],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
