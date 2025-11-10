import { Injectable, inject } from '@angular/core';
import { from, map, switchMap, Observable, delay, of, BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { TurnoVM, EstadoTurno, TurnoEspecialistaVM, Turno, UUID } from '../../models/interfaces';

type PerfilMin = { id: UUID; nombre: string; apellido: string };

@Injectable({ providedIn: 'root' })
export class TurnoService {
  private supa = inject(SupabaseService).client;
  private tabla = 'turnos';

  // Lookups SOLO para mock local. En real vendrá por join/relación.
  private readonly especialistas: Record<UUID, PerfilMin> = {
    e1: { id: 'e1', nombre: 'Laura', apellido: 'Ibarra' },
    e2: { id: 'e2', nombre: 'Diego', apellido: 'Ríos' },
    e3: { id: 'e3', nombre: 'Micaela', apellido: 'Ruiz' },
  };
  private readonly pacientes: Record<UUID, PerfilMin> = {
    p1: { id: 'p1', nombre: 'Marcos', apellido: 'Sosa' },
    p2: { id: 'p2', nombre: 'Ana', apellido: 'Gómez' },
    p3: { id: 'p3', nombre: 'Luz', apellido: 'Maidana' },
  };

  private readonly _turnos$ = new BehaviorSubject<Turno[]>
    ([
      {
        id: 't1',
        pacienteId: 'p1',
        especialistaId: 'e1',
        especialidad: 'Cardiología',
        fecha: new Date('2025-03-10T09:00:00-03:00'),
        estado: 'pendiente',
      },
      {
        id: 't2',
        pacienteId: 'p2',
        especialistaId: 'e2',
        especialidad: 'Dermatología',
        fecha: new Date('2025-03-11T10:30:00-03:00'),
        estado: 'aceptado',
      },
      {
        id: 't3',
        pacienteId: 'p3',
        especialistaId: 'e3',
        especialidad: 'Pediatría',
        fecha: new Date('2025-03-12T12:00:00-03:00'),
        estado: 'rechazado',
      },
    ]);


  // private readonly especialistas: Record<UUID, PerfilMin> = {
  //   e1: { id: 'e1', nombre: 'Laura',   apellido: 'Ibarra' },
  //   e2: { id: 'e2', nombre: 'Diego',   apellido: 'Ríos'   },
  //   e3: { id: 'e3', nombre: 'Micaela', apellido: 'Ruiz'   },
  // };

  // private readonly pacientes: Record<UUID, PerfilMin> = {
  //   p1: { id: 'p1', nombre: 'Marcos', apellido: 'Sosa'    },
  //   p2: { id: 'p2', nombre: 'Ana',    apellido: 'Gómez'   },
  //   p3: { id: 'p3', nombre: 'Luz',    apellido: 'Maidana' },
  // };

  // ===== Helpers públicos usados por el componente =====
  getEspecialista(id: UUID): PerfilMin | undefined {
    return this.especialistas[id];
  }

  getPaciente(id: UUID): PerfilMin | undefined {
    return this.pacientes[id];
  }

  public nombreCompleto(p?: { nombre: string; apellido: string }): string {
    return p ? `${p.apellido}, ${p.nombre}` : '-';
  }

  /** formatea HH:mm en 24h: evita variaciones de locale */
  public horaLocal(fecha: Date): string {
    const d = new Date(fecha);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }


  listAll(): Observable<Turno[]> {
    return this._turnos$.asObservable().pipe(delay(120));
  }

  cancelarTurno(id: string, motivo: string): Observable<void> {
    const curr = this._turnos$.value.slice();
    const ix = curr.findIndex(t => t.id === id);
    if (ix > -1) {
      curr[ix] = { ...curr[ix], estado: 'cancelado' }; // Motivo lo vas a persistir en BD real
      this._turnos$.next(curr);
    }
    return of(void 0).pipe(delay(200));
  }

  puedeCancelar(estado: EstadoTurno): boolean {
    // no fue aceptado / realizado / rechazado / cancelado
    return !['aceptado', 'realizado', 'rechazado', 'cancelado'].includes(estado);
  }



  // // === utilidades para la vista (reusan tus interfaces) ===
  // getEspecialista(id: UUID) { return this.especialistas[id]; }
  // getPaciente(id: UUID)     { return this.pacientes[id]; }
  // nombreCompleto(p?: PerfilMin) { return p ? `${p.apellido}, ${p.nombre}` : '-'; }
  // horaLocal(fecha: Date) { return new Date(fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

  // cancelarTurno(id: string, motivo: string): Observable<void> {
  //   const current = this._turnos$.value.slice();
  //   const idx = current.findIndex(t => t.id === id);
  //   if (idx > -1) {
  //     current[idx] = {
  //       ...current[idx],
  //       estado: 'cancelado',
  //       comentarios: {
  //         ...current[idx].comentarios,
  //         cancelacion: { texto: motivo, por: 'Administrador', fechaISO: new Date().toISOString() }
  //       }
  //     };
  //     this._turnos$.next(current);
  //   }
  //   return of(void 0).pipe(delay(250));
  // }

  // // Utilidad para saber si el Admin puede cancelar según el estado actual:
  // puedeCancelar(estado: EstadoTurno): boolean {
  //   // Es cancelable cuando "no fue Aceptado, Realizado o Rechazado" (consigna Sprint 2, p.4)
  //   return estado !== 'Aceptado' && estado !== 'Realizado' && estado !== 'Rechazado' && estado !== 'Cancelado';
  // }


  getTurnosAdminVM$(): Observable<TurnoVM[]> {
    return from(
      this.supa
        .from('turnos')
        .select(`
        id, paciente_id, especialista_id, especialidad, fecha_iso, estado,
        paciente:profiles!turnos_paciente_id_fkey ( nombre, apellido ),
        especialista:profiles!turnos_especialista_id_fkey ( nombre, apellido )
      `)
        .order('fecha_iso', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((r: any) => {
          const fecha = new Date(r.fecha_iso);
          const especialista = `${r.especialista?.apellido ?? ''}, ${r.especialista?.nombre ?? ''}`.trim();
          const pacienteNombre = `${r.paciente?.apellido ?? ''}, ${r.paciente?.nombre ?? ''}`.trim();
          return <TurnoVM>{
            id: r.id,
            especialidad: r.especialidad,
            especialista,
            estado: r.estado,
            fechaISO: r.fecha_iso,
            fecha,
            hora: this.horaLocal(fecha),
            pacienteId: r.paciente_id,
            especialistaId: r.especialista_id,
            pacienteNombre
          };
        });
      })
    );
  }


  /**
   * Lista turnos del paciente logueado y los mapea al VM canónico.
   * Retorna fechaISO (obligatoria) y deja fecha/hora para compatibilidad con tu tabla.
   */
  getTurnosPacienteVM$(): Observable<TurnoVM[]> {
    return from(this.supa.auth.getUser()).pipe(
      map(res => res.data.user?.id || ''),
      switchMap(uid =>
        from(
          this.supa
            .from(this.tabla)
            .select(`
              id,
              paciente_id,
              especialista_id,
              especialidad,
              fecha_iso,
              estado,
              resena_especialista,
              encuesta,
              especialista:profiles!turnos_especialista_id_fkey ( apellido, nombre )
            `)
            .eq('paciente_id', uid)
            .order('fecha_iso', { ascending: false })
        )
      ),
      map(({ data, error }) => {
        if (error) throw error;

        const out: TurnoVM[] = (data || []).map((t: any) => {
          const dt = new Date(t.fecha_iso);
          const hora = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const fechaSolo = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
          const especialista = t.especialista
            ? `${t.especialista.apellido || ''}, ${t.especialista.nombre || ''}`.trim()
            : '-';
          const encuesta = !!t.encuesta;
          const calificacion = Number(t.encuesta?.estrellas ?? t.encuesta?.rating ?? NaN);

          return {
            id: t.id,
            // canónico:
            fechaISO: t.fecha_iso,
            // compat (tu tabla actual):
            fecha: fechaSolo,
            hora,
            especialidad: t.especialidad,
            especialista,
            estado: t.estado as EstadoTurno,
            resenaEspecialista: t.resena_especialista || null,
            tieneResena: !!t.resena_especialista,
            encuesta,
            pacienteId: t.paciente_id,
            calificacion: isNaN(calificacion) ? undefined : calificacion
          } satisfies TurnoVM;
        });

        return out;
      })
    );
  }

  /**
   * Turnos del especialista (listado). Mapea al VM de especialista.
   * Si no pasás `especialistaId`, toma el usuario actual.
   */
  getTurnosEspecialista$(especialistaId?: string): Observable<TurnoEspecialistaVM[]> {
    return from(this.supa.auth.getUser()).pipe(
      map(res => especialistaId || res.data.user?.id || ''),
      switchMap(uid =>
        from(
          this.supa
            .from(this.tabla)
            .select(`
              id,
              paciente_id,
              especialista_id,
              especialidad,
              fecha_iso,
              estado,
              resena_especialista,
              encuesta,
              paciente:profiles!turnos_paciente_id_fkey ( apellido, nombre )
            `)
            .eq('especialista_id', uid)
            .order('fecha_iso', { ascending: false })
        )
      ),
      map(({ data, error }) => {
        if (error) throw error;

        return (data || []).map((t: any) => {
          const dt = new Date(t.fecha_iso);
          const hora = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const paciente = t.paciente
            ? `${t.paciente.apellido || ''}, ${t.paciente.nombre || ''}`.trim()
            : '-';

          const vm: TurnoEspecialistaVM = {
            id: t.id,
            fechaISO: t.fecha_iso,
            hora,
            especialidad: t.especialidad,
            paciente,
            estado: t.estado as EstadoTurno,
            resenaEspecialista: t.resena_especialista || null
          };
          return vm;
        });
      })
    );
  }

}



