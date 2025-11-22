// src/services/log-ingresos.service.ts
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { LogIngreso } from '../app/models/log-ingresos.model';

@Injectable({ providedIn: 'root' })
export class LogIngresosService {

  constructor(private readonly supa: SupabaseService) {}

  async registrarIngreso(tipo: string = 'LOGIN'): Promise<void> {
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
    const { data, error } = await this.supa.client
      .from('log_ingresos')
      .select('id, usuario_id, fecha_hora, tipo, ip, user_agent')
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
        createdAt: r.fecha_hora,           // 👈 acá nace createdAt
        tipo: r.tipo ?? 'LOGIN',
        ip: r.ip ?? null,
        user_agent: r.user_agent ?? null,
        email: u?.email ?? null,
        nombre: u?.nombre ?? null,
        apellido: u?.apellido ?? null
      };
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

//   /**
//    * Registra un ingreso (se llama típicamente al hacer login).
//    * Si tu tabla no tiene email o user_agent, borrá esas columnas del insert.
//    */
//   async registrarIngreso(tipo: string = 'LOGIN'): Promise<void> {
//     try {
//       const { data: userRes } = await this.supa.client.auth.getUser();
//       const user = userRes.user;

//       const { error } = await this.supa.client
//         .from('log_ingresos')
//         .insert({
//           usuario_id: user?.id ?? null,
//           email: user?.email ?? null,
//           tipo,
//           fecha_hora: new Date().toISOString(),
//           // si no tenés esta columna, borrala:
//           user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
//         });

//       if (error) {
//         console.error('[LogIngresosService] registrarIngreso error', error);
//       }
//     } catch (e) {
//       console.error('[LogIngresosService] registrarIngreso exception', e);
//     }
//   }

//   /** Devuelve todos los logs, más recientes primero, como Observable. */
//   all$(): Observable<LogIngreso[]> {
//     return from(this.obtenerTodos());
//   }

//   private async obtenerTodos(): Promise<LogIngreso[]> {
//     const { data, error } = await this.supa.client
//       .from('log_ingresos')
//       .select('id, usuario_id, email, tipo, fecha_hora')
//       .order('fecha_hora', { ascending: false });

//     if (error) {
//       console.error('[LogIngresosService] Error al obtener logs', error);
//       throw error;
//     }

//     return (data ?? []) as LogIngreso[];
//   }

// }





// import { Injectable } from '@angular/core';
// import { SupabaseService } from './supabase.service';
// import { LogIngresoTipo } from '../app/models/tipos.model';
// import { LogIngreso, LogIngresoCreate } from '../app/models/log-ingresos.model';

// @Injectable({ providedIn: 'root' })
// export class LogIngresosService {

//   constructor(
//     private readonly supa: SupabaseService,
//   ) {}

//   /**
//    * Registra un ingreso (por defecto LOGIN) para el usuario autenticado.
//    * Si no hay usuario logueado, no hace nada pero loguea un warning.
//    */
//   async registrarIngreso(tipo: LogIngresoTipo = 'LOGIN'): Promise<void> {
//     try {
//       const { data, error } = await this.supa.obtenerUsuarioActual();

//       if (error || !data?.user) {
//         console.warn('[LogIngresosService] No hay usuario autenticado para registrar ingreso', error);
//         return;
//       }

//       const user = data.user;

//       const payload: LogIngresoCreate = {
//         usuario_id: user.id,
//         tipo,
//         ip: null,                        // desde frontend es complicado obtener IP real
//         user_agent: navigator.userAgent, // al menos registramos el user agent
//       };

//       const { error: insertError } = await this.supa.client
//         .from('log_ingresos')
//         .insert(payload);

//       if (insertError) {
//         console.error('[LogIngresosService] Error al insertar log de ingreso', insertError);
//       }
//     } catch (e) {
//       console.error('[LogIngresosService] Excepción al registrar ingreso', e);
//     }
//   }

//   /**
//    * Obtiene logs de ingresos, con filtros opcionales para admin.
//    */
//   async obtenerLogIngresos(params?: {
//     usuarioId?: string;
//     desde?: string;  // ISO
//     hasta?: string;  // ISO
//     tipo?: LogIngresoTipo;
//     limite?: number;
//   }): Promise<{ data: LogIngreso[]; error: any | null }> {

//     let query = this.supa.client
//       .from('log_ingresos')
//       .select('*')
//       .order('fecha_hora', { ascending: false });

//     if (params?.usuarioId) {
//       query = query.eq('usuario_id', params.usuarioId);
//     }
//     if (params?.tipo) {
//       query = query.eq('tipo', params.tipo);
//     }
//     if (params?.desde) {
//       query = query.gte('fecha_hora', params.desde);
//     }
//     if (params?.hasta) {
//       query = query.lte('fecha_hora', params.hasta);
//     }
//     if (params?.limite && params.limite > 0) {
//       query = query.limit(params.limite);
//     }

//     const { data, error } = await query;

//     return {
//       data: (data ?? []) as LogIngreso[],
//       error,
//     };
//   }


  

// }
