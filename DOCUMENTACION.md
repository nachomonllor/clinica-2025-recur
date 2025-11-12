# Documentación del Proyecto - ClinicaOnline

## 📋 Resumen General

**ClinicaOnline** es un sistema de gestión de clínica médica online desarrollado en Angular 18. Permite la gestión de turnos médicos, perfiles de usuarios (pacientes, especialistas, administradores), historias clínicas, encuestas de atención y estadísticas.

---

## 🛠️ Stack Tecnológico

### Framework y Librerías Principales
- **Angular**: 18.2.0 (standalone components)
- **TypeScript**: ~5.5.2
- **RxJS**: ~7.8.0

### Backend/BaaS
- **Supabase**: Autenticación y base de datos
  - Entorno local via Docker (`SUPABASE_LOCAL_SETUP.md`) + credenciales de prueba
  - Cliente: `@supabase/supabase-js` v2.78.0

### UI/UX
- **Angular Material**: 18.2.14 (componentes UI)
- **Angular CDK**: 18.2.14
- **SweetAlert2**: 11.26.3 (alertas y modales)

### Utilidades
- **Chart.js**: 4.5.1 (gráficos y estadísticas)
- **jsPDF**: 3.0.3 + **jsPDF-autotable**: 5.0.2 (exportación PDF)
- **xlsx**: 0.18.5 (exportación Excel)
- **@ngx-translate**: 17.0.0 (internacionalización)

---

## 📁 Arquitectura del Proyecto

### Estructura de Directorios

```
src/
├── app/
│   ├── bienvenida/              # Componente de bienvenida
│   ├── components/               # Componentes principales
│   │   ├── encuesta-atencion/
│   │   ├── estadisticas/
│   │   ├── historia-clinica/
│   │   ├── listar-especialistas/
│   │   ├── listar-pacientes/
│   │   ├── log-table/
│   │   ├── login-paciente/
│   │   ├── mis-turnos-especialista/
│   │   ├── mis-turnos-paciente/
│   │   ├── registro-especialista/
│   │   ├── registro-paciente/
│   │   ├── resenia-especialista/
│   │   ├── seleccionar-usuario/
│   │   ├── seleccionar-usuario-login/
│   │   ├── seleccionar-usuario-registro/
│   │   ├── turnos-especialidad/
│   │   └── turnos-especialista/
│   ├── loading-overlay/          # Overlay de carga
│   ├── services/                  # Servicios de la app
│   │   ├── loading.service.ts
│   └── app.component.ts
├── environments/                  # Configuración de entornos
├── interceptors/                  # Interceptores HTTP
│   └── loading.interceptor.ts
├── models/                        # Modelos de datos
├── pipes/                         # Pipes personalizados
│   ├── local-date.pipe.ts
│   ├── status-label.pipe.ts
│   └── role-label.pipe.ts
├── directives/                    # Directivas personalizadas
│   ├── auto-focus.directive.ts
│   ├── elevate-on-hover.directive.ts
│   └── status-badge.directive.ts
└── services/                      # Servicios principales
    ├── auth.guard.ts
    ├── auth.service.ts
    ├── especialista.service.ts
    ├── firestore.service.ts
    ├── log.service.ts
    ├── paciente.service.ts
    ├── supabase.service.ts
    └── turno.service.ts
```

---

## 📊 Modelos de Datos

### Usuario (`usuario.model.ts`)
```typescript
interface Usuario {
  nombre: string;
  apellido: string;
  email: string;
  imagenPerfil: string;
  horarios?: Horario[];  // Solo para especialistas
}
```

### Perfil (`perfil.model.ts`)
```typescript
type Rol = 'paciente' | 'especialista' | 'admin';

interface PerfilRow {
  id: string;                    // PK = auth.users.id
  rol: Rol;
  aprobado: boolean | null;
  nombre: string | null;
  apellido: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string | null;
}

type PerfilInsert = {
  id: string;
  rol: Rol;
  aprobado?: boolean | null;
  nombre?: string | null;
  dni: string | null;
  obra_social?: string | null;
  fecha_nacimiento?: string | null;
  email: string;
  apellido?: string | null;
  avatar_url?: string | null;
  imagen2_url?: string | null;
};
```

### Turno (`turno.model.ts`)
```typescript
type TurnoEstado = 
  | 'pendiente'
  | 'realizado'
  | 'cancelado'
  | 'rechazado'
  | 'aceptado';

interface Turno {
  id: number;
  fecha: Date;
  hora: string;
  especialidad: string;
  especialista: string;
  pacienteId?: string;
  estado: TurnoEstado;
  resenaEspecialista?: string;
  resena: string;
  calificacion: number;
  comentarioPaciente?: string;
  calificacionPaciente?: number;
  encuesta?: boolean;
}

// Estructura desde BD (tabla 'turnos')
interface TurnoRow {
  id: string;
  paciente_id: string;
  especialista_id: string;
  especialidad: string;
  fecha_iso: string;              // ISO string
  estado: EstadoTurno;
  resena_especialista?: string | null;
  encuesta?: any | null;
  created_at?: string;
  updated_at?: string;
}

// Vista para UI
interface TurnoVM {
  id: string;
  fecha: Date;
  hora: string;                   // 'HH:mm'
  especialidad: string;
  especialista: string;            // "Apellido, Nombre"
  estado: EstadoTurno;
  resena?: string;
  encuesta?: boolean;
  pacienteId: string;
  calificacion?: number;
}
```

### Otros Modelos
- `paciente.model.ts`: Modelo de paciente
- `especialista.model.ts`: Modelo de especialista
- `historia-clinica.model.ts`: Modelo de historia clínica
- `horario.model.ts`: Modelo de horarios
- `dato-dinamico.model.ts`: Modelo de datos dinámicos
- `turno-especialista.model.ts`: Modelo específico para turnos de especialista

---

## 🎨 Pipes y Directivas Personalizadas (Sprint 4)

### Pipes
- `LocalDatePipe`: Formatea fechas a locale del usuario.
- `StatusLabelPipe`: Traduce estados de turno (`pendiente`, `realizado`, etc.) a etiquetas legibles.
- `RoleLabelPipe`: Expone etiquetas amigables para los roles del sistema.

### Directivas
- `AutoFocusDirective`: Enfoca campos automáticamente con retardo configurable (usado en login).
- `ElevateOnHoverDirective`: Añade elevación/hover en tarjetas y botones destacados.
- `StatusBadgeDirective`: Aplica estilos de badge según el estado/rol asociado.

Las tres directivas están registradas como standalone y reutilizadas en tablas de turnos y usuarios.

---

## 🔧 Servicios Principales

### SupabaseService (`supabase.service.ts`)
**Responsabilidad**: Cliente principal de Supabase y operaciones de base de datos.

**Métodos principales**:
- `iniciarSesion(email, password)`: Inicia sesión
- `signUp(email, password)`: Registro de usuario
- `cerrarSesion()`: Cierra sesión
- `obtenerUsuarioActual()`: Obtiene usuario actual
- `getSession()`: Obtiene sesión actual
- `onAuthChange(cb)`: Listener de cambios de autenticación
- `obtenerPerfil(uid)`: Obtiene perfil de usuario
- `upsertPerfil(perfil)`: Crea/actualiza perfil
- `uploadAvatar(userId, file, idx)`: Sube avatar a storage

**Propiedades**:
- `client`: Cliente de Supabase
- `sdk`: Alias de `client`

### AuthService (`auth.service.ts`)
**Responsabilidad**: Servicio de autenticación (duplicado con funcionalidades de SupabaseService).

**Métodos principales**:
- `signIn(email, password)`: Inicia sesión
- `signOut()`: Cierra sesión
- `getSession()`: Obtiene sesión actual
- `onAuthStateChange(callback)`: Listener de cambios de sesión
- `getMyProfile(userId)`: Obtiene perfil del usuario
- `signUp(email, password, profile?)`: Registro con verificación por email

**Nota**: Hay duplicación de funcionalidad con `SupabaseService`. Considerar consolidar.

### TurnoService (`turno.service.ts`)
**Responsabilidad**: Gestión de turnos médicos.

**Métodos principales**:
- `getTurnosPacienteVM$()`: Obtiene turnos del paciente logueado (Observable)
- `getTurnosEspecialista$(especialistaId?)`: Obtiene turnos del especialista (Observable)
- `cancelarTurno(id)`: Cancela un turno

**Características**:
- Usa RxJS para operaciones reactivas
- Mapea datos de BD a ViewModels (TurnoVM)
- Incluye joins con tabla `profiles` para nombres

