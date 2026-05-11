# Integración frontend: sesión por cookie (WorkHub API)

Este documento es la referencia para el **agente o equipo del frontend** cuando se consume el backend con **sesión de servidor** (`express-session`, store en PostgreSQL).

## Resumen

- Tras un login correcto, el servidor envía **`Set-Cookie`** con el nombre **`workhub.sid`** (httpOnly).
- Las rutas protegidas aceptan **primero** esa cookie (sesión) y, en migración, **también** `Authorization: Bearer` con el JWT que devuelve el login.
- Sin cookie válida ni Bearer, las rutas con `authenticate` responden **401** (`Sesión o token requerido` / mensaje de token inválido).

## Variables de entorno (frontend)

| Variable | Uso |
|----------|-----|
| `VITE_API_URL` | Base del API (sin `/` final). |
| `VITE_API_WITH_CREDENTIALS` | Debe ser **`true`** para que las peticiones usen `credentials: 'include'` y el navegador envíe y reciba la cookie de sesión. |

El origen del frontend debe estar permitido en **`FRONTEND_ORIGINS`** (o `FRONTEND_ORIGIN`) del backend para que CORS permita credenciales.

## Login

- **POST** `{VITE_API_URL}/api/auth/login`
- **Body JSON**: `{ "email": string, "password": string }` (también se aceptan alias de correo: `correo_institucional`, `correo`, `mail`).
- **Credenciales**: usar **`credentials: 'include'`** en esta petición.
- **Respuesta 200**: `{ "token": string, "user": { ... } }`. El token JWT se mantiene para **migración**; la fuente de verdad para sesión server-side es la **cookie** tras login.

## Cliente HTTP (`apiFetch` / `fetch`)

- Todas las peticiones al API que dependan de la sesión deben usar **`credentials: 'include'`** (no solo el login).
- Rutas que antes enviaban solo `Authorization: Bearer` pueden seguir haciéndolo durante la migración; cuando solo se use cookie, el header puede omitirse si el servidor reconoce la sesión.

## Logout

- **POST** `{VITE_API_URL}/api/auth/logout`
- **Credenciales**: **`credentials: 'include'`**
- **Respuesta 204**: sesión invalidada en base de datos y cookie eliminada en el cliente según `Set-Cookie`.
- Tras recibir 204, limpiar estado local (`sessionStorage`, contexto React, etc.), incluido `workhub_auth_token` si aplica.

## Producción: HTTPS, SameSite y Secure

En el backend, en **`NODE_ENV=production`**, la cookie se configura por defecto con **`SameSite=None`** y **`Secure=true`**, lo que obliga a que **front y API se sirvan por HTTPS** (o el navegador no guardará la cookie correctamente).

En **desarrollo local** (no production), el backend usa **`SameSite=Lax`** y **`Secure=false`** para `http://localhost`.

Se puede anular con variables del servidor: `SESSION_COOKIE_SAMESITE`, `SESSION_COOKIE_SECURE` (ver código en `WorkHub_Backend/src/config/session.js`).

## CSRF (importante)

Con **cookie de sesión** y un SPA en **origen distinto** del API, si la cookie usa `SameSite=None`, los navegadores envían la cookie en peticiones cross-site y puede aumentar el riesgo de **CSRF** en operaciones que mutan estado (POST/PATCH/DELETE).

Mitigaciones habituales:

1. **Mismo sitio efectivo**: API y estáticos del front detrás del mismo dominio / reverse proxy (cookies con `Lax` o `Strict` donde sea posible).
2. **Token CSRF** (doble cookie, header sincronizer, u otro patrón) si el equipo exige API cross-origin con métodos mutadores sin protección adicional.

Este backend **no** implementa actualmente un endpoint de token CSRF; documentar en el propio frontend la política que adoptéis tras revisión de seguridad.

## Errores y UX

- **401** en rutas protegidas: sesión expirada, cookie ausente o token JWT inválido. Mostrar mensaje tipo “sesión caducada” y redirigir a login, llamando opcionalmente a `POST /api/auth/logout` para limpiar estado.

## Migración JWT → cookie (checklist código frontend)

- [ ] `credentials: 'include'` en el cliente HTTP global.
- [ ] Login y logout con credenciales.
- [ ] `FRONTEND_ORIGINS` en el servidor incluye el origen exacto del dev server (p. ej. `http://localhost:5173`).
- [ ] Buscar y revisar: `Authorization: Bearer`, `workhub_auth_token`, `getStoredToken`.
- [ ] Probar en navegador: login → petición protegida sin Bearer (solo cookie) cuando el backend priorice sesión.

## Referencia backend

- Middleware de sesión: [`src/config/session.js`](../src/config/session.js)
- Autenticación dual: [`src/middleware/authenticate.js`](../src/middleware/authenticate.js)
- Rutas: [`src/routes/auth.routes.js`](../src/routes/auth.routes.js)
