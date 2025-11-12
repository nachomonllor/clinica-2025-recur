-- Seed data para desarrollo local
-- Este archivo se ejecuta automáticamente cuando haces `supabase db reset`

-- Crear usuarios de prueba en auth.users
-- Nota: En Supabase local, puedes crear usuarios directamente desde Studio o usando la API
-- Este script crea los perfiles una vez que los usuarios existan

-- Función helper para crear usuario y perfil (requiere que el usuario ya exista en auth.users)
-- Por ahora, creamos los perfiles manualmente desde Studio o usando la API

-- Los usuarios deben crearse desde Supabase Studio (http://127.0.0.1:54323)
-- Authentication > Users > Add user
-- 
-- Usuarios a crear:
-- 1. paciente@test.com / Paciente123
-- 2. especialista@test.com / Especialista123  
-- 3. admin@test.com / Admin123
--
-- Luego ejecutar este script desde SQL Editor para crear los perfiles

-- Ejemplo de cómo crear perfiles (descomentar y ajustar los IDs después de crear usuarios):
/*
INSERT INTO public.profiles (id, rol, aprobado, nombre, apellido, dni, email, obra_social, fecha_nacimiento, avatar_url)
VALUES 
  -- Reemplazar 'USER_ID_PACIENTE' con el ID real del usuario paciente@test.com
  ('USER_ID_PACIENTE', 'paciente', true, 'Paciente', 'Test', '12345678', 'paciente@test.com', 'Swiss Medical', '1990-01-15', null),
  -- Reemplazar 'USER_ID_ESPECIALISTA' con el ID real del usuario especialista@test.com
  ('USER_ID_ESPECIALISTA', 'especialista', true, 'Especialista', 'Test', '87654321', 'especialista@test.com', null, '1985-05-20', null),
  -- Reemplazar 'USER_ID_ADMIN' con el ID real del usuario admin@test.com
  ('USER_ID_ADMIN', 'admin', true, 'Admin', 'Test', '11223344', 'admin@test.com', null, '1980-03-10', null)
ON CONFLICT (id) DO UPDATE SET
  rol = EXCLUDED.rol,
  aprobado = EXCLUDED.aprobado,
  nombre = EXCLUDED.nombre,
  apellido = EXCLUDED.apellido,
  dni = EXCLUDED.dni,
  email = EXCLUDED.email;
*/

-- Por ahora, este archivo está vacío porque los usuarios deben crearse manualmente
-- desde Supabase Studio o usando la API de autenticación

