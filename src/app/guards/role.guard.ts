import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Rol } from '../models/tipos.model';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private supa: SupabaseService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    
    // 1. Verificar sesión Auth (rápido)
    const { data: u } = await this.supa.obtenerUsuarioActual();
    const authUser = u?.user;

    if (!authUser) {
      // Si no hay sesión Auth, fuera.
      return this.router.parseUrl('/login');
    }

    // 2. Verificar datos en BD (más lento)
    const userId = authUser.id;
    const { data: usuario, error } = await this.supa.obtenerUsuarioPorId(userId);

    // Si hay error de conexión o no encuentra el usuario
    if (error || !usuario) {
      console.warn('[RoleGuard] Sesión Auth OK, pero falla lectura de perfil en DB.', error);
      // Opcional: Podrías dejar pasar si es una ruta muy básica, pero por seguridad mejor login
      return this.router.parseUrl('/login');
    }

    // 3. Verificar Roles
    const perfil = (usuario.perfil || '').toUpperCase() as Rol;
    const allowed: Rol[] = route.data['roles'] ?? [];

    // Si la ruta no tiene roles definidos, dejamos pasar (asumiendo que solo requiere auth)
    if (allowed.length === 0) {
      return true;
    }

    // Si el rol del usuario está en la lista permitida -> Pasa
    if (allowed.includes(perfil)) {
      return true;
    }

    // 4. Si el rol NO está permitido, redirigir a su home correspondiente
    // (Evita loop infinito de redirecciones)
    console.warn(`[RoleGuard] Acceso denegado. Rol: ${perfil}, Requerido: ${allowed}`);
    
    switch (perfil) {
      case 'PACIENTE': return this.router.parseUrl('/mis-turnos-paciente');
      case 'ESPECIALISTA': return this.router.parseUrl('/mis-turnos-especialista');
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
//     const allowed: Rol[] = route.data['roles'] ?? [];

//     const { data: u } = await this.supa.obtenerUsuarioActual();
//     const authUser = u?.user;
//     if (!authUser) {
//       return this.router.parseUrl('/login');
//     }

//     const userId = authUser.id;
//     const { data: usuario, error } = await this.supa.obtenerUsuarioPorId(userId);

//     if (error || !usuario) {
//       console.warn('[RoleGuard] No se pudo obtener usuario de esquema_clinica.usuarios', error);
//       return this.router.parseUrl('/login');
//     }

//     const perfil = (usuario.perfil || '').toUpperCase() as Rol;

//     if (allowed.length && !allowed.includes(perfil)) {
//       switch (perfil) {
//         case 'PACIENTE': return this.router.parseUrl('/mis-turnos-paciente');
//         case 'ESPECIALISTA': return this.router.parseUrl('/mis-turnos-especialista');
//         case 'ADMIN': return this.router.parseUrl('/bienvenida');
//         default: return this.router.parseUrl('/login');
//       }
//     }

//     return true;
//   }
// }





// // import { Injectable } from '@angular/core';
// // import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
// // import { SupabaseService } from '../../services/supabase.service';
// // import { Rol } from '../models/tipos.model';

// // @Injectable({ providedIn: 'root' })
// // export class RoleGuard implements CanActivate {

// //     constructor(private supa: SupabaseService, private router: Router) { }

// //     async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
// //         const allowed: Rol[] = route.data['roles'] ?? [];

// //         // 1) Usuario actual desde Supabase Auth
// //         const { data: u } = await this.supa.obtenerUsuarioActual();
// //         const authUser = u?.user;
// //         if (!authUser) {
// //             return this.router.parseUrl('/login');
// //         }

// //         const userId = authUser.id;

// //         // 2) Buscar en esquema_clinica.usuarios (NO en perfiles)
// //         const { data: usuario, error } = await this.supa.obtenerUsuarioPorId(userId);
// //         if (error || !usuario) {
// //             console.warn('[RoleGuard] No se pudo obtener usuario de esquema_clinica.usuarios', error);
// //             return this.router.parseUrl('/login');
// //         }

// //         // 3) Normalizar perfil a tipo Rol
// //         const perfil = (usuario.perfil || '').toUpperCase() as Rol;

// //         // 4) Si la ruta define roles permitidos y el del usuario no está, redirigir a su “home”
// //         if (allowed.length && !allowed.includes(perfil)) {
// //             switch (perfil) {
// //                 case 'PACIENTE':
// //                     return this.router.parseUrl('/mis-turnos-paciente');
// //                 case 'ESPECIALISTA':
// //                     return this.router.parseUrl('/mis-turnos-especialista');
// //                 case 'ADMIN':
// //                     return this.router.parseUrl('/usuarios-admin');
// //                 default:
// //                     return this.router.parseUrl('/login');
// //             }
// //         }

// //         // 5) Todo OK, puede entrar
// //         return true;
// //     }
// // }









// // // import { Injectable } from '@angular/core';
// // // import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
// // // import { Rol } from '../../models/perfil.model';
// // // import { SupabaseService } from '../../services/supabase.service';

// // // @Injectable({ providedIn: 'root' })
// // // export class RoleGuard implements CanActivate {
// // //   constructor(private supa: SupabaseService, private router: Router) {}

// // //   async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
// // //     const allowed: Rol[] = route.data['roles'] ?? [];
// // //     const { data: u } = await this.supa.obtenerUsuarioActual();
// // //     if (!u?.user) return this.router.parseUrl('/login');

// // //     const { data: perfil } = await this.supa.obtenerPerfil(u.user.id);
// // //     if (!perfil) return this.router.parseUrl('/login');

// // //     if (allowed.length && !allowed.includes(perfil.rol)) {
// // //       // redireccioná a su home real
// // //       switch (perfil.rol) {
// // //         case 'paciente': return this.router.parseUrl('/mis-turnos-paciente');
// // //         case 'especialista': return this.router.parseUrl('/mis-turnos-especialista');
// // //         case 'admin': return this.router.parseUrl('/bienvenida');
// // //       }
// // //       return this.router.parseUrl('/login');
// // //     }
// // //     return true;
// // //   }
// // // }
