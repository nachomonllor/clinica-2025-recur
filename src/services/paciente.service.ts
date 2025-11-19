
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

  // // PacienteService.getPacientes()
  // return from(
  //   this.supa
  //     .from('pacientes')
  //     .select(`
  //       id,
  //       dni,
  //       obra_social,
  //       fecha_nacimiento,
  //       perfil:perfiles (nombre, apellido, email, avatar_url, imagen2_url)
  //     `)
  //     .order('perfil.apellido', { ascending: true })
  // ).pipe( /* map a tu modelo */ );


  // src/services/paciente.service.ts
  // getPacientes() {
  //   return from(
  //     this.supa
  //       .from('perfiles')
  //       .select('id, nombre, apellido, email, obra_social, avatar_url, imagen2_url, fecha_nacimiento, dni')
  //       .eq('rol', 'paciente')
  //       .order('apellido', { ascending: true })
  //   ).pipe(
  //     map(({ data, error }) => {
  //       if (error) throw error;

  //       const calcEdad = (iso?: string | null) => {
  //         if (!iso) return undefined;
  //         const d = new Date(iso);
  //         const diff = Date.now() - d.getTime();
  //         const ageDate = new Date(diff);
  //         return Math.abs(ageDate.getUTCFullYear() - 1970);
  //       };

  //       return (data || []).map((r: any) => ({
  //         id: r.id,
  //         avatarUrl: r.avatar_url ?? '',
  //         nombre: r.nombre ?? '',
  //         apellido: r.apellido ?? '',
  //         edad: calcEdad(r.fecha_nacimiento),
  //         dni: r.dni ?? '',
  //         obraSocial: r.obra_social ?? '',
  //         email: r.email ?? '',
  //         password: '',
  //         imagenPerfil1: r.avatar_url ?? '',
  //         imagenPerfil2: r.imagen2_url ?? ''
  //       })) as Paciente[];

  //     })
  //   );
  // }

  // Dentro de src/services/paciente.service.ts, reemplaza ÚNICAMENTE getPacientes()

  getPacientes() {
    return from(
      this.supa
        .from('pacientes')
        .select(`
        id, dni, obra_social, fecha_nacimiento,
        perfil:perfiles ( id, nombre, apellido, email, avatar_url, imagen2_url )
      `)
        .order('id', { ascending: true })
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
          avatarUrl: r.perfil?.avatar_url ?? '',
          nombre: r.perfil?.nombre ?? '',
          apellido: r.perfil?.apellido ?? '',
          edad: calcEdad(r.fecha_nacimiento),
          dni: r.dni ?? '',
          obraSocial: r.obra_social ?? '',
          email: r.perfil?.email ?? '',
          password: '',
          imagenPerfil1: r.perfil?.avatar_url ?? '',
          imagenPerfil2: r.perfil?.imagen2_url ?? ''
        })) as Paciente[];
      })
    );
  }





}


