import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const supabase = inject(SupabaseService);

  try {
    // Verificar sesión
    const { data: sessionData, error: sessionError } = await supabase.getSession();
    if (sessionError || !sessionData?.session) {
      router.navigate(['/login-paciente']);
      return false;
    }

    const userId = sessionData.session.user.id;

    // Obtener perfil del usuario
    const { data: perfil, error: perfilError } = await supabase.obtenerPerfil(userId);
    if (perfilError || !perfil || perfil.rol !== 'admin') {
      // Si no es admin, redirigir según su rol o a bienvenida
      if (perfil?.rol === 'paciente') {
        router.navigate(['/mis-turnos-paciente']);
      } else if (perfil?.rol === 'especialista') {
        router.navigate(['/mis-turnos-especialista']);
      } else {
        router.navigate(['/bienvenida']);
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('[AdminGuard] Error verificando acceso:', error);
    router.navigate(['/login-paciente']);
    return false;
  }
};

