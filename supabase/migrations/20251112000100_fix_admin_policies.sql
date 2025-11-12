-- Fix admin policies to avoid recursion by using auth.users metadata

-- Remove previous helper and policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP FUNCTION IF EXISTS public.check_is_admin();

-- Policy allowing admins (flagged via auth.users raw_app_meta_data.role = 'admin') to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1
      FROM auth.users u
      WHERE u.id = auth.uid()
        AND (u.raw_app_meta_data->>'role') = 'admin'
    )
  );

-- Policy allowing admins to update any profile
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users u
      WHERE u.id = auth.uid()
        AND (u.raw_app_meta_data->>'role') = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM auth.users u
      WHERE u.id = auth.uid()
        AND (u.raw_app_meta_data->>'role') = 'admin'
    )
  );