### Otros Servicios
- `paciente.service.ts`: Gestión de pacientes
- `especialista.service.ts`: Gestión de especialistas
- `log.service.ts`: Registro de actividades
- `firestore.service.ts`: Servicio de Firestore (posiblemente legacy)
- `loading.service.ts`: Gestión de estado de carga

---

## 🎯 Componentes Principales

### Autenticación
- **`login-paciente`**: Login de pacientes
  - Valida email y password
  - Verifica email confirmado
  - Valida rol de paciente
  - Redirige a `/mis-turnos-paciente`

- **`registro-paciente`**: Registro de nuevos pacientes
- **`registro-especialista`**: Registro de especialistas

### Gestión de Turnos
- **`mis-turnos-paciente`**: Vista de turnos del paciente
  - Lista turnos del paciente logueado
  - Permite cancelar turnos
  - Muestra estado, especialidad, especialista

- **`mis-turnos-especialista`**: Vista de turnos del especialista
  - Lista turnos asignados al especialista
  - Permite aceptar/rechazar turnos
  - Permite completar turnos

- **`turnos-especialidad`**: Selección de turnos por especialidad
- **`turnos-especialista`**: Gestión de turnos por especialista

### Gestión de Usuarios
- **`listar-pacientes`**: Lista todos los pacientes
- **`listar-especialistas`**: Lista todos los especialistas
- **`seleccionar-usuario`**: Selección de usuario (genérico)
- **`seleccionar-usuario-login`**: Selección para login
- **`seleccionar-usuario-registro`**: Selección para registro

### Evaluación y Feedback
- **`encuesta-atencion`**: Encuesta de atención post-consulta
- **`resenia-especialista`**: Reseña del especialista sobre la consulta

### Utilidades
- **`historia-clinica`**: Visualización y gestión de historia clínica
- **`estadisticas`**: Dashboards con Chart.js (4 gráficos combinados) + exportación PDF/Excel, estética personalizada y mensaje contextual cuando no hay datos
- **`log-table`**: Tabla de logs del sistema
- **`loading-overlay`**: Overlay de carga global
- **`bienvenida`**: Componente de bienvenida inicial

---

## 🗺️ Rutas de la Aplicación

### Rutas Principales (`app.routes.ts`)
```typescript
Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'bienvenida' },
  { path: 'bienvenida', component: BienvenidaComponent },
  
  // Auth / público
  { path: 'login-paciente', loadComponent: ... },
  { path: 'registro-paciente', loadComponent: ... },
  { path: 'registro-especialista', loadComponent: ... },
  
  // Funcionalidades
  { path: 'encuesta-atencion', loadComponent: ... },
  { path: 'log-table', loadComponent: ... },
  { path: 'estadisticas', loadComponent: ... },
  { path: 'historia-clinica', loadComponent: ... },
  { path: 'listar-especialistas', loadComponent: ... },
  { path: 'listar-pacientes', loadComponent: ... },
  { path: 'mis-turnos-especialista', loadComponent: ... },
  { path: 'mis-turnos-paciente', loadComponent: ... },
  { path: 'resenia-especialista', loadComponent: ... },
  { path: 'seleccionar-usuario', loadComponent: ... },
  { path: 'seleccionar-usuario-login', loadComponent: ... },
  { path: 'seleccionar-usuario-registro', loadComponent: ... },
  { path: 'turnos-especialidad', loadComponent: ... },
  
  { path: '**', redirectTo: 'login-paciente' }
]
```

**Nota**: Todas las rutas usan lazy loading con `loadComponent`.

**Problema identificado**: Hay una ruta duplicada (líneas 12 y 15) que redirige a diferentes lugares.

---

## 🗄️ Base de Datos (Supabase)

### Tablas Principales

#### `profiles`
Perfiles de usuario vinculados a `auth.users`.

**Campos**:
- `id` (PK, UUID): Referencia a `auth.users.id`
- `rol` (enum): 'paciente' | 'especialista' | 'admin'
- `aprobado` (boolean | null): Estado de aprobación
- `nombre` (string | null)
- `apellido` (string | null)
- `dni` (string | null)
- `obra_social` (string | null)
- `fecha_nacimiento` (date | null)
- `email` (string)
- `avatar_url` (string | null)
- `imagen2_url` (string | null)
- `created_at` (timestamptz)
- `updated_at` (timestamptz | null)

#### `turnos`
Turnos médicos.