// /** Cancela el turno (update estado='cancelado') y devuelve void si OK */
// cancelarTurno(id: string): Observable<void> {
//   return from(
//     this.supa
//       .from(this.tabla)
//       .update({ estado: 'cancelado' })
//       .eq('id', id)
//       .select('id')
//       .single()
//   ).pipe(
//     map(({ error }) => {
//       if (error) throw error;
//       return void 0;
//     })
//   );
// }







// import { Injectable, inject } from '@angular/core';
// import { from, map, switchMap } from 'rxjs';
// import { SupabaseService } from './supabase.service';
// import { TurnoVM } from '../../models/interfaces';

// @Injectable({ providedIn: 'root' })
// export class TurnoService {
//     private supa = inject(SupabaseService).client;
//     private tabla = 'turnos';

//     /** Lista turnos del paciente logueado y los mapea a la vista */
//     getTurnosPacienteVM$() {
//       return from(this.supa.auth.getUser()).pipe(
//         map(res => res.data.user?.id || ''),
//         switchMap(uid => from(
//           this.supa
//             .from(this.tabla)
//             .select(`
//               id,
//               paciente_id,
//               especialista_id,
//               especialidad,
//               fecha_iso,
//               estado,
//               resena_especialista,
//               encuesta,
//               especialista:profiles!turnos_especialista_id_fkey ( apellido, nombre )
//             `)
//             .eq('paciente_id', uid)
//             .order('fecha_iso', { ascending: false })
//         )),
//         map(({ data, error }) => {
//           if (error) throw error;
//           const out: TurnoVM[] = (data || []).map((t: any) => {
//             const dt = new Date(t.fecha_iso);
//             const hora = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//             const fechaSolo = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
//             const especialista = t.especialista ? `${t.especialista.apellido || ''}, ${t.especialista.nombre || ''}`.trim() : '-';
//             const encuesta = !!t.encuesta;
//             const calificacion = Number(t.encuesta?.estrellas ?? t.encuesta?.rating ?? NaN);
//             return {
//               id: t.id,
//               fecha: fechaSolo,
//               hora,
//               especialidad: t.especialidad,
//               especialista,
//               estado: t.estado as EstadoTurno,
//               resena: t.resena_especialista || '',
//               encuesta,
//               pacienteId: t.paciente_id,
//               calificacion: isNaN(calificacion) ? undefined : calificacion
//             } as TurnoVM;
//           });
//           return out;
//         })
//       );
//     }

