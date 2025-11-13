# Configuración de Supabase Local

## Estado Actual

✅ **Migraciones creadas**: Las migraciones del esquema de base de datos están en `supabase/migrations/`
⚠️ **Problema con Colima**: Hay un problema conocido con Colima y Supabase CLI al iniciar contenedores

## Solución Temporal

### Opción 1: Usar Docker Desktop (Recomendado)

1. Instalar Docker Desktop para macOS desde https://www.docker.com/products/docker-desktop/
2. Cambiar el contexto de Docker:
   ```bash
   docker context use default
   ```
3. Iniciar Supabase:
   ```bash
   supabase start
   ```

### Opción 2: Usar Docker Compose directamente

Si tienes problemas con `supabase start`, puedes usar Docker Compose directamente:

```bash
cd supabase
docker-compose up -d
```

### Opción 3: Obtener credenciales manualmente

Las credenciales por defecto de Supabase local son:

- **URL**: `http://127.0.0.1:54321`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`

## Actualizar environment.ts

Una vez que Supabase esté corriendo, actualiza `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  captchaEnabled: true,
  quickLogins: {
    paciente:     { email: 'paciente@test.com',     password: 'Paciente123' },
    especialista: { email: 'especialista@test.com', password: 'Especialista123' },
    admin:        { email: 'admin@test.com',        password: 'Admin123' }
  }
};
```

## Verificar que Supabase está corriendo

```bash
supabase status
```

Deberías ver:
- API URL: http://127.0.0.1:54321
- DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- Studio URL: http://127.0.0.1:54323

## Acceder a Supabase Studio

Una vez que Supabase esté corriendo, puedes acceder a Supabase Studio en:
http://127.0.0.1:54323

Desde ahí puedes:
- Ver y editar datos de las tablas
- Crear usuarios de prueba
- Ver logs
- Gestionar storage

## Crear usuarios de prueba

Puedes crear usuarios de prueba desde Supabase Studio:
1. Ve a Authentication > Users
2. Click en "Add user"
3. Crea los usuarios:
   - paciente@test.com / Paciente123
   - especialista@test.com / Especialista123
   - admin@test.com / Admin123

Luego, desde SQL Editor, ejecuta:

```sql
-- Crear perfiles para los usuarios
INSERT INTO public.profiles (id, rol, aprobado, nombre, apellido, email, dni)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'paciente@test.com'), 'paciente', true, 'Paciente', 'Test', 'paciente@test.com', '12345678'),
  ((SELECT id FROM auth.users WHERE email = 'especialista@test.com'), 'especialista', true, 'Especialista', 'Test', 'especialista@test.com', '87654321'),
  ((SELECT id FROM auth.users WHERE email = 'admin@test.com'), 'admin', true, 'Admin', 'Test', 'admin@test.com', '11223344')
ON CONFLICT (id) DO UPDATE SET
  rol = EXCLUDED.rol,
  aprobado = EXCLUDED.aprobado,
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  email = EXCLUDED.email,
  dni = EXCLUDED.dni;
```

## Comandos útiles

```bash
# Iniciar Supabase
supabase start

# Detener Supabase
supabase stop

# Ver estado
supabase status

# Ver logs
supabase logs

# Resetear base de datos (elimina todos los datos)
supabase db reset
```

