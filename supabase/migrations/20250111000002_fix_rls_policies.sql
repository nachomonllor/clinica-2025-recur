-- Arreglar políticas RLS que causan recursión infinita

-- Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Crear función helper para verificar si el usuario es admin
-- Esto evita la recursión porque la función se ejecuta en un contexto diferente
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = user_id
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política mejorada para admins (sin recursión)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role' = 'admin' OR 
           EXISTS (
             SELECT 1 FROM public.profiles p
             WHERE p.id = auth.uid() AND p.rol = 'admin'
           ))
    )
  );

-- Mejor aún, usar una función que evite la recursión completamente
-- Eliminar la política anterior y crear una mejor
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Política simple: todos pueden ver perfiles públicos, usuarios pueden ver el suyo
-- Los admins se manejan con una política separada que usa auth.jwt()
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    -- Usuario puede ver su propio perfil
    auth.uid() = id
    OR
    -- Todos pueden ver perfiles (ya existe "Public profiles are viewable by everyone")
    true
    OR
    -- Admin puede ver todos (verificamos desde auth.users directamente)
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (u.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- En realidad, la política "Public profiles are viewable by everyone" ya permite ver todos
-- El problema es la política de admin. Vamos a simplificar:
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Las políticas existentes ya cubren el caso:
-- 1. "Users can view own profile" - usuarios ven su perfil
-- 2. "Public profiles are viewable by everyone" - todos pueden ver perfiles
-- 
-- Para admins, podemos crear una política que use una función SECURITY DEFINER
-- que evite la recursión

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT rol INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Política para admins usando la función
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.check_is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.check_is_admin());