//     getTurnosEspecialista$(especialistaId?: string) {
//       return from(this.supa.auth.getUser()).pipe(
//         map(res => especialistaId || res.data.user?.id || ''),
//           switchMap(uid => from(
//             this.supa
//               .from('turnos')
//               .select(`
//                 id,
//                 paciente_id,
//                 especialista_id,
//                 especialidad,
//                 fecha_iso,
//                 estado,
//                 resena_especialista,
//                 encuesta,
//                 paciente:profiles!turnos_paciente_id_fkey ( apellido, nombre )
//               `)
//               .eq('especialista_id', uid)
//               .order('fecha_iso', { ascending: false })
//           )),
//           // map(({ data, error }) => {
//           //   if (error) throw error;
//           //   // Mapea a la misma VM que uses en tu tabla de especialista
//           //   return (data || []).map((t: any) => {
//           //     const dt = new Date(t.fecha_iso);
//           //     const hora = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//           //     const fechaSolo = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
//           //     const paciente = t.paciente ? `${t.paciente.apellido || ''}, ${t.paciente.nombre || ''}`.trim() : '-';
//           //     const encuesta = !!t.encuesta;
//           //     return {
//           //       id: t.id,
//           //       fecha: fechaSolo,
//           //       hora,
//           //       especialidad: t.especialidad,
//           //       paciente,
//           //       estado: t.estado,
//           //       resena: t.resena_especialista || '',
//           //       encuesta
//           //     };
//           //   });
//           // })