**Campos**:
- `id` (PK, UUID)
- `paciente_id` (FK → profiles.id)
- `especialista_id` (FK → profiles.id)
- `especialidad` (string)
- `fecha_iso` (timestamptz): Fecha y hora del turno
- `estado` (enum): 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado'
- `resena_especialista` (text | null)
- `encuesta` (jsonb | null): Datos de encuesta (estrellas, comentario, etc.)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Storage
- **Bucket `avatars`**: Almacenamiento de imágenes de perfil

---

## 🔐 Autenticación y Autorización

### Flujo de Autenticación
1. Usuario ingresa email y password
2. `SupabaseService.iniciarSesion()` autentica con Supabase Auth
3. (Temporal) Se omite la verificación de `email_confirmed_at` para agilizar QA local
4. Se obtiene el perfil desde `profiles`
5. Se valida el rol del usuario
6. Se redirige según el rol:
   - Paciente → `/mis-turnos-paciente`
   - Especialista → `/mis-turnos-especialista`
   - Admin → `/bienvenida`

### Guards
- **`authGuard`**: Verifica sesión activa
  - Ubicación: `src/services/auth.guard.ts`
  - Redirige a `/login` si no hay sesión
- **`adminGuard`**: Valida rol administrador y redirige a `/login-paciente` si no corresponde

### Roles
- **`paciente`**: Puede solicitar turnos, ver sus turnos, completar encuestas
- **`especialista`**: Puede aceptar/rechazar turnos, completar turnos, dejar reseñas
- **`admin`**: Gestiona usuarios, turnos globales y estadísticas

---

## ⚙️ Configuración

### Environment (`environment.ts`)
```typescript
{
  production: false,
  supabaseUrl: 'https://tuwlrspqlkpqatnaintx.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1d2xyc3BxbGtwcWF0bmFpbnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDcyOTEsImV4cCI6MjA3MTMyMzI5MX0.O5eawMd27SKifzyOvKp5fJZcvgBodxXA5LZWZdexRSA',
  captchaEnabled: true,
  quickLogins: {
    paciente: { email: 'paciente@test.com', password: 'Paciente123' },
    especialista: { email: 'especialista@test.com', password: 'Especialista123' },
    admin: { email: 'admin@test.com', password: 'Admin123' }
  }
}
```

> Nota: el `service_role` **no** se guarda en el frontend. Sólo se usa temporalmente al ejecutar seeds desde CLI o scripts.

#### Supabase Cloud – Pasos rápidos

1. **Token personal:** `export SUPABASE_ACCESS_TOKEN=sbp_xxx`  
2. **Login + link:**  
   ```bash
   supabase login
   supabase link --project-ref tuwlrspqlkpqatnaintx --password pU2jyBIb8rziRbOm
   ```
