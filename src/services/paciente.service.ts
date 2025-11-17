
// src/app/services/paciente.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, map, Observable } from 'rxjs';
import { Turno } from '../models/turno.model';
import { Paciente } from '../models/paciente.model';
import { HistoriaClinica } from '../models/historia-clinica.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class PacienteService {

  private supa = inject(SupabaseService).client;

  constructor(private http: HttpClient) { }

  // Trae todos los turnos del especialista
  getTurnosPorEspecialista(especialistaId: string): Observable<Turno[]> {
    return this.http.get<Turno[]>(`/api/turnos?especialista=${especialistaId}`);
  }

  /**
 * Devuelve sólo los pacientes que el especialista haya atendido al menos una vez.
 * La API debe aceptar el query param `atendidosPor` y devolver:
 * [{ id, nombre, apellido, avatarUrl, … }]
 */
  getPacientesAtendidos(especialistaId: string): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(
      `/api/pacientes?atendidosPor=${especialistaId}`
    );
  }

  // Detalles de un paciente
  getTurnosDePaciente(pacienteId: string, especialistaId: string): Observable<Turno[]> {
    return this.http.get<Turno[]>(`/api/turnos?paciente=${pacienteId}&especialista=${especialistaId}`);
  }

  getHistoriaClinica(pacienteId: string): Observable<HistoriaClinica> {
    return this.http.get<HistoriaClinica>(`/api/historias/${pacienteId}`);
  }


  // getPacientes() {

  //   // src/app/services/pacientes.service.ts
  //   return from(
  //     this.supa
  //       .from('perfiles')
  //       .select('id, nombre, apellido, obra_social, avatar_url, imagen2_url, edad, dni')
  //       .eq('rol', 'paciente')
  //       .order('apellido', { ascending: true })
  //   ).pipe(
  //     map(({ data, error }) => {
  //       if (error) throw error;
  //       return (data || []).map((r: any) => ({
  //         id: r.id,
  //         avatarUrl: r.avatar_url ?? '',
  //         nombre: r.nombre ?? '',
  //         apellido: r.apellido ?? '',
  //         edad: Number(r.edad ?? 0),
  //         dni: r.dni ?? '',
  //         obraSocial: r.obra_social ?? '',
  //         email: '',                 // <- si el modelo lo exige, dejalo vacío
  //         password: '',              // <- idem (no se lee nunca desde BD)
  //         imagenPerfil1: r.avatar_url ?? '',
  //         imagenPerfil2: r.imagen2_url ?? ''
  //       })) as Paciente[];
  //     })
  //   );

  // }


  // src/services/paciente.service.ts
  getPacientes() {
    return from(
      this.supa
        .from('perfiles')
        .select('id, nombre, apellido, email, obra_social, avatar_url, imagen2_url, fecha_nacimiento, dni')
        .eq('rol', 'paciente')
        .order('apellido', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;

        const calcEdad = (iso?: string | null) => {
          if (!iso) return undefined;
          const d = new Date(iso);
          const diff = Date.now() - d.getTime();
          const ageDate = new Date(diff);
          return Math.abs(ageDate.getUTCFullYear() - 1970);
        };

        return (data || []).map((r: any) => ({
          id: r.id,
          avatarUrl: r.avatar_url ?? '',
          nombre: r.nombre ?? '',
          apellido: r.apellido ?? '',
          edad: calcEdad(r.fecha_nacimiento),
          dni: r.dni ?? '',
          obraSocial: r.obra_social ?? '',
          email: r.email ?? '',
          password: '',
          imagenPerfil1: r.avatar_url ?? '',
          imagenPerfil2: r.imagen2_url ?? ''
        })) as Paciente[];
      })
    );
  }



}



// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class PacienteService {

//   constructor() { }
// }



// /** Devuelve todos los pacientes (profiles.rol='paciente') como Observable */
// getPacientes() {
//   return from(
//     this.supa
//       .from('profiles')
//       .select('id, nombre, apellido, email, obra_social, avatar_url')
//       .eq('rol', 'paciente')
//       .order('apellido', { ascending: true })
//   ).pipe(
//     map(({ data, error }) => {
//       if (error) throw error;
//       // Mapear nombres de columnas de BD -> modelo de UI
//       return (data || []).map((r: any) => ({
//         id: r.id,
//         nombre: r.nombre ?? '',
//         apellido: r.apellido ?? '',
//         email: r.email ?? '',
//         obraSocial: r.obra_social ?? '',     // BD: obra_social -> UI: obraSocial
//         avatar: r.avatar_url ?? null         // BD: avatar_url -> UI: avatar
//       })) as Paciente[];
//     })
//   );
// }



