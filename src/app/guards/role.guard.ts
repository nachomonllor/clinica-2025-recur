import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Rol } from '../models/tipos.model';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private supa: SupabaseService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    
  
    //Verificar sesión Auth
    const { data: u } = await this.supa.obtenerUsuarioActual();
    const authUser = u?.user;

    if (!authUser) {
      return this.router.parseUrl('/login');
    }

    // Verificar datos en BD
    const userId = authUser.id;
    const { data: usuario, error } = await this.supa.obtenerUsuarioPorId(userId);

    if (error || !usuario) {
      console.warn('[RoleGuard] Error al obtener datos del usuario.');
      return this.router.parseUrl('/login');
    }

    // =========================================================
    //  BLOQUEO DE ESPECIALISTAS NO APROBADOS
    // =========================================================
    if (usuario.perfil === 'ESPECIALISTA' && !usuario.esta_aprobado) {
      console.warn('[RoleGuard] Especialista NO aprobado. Cerrando sesión y redirigiendo.');
      
      // CERRAR SESION
      await this.supa.cerrarSesion(); 
      
      return this.router.parseUrl('/login');
    }

    //  Verificar Roles (Logica original)
    const perfil = (usuario.perfil || '').toUpperCase() as Rol;
    const allowed: Rol[] = route.data['roles'] ?? [];

    // Si la ruta no tiene roles definidos (acceso publico logueado)
    if (allowed.length === 0) {
      return true;
    }

    // Si el rol es permitido
    if (allowed.includes(perfil)) {
      return true;
    }

    // 4. Si el rol NO está permitido, redirigir a su home
    console.warn(`[RoleGuard] Acceso denegado. Rol: ${perfil}, Requerido: ${allowed}`);
    
    switch (perfil) {
      case 'PACIENTE': return this.router.parseUrl('/mis-turnos-paciente');
      case 'ESPECIALISTA': return this.router.parseUrl('/mis-turnos-especialista'); // =========> SOLO SI ESTA APROBADO
      case 'ADMIN': return this.router.parseUrl('/turnos-admin');
      default: return this.router.parseUrl('/bienvenida');
    }
  }
}




// import { Injectable } from '@angular/core';
// import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
// import { SupabaseService } from '../../services/supabase.service';
// import { Rol } from '../models/tipos.model';

// @Injectable({ providedIn: 'root' })
// export class RoleGuard implements CanActivate {
//   constructor(private supa: SupabaseService, private router: Router) {}

//   async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    
//     // 1. Verificar sesión Auth (rápido)
//     const { data: u } = await this.supa.obtenerUsuarioActual();
//     const authUser = u?.user;

//     if (!authUser) {
//       // Si no hay sesión Auth, fuera.
//       return this.router.parseUrl('/login');
//     }

//     // 2. Verificar datos en BD (más lento)
//     const userId = authUser.id;
//     const { data: usuario, error } = await this.supa.obtenerUsuarioPorId(userId);

//     // Si hay error de conexión o no encuentra el usuario
//     if (error || !usuario) {
//       console.warn('[RoleGuard] Sesión Auth OK, pero falla lectura de perfil en DB.', error);
//       // Opcional: Podrías dejar pasar si es una ruta muy básica, pero por seguridad mejor login
//       return this.router.parseUrl('/login');
//     }

//     // 3. Verificar Roles
//     const perfil = (usuario.perfil || '').toUpperCase() as Rol;
//     const allowed: Rol[] = route.data['roles'] ?? [];

//     // Si la ruta no tiene roles definidos, dejamos pasar (asumiendo que solo requiere auth)
//     if (allowed.length === 0) {
//       return true;
//     }

//     // Si el rol del usuario está en la lista permitida -> Pasa
//     if (allowed.includes(perfil)) {
//       return true;
//     }

//     // 4. Si el rol NO está permitido, redirigir a su home correspondiente
//     // (Evita loop infinito de redirecciones)
//     console.warn(`[RoleGuard] Acceso denegado. Rol: ${perfil}, Requerido: ${allowed}`);
    
//     switch (perfil) {
//       case 'PACIENTE': return this.router.parseUrl('/mis-turnos-paciente');
//       case 'ESPECIALISTA': return this.router.parseUrl('/mis-turnos-especialista');
//       case 'ADMIN': return this.router.parseUrl('/turnos-admin');
//       default: return this.router.parseUrl('/bienvenida');
//     }
//   }
// }



