// src/app/services/especialidades.service.ts

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Especialidad, EspecialidadCreate, EspecialidadUpdate, UsuarioEspecialidadCreate } from '../app/models/especialidad.model';

@Injectable({ providedIn: 'root' })
export class EspecialidadesService {

  constructor(
    private readonly supa: SupabaseService,
  ) {}

  /* ======================= ESPECIALIDADES ======================= */

  /** Lista todas las especialidades (ordenadas por nombre). */
  async listarEspecialidades(): Promise<Especialidad[]> {
    const { data, error } = await this.supa.client
      .from('especialidades')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('[EspecialidadesService] Error al listar especialidades', error);
      throw error;
    }

    return (data ?? []) as Especialidad[];
  }

  /** Obtiene una especialidad por id. */
  async obtenerEspecialidadPorId(id: string): Promise<Especialidad | null> {
    const { data, error } = await this.supa.client
      .from('especialidades')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[EspecialidadesService] Error al obtener especialidad', error);
      throw error;
    }

    return data as Especialidad | null;
  }

  /** Crea una nueva especialidad. */
  async crearEspecialidad(payload: EspecialidadCreate): Promise<Especialidad> {
    const { data, error } = await this.supa.client
      .from('especialidades')
      .insert(payload)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[EspecialidadesService] Error al crear especialidad', error);
      throw error;
    }

    return data as Especialidad;
  }

  /** Actualiza una especialidad existente. */
  async actualizarEspecialidad(id: string, cambios: EspecialidadUpdate): Promise<Especialidad> {
    const { data, error } = await this.supa.client
      .from('especialidades')
      .update(cambios)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[EspecialidadesService] Error al actualizar especialidad', error);
      throw error;
    }

    return data as Especialidad;
  }

  /** Elimina una especialidad (cuidado con FKs en usuario_especialidad y turnos). */
  async eliminarEspecialidad(id: string): Promise<void> {
    const { error } = await this.supa.client
      .from('especialidades')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[EspecialidadesService] Error al eliminar especialidad', error);
      throw error;
    }
  }

  /* =================== USUARIO_ESPECIALIDAD ===================== */

  /** 
   * Obtiene las especialidades asociadas a un usuario (especialista).
   * Devuelve directamente la lista de Especialidad.
   */
  async listarEspecialidadesDeUsuario(usuarioId: string): Promise<Especialidad[]> {

    // 1) Traemos los ids de especialidad
    const { data: rels, error: relError } = await this.supa.client
      .from('usuario_especialidad')
      .select('especialidad_id')
      .eq('usuario_id', usuarioId);

    if (relError) {
      console.error('[EspecialidadesService] Error al obtener relaciones usuario_especialidad', relError);
      throw relError;
    }

    const ids = (rels ?? [])
      .map((r: any) => r.especialidad_id as string)
      .filter(Boolean);

    if (!ids.length) {
      return [];
    }

    // 2) Traemos las especialidades correspondientes
    const { data, error } = await this.supa.client
      .from('especialidades')
      .select('*')
      .in('id', ids);

    if (error) {
      console.error('[EspecialidadesService] Error al obtener especialidades por ids', error);
      throw error;
    }

    return (data ?? []) as Especialidad[];
  }

  /** Asigna una especialidad a un usuario (no duplica por PK compuesta). */
  async agregarEspecialidadAUsuario(usuarioId: string, especialidadId: string): Promise<void> {
    const payload: UsuarioEspecialidadCreate = {
      usuario_id: usuarioId,
      especialidad_id: especialidadId,
    };

    const { error } = await this.supa.client
      .from('usuario_especialidad')
      .upsert(payload); // pk (usuario_id, especialidad_id) evita duplicados

    if (error) {
      console.error('[EspecialidadesService] Error al agregar especialidad a usuario', error);
      throw error;
    }
  }

  /** Quita una especialidad particular de un usuario. */
  async quitarEspecialidadDeUsuario(usuarioId: string, especialidadId: string): Promise<void> {
    const { error } = await this.supa.client
      .from('usuario_especialidad')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('especialidad_id', especialidadId);

    if (error) {
      console.error('[EspecialidadesService] Error al quitar especialidad de usuario', error);
      throw error;
    }
  }

  /**
   * Reemplaza completamente el set de especialidades de un usuario.
   * - Borra todas las filas previas de usuario_especialidad
   * - Inserta las nuevas
   */
  async reemplazarEspecialidadesDeUsuario(usuarioId: string, especialidadIds: string[]): Promise<void> {
    // 1) Borrar todas
    const { error: delError } = await this.supa.client
      .from('usuario_especialidad')
      .delete()
      .eq('usuario_id', usuarioId);

    if (delError) {
      console.error('[EspecialidadesService] Error al borrar especialidades de usuario', delError);
      throw delError;
    }

    // 2) Insertar nuevas (si hay)
    if (!especialidadIds.length) {
      return;
    }

    const rows: UsuarioEspecialidadCreate[] = especialidadIds.map(especialidadId => ({
      usuario_id: usuarioId,
      especialidad_id: especialidadId,
    }));

    const { error: insError } = await this.supa.client
      .from('usuario_especialidad')
      .insert(rows);

    if (insError) {
      console.error('[EspecialidadesService] Error al insertar especialidades de usuario', insError);
      throw insError;
    }
  }
}


