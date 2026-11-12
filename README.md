# Gestión Académica Web

Cliente web (React + TypeScript) que consume la API REST de **gestión académica** (Spring Boot). Curso de Servicios Web, Unidad III:

- **Sesión 12 · Consumo de API**: cliente HTTP, servicios de API, tipos y componentes de UI separados, con los estados de carga, datos, error y vacío.
- **Guía práctica · Gestión de estados**: clasificación de estados (sesión, local y remoto), consultas y mutaciones con TanStack Query, sincronización de la caché tras crear o editar, robustez ante errores y control de acceso por rol. Ver [Gestión de estados](#gestión-de-estados).

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
    ├── auth/               authApi, tokenStorage, AuthProvider/useAuth, permissions, LoginPage
    ├── carreras/           carrerasApi, useCarreras
    └── estudiantes/        estudiantesApi, useEstudiantes, Page, Table, Detail, Form
```

Flujo de dependencias: componente → hook (TanStack Query) → servicio de API → `http()`.

La guía nombra `sessionStore` y `useCurrentUser`; en este repositorio cumplen ese papel `tokenStorage` (persistencia en `sessionStorage`) y `AuthProvider` + `useAuth()` (sesión y rol en memoria). El módulo de login no se reconstruyó.

## Cómo ejecutar

**Backend** (repositorio `gestion-academica`): JDK 21, PostgreSQL en ejecución y las variables de entorno `JWT_SECRET` (secreto para firmar los JWT) y `ADMIN_PASSWORD` (contraseña del usuario administrador inicial). Debe escuchar en el puerto **9090**. Los valores se definen localmente y nunca se versionan.

**Frontend:**

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

Otros scripts: `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm preview`. Copia `.env.example` si necesitas cambiar `VITE_API_BASE_URL`.

## Endpoints consumidos

| Método | Ruta | Roles | Uso |
|---|---|---|---|
| POST | `/auth/login` | público | Iniciar sesión (devuelve JWT y rol) |
| GET | `/carreras` | ADMIN, DOCENTE, ESTUDIANTE | Nombre de la carrera y selector del formulario |
| GET | `/estudiantes` | ADMIN, DOCENTE | Tabla de estudiantes |
| GET | `/estudiantes/{id}` | ADMIN, DOCENTE | Panel de detalle |
| POST | `/estudiantes` | ADMIN | Formulario de alta |
| PUT | `/estudiantes/{id}` | ADMIN | Formulario de edición |

Todas bajo `/api/v1`. La API no ofrece paginación ni parámetros de búsqueda; las listas son arreglos simples.

## Estados manejados

- **Cargando**: spinner con texto (`role="status"`).
- **Con datos**: tabla con filtros.
- **Vacío**: «No hay estudiantes registrados» (y «Ningún estudiante coincide con los filtros»).
- **Error**: sin conexión (`ApiError` status 0, «No se pudo conectar con el servidor» + *Reintentar*), 401 (sesión expirada), 403 («No tienes permiso para ver estudiantes»), otros mensajes del servidor.
- **Actividad 3**: (A) clic en una fila abre un detalle con su propia carga/error; (B) búsqueda por nombre/correo y filtro por carrera **en el cliente**, porque la API no expone parámetros de consulta; (C) formulario de alta visible solo para ADMIN, con errores por campo del mapa `errors` del servidor, mensajes 400/409 y refresco de la lista al crear.

## Gestión de estados

### Actividad 1 · Clasificación de estados

| Dato | Tipo de estado | Dónde vive | Fuente de verdad |
|---|---|---|---|
| (a) Sesión y rol | Sesión (cliente, global) | `AuthProvider` (contexto) + `tokenStorage` (`sessionStorage`) | El JWT emitido por el backend; el cliente solo guarda una copia hasta que expira |
| (b) Texto de búsqueda, filtro de carrera, fila seleccionada, formulario abierto (alta/edición) | Local de interfaz | `useState` en `EstudiantesPage` | El propio componente |
| (b) Valores y errores de los campos | Local de formulario | `react-hook-form` en `EstudianteForm` | El formulario, hasta que se envía |
| (c) Catálogo de carreras | Remoto de servidor | Caché de TanStack Query, clave `['carreras']` | La base de datos, vía `GET /carreras` |
| (d) Lista de estudiantes | Remoto de servidor | Caché de TanStack Query, clave `['estudiantes', 'list']` | La base de datos, vía `GET /estudiantes` |
| (e) Estado de envío del formulario | Remoto (de la mutación) | `useMutation` (`isPending`, `error`) | La petición en curso |

**Justificación.** Carreras y estudiantes pertenecen al servidor: otro usuario puede cambiarlos en cualquier momento, así que el cliente solo tiene una *copia que caduca*. Esa copia vive en TanStack Query, que sabe cuándo está cargando, cuándo falló, cuándo está obsoleta y cómo refrescarla. La búsqueda, la fila seleccionada y qué formulario está abierto no existen en el servidor ni le interesan a otra pantalla: son estado local y desaparecen al desmontar el componente. La lista filtrada **no es estado**: se deriva con `useMemo` a partir de la caché y del texto de búsqueda, sin copiar ni mutar los datos.

### Actividad 2 · Diseño de componentes y claves de consulta

| Componente | Responsabilidad | ¿Hace peticiones? |
|---|---|---|
| `EstudiantesPage` | Contenedor: usa los hooks, guarda el estado local de interfaz, decide qué estado mostrar y qué acciones permite el rol | A través de hooks |
| `EstudiantesTable` | Presentación: recibe los estudiantes ya filtrados y callbacks (`onSelect`, `onEdit`) | No |
| `EstudianteForm` | Formulario único para alta y edición; validación con zod y errores de la API | A través de hooks de mutación |
| Selector de carreras | `<select>` dentro del formulario y del filtro; recibe el catálogo por props | No |
| `EstudianteDetail` | Detalle con su propia consulta `GET /estudiantes/{id}` | A través de un hook |

Claves de consulta (jerárquicas, para poder invalidar con precisión):

```ts
carrerasKeys.all            // ['carreras']
estudiantesKeys.all         // ['estudiantes']
estudiantesKeys.list()      // ['estudiantes', 'list']
estudiantesKeys.detail(id)  // ['estudiantes', 'detail', id]
```

Ningún componente llama a `fetch`: componente → hook (`useEstudiantes`, `useCarreras`, `useCreateEstudiante`, `useUpdateEstudiante`) → servicio tipado (`estudiantesApi`, `carrerasApi`) → `http()`.

### Sincronización tras mutaciones (actividades 5 a 7)

- **Alta (`POST`)**: al confirmar el servidor se **invalida** `['estudiantes', 'list']`. TanStack Query vuelve a pedir la lista y la tabla muestra el nuevo registro. No se usa `window.location.reload()`.
- **Edición (`PUT`)**: la respuesta del servidor se escribe en la caché del detalle con `setQueryData` (ya tenemos el dato fresco, no hace falta otra petición) y se invalida la lista.
- La mutación permanece pendiente hasta que la lista se refresca; mientras tanto el botón de guardar queda deshabilitado, lo que evita envíos repetidos.
- El formulario se monta con una `key` distinta por alta o por estudiante editado, de modo que cada apertura tiene su propio estado y no arrastra valores de la anterior.
- Los datos persisten tras refrescar el navegador porque la fuente de verdad es el servidor: al recargar, la consulta se ejecuta de nuevo.

### Robustez y control de acceso (actividades 8 y 9)

- **Formulario inválido**: zod valida en el cliente y no se envía nada. Si la API responde 400, su mapa `errors` se muestra bajo cada campo; un 409 (correo duplicado) o una regla de negocio se muestra como mensaje general. En todos los casos los valores escritos se conservan.
- **Error de red** (`ApiError` con status 0): la lista y el formulario muestran el mensaje con un botón *Reintentar*; en el formulario reenvía los mismos valores.
- **401 frente a 403**: un 401 significa que la sesión ya no es válida: `httpClient` avisa a `AuthProvider`, que borra la sesión y la caché, y `ProtectedRoute` redirige a `/login`. Un 403 significa que la sesión es válida pero el rol no alcanza: se muestra el mensaje y el usuario **sigue autenticado**.
- **Permisos por rol**: `canManageEstudiantes(rol)` decide si se muestran *Nuevo estudiante* y *Editar* (solo ADMIN). DOCENTE consulta la lista y el detalle. ESTUDIANTE recibe 403 en `/estudiantes` y ve el mensaje correspondiente. Ocultar botones es solo una ayuda de interfaz: quien autoriza es el backend con `@PreAuthorize`.

### Preguntas de análisis

**1. ¿Por qué no conviene copiar toda la respuesta del servidor a un segundo `useState` si ya la administra TanStack Query?**
Porque habría dos fuentes de verdad para el mismo dato. La copia no se entera de un refetch ni de una invalidación, así que queda obsoleta y hay que sincronizarla a mano con un `useEffect`, lo que añade renders extra y errores difíciles de ver. La caché ya es el estado; lo que se necesite a partir de ella (como la lista filtrada) se **deriva** en el render.

**2. ¿Qué sucede con la vista al hacer POST si no se invalida o actualiza la consulta correspondiente?**
El servidor guarda el estudiante, pero la tabla sigue mostrando la lista en caché: el registro nuevo no aparece hasta que algo provoque otra petición (recargar, volver a montar la página o que la consulta caduque). El usuario cree que el alta falló y puede enviarla otra vez.

**3. ¿Cuándo debe utilizarse estado local y cuándo una query cache?**
Estado local cuando el dato nace y muere en la interfaz y el cliente es su dueño: texto de búsqueda, modal abierto, fila seleccionada, valores de un formulario sin enviar. Query cache cuando el dueño es el servidor y el cliente solo tiene una copia asíncrona, compartida entre pantallas y que puede quedar obsoleta: listas, catálogos, detalles.

**4. ¿Por qué un control de roles en React no reemplaza la autorización en Spring Security?**
Porque el código de React se ejecuta en el navegador del usuario, que puede modificarlo o llamar a la API directamente con Postman o `curl`. Ocultar un botón mejora la experiencia, pero no impide la petición. La decisión debe tomarla el servidor, que valida el token y el rol en cada petición.

### Pruebas

`pnpm test` ejecuta pruebas de comportamiento con Vitest y Testing Library (con `fetch` simulado): validación del formulario, errores de la API por campo, reintento tras error de red, edición con datos precargados, sincronización de la tabla tras alta y edición, filtro local y visibilidad de acciones según el rol.

## Flujo de autenticación

1. `LoginPage` valida con zod y llama a `POST /auth/login`.
2. La sesión (token, usuario, rol, expiración) se guarda en `sessionStorage` (se borra al cerrar la pestaña).
3. `httpClient` adjunta `Authorization: Bearer <token>`; no conoce el módulo auth: la app le inyecta `getToken` y `onUnauthorized` con `configureHttpClient`.
4. Ante un 401 en una petición autenticada se limpia la sesión y la caché, y `ProtectedRoute` redirige a `/login`.
5. El rol se expone con `useAuth()` para ocultar las acciones de alta y edición a quien no es ADMIN (el backend sigue siendo quien autoriza).

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
Ampliar las pruebas (ya hay Vitest + Testing Library; MSW permitiría simular la API a nivel de red); documentación OpenAPI y tipos generados a partir de ella; configurar CORS en el backend para despliegues sin proxy; un formato de error unificado (`status` siempre numérico, siempre `message`); paginación y filtros en el servidor; refresh token en lugar de cerrar sesión al expirar; y corregir los defectos detectados en el backend.