//           map(({ data, error }) => {
//             if (error) throw error;
//             return (data || []).map((t: any) => {
//               const dt = new Date(t.fecha_iso);
//               const yyyy = dt.getFullYear();
//               const mm = String(dt.getMonth() + 1).padStart(2, '0');
//               const dd = String(dt.getDate()).padStart(2, '0');
//               const fechaStr = `${yyyy}-${mm}-${dd}`;                     // <- string
//               const hora = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//               const paciente = t.paciente ? `${t.paciente.apellido || ''}, ${t.paciente.nombre || ''}`.trim() : '-';
//               const encuesta = !!t.encuesta;
//               return {
//                 id: t.id,
//                 fecha: fechaStr,                                          // <- string
//                 hora,                                                     // <- string
//                 especialidad: t.especialidad,
//                 paciente,
//                 estado: t.estado,
//                 resena: t.resena_especialista || '',
//                 encuesta
//               } as TurnoEspecialista;
//             });
//           })


//     );
//   }

//   /** Cancela el turno (update estado='cancelado') */
//   cancelarTurno(id: string) {
//     return from(
//       this.supa
//         .from(this.tabla)
//         .update({ estado: 'cancelado' })
//         .eq('id', id)
//         .select('id')
//         .single()
//     );
//   }
// }




// ------------------------------------------------------------------------------ ------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------------------


// import { Injectable, inject } from '@angular/core';
// import { Observable, from, map } from 'rxjs';
// import { SupabaseService } from './supabase.service';

// export type EstadoTurno =
//   | 'pendiente' | 'aceptado' | 'confirmado'
//   | 'realizado' | 'rechazado' | 'cancelado';

// export interface TurnoVM {
//   id: string;
//   pacienteId: string;
//   especialistaId: string;
//   especialista: string;     // nombre para UI
//   especialidad: string;
//   fechaISO: string;         // ISO 8601
//   hora?: string;            // opcional si lo usás en la tabla
//   estado: EstadoTurno;
//   ubicacion?: string;
//   notas?: string;
//   resena?: boolean;
//   encuesta?: boolean;
// }

// @Injectable({ providedIn: 'root' })
// export class TurnoService {
//   private sb = inject(SupabaseService);

//   /**
//    * Mis turnos (paciente): view model para tu tabla.
//    * Si ya tenés algo hecho, dejá la misma firma para no romper nada.
//    */
//   getTurnosPacienteVM$(pacienteId?: string): Observable<TurnoVM[]> {
//     // Si ya manejás el userId en otro lado, podés ignorar el parámetro.
//     // --- Supabase real ---
//     // return from(
//     //   this.sb.client
//     //     .from('turnos')
//     //     .select(`
//     //       id, paciente_id, especialista_id, especialidad, fecha_iso, estado, notas,
//     //       especialista:perfiles_especialista(nombre, apellido)
//     //     `)
//     //     .eq('paciente_id', pacienteId)            // si lo recibís
//     //     .order('fecha_iso', { ascending: true })
//     // ).pipe(
//     //   map(({ data, error }) => {
//     //     if (error) throw error;
//     //     return (data ?? []).map(r => <TurnoVM>{
//     //       id: r.id,
//     //       pacienteId: r.paciente_id,
//     //       especialistaId: r.especialista_id,
//     //       especialista: this.fullName(r.especialista),
//     //       especialidad: r.especialidad,
//     //       fechaISO: r.fecha_iso,
//     //       estado: r.estado as EstadoTurno,
//     //       notas: r.notas
//     //     });
//     //   })
//     // );

