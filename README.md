# Innova Bandera — Repositorio TIC

Plataforma web institucional para la **I.E. Emblemática Bandera del Perú – Pisco**, desarrollada para centralizar, organizar y gestionar recursos educativos digitales, tutoriales TIC, evidencias de actividades y comunicados institucionales del Área de Innovación Pedagógica (AIP).

El sistema está orientado a docentes, estudiantes y administradores, con control de acceso mediante roles, almacenamiento de archivos, auditoría de operaciones y persistencia en PostgreSQL mediante Sequelize.

---

## 📚 Características principales

La plataforma integra diferentes módulos para apoyar la gestión de recursos digitales de la institución.

### 🏠 1. Inicio

Página principal de la plataforma con:

* Presentación institucional.
* Acceso a los principales módulos.
* Navegación responsive.
* Diseño adaptable a dispositivos móviles.
* Animaciones y transiciones.
* Soporte para modo claro y oscuro.

---

### 📚 2. Recursos Pedagógicos

Repositorio digital de materiales educativos organizados para facilitar su consulta y utilización pedagógica.

Permite trabajar con:

* Recursos educativos.
* Áreas curriculares.
* Grados de secundaria.
* Enlaces externos.
* Archivos descargables.
* Materiales digitales.
* Información descriptiva de cada recurso.

Los usuarios autenticados pueden consultar los recursos y, según su rol, administrarlos.

**Permisos:**

* Administrador: crear, editar y eliminar.
* Docente: crear, editar y eliminar.
* Invitado/Estudiante: consulta.

Los archivos pueden almacenarse mediante **Supabase Storage**.

---

### 🎥 3. Tutoriales TIC

Biblioteca de tutoriales orientados al fortalecimiento de las competencias digitales.

Los tutoriales pueden incorporar:

* Videos de YouTube.
* Título.
* Descripción.
* Categoría.
* Audiencia.
* Enlaces.
* Información complementaria.

La plataforma diferencia contenidos dirigidos a:

* 👨‍🏫 Docentes.
* 👨‍🎓 Estudiantes.
* 👥 Ambos públicos.

Los videos de YouTube se procesan mediante utilidades internas para reconocer y manejar diferentes formatos de enlaces.

**Permisos actuales de API:**

* Administrador: crear, editar y eliminar.
* Docente: crear, editar y eliminar.
* Invitado/Estudiante: consulta.

> **Nota:** la API permite al docente gestionar tutoriales. La interfaz debe mantenerse alineada con esta política de permisos para que las capacidades del frontend y backend sean coherentes.

---

### 🖼️ 4. Evidencias por Mes

Módulo destinado a registrar y visualizar evidencias de las actividades desarrolladas por el Área de Innovación Pedagógica.

Permite organizar evidencias mediante:

* Mes.
* Categoría.
* Tipo.
* Título.
* Descripción.
* Imágenes.
* Enlaces.
* Carpeta de Google Drive.

Las evidencias pueden visualizarse mediante una galería interactiva.

También existe integración opcional con **Google Drive** para obtener imágenes desde carpetas públicas asociadas a cada evidencia.

**Permisos:**

* Administrador: crear, editar y eliminar.
* Docente: crear, editar y eliminar.
* Invitado/Estudiante: consulta.

---

### 📢 5. Noticias y Comunicados

Espacio destinado a publicar información institucional relacionada con:

* Comunicados.
* Talleres TIC.
* Capacitaciones.
* Actividades del AIP.
* Eventos.
* Información institucional.

**Permisos:**

* Administrador: crear, editar y eliminar.
* Docente: consulta.
* Invitado/Estudiante: consulta.

---

### 🔐 6. Autenticación y control de acceso

El sistema utiliza autenticación mediante **JWT (JSON Web Tokens)**.

Los perfiles definidos actualmente son:

| Rol                 | Recursos | Tutoriales | Evidencias | Noticias | Administración |
| ------------------- | -------: | ---------: | ---------: | -------: | -------------: |
| Administrador       |     CRUD |       CRUD |       CRUD |     CRUD |              ✅ |
| Docente             |     CRUD |      CRUD* |       CRUD |  Lectura |              ❌ |
| Invitado/Estudiante |  Lectura |    Lectura |    Lectura |  Lectura |              ❌ |

`*` El backend permite al docente gestionar tutoriales.

El sistema utiliza:

* JWT.
* bcryptjs para hash de contraseñas.
* Middleware de autenticación.
* Control de permisos por rol.
* Rate limiting.
* Helmet.
* CORS.
* Validación de datos mediante Zod.

---

# 🛠️ Arquitectura tecnológica

## Frontend

Desarrollado utilizando:

* React 19.
* Vite 8.
* React Router 7.
* Tailwind CSS 4.
* Framer Motion.
* Lucide React.
* Font Awesome.
* Recharts.

El frontend se encuentra principalmente en:

```text
src/
├── App.jsx
├── App.css
├── index.css
├── main.jsx
├── assets/
├── components/
├── context/
├── services/
└── utils/
```

---

## Backend

El backend está construido con:

* Node.js.
* Express 5.
* Sequelize.
* PostgreSQL.
* JWT.
* bcryptjs.
* Helmet.
* CORS.
* express-rate-limit.
* Multer.
* Zod.
* Winston.

Archivo principal:

```text
server.js
```

Servicios complementarios:

```text
server/
├── middleware.js
├── models.js
├── services/
│   ├── auditoria.js
│   ├── logger.js
│   └── storage.js
└── validators.js
```

---

# 🗄️ Base de datos

La persistencia principal se realiza mediante:

```text
PostgreSQL
       ↓
   Sequelize
       ↓
    Express
```

La conexión puede realizarse mediante **Supabase PostgreSQL**, utilizando `DATABASE_URL`.

Los modelos principales incluyen información relacionada con:

* Usuarios.
* Recursos.
* Tutoriales.
* Noticias.
* Evidencias.
* Registros de auditoría.

---

# ☁️ Supabase Storage

Los archivos subidos por los usuarios pueden almacenarse mediante **Supabase Storage**.

Variables principales:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=recursos-uploads
```

El servicio de almacenamiento se encuentra en:

```text
server/services/storage.js
```

---

# 📁 Google Drive

El módulo de evidencias incorpora una integración opcional con Google Drive.

Se utiliza una API Key de Google para acceder a carpetas públicas asociadas a las evidencias.

Variable:

```env
VITE_GOOGLE_API_KEY=
```

La funcionalidad se encuentra principalmente en:

```text
src/services/googleDrive.js
```

La API Key debe configurarse con restricciones apropiadas.

Para producción se recomienda restringir el uso al dominio oficial:

```text
https://recursos-docentes-aip.vercel.app/*
```

y al entorno local:

```text
http://localhost:5173/*
```

---

# 📊 Auditoría

El sistema incorpora un módulo de auditoría exclusivo para administradores.

Permite:

* Consultar registros.
* Filtrar operaciones.
* Consultar estadísticas.
* Revisar actividad del sistema.
* Exportar registros a CSV.

Endpoints principales:

```text
GET /api/admin/auditoria
GET /api/admin/auditoria/stats
GET /api/admin/auditoria/export-csv
```

Entre las operaciones registradas se encuentran:

```text
LOGIN_EXITOSO
LOGIN_FALLIDO
USUARIO_CREADO
USUARIO_ELIMINADO
RECURSO_CREADO
RECURSO_ACTUALIZADO
RECURSO_ELIMINADO
TUTORIAL_CREADO
TUTORIAL_ACTUALIZADO
TUTORIAL_ELIMINADO
NOTICIA_CREADA
NOTICIA_ACTUALIZADA
NOTICIA_ELIMINADA
EVIDENCIA_CREADA
EVIDENCIA_ACTUALIZADA
EVIDENCIA_ELIMINADA
AUDITORIA_EXPORTADA
```

Los servicios de auditoría se encuentran en:

```text
server/services/auditoria.js
```

---

# 💾 Backups e importación

El administrador dispone de funcionalidades para generar respaldos de los datos.

Endpoint:

```text
POST /api/admin/backup
```

Los respaldos se almacenan en:

```text
backups/
```

También existe un mecanismo de importación:

```text
POST /api/import
```

Estas operaciones están protegidas y solamente pueden ser ejecutadas por administradores autenticados.

> Los directorios de respaldo pueden contener archivos grandes y no deben considerarse parte necesaria del despliegue de producción.

---

# 👨‍🏫 Gestión de docentes

El administrador puede gestionar usuarios docentes desde el panel administrativo.

La plataforma incluye carga masiva de docentes mediante archivos Excel.

Endpoint:

```text
POST /api/docentes/bulk-upload
```

La funcionalidad utiliza:

```text
xlsx
```

para procesar archivos de Excel.

También existen operaciones administrativas para:

```text
GET    /api/auth/users
POST   /api/auth/register
DELETE /api/auth/users/:id
PUT    /api/auth/users/:id/password
```

---

# 🔌 API REST

Los principales recursos disponibles son:

## Autenticación

```text
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/register
GET  /api/auth/users
DELETE /api/auth/users/:id
PUT /api/auth/users/:id/password
```

## Recursos

```text
GET    /api/recursos
POST   /api/recursos
PUT    /api/recursos/:id
DELETE /api/recursos/:id
```

## Tutoriales

```text
GET    /api/tutoriales
POST   /api/tutoriales
PUT    /api/tutoriales/:id
DELETE /api/tutoriales/:id
```

## Noticias

```text
GET    /api/noticias
POST   /api/noticias
PUT    /api/noticias/:id
DELETE /api/noticias/:id
```

## Evidencias

```text
GET    /api/evidencias
POST   /api/evidencias
PUT    /api/evidencias/:id
DELETE /api/evidencias/:id
```

## Archivos

```text
POST /api/upload
POST /api/uploads
```

## Administración

```text
POST /api/admin/backup
POST /api/import

