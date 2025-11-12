# Manual de Uso – Funcionalidades Sprints 1 a 4

> **Entorno objetivo:** Angular 18 + Supabase **cloud** (no instancia local).  
> **Audiencia:** Equipo funcional/QAs y stakeholders que necesitan probar el producto sin entrar al detalle técnico.

---

## 1. Preparación del Entorno

### 1.1. Requisitos
- Node.js 18+
- npm (o yarn)
- Acceso a un proyecto Supabase en la nube (URL + `anon` key + `service_role` para scripts/seed)
- Credenciales de usuarios de prueba (paciente, especialista, admin)

### 1.2. Configuración de Supabase (cloud)
1. En tu proyecto Supabase crear:
   - Tablas `profiles`, `turnos`, `historia_clinica`, etc. (usar las migraciones incluidas en `/supabase/migrations`).
   - Buckets de storage necesarios (`avatars`).
2. Ejecutar seeds (opcional):
   - `SUPABASE_URL=https://<tu-instancia>.supabase.co`
   - `SUPABASE_SERVICE_KEY=<service_role>`
   - `supabase db push && supabase db seed` (desde un entorno local con Supabase CLI) **o** trabajar con SQL manual en el dashboard.
3. Actualizar políticas RLS según las migraciones provistas.

### 1.3. Configuración de la App Angular
En `src/environments/environment.ts` (development) y/o `environment.prod.ts` (producción) colocar:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://<tu-instancia>.supabase.co',
  supabaseKey: '<SUPABASE_ANON_KEY>',
  captchaEnabled: true,
  quickLogins: {
    paciente: { email: 'paciente@demo.com', password: 'Paciente123' },
    especialista: { email: 'especialista@demo.com', password: 'Especialista123' },
    admin: { email: 'admin@demo.com', password: 'Admin123' }
  }
};
```

### 1.4. Scripts útiles
- `npm install` → instala dependencias.
- `npm start` → levanta Angular en http://localhost:4200 (usar `npm start -- --port 4201` si el 4200 está ocupado).
- `npm run build` → build de producción.
- `npm test` → tests unitarios (en progreso).

### 1.5. Proyecto Supabase ya configurado
- **URL:** `https://tuwlrspqlkpqatnaintx.supabase.co`
- **Anon key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1d2xyc3BxbGtwcWF0bmFpbnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDcyOTEsImV4cCI6MjA3MTMyMzI5MX0.O5eawMd27SKifzyOvKp5fJZcvgBodxXA5LZWZdexRSA`
- **Usuarios demo:**
  - Paciente → `paciente@test.com / Paciente123`
  - Especialista (aprobado) → `especialista@test.com / Especialista123`
  - Admin → `admin@test.com / Admin123`
- **Carga inicial:** migraciones aplicadas y 12 turnos `DEMO ...` con historias clínicas para que `/estadisticas` muestre datos reales.
- **Refrescá seeds (opcional):**
  ```bash
  export SUPABASE_ACCESS_TOKEN=sbp_xxx
  supabase login
  supabase link --project-ref tuwlrspqlkpqatnaintx --password pU2jyBIb8rziRbOm
  supabase db push
  export SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
  supabase db execute --file supabase/seeds/seed_estadisticas.sql
  ```

---

## 2. Sprint 1 – Autenticación y Gestión de Usuarios

### 2.1. Landing y acceso
- Visitar `http://localhost:4200/bienvenida`.
- Desde allí se accede a login y registros.

### 2.2. Registro de Pacientes
Ruta: `/registro-paciente`
1. Completar datos personales (incluye obra social, fecha de nacimiento).
2. Subir **dos** imágenes obligatorias.
3. Resolver el captcha.
4. Confirmar.  
   - Se crea el usuario en Supabase Auth.
   - Se genera registro en `profiles` y `pacientes`.

### 2.3. Registro de Especialistas
Ruta: `/registro-especialista`
1. Completar datos (nombre, DNI, fecha de nacimiento).
2. Seleccionar una o más especialidades (posibilidad de agregar nueva).
3. Subir imagen de perfil.
4. Captcha obligatorio.
5. Al finalizar: el especialista queda en `profiles` con `aprobado = false` (requiere aprobación admin).

### 2.4. Login
Ruta: `/login-paciente`
- Campos: email + password.
- Botones de acceso rápido (para pruebas) cargan credenciales de ejemplo.
- Flujos:
  - Paciente → `/mis-turnos-paciente`
  - Especialista (aprobado) → `/mis-turnos-especialista`
  - Admin → `/bienvenida`
- La verificación de email puede reactivarse quitando el bypass temporal (ver `login-paciente.component.ts`).

### 2.5. Módulo Usuarios (Admin)
Ruta: `/usuarios-admin` (protegida con `adminGuard`)
- Tabla con todos los perfiles (filtros, paginación).
- Acciones:
  - Aprobar/denegar especialistas (`aprobado`).
  - Crear nuevos usuarios (paciente, especialista, admin) con formulario dinámico.
  - Descargar listado en Excel.
- Vistas/Dialogs: ver historias clínicas, detalle de usuario.

---

## 3. Sprint 2 – Gestión de Turnos

### 3.1. Mis Turnos – Paciente (`/mis-turnos-paciente`)
- Lista los turnos solicitados por el paciente actual.
- Filtro inteligente (texto libre) sobre especialidad, especialista e historia clínica.
- Acciones según estado:
  - `Cancelar turno` (requiere motivo).
  - `Ver reseña` (si existe).
  - `Completar encuesta` y `Calificar atención` para turnos realizados.

### 3.2. Mis Turnos – Especialista (`/mis-turnos-especialista`)
- Turnos asignados al especialista logueado.
- Acciones:
  - Aceptar / Rechazar / Cancelar (con motivo).
  - Finalizar turno → abre diálogo para cargar historia clínica (datos fijos + dinámicos).
