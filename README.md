# Clínica Online - Sistema de Gestión de Turnos Médicos

## 📋 Descripción del Proyecto

**Clínica Online** es una aplicación web desarrollada en Angular 18 que permite gestionar turnos médicos de forma digital. El sistema está diseñado para facilitar la interacción entre pacientes, especialistas y administradores, proporcionando una plataforma completa para la solicitud, gestión y seguimiento de turnos médicos.

### Características Principales

- **Gestión de usuarios**: Registro y administración de pacientes, especialistas y administradores
- **Sistema de turnos**: Solicitud, aceptación, rechazo y cancelación de turnos
- **Perfiles de usuario**: Gestión de datos personales y horarios de disponibilidad
- **Historia clínica**: Registro de atenciones y controles médicos
- **Encuestas y calificaciones**: Sistema de evaluación de la atención recibida
- **Estadísticas**: Informes y gráficos de la actividad de la clínica
- **UI dinámica**: Pipes y directivas personalizadas para badges, foco automático y efectos visuales

---

## 🏥 Sobre la Clínica

**Clínica Mondani** es una institución de salud que ofrece atención médica de calidad con tecnología, compromiso y calidez humana. La clínica cuenta con múltiples especialidades médicas y un sistema de turnos online que permite a los pacientes gestionar sus citas de manera sencilla y eficiente.

### Especialidades Disponibles

- Clínica Médica
- Pediatría
- Cardiología
- Dermatología
- Nutrición
- Psicología
- Y más...

### Horarios de Atención

- **Lunes a Viernes**: 8:00 a 19:00 h
- **Sábados**: 9:00 a 14:00 h

---

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn
- Supabase (local o cloud)

### Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>

# Instalar dependencias
npm install

# Configurar variables de entorno
# Editar src/environments/environment.ts con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm start  # por defecto http://localhost:4200
# Si el puerto está ocupado:
# npm start -- --port 4201
```

La aplicación estará disponible en `http://localhost:4200` (o en el puerto que definas con `--port`).

#### Datos de ejemplo

El proyecto cloud contiene turnos demo e historias clínicas para que `/estadisticas` muestre gráficos desde el primer inicio. Si necesitás regenerarlos:

Ejecutá `supabase/seeds/seed_estadisticas.sql` desde el SQL Editor o mediante:

```bash
supabase db execute --file supabase/seeds/seed_estadisticas.sql   # requiere service_role
```

---

## 📱 Pantallas y Secciones

### Página de Bienvenida (`/bienvenida`)

**Acceso**: Público (sin autenticación)

**Contenido**:
- Información sobre la clínica
- Listado de especialidades disponibles
- Horarios de atención
- Enlaces de acceso a login y registro

**Acciones disponibles**:
- Navegar a login de pacientes
- Navegar a registro de pacientes
- Navegar a registro de especialistas

---

### Login (`/login-paciente`)

**Acceso**: Público

**Contenido**:
- Formulario de inicio de sesión (email y contraseña)
- Botones de acceso rápido para desarrollo (Paciente, Especialista, Admin)

**Funcionalidad**:
- Autenticación de usuarios
- Redirección según rol del usuario:
  - **Paciente** → `/mis-turnos-paciente`
  - **Especialista** → `/mis-turnos-especialista`
  - **Admin** → `/bienvenida`

**Validaciones**:
- Especialistas requieren aprobación de administrador
- Verificación de email (temporalmente deshabilitada en desarrollo)

---

### Registro de Paciente (`/registro-paciente`)

**Acceso**: Público

**Contenido**:
- Formulario de registro con los siguientes campos:
  - Nombre
  - Apellido
  - Fecha de nacimiento
  - DNI
  - Obra Social
  - Correo electrónico
  - Contraseña
  - 2 imágenes de perfil (obligatorias)
- Captcha de seguridad

**Funcionalidad**:
- Creación de cuenta de paciente
- Validación de todos los campos
- Cálculo automático de edad desde fecha de nacimiento
- Subida de imágenes a Supabase Storage
- Creación de perfil en base de datos

---

### Registro de Especialista (`/registro-especialista`)

