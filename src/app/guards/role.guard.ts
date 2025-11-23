
// import { Injectable } from '@angular/core';
// import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
// import { Rol } from '../../models/perfil.model';
// import { SupabaseService } from '../../services/supabase.service';

// @Injectable({ providedIn: 'root' })
// export class RoleGuard implements CanActivate {
//   constructor(private supa: SupabaseService, private router: Router) {}

//   async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
//     const allowed: Rol[] = route.data['roles'] ?? [];
//     const { data: u } = await this.supa.obtenerUsuarioActual();
//     if (!u?.user) return this.router.parseUrl('/login');

//     const { data: perfil } = await this.supa.obtenerPerfil(u.user.id);
//     if (!perfil) return this.router.parseUrl('/login');

//     if (allowed.length && !allowed.includes(perfil.rol)) {
//       // redireccioná a su home real
//       switch (perfil.rol) {
//         case 'paciente': return this.router.parseUrl('/mis-turnos-paciente');
//         case 'especialista': return this.router.parseUrl('/mis-turnos-especialista');
//         case 'admin': return this.router.parseUrl('/bienvenida');
//       }
//       return this.router.parseUrl('/login');
//     }
//     return true;
//   }
// }
