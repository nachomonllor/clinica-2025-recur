import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { HttpClient, HttpParams } from '@angular/common/http';

import { defer, from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import type { PostgrestSingleResponse } from '@supabase/supabase-js';

/** DTO final que consumirá el componente */
export interface TurnosPorMedicoDTO {
  medico: string;
  cantidad: number;
}

/** Shape que podría devolver el RPC (campos opcionales) */
type TurnosPorMedicoRow = {
  medico?: string | null;
  nombre?: string | null;
  apellido?: string | null;
  cantidad?: number | null;
};


export interface ItemTurnosEspecialidad {
  especialidad: string;
  cantidad: number;
}

export interface TurnoEstadistica {
  id: string;
  especialidad: string;
  estado: string;
  fecha_iso: string;
  especialista_id: string;
  created_at?: string | null;
}

export interface PerfilBasico {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface TurnosPorMedicoDTO {
  medico: string;      // 
  cantidad: number;
}

export type RpcRow = TurnosPorMedicoDTO;

export type RpcPayload = RpcRow[] | { Error: string } | null;  // <- el union que emite rpc()




@Injectable({ providedIn: 'root' })
export class EstadisticasService {

  private base = '/api/estadisticas';

  constructor(private readonly supa: SupabaseService, private http: HttpClient) { }

  turnosPorEspecialidad(desde?: string, hasta?: string): Observable<ItemTurnosEspecialidad[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);

    return this.http.get<ItemTurnosEspecialidad[]>(`${this.base}/turnos-por-especialidad`, { params })
      .pipe(
        map(arr => arr ?? []),
        catchError(() => {
          // Fallback de ejemplo
          const mock: ItemTurnosEspecialidad[] = [
            { especialidad: 'Cardiología', cantidad: 5 },
            { especialidad: 'Pediatría', cantidad: 5 },
            { especialidad: 'Neurología', cantidad: 2 },
            { especialidad: 'Clínica', cantidad: 1 },
          ];
          return of(mock);
        })
      );
  }


  /**
   * Obtiene todos los turnos (para admin). Se espera que la política RLS permita la lectura.
   */
  async obtenerTurnos(): Promise<TurnoEstadistica[]> {
    const { data, error } = await this.supa.client
      .from('turnos')
      .select('id, especialidad, estado, fecha_iso, especialista_id, created_at');

    if (error) throw error;
    return (data ?? []) as TurnoEstadistica[];
  }

  /**
   * Devuelve un mapa de perfiles por ID para los especialistas involucrados en los reportes.
   */
  async obtenerPerfiles(ids: string[]): Promise<Map<string, PerfilBasico>> {
    if (!ids.length) return new Map();

    const { data, error } = await this.supa.client
      .from('profiles')
      .select('id, nombre, apellido, email, created_at, updated_at')
      .in('id', ids);

    if (error) throw error;

    const map = new Map<string, PerfilBasico>();
    (data ?? []).forEach(p => map.set(p.id, p as PerfilBasico));
    return map;
  }

  /**
   * Usa los perfiles como pseudo-registro de ingresos (última actualización vs creación).
   * Retorna los más recientes.
   */
  async obtenerLogsDeIngreso(limit = 15): Promise<PerfilBasico[]> {
    const { data, error } = await this.supa.client
      .from('profiles')
      .select('id, nombre, apellido, email, created_at, updated_at')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as PerfilBasico[];
  }


  turnosPorMedico(
    desde?: string,
    hasta?: string,
    soloFinalizados: boolean = true
  ): Observable<TurnosPorMedicoDTO[]> {
    const args = {
      p_desde: desde ?? null,
      p_hasta: hasta ?? null,
      p_solo_finalizados: soloFinalizados
    };

    return defer(() =>
      this.supa.client
        .rpc('turnos_por_medico', args)
        .returns<RpcPayload>()         // 👈 pedimos el union correcto
    ).pipe(
      map((res: PostgrestSingleResponse<RpcPayload>) => {
        if (res.error) throw res.error;

        // Si no es array (null o el objeto { Error: ... }) => []
        const rows: TurnosPorMedicoRow[] = Array.isArray(res.data) ? res.data : [];

        const salida = rows.map((r) => {
          const ape = r.apellido ?? '';
          const nom = r.nombre ?? '';

          // 1) Elegimos médico explícito o "Apellido Nombre"
          // 2) trim para limpiar espacios
          const medicoRaw = (r.medico ?? `${ape} ${nom}`).trim();

          // 3) Si quedó vacío => "Sin nombre"
          const medico = medicoRaw || 'Sin nombre';

          return {
            medico,
            cantidad: Number(r.cantidad ?? 0)
          };
        });

        // (Opcional) ordenar desc
        // salida.sort((a, b) => b.cantidad - a.cantidad);

        return salida;
      })
    );
  }

  // estadisticas.service.ts
// Debe devolver algo como: [{ dia: 'YYYY-MM-DD', cantidad: number }]
turnosPorDia(desde?: string, hasta?: string, soloFinalizados: boolean = true) {
  //--- Supabase RPC ---
  return defer(() =>
    this.supa.client.rpc('turnos_por_dia', {
      p_desde: desde ?? null,
      p_hasta: hasta ?? null,
      p_solo_finalizados: soloFinalizados
    }).returns<Array<{ dia: string; cantidad: number }> | { Error: string } | null>()
  );

 // --- HTTP ---
  return this.http.get<Array<{ dia: string; cantidad: number }>>('/api/estadisticas/turnos-por-dia', {
    params: { desde: desde ?? '', hasta: hasta ?? '', soloFinalizados }
  });
}



}