**Acceso**: Público

**Contenido**:
- Formulario de registro con los siguientes campos:
  - Nombre
  - Apellido
  - DNI
  - Fecha de nacimiento
  - Especialidades (múltiple selección)
  - Campo para agregar especialidad personalizada
  - Correo electrónico
  - Contraseña
  - Imagen de perfil (obligatoria)
- Captcha de seguridad

**Funcionalidad**:
- Creación de cuenta de especialista
- Selección múltiple de especialidades
- Posibilidad de agregar especialidades nuevas
- El especialista queda pendiente de aprobación por administrador

---

### Mis Turnos - Paciente (`/mis-turnos-paciente`)

**Acceso**: Solo usuarios con rol **Paciente**

**Contenido**:
- Tabla con todos los turnos solicitados por el paciente
- Columnas: ID, Fecha, Hora, Especialidad, Especialista, Estado, Acciones
- Filtro único para buscar por especialidad o especialista (sin Combobox)

**Acciones disponibles** (según estado del turno):
- **Cancelar turno**: Solo visible si el turno no fue realizado
  - Requiere comentario explicando el motivo
- **Ver reseña**: Solo visible si el turno tiene reseña del especialista
- **Completar encuesta**: Solo visible si el turno fue realizado y tiene reseña
- **Calificar atención**: Solo visible si el turno fue realizado
  - Permite dejar comentario sobre la atención recibida

**Estados de turno**:
- Pendiente
- Aceptado
- Realizado
- Cancelado
- Rechazado

---

### Mis Turnos - Especialista (`/mis-turnos-especialista`)

**Acceso**: Solo usuarios con rol **Especialista**

**Contenido**:
- Tabla con todos los turnos asignados al especialista
- Columnas: ID, Fecha, Hora, Especialidad, Paciente, Estado, Acciones
- Filtro único para buscar por especialidad o paciente (sin Combobox)

**Acciones disponibles** (según estado del turno):
- **Cancelar turno**: Solo visible si no está Aceptado, Realizado o Rechazado
  - Requiere comentario explicando el motivo
- **Rechazar turno**: Solo visible si no está Aceptado, Realizado o Cancelado
  - Requiere comentario explicando el motivo
- **Aceptar turno**: Solo visible si no está Realizado, Cancelado o Rechazado
- **Finalizar Turno**: Solo visible si el turno fue Aceptado
  - Requiere dejar reseña o comentario de la consulta y diagnóstico
- **Ver Reseña**: Solo visible si el turno tiene reseña o comentario

---

### Turnos - Administrador (`/turnos-especialidad`)

**Acceso**: Solo usuarios con rol **Administrador**

**Contenido**:
- Tabla con todos los turnos de la clínica
- Filtro único para buscar por especialidad o especialista (sin Combobox)

**Acciones disponibles**:
- **Cancelar turno**: Solo visible si no está Aceptado, Realizado o Rechazado
  - Requiere comentario explicando el motivo

---

### Solicitar Turno (`/turnos-especialidad` o ruta específica)

**Acceso**: Usuarios con rol **Paciente** o **Administrador**

**Contenido**:
- Formulario para solicitar un nuevo turno
- Campos:
  - Especialidad (selección)
  - Especialista (selección basada en especialidad)
  - Día y horario del turno
  - Si es administrador: selección del paciente

**Restricciones**:
- Los pacientes solo pueden elegir turnos dentro de los próximos 15 días
- Las fechas disponibles están relacionadas con la disponibilidad horaria del especialista seleccionado
- **NO se utiliza Datepicker** (según consigna)

---

### Usuarios - Administrador (`/usuarios-admin`)

**Acceso**: Solo usuarios con rol **Administrador**

**Contenido**:
- Tabla con todos los usuarios del sistema
- Columnas: Avatar, Nombre, Apellido, Email, Rol, Estado, Acciones
- Filtro de búsqueda por nombre, apellido, email o rol
- Paginación y ordenamiento

