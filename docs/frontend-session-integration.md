# Integración frontend: sesión por cookie (WorkHub API)

## Pestañas y `sessionStorage`

La cookie **`workhub.sid`** (origen del API) la comparte el navegador entre **todas las pestañas**. En cambio, **`sessionStorage`** (p. ej. `workhub_auth_token`) es **por pestaña**: al abrir Home en una pestaña y Reservas en otra, la segunda arranca sin token en storage.

**Solución:** al montar la app (p. ej. `AuthProvider`), llamar **`GET /api/auth/me`** con **`credentials: 'include'`**.

- **200** y body `{ user }` (mismo shape que en login): usuario autenticado; rellenar contexto sin depender solo de `sessionStorage`.
- **401**: no hay sesión/cookie válida ni Bearer; mostrar login.

Opcional: si la respuesta es 200 pero no hay JWT en storage, las rutas que solo envíen Bearer pueden seguir funcionando solo con cookie gracias al middleware del backend; o pedir login de nuevo solo cuando falle `/me` y las APIs protegidas.

## Variables típicas (frontend)

| Variable | Uso |
|----------|-----|
| `VITE_API_URL` | Base del API (sin `/` final). |
| `VITE_API_WITH_CREDENTIALS` | Debe permitir `credentials: 'include'` para cookies en `/me`, login y logout. |

## Login / logout

- **POST** `/api/auth/login` — credenciales JSON; respuesta `{ token, user }` y `Set-Cookie`.
- **POST** `/api/auth/logout` — `credentials: 'include'`; **204**.

## GET `/api/auth/me`

- **GET** `{VITE_API_URL}/api/auth/me`
- Headers: ninguno obligatorio si la cookie se envía; opcional **`Authorization: Bearer`** (migración).
- **200**: `{ "user": { "id_usuario", "nombre", "apellido", "correo_institucional", "rol" } }`
- **401**: sesión inválida o usuario borrado.

## Referencia código backend

- [`src/routes/auth.routes.js`](../src/routes/auth.routes.js)
- [`src/controllers/auth.controller.js`](../src/controllers/auth.controller.js)
- [`src/middleware/authenticate.js`](../src/middleware/authenticate.js)