//     // --- Placeholder para que compile ya (borralo cuando conectes) ---
//     return from(Promise.resolve<TurnoVM[]>([]));
//   }

//   /**
//    * Detalle del turno por ID (paciente).
//    */
//   getTurnoPacienteById$(id: string): Observable<TurnoVM> {
//     // --- Supabase real ---
//     // return from(
//     //   this.sb.client
//     //     .from('turnos')
//     //     .select(`
//     //       id, paciente_id, especialista_id, especialidad, fecha_iso, estado, notas, ubicacion,
//     //       especialista:perfiles_especialista(nombre, apellido)
//     //     `)
//     //     .eq('id', id)
//     //     .maybeSingle()
//     // ).pipe(
//     //   map(({ data, error }) => {
//     //     if (error) throw error;
//     //     if (!data) throw new Error('Turno no encontrado');
//     //     return <TurnoVM>{
//     //       id: data.id,
//     //       pacienteId: data.paciente_id,
//     //       especialistaId: data.especialista_id,
//     //       especialista: this.fullName(data.especialista),
//     //       especialidad: data.especialidad,
//     //       fechaISO: data.fecha_iso,
//     //       estado: data.estado as EstadoTurno,
//     //       notas: data.notas,
//     //       ubicacion: data.ubicacion
//     //     };
//     //   })
//     // );

//     // --- Placeholder para que compile ya ---
//     return from(Promise.reject<TurnoVM>(new Error('TODO: conectar a Supabase')));
//   }

//   /**
//    * Cancelar turno (paciente).
//    */
//   cancelarTurno(id: string): Observable<void> {
//     // --- Supabase real ---
//     // return from(
//     //   this.sb.client
//     //     .from('turnos')
//     //     .update({ estado: 'cancelado' })
//     //     .eq('id', id)
//     // ).pipe(
//     //   map(({ error }) => { if (error) throw error; return void 0; })
//     // );

//     // --- Placeholder para que compile ya ---
//     return from(Promise.resolve(void 0));
//   }

//   // Util
//   private fullName(p?: { nombre?: string; apellido?: string } | null): string {
//     if (!p) return '—';
//     const n = [p.nombre, p.apellido].filter(Boolean).join(' ');
//     return n || '—';
//   }
// }


// ------------------------------------------------------------------------------ ------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------------------







/*
 ---------------------- HARDCODEADOS MOCKS ANTERIORES ----------------------
 //   // → aquí el mock único para toda la app
//   private mockTurnos: Turno[] = [
//     {
//       id: 101,
//        fecha: new Date('2025-06-25'),
//         hora: '09:30', 
//         especialidad: 'Cardiología',
//       especialista: 'Dra. Pérez', 
//       estado: 'aceptado', 
//       resena: 'Excelente atención, muy profesional.', 
//       encuesta: false,
//       calificacion: 10
//     },
//     {
//       id: 102, 
//       fecha: new Date('2025-06-28'), 
//       hora: '14:00', 
//       especialidad: 'Dermatología',
//       especialista: 'Dr. Gómez', 
//        pacienteId: '4',  
//         estado: 'realizado', 
//         resena: 'Me gustó mucho la consulta.', 
//         encuesta: true,
//       calificacion: 10
//     },
//     {
//       id: 103, 
//       fecha: new Date('2025-07-02'), 
//       hora: '11:15',
//        especialidad: 'Pediatría',
//       especialista: 'Dra. Ruiz',
//        pacienteId: '4',    
//        estado: 'pendiente', 
//        resena: "prueba res",
//        encuesta: false,
//       calificacion: 8
//     },
//     {
//       id: 104,
//       fecha: new Date('2025-09-02'),
//       hora: '11:15',
//       especialidad: 'Cardiologia',
//       especialista: 'Dra. Nora Da Puente',
//        pacienteId: '5',   
//       estado: 'realizado',
//       resena: 'Reseña de prueba', // ← aquí
//       encuesta: false,
//       calificacion: 9
//     },
//     {
//       id: 105,
//       fecha: new Date('2025-06-22'),
//       hora: '11:15',
//       especialidad: 'Diabetóloga',
//       especialista: 'Dra. Florencia De Césare',
//       estado: 'realizado',
//       resena: 'Reseña de prueba', // ← aquí
//       encuesta: false,
//       pacienteId: '6',
//       calificacion: 10
//     }

//   ];


*/