**Funcionalidades**:
- **Ver información de usuarios**: Listado completo con datos básicos
- **Aprobar/Desaprobar especialistas**: Toggle para habilitar o inhabilitar acceso
- **Crear nuevos usuarios**: Formulario para crear usuarios de cualquier rol:
  - Paciente (con obra social)
  - Especialista (con especialidad)
  - Administrador

**Campos para creación de usuarios**:
- Rol (Paciente, Especialista, Administrador)
- Nombre
- Apellido
- Fecha de nacimiento
- DNI
- Obra Social (solo para pacientes)
- Email
- Contraseña
- Imagen de perfil

---

### Mi Perfil (`/mi-perfil` o ruta específica)

**Acceso**: Usuarios autenticados

**Contenido**:
- Datos del usuario:
  - Nombre y Apellido
  - DNI
  - Email
  - Imágenes de perfil (pacientes tienen 2)
  - Obra Social (solo pacientes)
  - Especialidades (solo especialistas)

**Sección "Mis Horarios"** (solo Especialistas):
- Permite al especialista marcar su disponibilidad horaria
- Considera que un especialista puede tener múltiples especialidades asociadas
- Los horarios se utilizan para mostrar disponibilidad al solicitar turnos

---

### Estadísticas (Administrador) (`/estadisticas`)

**Acceso**: Solo usuarios con rol **Administrador**

**Contenido**:
- Dashboard con 4 gráficos Chart.js:
  - Ingresos recientes al sistema (línea con gradiente)
  - Turnos por especialidad (doughnut)
  - Turnos solicitados por día (barras)
  - Comparativa de turnos solicitados vs. finalizados por profesional (barras agrupadas)
- Tarjetas-resumen con top de especialidades, profesionales y últimas sesiones.

**Funcionalidades**:
- Descarga de reportes en Excel y PDF.
- Mensaje informativo cuando todavía no existen datos estadísticos.
- Estética personalizada (gradientes, tooltips legibles, leyendas inferiores).

---

## 🔐 Sistema de Autenticación

### Roles de Usuario

1. **Paciente**
   - Puede solicitar turnos
   - Ver sus turnos
   - Cancelar turnos pendientes
   - Completar encuestas
   - Calificar atención

2. **Especialista**
   - Requiere aprobación de administrador para acceder
   - Ver turnos asignados
   - Aceptar/rechazar/cancelar turnos
   - Finalizar turnos con reseña
   - Gestionar horarios de disponibilidad

3. **Administrador**
   - Acceso completo al sistema
   - Gestión de usuarios
   - Aprobar especialistas
   - Ver todos los turnos
   - Crear turnos para cualquier paciente

### Acceso y verificación

- Botones de acceso rápido en el login (`environment.quickLogins`) para probar roles sin crear cuentas adicionales.
- La verificación de email (`email_confirmed_at`) está temporalmente deshabilitada en desarrollo; recordar reactivarla antes del despliegue.

### Protección de Rutas

- Las rutas protegidas utilizan guards de Angular
- `adminGuard`: Protege rutas que solo pueden acceder administradores
- Redirección automática según rol si se intenta acceder sin permisos

---

## 🛠️ Tecnologías Utilizadas

- **Angular 18**: Framework principal
- **Angular Material**: Componentes UI
- **Supabase**: Backend (Autenticación, Base de datos, Storage)
- **TypeScript**: Lenguaje de programación
- **RxJS**: Programación reactiva
- **SweetAlert2**: Alertas y diálogos
- **Chart.js**: Gráficos estadísticos
- **jsPDF / jspdf-autotable**: Exportación de reportes en PDF
- **xlsx**: Exportación de reportes en Excel
- **@ngx-translate**: Preparado para internacionalización
- **Reactive Forms**: Formularios reactivos

---

## 📦 Estructura del Proyecto

```
src/
├── app/
│   ├── components/          # Componentes de la aplicación
│   │   ├── login-paciente/
│   │   ├── registro-paciente/
│   │   ├── registro-especialista/
│   │   ├── mis-turnos-paciente/
│   │   ├── mis-turnos-especialista/
│   │   ├── usuarios-admin/
│   │   └── captcha/
│   ├── services/           # Servicios (Supabase, Turnos, etc.)
│   ├── models/             # Modelos de datos
│   ├── directives/         # AutoFocus, ElevateOnHover, StatusBadge
│   ├── pipes/              # LocalDate, StatusLabel, RoleLabel
│   └── app.routes.ts       # Configuración de rutas
├── environments/          # Variables de entorno
└── assets/               # Recursos estáticos
```

