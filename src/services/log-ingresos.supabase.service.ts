
// import { Injectable } from '@angular/core';
// import { from, map, Observable } from 'rxjs';
// import { LogIngreso } from '../models/log.model';
// import { SupabaseService } from './supabase.service';


// type Row = { email: string | null; created_at: string | null };

//  interface LogPage {
//   items: LogIngreso[];
//   total: number;
//   pageIndex: number;
//   pageSize: number;
// }

// @Injectable({ providedIn: 'root' })
// export class LogIngresosService {

//   constructor(private supa: SupabaseService) {}

//   /** Quick‑win: traer TODO (ordenado desc) y paginar en memoria en el componente */
//   all$(): Observable<LogIngreso[]> {
//     const q = this.supa.client
//       .from('log_ingresos')
//       .select('email, created_at')
//       .order('created_at', { ascending: false });

//     return from(q).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         const items = (data ?? []) as Row[];
//         return items.map(r => ({
//           email: r.email ?? '(sin email)',
//           createdAt: this.toIso(r.created_at)
//         }));
//       })
//     );
//   }

//   /** (Opcional) Paginación en servidor con offset */
//   page$(pageIndex: number, pageSize: number): Observable<LogPage> {
//     const fromIdx = pageIndex * pageSize;
//     const toIdx   = fromIdx + pageSize - 1;

//     const q = this.supa.client
//       .from('log_ingresos')
//       .select('email, created_at', { count: 'exact', head: false })
//       .order('created_at', { ascending: false })
//       .range(fromIdx, toIdx);

//     return from(q).pipe(
//       map(({ data, count, error }) => {
//         if (error) throw error;
//         const items = (data ?? []).map((r: Row) => ({
//           email: r.email ?? '(sin email)',
//           createdAt: this.toIso(r.created_at)
//         }));
//         return { items, total: count ?? 0, pageIndex, pageSize };
//       })
//     );
//   }

//   /** (Opcional) Realtime */
//   subscribeRealtime(onAnyChange: () => void) {
//     return this.supa.client
//       .channel('log_ingresos_changes')
//       .on('postgres_changes', { event: '*', schema: 'public', table: 'log_ingresos' }, () => onAnyChange())
//       .subscribe();
//   }

//   // -- helpers
//   private toIso(v: any): string {
//     if (!v) return new Date(0).toISOString();
//     if (typeof v === 'string') return v;
//     if (typeof v === 'number') return new Date(v).toISOString();
//     if (v?.toDate) return v.toDate().toISOString();      // Firestore-like
//     if (v?.seconds) return new Date(v.seconds * 1000).toISOString();
//     try { return new Date(v).toISOString(); } catch { return new Date(0).toISOString(); }
//   }
// }