- Filtro incluye paciente, especialidad y datos de historia.

### 3.3. Turnos – Admin (`/turnos-especialidad`)
- Vista global para administradores.
- Acciones: Cancelar turno con motivo.

### 3.4. Solicitar Turno
Accesos:
- Paciente: desde menú correspondiente.
- Admin: permite elegir paciente objetivo.

Flujo:
1. Seleccionar especialidad.
2. Elegir especialista disponible (según especialidad).
3. Definir fecha/hora (sin datepicker, siguiendo consignas).
4. Confirmar el turno (estado inicial `pendiente`).

### 3.5. Mi Perfil
- Paciente: datos personales y fotos.
- Especialista: datos + gestión de horarios disponibles por especialidad.
- Historial de historias clínicas relacionadas al paciente.

---

## 4. Sprint 3 – Historia Clínica, Descargas y Animaciones

### 4.1. Historia Clínica
- Se genera al finalizar un turno desde el lado del especialista.
- Datos fijos (altura, peso, temperatura, etc.) + datos dinámicos configurables.
- Visualización:
  - Paciente: en `/mi-perfil`.
  - Admin: dialog en `/usuarios-admin`.
  - Especialista: en `/pacientes-especialista`.

### 4.2. Descargas
- **Pacientes:** PDF de su historia clínica desde `/mi-perfil`.
- **Admins:** Excel de usuarios desde `/usuarios-admin`.
- Formato con logo + tablas (usando `jsPDF` + `autoTable`, `xlsx`).

### 4.3. Animaciones
- Transiciones suaves entre rutas principales (definidas en `animations.ts`).
- Aplicadas al `RouterOutlet` y componentes críticos (bienvenida, login, turnos).

---

## 5. Sprint 4 – Pipes, Directivas y Estadísticas

### 5.1. Pipes
- `LocalDatePipe` → fechas amigables según locale.
- `StatusLabelPipe` → traducción de estados (`pendiente`, `realizado`, etc.).
- `RoleLabelPipe` → etiquetas legibles para roles (`Paciente`, `Especialista`, `Administrador`).

### 5.2. Directivas
- `AutoFocusDirective` → enfoca inputs con retardo configurable (usada en login/email).
- `StatusBadgeDirective` → aplica estilos badges según estado/rol (chips de turnos/usuarios).
- `ElevateOnHoverDirective` → efecto hover/elevación en tarjetas y botones.

### 5.3. Estadísticas (solo admin)
Ruta: `/estadisticas`
- Gráficos Chart.js:
  - Ingresos por día (línea con gradiente).
  - Turnos por especialidad (doughnut).
  - Turnos solicitados por día (barras).
  - Comparativa solicitados/finalizados por profesional (barras agrupadas).
- Tarjetas de resumen con top especialidades/profesionales y últimas sesiones.
- Mensaje contextual cuando no existen datos (no se cargan dummies).
- Descargas:
  - Excel (4 pestañas: especialidades, días, profesionales, ingresos).
  - PDF (tablas formateadas + detalle de ingresos).

### 5.4. Consideraciones de Supabase
- `EstadisticasService` consulta tablas reales (`turnos`, `historia_clinica`, `profiles`, `log_registros` o equivalentes).
- Asegurar datos sample en producción/cloud para que los gráficos muestren información.
- RLS: permitir lectura a administradores (ver migraciones `admin_turnos_policy`).

---

## 6. Guía Rápida por Rol

### 6.1. Administrador
1. Iniciar sesión.
2. Revisar `/usuarios-admin` para aprobar especialistas o crear nuevos usuarios.
3. Gestionar turnos globales en `/turnos-especialidad`.
4. Revisar estadísticas en `/estadisticas`.
5. Descargar reportes (Excel/PDF) cuando lo requiera.

### 6.2. Especialista
1. Ingresar (debe estar aprobado).
2. Configurar horarios en su perfil.
3. Administrar turnos en `/mis-turnos-especialista`.
4. Finalizar turnos cargando historia clínica.
5. Consultar pacientes atendidos en `/pacientes-especialista`.

### 6.3. Paciente
1. Registrarse y subir las dos fotos.
2. Solicitar turnos.
3. Gestionar turnos en `/mis-turnos-paciente`.
4. Completar encuestas/calificaciones tras los turnos.
5. Descargar historia clínica en PDF desde `/mi-perfil`.

---

## 7. Troubleshooting Común

| Problema | Posible causa | Solución |
|----------|---------------|----------|
| Login falla con “User not allowed” | Seed con `anon` key | Usar `service_role` para creación masiva |
| Especialista no accede a `/mis-turnos-especialista` | Falta aprobación admin | Aprobar desde `/usuarios-admin` |
| Gráficos vacíos | Sin datos reales en Supabase | Ingresar turnos/logs reales o mostrar mensaje actual |
| 404 en assets (`default-avatar.png`) | Falta copia a `/src/assets` | Confirmar que `angular.json` incluye `src/assets` |
| Ports ocupados (4200/4201) | Servidor anterior quedó corriendo | Matar procesos (`lsof -i:4200`) o usar otro puerto |

---

## 8. Próximos pasos sugeridos
- Reactivar verificación de email antes de producción.
- Completar QA de descargas con datos reales en Supabase cloud.
- Documentar proceso de deployment (hosting + variables de entorno).
- Iniciar tareas de Sprint 5 (captcha custom, nuevos datos dinámicos).

---

**Contacto:** para dudas técnicas revisar `DOCUMENTACION.md`, `ROADMAP.md` o comunicar con el equipo de desarrollo.  
**Última revisión:** 2025-11-11 (post cierre Sprint 4).