GET /api/admin/auditoria
GET /api/admin/auditoria/stats
GET /api/admin/auditoria/export-csv
```

Las operaciones de escritura y administración requieren autenticación y permisos adecuados.

---

# 📋 Datos iniciales

El archivo:

```text
db.json
```

contiene datos iniciales utilizados como **seed** cuando corresponde.

Actualmente puede incluir información inicial de:

```text
recursos
tutoriales
noticias
evidencias
```

Este archivo no debe confundirse con la base de datos de producción.

La información de producción se gestiona mediante PostgreSQL/Sequelize.

---

# 🚀 Requisitos

Para ejecutar el proyecto localmente se recomienda:

* Node.js 18 o superior.
* npm.
* PostgreSQL o una instancia de PostgreSQL compatible.
* Cuenta de Supabase para almacenamiento/base de datos si se utiliza esa infraestructura.

El entorno Docker utiliza Node.js 22 Alpine.

---

# 📥 Instalación

Clonar el repositorio:

```bash
git clone https://github.com/s2angelo9876-svg/recursos-docentes-aip.git
```

Entrar al proyecto:

```bash
cd recursos-docentes-aip
```

Instalar dependencias:

```bash
npm install
```

Crear el archivo de variables de entorno:

### Linux / macOS

```bash
cp .env.example .env
```

### Windows CMD

```cmd
copy .env.example .env
```

Editar `.env` y configurar los valores correspondientes.

---

# 💻 Desarrollo local

Ejecutar:

```bash
npm run dev
```

Esto inicia simultáneamente:

* Frontend Vite.
* Backend Express.

Por defecto:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:5000
```

El frontend utiliza el proxy de Vite para las peticiones `/api` cuando `VITE_API_URL` está vacío.

---

# 🏗️ Compilación

Para generar la versión de producción del frontend:

```bash
npm run build
```

El resultado se genera en:

```text
dist/
```

---

# ▶️ Producción

Para ejecutar el sistema en producción:

```bash
npm run start
```

Para compilar y ejecutar en un solo paso:

```bash
npm run prod
```

El script de producción establece:

```env
NODE_ENV=production
```

y ejecuta el servidor Express.

En producción se debe configurar obligatoriamente un `JWT_SECRET` seguro.

---

# 🌐 Despliegue en Vercel + Render

La arquitectura recomendada para despliegue separado es:

```text
                    INTERNET
                        │
                        ▼
              ┌─────────────────┐
              │     Vercel      │
              │ React + Vite    │
              └────────┬────────┘
                       │
                 HTTPS / API
                       │
                       ▼
              ┌─────────────────┐
              │     Render      │
              │ Express + Node  │
              └────────┬────────┘
                       │
              ┌────────┴─────────┐
              ▼                  ▼
       PostgreSQL             Supabase
       / Sequelize            Storage
```

## Frontend — Vercel

Configuración:

```text
Framework:
Vite

Build Command:
npm run build

Output Directory:
dist
```

Variable:

```env
VITE_API_URL=https://recursos-docentes.onrender.com
```

El archivo `vercel.json` contiene la configuración necesaria para el funcionamiento de React Router como SPA.

