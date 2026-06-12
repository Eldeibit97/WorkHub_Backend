# WorkHub Monterrey - SpotOn — Backend

API REST del sistema de reservas de espacios corporativos. Construida con **Node.js + Express**, conectada a una base de datos **PostgreSQL en Neon** y documentada con **Swagger**.

---

## Índice

- [Arquitectura](#arquitectura)
- [Seguridad y autenticación](#seguridad-y-autenticación)
- [Uso del sistema](#uso-del-sistema)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Dependencias clave](#dependencias-clave)
- [Enlaces clave](#enlaces-clave)

---

## Arquitectura

```
src/
├── config/
├── constants/
├── controllers/
├── docs/
├── middleware/
├── models/
├── routes/
├── services/
├── stores/
└── utils/
```

### Stack

| Tecnología | Rol |
|---|---|
| Node.js + Express | Servidor HTTP |
| Neon (Postgres) | Base de datos serverless |
| postgres.js | Cliente SQL con template literals |
| JWT | Autenticación stateless |
| bcrypt + salt | Hasheo de contraseñas |
| Swagger (OpenAPI) | Documentación interactiva de la API |

---

## Uso del sistema

### Instalación

```bash
git clone https://github.com/Eldeibit97/WorkHub_Backend
cd WorkHub_Backend
npm install
```

### Desarrollo

```bash
npm run dev
```

El servidor inicia en `http://localhost:5500` por defecto.

La documentación interactiva de Swagger estará disponible en:

```
http://localhost:5500/api/docs
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos Neon
DATABASE_URL=postgresql://usuario:password@host.neon.tech/dbname?sslmode=require

# Autenticación
JWT_SECRET=tu_clave_secreta
SESSION_SECRET=tu_clave_secreta

#Servicio de correo
ADMIN_EMAILS=unCorreo@---.com
SMTP_HOST=implementacion de smtp
SMTP_PORT=tuPuerto
SMTP_USER=tuUsuario
SMTP_FROM=correo_de_envio
SMTP_PASS=tuKey
```

---

## Scripts disponibles

```bash
npm run dev        # Servidor con hot-reload (nodemon)
npm start          # Producción
npm run lint       # ESLint
npm test           # Tests (Jest)
```

---

## Dependencias clave

| Paquete | Uso |
|---|---|
| `express` | Framework HTTP |
| `express-rate-limit` | Rate limiting de peticiones |
| `express-session` | Manejo de sessiones y cookies |
| `@neondatabase/serverless` | Cliente SQL para Neon con template literals |
| `socket.io` | Creacion de websockets |
| `jsonwebtoken` | Generación y verificación de JWT |
| `bcrypt` | Hasheo de contraseñas |
| `swagger-ui-express` | UI interactiva de documentación |
| `swagger-jsdoc` | Generación de spec OpenAPI desde JSDoc |
| `dotenv` | Carga de variables de entorno |
| `cors` | Control de acceso cross-origin |
| `nodemailer` | Mensajeria por email |

---

## Enlaces clave

- **Repositorio Frontend** → [github.com/Eldeibit97/WorkHub_SpotOn](https://github.com/Eldeibit97/WorkHub_SpotOn)
- **Repositorio MCP Server** → [github.com/Eldeibit97/WorkHub_AI](https://github.com/Eldeibit97/WorkHub_AI)
- **Neon Console** → [console.neon.tech](https://console.neon.tech)