---

## 🔧 Configuración

### Variables de Entorno

Editar `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://tuwlrspqlkpqatnaintx.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1d2xyc3BxbGtwcWF0bmFpbnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDcyOTEsImV4cCI6MjA3MTMyMzI5MX0.O5eawMd27SKifzyOvKp5fJZcvgBodxXA5LZWZdexRSA', // key pública (anon)
  captchaEnabled: true, // Habilitar/deshabilitar captcha
  quickLogins: { // Solo para desarrollo
    paciente: { email: '...', password: '...' },
    especialista: { email: '...', password: '...' },
    admin: { email: '...', password: '...' }
  }
};
```

> Si necesitás volver al entorno local, seguí `SUPABASE_LOCAL_SETUP.md` y reemplazá `supabaseUrl`/`supabaseKey` por los de localhost. Para cloud, usá la CLI como se detalla debajo.

### Supabase Cloud (CLI)

```bash
# 1) Token personal (Settings → Access Tokens)
export SUPABASE_ACCESS_TOKEN=sbp_xxx

# 2) Iniciar sesión y linkear proyecto
supabase login
supabase link --project-ref tuwlrspqlkpqatnaintx --password pU2jyBIb8rziRbOm

# 3) Aplicar migraciones
supabase db push

# 4) Crear usuarios demo (usa service role)
export SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
curl -X POST "https://tuwlrspqlkpqatnaintx.supabase.co/auth/v1/admin/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"paciente@test.com","password":"Paciente123","email_confirm":true}'
# repetir para especialista/admin
```

Usuarios ya preconfigurados en cloud:

- Paciente: `paciente@test.com / Paciente123`
- Especialista (aprobado): `especialista@test.com / Especialista123`
- Admin: `admin@test.com / Admin123`

---

## 📝 Scripts Disponibles

```bash
npm start          # Servidor de desarrollo (puerto 4200)
npm run build      # Build de producción
npm test           # Ejecutar tests
```

---

## 🚀 Estado del Proyecto

### Sprint 1 ✅ Finalizado
- Registro de pacientes y especialistas (imágenes dobles para pacientes).
- Login con validaciones por rol y botones de acceso rápido.
- Gestión de usuarios para administradores + guard específico.
- Loading overlay global operativo.

### Sprint 2 ✅ Finalizado
- Captcha activo en ambos formularios de registro.
- README/documentación actualizados.
- Turnos (paciente, especialista, admin) con filtros, acciones y gestión completa.
- Solicitar turnos sin datepicker y con disponibilidad controlada por especialista.
- Mi Perfil con horarios configurables y datos dinámicos.

### Sprint 3 ✅ Finalizado
- Historia clínica completa con vistas para paciente/admin/especialista.
- Descargas: PDF en Mi Perfil y Excel en Usuarios Admin.
- Animaciones de navegación aplicadas a rutas clave.
- Búsqueda de turnos enriquecida con información de historia clínica.

### Sprint 4 🟡 QA final
- Pipes (`LocalDate`, `StatusLabel`, `RoleLabel`) y directivas (`AutoFocus`, `StatusBadge`, `ElevateOnHover`) en producción.
- Dashboards de estadísticas con Chart.js (ingresos, especialidades, días, comparativa profesional).
- Exportaciones de estadísticas en PDF/Excel y manejo de "sin datos" con mensaje contextual.
- Estética refinada de gráficos (gradientes, tooltips legibles, leyendas unificadas).
- Pendiente: cerrar pruebas cruzadas de descargas contra datos reales.

---

## 📞 Contacto y Soporte

Para más información sobre el proyecto, consultar la documentación técnica en `DOCUMENTACION.md` o el roadmap en `ROADMAP.md`.

---

**Desarrollado con ❤️ para Clínica Mondani**