Dominio actualmente utilizado:

```text
https://recursos-docentes-aip.vercel.app
```

---

## Backend — Render

Crear un Web Service conectado al repositorio.

Comando:

```bash
npm start
```

Variables principales:

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=TU_SECRETO_SEGURO
DATABASE_URL=TU_URL_POSTGRESQL
SUPABASE_URL=TU_URL_SUPABASE
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=recursos-uploads
CORS_ORIGIN=https://recursos-docentes-aip.vercel.app
```

El backend debe permitir como origen CORS el dominio real utilizado por el frontend.

Si también se requiere desarrollo local:

```env
CORS_ORIGIN=https://recursos-docentes-aip.vercel.app,http://localhost:5173
```

---

# 🔐 Variables de entorno

Ejemplo:

```env
JWT_SECRET=cambiar-por-un-secreto-seguro
PORT=5000
NODE_ENV=development

CORS_ORIGIN=https://recursos-docentes-aip.vercel.app,http://localhost:5173

VITE_API_URL=

DATABASE_URL=postgresql://usuario:password@host:6543/postgres

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=recursos-uploads

VITE_GOOGLE_API_KEY=

LOG_LEVEL=info
```

### Descripción

| Variable                    | Función                                      |
| --------------------------- | -------------------------------------------- |
| `JWT_SECRET`                | Secreto utilizado para firmar los tokens JWT |
| `PORT`                      | Puerto del servidor Express                  |
| `NODE_ENV`                  | Entorno de ejecución                         |
| `CORS_ORIGIN`               | Orígenes permitidos                          |
| `VITE_API_URL`              | URL del backend utilizada por Vercel         |
| `DATABASE_URL`              | Conexión a PostgreSQL                        |
| `SUPABASE_URL`              | URL del proyecto Supabase                    |
| `SUPABASE_SERVICE_ROLE_KEY` | Credencial de servidor para Storage          |
| `SUPABASE_STORAGE_BUCKET`   | Bucket utilizado para archivos               |
| `VITE_GOOGLE_API_KEY`       | API Key opcional para Google Drive           |
| `LOG_LEVEL`                 | Nivel de detalle de los logs                 |

> **Nunca publiques las claves de Supabase, secretos JWT, contraseñas ni otras credenciales en GitHub.**

---

# 👤 Usuario administrador inicial

Cuando la base de datos se encuentra vacía, el servidor puede crear automáticamente un usuario administrador inicial.

Credenciales iniciales configuradas actualmente por el backend:

```text
Usuario: admin
Contraseña: admin123
Rol: Administrador
```

### ⚠️ Seguridad

Estas credenciales son únicamente de inicialización.

**Debe cambiarse inmediatamente la contraseña antes de utilizar la plataforma en un entorno real.**

No se deben documentar ni distribuir credenciales reales de docentes o usuarios finales dentro del repositorio público.

Los usuarios docentes pueden gestionarse posteriormente desde el panel administrativo.

---

# 🧪 Pruebas

El proyecto incluye pruebas automatizadas.

Ejecutar:

```bash
npm test
```

Actualmente existen pruebas relacionadas con:

```text
tests/
├── auditoria.test.js
└── youtube.test.js
```

---

# 🔍 Calidad del código

Ejecutar ESLint:

```bash
npm run lint
```

Esto permite detectar problemas de estilo y posibles errores en el código JavaScript/React.

---

# 📜 Scripts disponibles

| Comando           | Descripción                             |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Inicia frontend y backend en desarrollo |
| `npm run server`  | Inicia solamente el backend con Nodemon |
| `npm run build`   | Genera el build de producción           |
| `npm run start`   | Ejecuta el servidor en producción       |
| `npm run prod`    | Compila y ejecuta producción            |
| `npm run lint`    | Ejecuta ESLint                          |
| `npm test`        | Ejecuta las pruebas automatizadas       |
| `npm run preview` | Previsualiza el build de Vite           |

---

# 📂 Estructura del proyecto

```text
recursos-docentes-aip/
│
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── AdminModal.jsx
│   │   ├── AdminPanel.jsx
│   │   ├── AuditoriaPanel.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── Evidencias.jsx
│   │   ├── GaleriaModal.jsx
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── Login.jsx
│   │   ├── Noticias.jsx
│   │   ├── Repositorio.jsx
│   │   └── Tutoriales.jsx
│   │
│   ├── context/
│   │   └── AppContext.jsx
│   │
│   ├── services/
│   │   ├── db.js
│   │   └── googleDrive.js
│   │
│   ├── utils/
│   │   ├── api.js
│   │   └── youtube.js
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── server/
│   ├── middleware.js
│   ├── models.js
│   ├── services/
│   │   ├── auditoria.js
│   │   ├── logger.js
│   │   └── storage.js
│   └── validators.js
│
├── scripts/
│   ├── create-bucket.js
│   └── start-prod.js
│
├── tests/
│   ├── auditoria.test.js
│   └── youtube.test.js
│
├── backups/
│
├── public/
│
├── db.json
├── server.js
├── Dockerfile
├── docker-compose.yml
├── vercel.json
├── vite.config.js
├── tailwind.config.js
├── eslint.config.js
├── package.json
├── .env.example
├── DESIGN.md
└── README.md
```

---

# 🐳 Docker

El proyecto incluye:

```text
Dockerfile
docker-compose.yml
```

La imagen utiliza:

```text
Node.js 22 Alpine
```

El Dockerfile realiza:

1. Instalación de dependencias.
2. Compilación del frontend.
3. Preparación del entorno de producción.
4. Copia del backend y archivos necesarios.
5. Creación del directorio de backups.
6. Inicio del servidor.

Construir:

```bash
docker build -t recursos-docentes-aip .
```

Ejecutar:

```bash
docker run -p 10000:10000 --env-file .env recursos-docentes-aip
```

La configuración de producción debe proporcionar las variables de entorno necesarias.

---

# 🛡️ Consideraciones de seguridad

El proyecto incorpora diferentes mecanismos de protección:

* Helmet.
* CORS.
* Rate limiting.
* JWT.
* bcryptjs.
* Validación mediante Zod.
* Middleware de autenticación.
* Autorización basada en roles.
* Limitación de operaciones administrativas.
* Registro de auditoría.
* Protección de endpoints sensibles.

### Recomendaciones para producción

Antes de publicar:

1. Cambiar la contraseña del administrador.
2. Utilizar un `JWT_SECRET` largo y aleatorio.
3. No subir `.env` a GitHub.
4. No publicar `SUPABASE_SERVICE_ROLE_KEY`.
5. Restringir la API Key de Google.
6. Configurar correctamente `CORS_ORIGIN`.
7. Utilizar HTTPS.
8. Revisar las políticas RLS de Supabase cuando correspondan.
9. Realizar backups periódicos.
10. Revisar los registros de auditoría.

---

# 📝 Información institucional

**Proyecto:** Innova Bandera — Repositorio TIC

**Institución:** I.E. Emblemática Bandera del Perú

**Ubicación:** Pisco, Ica, Perú

**Área:** Área de Innovación Pedagógica (AIP)

**Plataforma:** Recursos Docentes AIP

**Frontend:** React + Vite

**Backend:** Node.js + Express

**Base de datos:** PostgreSQL + Sequelize

**Infraestructura:** Vercel + Render + Supabase

---

# 🌐 Plataforma

La versión desplegada actualmente se encuentra disponible en:

https://recursos-docentes-aip.vercel.app

---

# 📌 Estado del proyecto

El proyecto cuenta actualmente con:

* ✅ Repositorio de recursos pedagógicos.
* ✅ Tutoriales TIC.
* ✅ Noticias y comunicados.
* ✅ Evidencias organizadas por mes.
* ✅ Galería de evidencias.
* ✅ Integración opcional con Google Drive.
* ✅ Autenticación JWT.
* ✅ Roles de usuario.
* ✅ Gestión administrativa.
* ✅ Gestión de docentes.
* ✅ Carga masiva mediante Excel.
* ✅ Auditoría.
* ✅ Exportación de auditoría a CSV.
* ✅ Backups.
* ✅ Importación de datos.
* ✅ Supabase Storage.
* ✅ PostgreSQL mediante Sequelize.
* ✅ Protección mediante Helmet.
* ✅ Rate limiting.
* ✅ Validación de datos.
* ✅ Pruebas automatizadas.
* ✅ Configuración Docker.
* ✅ Despliegue Vercel + Render.

---

## 📄 Licencia

Proyecto institucional de uso educativo.

La utilización, modificación o redistribución del código debe realizarse de acuerdo con las políticas y autorizaciones correspondientes de la institución educativa.

