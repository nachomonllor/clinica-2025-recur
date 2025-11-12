# Clínica Online · Gestión de Turnos Médicos

Aplicación Angular 18 para administrar turnos, historias clínicas y estadísticas de una clínica digital usando Supabase como backend (auth, base de datos y storage).

---

## 📌 Estado del Proyecto

- ✅ Login y registro (paciente / especialista / admin)
- ✅ Gestión de turnos por rol
- ✅ Historia clínica, reseñas y encuestas
- ✅ Dashboard de estadísticas con exportes (PDF / Excel)
- ✅ UI con favbuttons, pipes y directivas personalizadas
- 🔄 Roadmap de consignas eliminado del repo (se trabaja directo desde Supabase + README)

---

## 🧰 Stack principal

| Área | Tecnologías |
|------|-------------|
| Frontend | Angular 18, Angular Material, RxJS, Tailwind utilities puntuales |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions opcionales) |
| Visualización | Chart.js, jsPDF, xlsx |
| UX | SweetAlert2, directivas personalizadas (AutoFocus, ElevateOnHover, StatusBadge) |

---

## 🚀 Puesta en marcha

### Requisitos
- Node.js ≥ 18
- npm (v10 recomendado)
- Cuenta Supabase (o Supabase CLI en local)

### Instalación y arranque
```bash
git clone <url-del-repo>
cd clinica-2025-recur
npm install

# Configurar credenciales en src/environments/environment*.ts
# (ver sección Supabase más abajo)

npm start           # http://localhost:4200
# o un puerto específico
npm start -- --port 4201
```

### Quick logins (solo dev)
Los accesos flotantes del login se alimentan de `environment.quickLogins`.
```ts
// src/environments/environment.ts
quickLogins: {
  paciente: [{ email: 'paciente@test.com', password: 'Paciente123', nombre: 'Paciente Demo' }],
  especialista: [{ ... }],
  admin: [{ ... }]
}
```
Al hacer clic se completan los campos y se muestra un recordatorio para presionar “Ingresar”.

---

## ⚙️ Configuración Supabase

1. Crear proyecto en [supabase.com](https://supabase.com) o levantar Supabase CLI (`supabase start`).
2. Copiar URL y claves Anon/ServiceRole en:
   - `src/environments/environment.ts`
   - `src/environments/environment.prod.ts`
3. Ejecutar migraciones y seeds si se requiere datos demo:
   ```bash
   # Con CLI configurada (reemplazar project-id si aplica)
   supabase db push
   # ó cargar scripts desde SQL Editor
   ```
4. Variables esperadas en los environments:
   ```ts
   supabaseUrl: 'https://xxxx.supabase.co',
   supabaseKey: '<anon key>',
   captchaEnabled: true,
   quickLogins: { ... }
   ```

---

## 🧑‍💻 Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo (Angular CLI) |
| `npm run build` | Compilación producción |
| `npm test` | Unit tests (Karma) |
| `npm run lint` | Lint con ESLint |
| `npm run format` | Formatea con Prettier |

---

## 👥 Roles y flujos resumidos

### Paciente
- Solicitar / cancelar turnos (`/mis-turnos-paciente`)
- Completar encuestas y calificar atención
- Descargar historia clínica en PDF (`/mi-perfil`)

### Especialista
- Aceptar / rechazar / finalizar turnos (`/mis-turnos-especialista`)
- Cargar reseñas e indicadores dinámicos en historia clínica
- Configurar horarios disponibles (`/mi-perfil`)

### Administrador
- Alta y aprobación de usuarios (`/usuarios-admin`)
- Gestión global de turnos (`/turnos-admin`, `/turnos-especialidad`)
- Dashboard de estadísticas con exportes (`/estadisticas`)

---

## 🗂️ Estructura relevante

```
src/
├── app/
│   ├── animations.ts
│   ├── app.routes.ts
│   ├── components/
│   │   ├── login-paciente/
│   │   ├── usuarios-admin/
│   │   ├── estadisticas/
│   │   └── ...
│   ├── directives/
│   ├── pipes/
│   └── services/
├── environments/
└── assets/
```

---

## 🧪 Testing rápido

| Escenario | Pasos |
|-----------|-------|
| Acceso rápido | 1) ir a `/login-paciente` · 2) clic en un favbutton · 3) confirmar campos completados y snackbar |
| Flujo paciente | 1) Login paciente demo · 2) Solicitar turno · 3) Ver en “Mis turnos” y cancelar/reseñar |
| Flujo especialista | 1) Login especialista demo · 2) Aceptar turno pendiente · 3) Finalizar con reseña |
| Dashboard | 1) Login admin demo · 2) Visitar `/estadisticas` · 3) Exportar PDF/Excel |

---

## 🛠️ Troubleshooting

- **`NavigatorLockAcquireTimeoutError` en login**  
  Se debe a múltiples pestañas usando Supabase auth en modo dev. Cerrar pestañas duplicadas o reintentar tras recargar.
- **No se completan los accesos rápidos**  
  El navegador puede estar sirviendo un bundle antiguo. Ejecutar `npx kill-port 4201`, reiniciar `npm start` y abrir en incógnito / limpiar “Clear site data”.
- **Errores NG8107 en build**  
  Ya se normalizaron las plantillas (`as seleccionado`). Reinstalar dependencias si reaparece.

---

## 📄 Licencia

Proyecto académico. Uso interno para prácticas de Angular + Supabase 2025. Ajustar licencias de librerías externas según corresponda.

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
