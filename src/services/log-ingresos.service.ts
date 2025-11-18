import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';          
import { LogIngreso } from '../models/log.model';            

type LogRow = {
    email: string | null;
    created_at: string | null;
};

@Injectable({ providedIn: 'root' })
export class LogIngresosService {

    constructor(private supa: SupabaseService) { }

    //   /** Inserta una fila en log_ingresos para el usuario actualmente logueado */
    async registrarIngreso(): Promise<void> {
        const { data, error } = await this.supa.client.auth.getUser();
        if (error) {
            console.error('[LogIngresosService] error getUser', error);
            return;
        }
        const user = data.user;
        if (!user) return;

        const email = user.email ?? '(sin email)';

        const { error: insError } = await this.supa.client
            .from('log_ingresos')
            .insert({
                user_id: user.id,
                email: email
                // created_at se completa solo con now()
            });

        if (insError) {
            console.error('[LogIngresosService] error insert log_ingresos', insError);
        }
    }

    /** Devuelve todos los logs ordenados desc por fecha */
    all$(): Observable<LogIngreso[]> {
        const query = this.supa.client
            .from('log_ingresos')
            .select('email, created_at')
            .order('created_at', { ascending: false });

        return from(query).pipe(
            tap(res => console.log('[log_ingresos] raw supabase', res)),
            map(({ data, error }) => {
                if (error) {
                    console.error('[LogIngresosService] error select log_ingresos', error);
                    return [] as LogIngreso[];
                }

                const rows = (data ?? []) as LogRow[];

                const mapped = rows.map(r => ({
                    email: r.email ?? '(sin email)',
                    createdAt: r.created_at ?? new Date(0).toISOString()
                }));

                console.log('[log_ingresos] mapped', mapped);
                return mapped;
            }),
            catchError(err => {
                console.error('[LogIngresosService] EXCEPTION all$', err);
                return of<LogIngreso[]>([]);
            })
        );
    }
}



// import { Injectable } from '@angular/core';
// import { from, map, Observable } from 'rxjs';
// import { LogIngreso } from '../models/log.model';
// import { SupabaseService } from './supabase.service';

// type LogRow = {
//   email: string | null;
//   created_at: string | null;
// };

// @Injectable({ providedIn: 'root' })
// export class LogIngresosService {

//   constructor(private supa: SupabaseService) {}

//   /** Inserta una fila en log_ingresos para el usuario actualmente logueado */
//   async registrarIngreso(): Promise<void> {
//     const { data, error } = await this.supa.client.auth.getUser();
//     if (error) {
//       console.error('[LogIngresosService] error getUser', error);
//       return;
//     }
//     const user = data.user;
//     if (!user) return;

//     const email = user.email ?? '(sin email)';

//     const { error: insError } = await this.supa.client
//       .from('log_ingresos')
//       .insert({
//         user_id: user.id,
//         email: email
//         // created_at se completa solo con now()
//       });

//     if (insError) {
//       console.error('[LogIngresosService] error insert log_ingresos', insError);
//     }
//   }

//   /** Devuelve todos los logs ordenados por fecha desc */
//   all$(): Observable<LogIngreso[]> {
//     const query = this.supa.client
//       .from('log_ingresos')
//       .select('email, created_at')
//       .order('created_at', { ascending: false });

//     return from(query).pipe(
//       map(({ data, error }) => {
//         if (error) {
//           console.error('[LogIngresosService] error select log_ingresos', error);
//           return [] as LogIngreso[];
//         }

//         const rows = (data ?? []) as LogRow[];

//         return rows.map(r => ({
//           email: r.email ?? '(sin email)',
//           createdAt: r.created_at ?? new Date(0).toISOString()
//         }));
//       })
//     );
//   }
// }
