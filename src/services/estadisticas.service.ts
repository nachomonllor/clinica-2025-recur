import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

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

@Injectable({ providedIn: 'root' })
export class EstadisticasService {

  constructor(private readonly supa: SupabaseService) { }

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
}
