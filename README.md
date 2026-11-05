# Gestión Académica Web

Cliente web (React + TypeScript) que consume la API REST de **gestión académica** (Spring Boot). Sesión 12 del curso de Servicios Web: consumo de una API real separando cliente HTTP, servicios de API, tipos y componentes de UI, y manejando los estados de carga, datos, error y vacío.

## Stack

Vite 8 · React 19 · TypeScript 6 · Tailwind CSS 4 · TanStack Query 5 · React Router 8 · react-hook-form + zod 4 · pnpm.

TanStack Query se eligió porque ya estaba incluido en el proyecto y entrega gratis caché, `isPending/isError/data`, reintentos manuales (`refetch`), cancelación (`AbortSignal`) e invalidación tras una mutación. Ningún `fetch` se ejecuta durante el render.

## Estructura

```
src/
├── app/                    App.tsx (router + providers), ProtectedRoute.tsx
├── shared/
│   ├── api/                httpClient.ts (fetch + ApiError), types.ts, errorMessages.ts
│   ├── config/env.ts       VITE_API_BASE_URL
│   └── ui/                 Button, Field, Spinner, StateMessage, Layout
└── features/
    ├── auth/               authApi, tokenStorage, AuthProvider/useAuth, LoginPage
    ├── carreras/           carrerasApi, useCarreras
    └── estudiantes/        estudiantesApi, useEstudiantes, Page, Table, Detail, Form
```

Flujo de dependencias: componente → hook (TanStack Query) → servicio de API → `http()`.

## Cómo ejecutar

**Backend** (repositorio `gestion-academica`): JDK 21, PostgreSQL en ejecución y las variables de entorno `JWT_SECRET` (secreto para firmar los JWT) y `ADMIN_PASSWORD` (contraseña del usuario administrador inicial). Debe escuchar en el puerto **9090**. Los valores se definen localmente y nunca se versionan.

**Frontend:**

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

Otros scripts: `pnpm lint`, `pnpm build`, `pnpm preview`. Copia `.env.example` si necesitas cambiar `VITE_API_BASE_URL`.

## Endpoints consumidos

| Método | Ruta | Roles | Uso |
|---|---|---|---|
| POST | `/auth/login` | público | Iniciar sesión (devuelve JWT y rol) |
| GET | `/carreras` | ADMIN, DOCENTE, ESTUDIANTE | Nombre de la carrera y selector del formulario |
| GET | `/estudiantes` | ADMIN, DOCENTE | Tabla de estudiantes |
| GET | `/estudiantes/{id}` | ADMIN, DOCENTE | Panel de detalle |
| POST | `/estudiantes` | ADMIN | Formulario de alta |

Todas bajo `/api/v1`. La API no ofrece paginación ni parámetros de búsqueda; las listas son arreglos simples.

## Estados manejados

- **Cargando**: spinner con texto (`role="status"`).
- **Con datos**: tabla con filtros.
- **Vacío**: «No hay estudiantes registrados» (y «Ningún estudiante coincide con los filtros»).
- **Error**: sin conexión (`ApiError` status 0, «No se pudo conectar con el servidor» + *Reintentar*), 401 (sesión expirada), 403 («No tienes permiso para ver estudiantes»), otros mensajes del servidor.
- **Actividad 3**: (A) clic en una fila abre un detalle con su propia carga/error; (B) búsqueda por nombre/correo y filtro por carrera **en el cliente**, porque la API no expone parámetros de consulta; (C) formulario de alta visible solo para ADMIN, con errores por campo del mapa `errors` del servidor, mensajes 400/409 y refresco de la lista al crear.

## Flujo de autenticación

1. `LoginPage` valida con zod y llama a `POST /auth/login`.
2. La sesión (token, usuario, rol, expiración) se guarda en `sessionStorage` (se borra al cerrar la pestaña).
3. `httpClient` adjunta `Authorization: Bearer <token>`; no conoce el módulo auth: la app le inyecta `getToken` y `onUnauthorized` con `configureHttpClient`.
4. Ante un 401 en una petición autenticada se limpia la sesión y la caché, y `ProtectedRoute` redirige a `/login`.
5. El rol se expone con `useAuth()` para ocultar el formulario de alta a quien no es ADMIN (el backend sigue siendo quien autoriza).

## Mejoras aplicadas respecto a la base

- `httpClient.ts`: las declaraciones estaban anidadas por error dentro de `ApiError` y faltaba importar `env`; corregido.
- Mensajes de error robustos: los errores de validación traen `errors` y no `message`; se usa el primero. Se confía en el status HTTP y no en `body.status` (puede venir como texto).
- `tsconfig.app.json`: el alias `"@/"` no resolvía; ahora es `"@/*"`.
- Un 401 solo cierra sesión si la petición era autenticada (un login fallido no la dispara).
- Se reemplazó la pantalla «Hola» por la aplicación completa.

## Análisis y reflexión

**1. ¿Qué papel cumplen `VITE_API_BASE_URL` y el proxy de Vite?**
`VITE_API_BASE_URL` (`/api/v1`) define la ruta base en un solo lugar y permite cambiarla por entorno sin tocar el código. Como es una ruta relativa, el navegador llama al mismo origen (`:5173`) y el proxy de `vite.config.ts` reenvía `/api` a `http://localhost:9090`. Así no hay peticiones entre orígenes y se evita CORS, importante porque el backend no tiene configuración CORS.

**2. ¿Por qué separar el acceso HTTP de los componentes?**
Los componentes quedan enfocados en presentar; la URL, cabeceras, token y traducción de errores viven en un único lugar (`httpClient`) y cada recurso en su servicio. Se evita duplicar código, se puede cambiar la implementación (o simularla en pruebas) sin tocar la UI y los tipos documentan el contrato.

**3. ¿Qué diferencia hay entre manejar datos, carga y error con estado propio frente a TanStack Query?**
Con `useState/useEffect` hay que mantener y sincronizar a mano `data`, `loading` y `error`, cuidar condiciones de carrera y cancelaciones. TanStack Query modela el estado como un resultado único (`isPending`, `isError`, `data`), añade caché, `refetch`, cancelación con `AbortSignal` e invalidación tras mutaciones, por lo que el componente solo decide qué mostrar en cada estado.

**4. ¿Qué información del contrato hubo que verificar primero?**
Puerto y ruta base (`9090`, `/api/v1`); rutas y métodos; nombres exactos de los campos JSON (p. ej. la petición usa `carrera` y la respuesta `carreraId`); autenticación Bearer y qué roles acceden a cada ruta (ESTUDIANTE recibe 403 en `/estudiantes`); formas de los cuerpos de error (400 con `errors` y sin `message`, 401/403/409 con `message`, `status` a veces como texto); reglas de negocio (edad ≥ 18); y la ausencia de paginación y filtros.

**5. ¿Qué mejoras facilitarían el mantenimiento?**
Pruebas (Vitest + Testing Library, MSW para simular la API); documentación OpenAPI y tipos generados a partir de ella; configurar CORS en el backend para despliegues sin proxy; un formato de error unificado (`status` siempre numérico, siempre `message`); paginación y filtros en el servidor; refresh token en lugar de cerrar sesión al expirar; y corregir los defectos detectados en el backend.
