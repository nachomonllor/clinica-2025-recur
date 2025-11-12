# Clínica Online – Guía de Uso

Aplicación Angular 18 integrada con Supabase para gestionar turnos, historias clínicas y estadísticas. Esta guía resume únicamente lo necesario para levantar el proyecto y probarlo.

---

## Requisitos
- Node.js ≥ 18
- npm (se recomienda v10)
- Proyecto Supabase (cloud o CLI)

---

## Instalación y ejecución

```bash
git clone <url-del-repo>
cd clinica-2025-recur
npm install

# Configurar credenciales en src/environments/environment*.ts
# ver sección Supabase

npm start            # abre en http://localhost:4200
# Otra opción de puerto:
npm start -- --port 4201
```

---

## Configuración Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com) o iniciar Supabase CLI (`supabase start`).
2. Copiar `supabaseUrl` y `supabaseKey` (anon) en:
   - `src/environments/environment.ts`
   - `src/environments/environment.prod.ts`
3. (Opcional) Si usás CLI, ejecutar migraciones/seeds necesarias:
   ```bash
   supabase db push
   ```
4. Variables esperadas:
   ```ts
   export const environment = {
     supabaseUrl: 'https://<tu-id>.supabase.co',
     supabaseKey: '<anon key>',
     captchaEnabled: true,
     quickLogins: { ... }   // ver siguiente sección
   };
   ```

---

## Accesos rápidos (dev)

Los botones de acceso rápido completan el login con cuentas demo definidas en `environment.quickLogins`. Valores actuales:

```ts
paciente: [
  { email: 'paciente@test.com', password: 'Paciente123', nombre: 'Paciente Demo' },
  { email: 'marcela.rodriguez@test.com', password: 'Paciente123' },
  { email: 'andres.lopez@test.com', password: 'Paciente123' }
],
especialista: [
  { email: 'especialista@test.com', password: 'Especialista123' },
  { email: 'jorge.perez@test.com', password: 'Especialista123' }
],
admin: [
  { email: 'admin@test.com', password: 'Admin123' }
]
```

Editar los environments si necesitás otros usuarios.

---

## Scripts npm útiles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Build producción |
| `npm test` | Pruebas unitarias |
| `npm run lint` | Linter (ESLint) |
| `npm run format` | Prettier |

---

## Problemas frecuentes

- **Lock de Supabase en login**  
  Cerrar pestañas duplicadas e intentar nuevamente (el API usa `navigator.locks`).

- **Cambios que no refrescan**  
  Hacer “Clear site data” en DevTools → Application → Storage o abrir en incógnito.

- **Conexión fallida a Supabase**  
  Revisar `supabaseUrl` y `supabaseKey` en los environments.

---

## Nota legal

Proyecto académico con dependencias OSS. Revisar licencias de terceros antes de desplegar en producción.

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
