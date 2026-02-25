// src/services/log-ingresos.service.ts
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { LogIngreso } from '../app/models/log-ingresos.model'; // Asegurate de actualizar este modelo también si lo usás estricto

@Injectable({ providedIn: 'root' })
export class LogIngresosService {

  constructor(private readonly supa: SupabaseService) {}

  // Agregamos los nuevos parámetros opcionales
  async registrarIngreso(
    tipo: string = 'LOGIN', 
    componente?: string, 
    funcion?: string, 
    descripcion?: string
  ): Promise<void> {
    try {
      const { data, error } = await this.supa.obtenerUsuarioActual();
      if (error || !data?.user) {
        console.warn('[LogIngresosService] registrarIngreso sin usuario', error);
        return;
      }

      const user = data.user;

      const { error: insertError } = await this.supa.client
        .from('log_ingresos')
        .insert({
          usuario_id: user.id,
          tipo,
          componente: componente ?? null,
          funcion: funcion ?? null,
          descripcion: descripcion ?? null,
          ip: null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
        });

      if (insertError) {
        console.error('[LogIngresosService] Error insert log_ingresos', insertError);
      }
    } catch (e) {
      console.error('[LogIngresosService] registrarIngreso exception', e);
    }
  }

  async obtenerTodos(): Promise<LogIngreso[]> {
    // Agregamos los campos nuevos al select
    const { data, error } = await this.supa.client
      .from('log_ingresos')
      .select('id, usuario_id, fecha_hora, tipo, ip, user_agent, componente, funcion, descripcion')
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error('[LogIngresosService] Error al listar log_ingresos', error);
      throw error;
    }

    const rows = (data ?? []) as Array<{
      id: string;
      usuario_id: string;
      fecha_hora: string;
      tipo: string | null;
      ip: string | null;
      user_agent: string | null;
      componente: string | null;
      funcion: string | null;
      descripcion: string | null;
    }>;

    const ids = Array.from(new Set(rows.map(r => r.usuario_id).filter(Boolean)));
    const emailMap = new Map<string, { email: string | null; nombre: string | null; apellido: string | null }>();

    if (ids.length) {
      const { data: usuarios, error: uErr } = await this.supa.client
        .from('usuarios')
        .select('id, email, nombre, apellido')
        .in('id', ids);

      if (uErr) {
        console.warn('[LogIngresosService] Error al traer usuarios para logs', uErr);
      } else {
        (usuarios ?? []).forEach((u: any) => {
          emailMap.set(u.id, {
            email: u.email ?? null,
            nombre: u.nombre ?? null,
            apellido: u.apellido ?? null
          });
        });
      }
    }

    return rows.map(r => {
      const u = emailMap.get(r.usuario_id);
      return {
        id: r.id,
        usuario_id: r.usuario_id,
        createdAt: r.fecha_hora,
        tipo: r.tipo ?? 'LOGIN',
        ip: r.ip ?? null,
        user_agent: r.user_agent ?? null,
        componente: r.componente ?? null,   // Nuevo
        funcion: r.funcion ?? null,         // Nuevo
        descripcion: r.descripcion ?? null, // Nuevo
        email: u?.email ?? null,
        nombre: u?.nombre ?? null,
        apellido: u?.apellido ?? null
      } as any; // Usamos as any por si tu modelo LogIngreso no tiene estas propiedades aún
    });
  }

  all$(): Observable<LogIngreso[]> {
    return from(this.obtenerTodos());
  }
}






// // src/services/log-ingresos.service.ts
// import { Injectable } from '@angular/core';
// import { from, Observable } from 'rxjs';
// import { SupabaseService } from './supabase.service';
// import { LogIngreso } from '../app/models/log-ingresos.model';

// @Injectable({ providedIn: 'root' })
// export class LogIngresosService {

//   constructor(private readonly supa: SupabaseService) {}

//   async registrarIngreso(tipo: string = 'LOGIN'): Promise<void> {
//     try {
//       const { data, error } = await this.supa.obtenerUsuarioActual();
//       if (error || !data?.user) {
//         console.warn('[LogIngresosService] registrarIngreso sin usuario', error);
//         return;
//       }

//       const user = data.user;

//       const { error: insertError } = await this.supa.client
//         .from('log_ingresos')
//         .insert({
//           usuario_id: user.id,
//           tipo,
//           ip: null,
//           user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
//         });

//       if (insertError) {
//         console.error('[LogIngresosService] Error insert log_ingresos', insertError);
//       }
//     } catch (e) {
//       console.error('[LogIngresosService] registrarIngreso exception', e);
//     }
//   }

//   async obtenerTodos(): Promise<LogIngreso[]> {
//     const { data, error } = await this.supa.client
//       .from('log_ingresos')
//       .select('id, usuario_id, fecha_hora, tipo, ip, user_agent')
//       .order('fecha_hora', { ascending: false });

//     if (error) {
//       console.error('[LogIngresosService] Error al listar log_ingresos', error);
//       throw error;
//     }

//     const rows = (data ?? []) as Array<{
//       id: string;
//       usuario_id: string;
//       fecha_hora: string;
//       tipo: string | null;
//       ip: string | null;
//       user_agent: string | null;
//     }>;

//     const ids = Array.from(new Set(rows.map(r => r.usuario_id).filter(Boolean)));
//     const emailMap = new Map<string, { email: string | null; nombre: string | null; apellido: string | null }>();

//     if (ids.length) {
//       const { data: usuarios, error: uErr } = await this.supa.client
//         .from('usuarios')
//         .select('id, email, nombre, apellido')
//         .in('id', ids);

//       if (uErr) {
//         console.warn('[LogIngresosService] Error al traer usuarios para logs', uErr);
//       } else {
//         (usuarios ?? []).forEach((u: any) => {
//           emailMap.set(u.id, {
//             email: u.email ?? null,
//             nombre: u.nombre ?? null,
//             apellido: u.apellido ?? null
//           });
//         });
//       }
//     }

//     return rows.map(r => {
//       const u = emailMap.get(r.usuario_id);
//       return {
//         id: r.id,
//         usuario_id: r.usuario_id,
//         createdAt: r.fecha_hora,           //  acá nace createdAt
//         tipo: r.tipo ?? 'LOGIN',
//         ip: r.ip ?? null,
//         user_agent: r.user_agent ?? null,
//         email: u?.email ?? null,
//         nombre: u?.nombre ?? null,
//         apellido: u?.apellido ?? null
//       };
//     });
//   }

//   all$(): Observable<LogIngreso[]> {
//     return from(this.obtenerTodos());
//   }
// }




