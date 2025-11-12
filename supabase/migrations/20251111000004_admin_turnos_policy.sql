-- Permitir que los administradores puedan consultar todos los turnos
CREATE POLICY "Admins can view all turnos" ON public.turnos
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );
