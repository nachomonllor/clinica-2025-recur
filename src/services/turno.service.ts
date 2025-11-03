import { Injectable, inject } from '@angular/core';
import { from, map, switchMap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { TurnoVM, EstadoTurno } from '../models/turno.model';
import { TurnoEspecialista } from '../models/turno-especialista.model';

@Injectable({ providedIn: 'root' })
export class TurnoService {
    private supa = inject(SupabaseService).client;
    private tabla = 'turnos';

    /** Lista turnos del paciente logueado y los mapea a la vista */
    getTurnosPacienteVM$() {
      return from(this.supa.auth.getUser()).pipe(
        map(res => res.data.user?.id || ''),
        switchMap(uid => from(
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
        )),
        map(({ data, error }) => {
          if (error) throw error;
          const out: TurnoVM[] = (data || []).map((t: any) => {
            const dt = new Date(t.fecha_iso);
            const hora = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const fechaSolo = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
            const especialista = t.especialista ? `${t.especialista.apellido || ''}, ${t.especialista.nombre || ''}`.trim() : '-';
            const encuesta = !!t.encuesta;
            const calificacion = Number(t.encuesta?.estrellas ?? t.encuesta?.rating ?? NaN);
            return {
              id: t.id,
              fecha: fechaSolo,
              hora,
              especialidad: t.especialidad,
              especialista,
              estado: t.estado as EstadoTurno,
              resena: t.resena_especialista || '',
              encuesta,
              pacienteId: t.paciente_id,
              calificacion: isNaN(calificacion) ? undefined : calificacion
            } as TurnoVM;
          });
          return out;
        })
      );
    }

    getTurnosEspecialista$(especialistaId?: string) {
      return from(this.supa.auth.getUser()).pipe(
        map(res => especialistaId || res.data.user?.id || ''),
          switchMap(uid => from(
            this.supa
              .from('turnos')
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
          )),
          // map(({ data, error }) => {
          //   if (error) throw error;
          //   // Mapea a la misma VM que uses en tu tabla de especialista
          //   return (data || []).map((t: any) => {
          //     const dt = new Date(t.fecha_iso);
          //     const hora = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          //     const fechaSolo = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
          //     const paciente = t.paciente ? `${t.paciente.apellido || ''}, ${t.paciente.nombre || ''}`.trim() : '-';
          //     const encuesta = !!t.encuesta;
          //     return {
          //       id: t.id,
          //       fecha: fechaSolo,
          //       hora,
          //       especialidad: t.especialidad,
          //       paciente,
          //       estado: t.estado,
          //       resena: t.resena_especialista || '',
          //       encuesta
          //     };
          //   });
          // })

          map(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((t: any) => {
              const dt = new Date(t.fecha_iso);
              const yyyy = dt.getFullYear();
              const mm = String(dt.getMonth() + 1).padStart(2, '0');
              const dd = String(dt.getDate()).padStart(2, '0');
              const fechaStr = `${yyyy}-${mm}-${dd}`;                     // <- string
              const hora = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const paciente = t.paciente ? `${t.paciente.apellido || ''}, ${t.paciente.nombre || ''}`.trim() : '-';
              const encuesta = !!t.encuesta;
              return {
                id: t.id,
                fecha: fechaStr,                                          // <- string
                hora,                                                     // <- string
                especialidad: t.especialidad,
                paciente,
                estado: t.estado,
                resena: t.resena_especialista || '',
                encuesta
              } as TurnoEspecialista;
            });
          })


    );
  }

  /** Cancela el turno (update estado='cancelado') */
  cancelarTurno(id: string) {
    return from(
      this.supa
        .from(this.tabla)
        .update({ estado: 'cancelado' })
        .eq('id', id)
        .select('id')
        .single()
    );
  }
}




// import { Injectable, inject } from '@angular/core';
// import { from, map, switchMap } from 'rxjs';
// import { SupabaseService } from './supabase.service';
// import { TurnoVM } from '../models/turno.model';

// export interface Turno {
//   id?: string;
//   paciente_id: string;
//   especialista_id: string;
//   especialidad: string;
//   fecha_iso: string; // ISO
//   estado: 'pendiente'|'aceptado'|'realizado'|'cancelado'|'rechazado';
// }

// @Injectable({ providedIn: 'root' })
// export class TurnoService {
//   private supa = inject(SupabaseService).client;
//   private tabla = 'turnos';

  

//   crearTurno(turno: Turno) {
//     return from(this.supa.from(this.tabla).insert(turno));
//   }

//   /** Reemplazo del viejo getTurnosPaciente$ con Supabase */
//   getTurnosPaciente$(pacienteId?: string) {
//     return from(this.supa.auth.getUser()).pipe(
//       map(res => pacienteId || res.data.user?.id || ''),
//       switchMap(uid => from(
//         this.supa.from(this.tabla)
//           .select('id, paciente_id, especialista_id, especialidad, fecha_iso, estado')
//           .eq('paciente_id', uid)
//           .order('fecha_iso', { ascending: false })
//       )),
//       map(({ data, error }) => { if (error) throw error; return data as Turno[]; })
//     );
//   }

//   /** Reemplazo del viejo getTurnosEspecialista$ */
//   getTurnosEspecialista$(especialistaId?: string) {
//     return from(this.supa.auth.getUser()).pipe(
//       map(res => especialistaId || res.data.user?.id || ''),
//       switchMap(uid => from(
//         this.supa.from(this.tabla)
//           .select('id, paciente_id, especialista_id, especialidad, fecha_iso, estado')
//           .eq('especialista_id', uid)
//           .order('fecha_iso', { ascending: false })
//       )),
//       map(({ data, error }) => { if (error) throw error; return data as Turno[]; })
//     );
//   }

//   /** Lista los turnos del paciente logueado con nombre del especialista y mapea a VM de la UI. */
//   getTurnosPacienteVM$() {
//     return from(this.supa.auth.getUser()).pipe(
//       map(res => res.data.user?.id || ''),
//       switchMap(uid => from(
//         this.supa
//           .from(this.tabla)
//           .select(`
//             id,
//             paciente_id,
//             especialista_id,
//             especialidad,
//             fecha_iso,
//             estado,
//             resena_especialista,
//             encuesta,
//             especialista:profiles!turnos_especialista_id_fkey ( apellido, nombre )
//           `)
//           .eq('paciente_id', uid)
//           .order('fecha_iso', { ascending: false })
//       )),
//       map(({ data, error }) => {
//         if (error) throw error;
//         const out: TurnoVM[] = (data || []).map((t: any) => {
//           const dt = new Date(t.fecha_iso);
//           const hora = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//           const fechaSolo = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
//           const especialista = t.especialista ? `${t.especialista.apellido || ''}, ${t.especialista.nombre || ''}`.trim() : '-';
//           const encuesta = !!t.encuesta; // asume que es objeto o null
//           const calificacion = Number(t.encuesta?.estrellas ?? t.encuesta?.rating ?? NaN);
//           return {
//             id: t.id,
//             fecha: fechaSolo,
//             hora,
//             especialidad: t.especialidad,
//             especialista,
//             estado: t.estado,
//             resena: t.resena_especialista || '',
//             encuesta,
//             pacienteId: t.paciente_id,
//             calificacion: isNaN(calificacion) ? undefined : calificacion
//           } as TurnoVM;
//         });
//         return out;
//       })
//     );
//   }

//   /** Cancela el turno (si las RLS permiten que el paciente actual lo modifique). */
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