3. **Migraciones:** `supabase db push`  
4. **Usuarios demo (Auth):** usar la Admin API con la `service_role key`  
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
   curl -X POST "https://tuwlrspqlkpqatnaintx.supabase.co/auth/v1/admin/users" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"paciente@test.com","password":"Paciente123","email_confirm":true}'
   # repetir para especialista@test.com y admin@test.com
   ```
5. **Perfiles/turnos demo:**  
   - Ejecutar `supabase/seeds/seed_estadisticas.sql` (desde CLI o SQL editor) **una vez que existan el paciente y el especialista aprobados**.  
   - En esta instancia cloud ya se ejecutó una carga via REST: 12 turnos `DEMO ...`, historias clínicas asociadas y `updated_at` ajustado para estadísticas.

Credenciales disponibles en producción:
- Paciente: `paciente@test.com / Paciente123`
- Especialista (aprobado): `especialista@test.com / Especialista123`
- Admin: `admin@test.com / Admin123`

---

## 🚀 Scripts Disponibles

```bash
npm start          # ng serve - Servidor de desarrollo
npm run build      # ng build - Build de producción
npm run watch      # ng build --watch --configuration development
npm test           # ng test - Ejecutar tests
```

---

## 📝 Observaciones y Mejores Prácticas Pendientes

### Hallazgos Recientes

1. **Servicios de autenticación solapados**
   - `AuthService` y `SupabaseService` siguen compartiendo responsabilidades.
   - Recomendación: Consolidar lógica de login/registro en un único servicio para reducir duplicación.

2. **Código comentado legacy**
   - Persisten secciones comentadas en componentes y servicios históricos.
   - Recomendación: limpiar o mover esos ejemplos a documentación técnica para mantener el repo prolijo.

3. **Firestore legacy**
   - `firestore.service.ts` se mantiene aunque la app opera 100% con Supabase.
   - Recomendación: evaluar su eliminación o actualizarlo a la nueva arquitectura si aún se necesita.

4. **Reactivación de verificación de email**
   - La validación de `email_confirmed_at` permanece deshabilitada para agilizar el desarrollo.
   - Recomendación: restaurarla antes del despliegue y documentar el procedimiento en `SUPABASE_LOCAL_SETUP.md`.

### Próximos Ajustes Sugeridos

1. Consolidar servicios de autenticación.
2. Continuar limpiando código comentado y assets sin uso.
3. Documentar contratos de servicios (inputs/outputs) y errores esperables.
4. Agregar pruebas unitarias en pipes/directivas nuevas y en `EstadisticasService`.
5. Centralizar manejo de errores y toasts para mantener consistencia UX.
6. Documentar proceso para reactivar e2e del captcha cuando se vuelva a habilitar.

---

## 📚 Dependencias Clave

### Producción
- `@angular/*`: 18.2.0 - 18.2.14
- `@supabase/supabase-js`: ^2.78.0
- `rxjs`: ~7.8.0
- `chart.js`: ^4.5.1
- `jspdf`: ^3.0.3
- `jspdf-autotable`: ^5.0.2
- `sweetalert2`: ^11.26.3
- `xlsx`: ^0.18.5

### Desarrollo
- `@angular/cli`: ^18.2.21
- `typescript`: ~5.5.2
- `karma`: ~6.4.0
- `jasmine-core`: ~5.2.0

---

## 🔄 Flujos Principales

### Flujo de Solicitud de Turno
1. Paciente selecciona especialidad
2. Selecciona especialista
3. Selecciona fecha y hora disponible
4. Confirma turno
5. Turno se crea con estado `pendiente`
6. Especialista recibe notificación
7. Especialista acepta/rechaza turno

### Flujo de Completar Turno
1. Especialista marca turno como `realizado`
2. Especialista puede dejar reseña
3. Paciente puede completar encuesta de atención
4. Sistema registra calificación

### Flujo de Registro
1. Usuario selecciona tipo (paciente/especialista)
2. Completa formulario de registro
3. Se crea cuenta en Supabase Auth
4. Se envía email de verificación
5. Usuario verifica email
6. Se crea perfil en tabla `profiles`
7. Si es especialista, requiere aprobación (`aprobado: false`)

---

## 🚀 Estado del Proyecto

### Sprint 1 ✅ Finalizado
- Registro completo de pacientes y especialistas (con doble imagen para pacientes).
- Login con validaciones por rol y accesos rápidos temporales.
- Gestión de usuarios para administradores + guard específico.
- Loading overlay global activo.

### Sprint 2 ✅ Finalizado
- Captcha integrado en ambos formularios de registro.
- `README.md` actualizado con flujos y accesos.
- Turnos (paciente, especialista, admin) con filtros, acciones y gestión completa.
- Solicitud de turnos sin datepicker y con disponibilidad controlada por especialista.
- Mi Perfil con horarios configurables y datos dinámicos.

### Sprint 3 ✅ Finalizado
- Historia clínica integral: carga desde especialista, vistas para paciente/admin/especialista.
- Descargas: PDF en Mi Perfil y Excel en Usuarios Admin.
- Animaciones de navegación en router-outlet y componentes clave.
- Filtro enriquecido de turnos incluyendo términos de historia clínica.

### Sprint 4 🟡 En pruebas finales
- Pipes (`LocalDate`, `StatusLabel`, `RoleLabel`) y directivas (`AutoFocus`, `StatusBadge`, `ElevateOnHover`) en producción.
- Estadísticas con Chart.js: ingresos, especialidades, turnos por día y comparativa solicitados/finalizados por profesional.
- Exportaciones de estadísticas en PDF/Excel y mensaje contextual cuando no existen registros.
- Estética de dashboards ajustada con gradientes, tooltips personalizados y leyendas unificadas.
- Próximos pasos: testing exhaustivo de descargas y checklist final para cerrar sprint.

---

## 📞 Contacto y Recursos

- **Proyecto**: ClinicaOnline
- **Versión**: 0.0.0
- **Framework**: Angular 18
- **Backend**: Supabase

---

*Última actualización: Generado automáticamente durante análisis del proyecto*

