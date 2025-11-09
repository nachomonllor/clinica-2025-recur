
// src/app/services/paciente.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, map, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { HistoriaClinica, Paciente, Turno } from '../../models/interfaces';

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

  getPacientes() {
    // Traemos SOLO columnas que existen en 'profiles'
    // Ajustá nombres si tu tabla usa otros campos
    // return from(
    //   this.supa
    //     .from('profiles')
    //     .select('id, nombre, apellido, email, obra_social, avatar_url, imagen2_url, edad, dni')
    //     .eq('rol', 'paciente')
    //     .order('apellido', { ascending: true })
    // ).pipe(
    //   map(({ data, error }) => {
    //     if (error) throw error;

    //     const rows = (data || []).map((r: any): Paciente => ({
    //       id: r.id,
    //       avatarUrl: r.avatar_url ?? '',

    //       nombre: r.nombre ?? '',
    //       apellido: r.apellido ?? '',
    //       edad: Number(r.edad ?? 0),
    //       dni: r.dni ?? '',
    //       obraSocial: r.obra_social ?? '',
    //       email: r.email ?? '',
    //       //nNunca LEEREMOS el password real desde BD / Auth.
    //       // Para cumplir la interfaz LO DEJAMOS VACIO 
    //       password: '',

    //       // Si no tenés 2 imágenes, reusamos la de avatar para la 1 y
    //       // dejamos vacía la 2. Cambiá a tus columnas reales si existen.
    //       imagenPerfil1: r.avatar_url ?? '',
    //       imagenPerfil2: r.imagen2_url ?? ''
    //     }));

    //     return rows;
    //   })
    // );


    // src/app/services/pacientes.service.ts
    return from(
      this.supa
        .from('profiles')
        .select('id, nombre, apellido, obra_social, avatar_url, imagen2_url, edad, dni')
        .eq('rol', 'paciente')
        .order('apellido', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((r: any) => ({
          id: r.id,
          avatarUrl: r.avatar_url ?? '',
          nombre: r.nombre ?? '',
          apellido: r.apellido ?? '',
          edad: Number(r.edad ?? 0),
          dni: r.dni ?? '',
          obraSocial: r.obra_social ?? '',
          email: '',                 // <- si el modelo lo exige, dejalo vacío
          password: '',              // <- idem (no se lee nunca desde BD)
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



