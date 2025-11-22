// src/app/services/horarios-especialista.service.ts

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { HorarioEspecialista, HorarioEspecialistaCreate, HorarioEspecialistaUpdate } from '../app/models/horario-especialista.model';

@Injectable({ providedIn: 'root' })
export class HorariosEspecialistaService {

  constructor(
    private readonly supa: SupabaseService,
  ) {}

  /**
   * Lista horarios de un especialista.
   * Podés filtrar opcionalmente por día de semana y/o especialidad.
   */
  async listarHorariosDeEspecialista(opciones: {
    especialistaId: string;
    diaSemana?: number;
    especialidadId?: string;
  }): Promise<HorarioEspecialista[]> {

    let query = this.supa.client
      .from('horarios_especialista')
      .select('*')
      .eq('especialista_id', opciones.especialistaId)
      .order('dia_semana', { ascending: true })
      .order('hora_desde', { ascending: true });

    if (typeof opciones.diaSemana === 'number') {
      query = query.eq('dia_semana', opciones.diaSemana);
    }

    if (opciones.especialidadId) {
      query = query.eq('especialidad_id', opciones.especialidadId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[HorariosEspecialistaService] Error al listar horarios', error);
      throw error;
    }

    return (data ?? []) as HorarioEspecialista[];
  }

  /** Obtiene un horario específico por id. */
  async obtenerHorarioPorId(id: string): Promise<HorarioEspecialista | null> {
    const { data, error } = await this.supa.client
      .from('horarios_especialista')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[HorariosEspecialistaService] Error al obtener horario por id', error);
      throw error;
    }

    return data as HorarioEspecialista | null;
  }

  /** Crea un nuevo horario para un especialista. */
  async crearHorario(payload: HorarioEspecialistaCreate): Promise<HorarioEspecialista> {
    const { data, error } = await this.supa.client
      .from('horarios_especialista')
      .insert(payload)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[HorariosEspecialistaService] Error al crear horario', error);
      throw error;
    }

    return data as HorarioEspecialista;
  }

  /**
   * Actualiza un horario existente (patch).
   * No cambia el especialista_id.
   */
  async actualizarHorario(id: string, cambios: HorarioEspecialistaUpdate): Promise<HorarioEspecialista> {
    const { data, error } = await this.supa.client
      .from('horarios_especialista')
      .update(cambios)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[HorariosEspecialistaService] Error al actualizar horario', error);
      throw error;
    }

    return data as HorarioEspecialista;
  }

  /** Elimina un horario concreto. */
  async eliminarHorario(id: string): Promise<void> {
    const { error } = await this.supa.client
      .from('horarios_especialista')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[HorariosEspecialistaService] Error al eliminar horario', error);
      throw error;
    }
  }

  /**
   * Elimina todos los horarios de un especialista (útil para resetear “Mis horarios”).
   */
  async eliminarHorariosDeEspecialista(especialistaId: string): Promise<void> {
    const { error } = await this.supa.client
      .from('horarios_especialista')
      .delete()
      .eq('especialista_id', especialistaId);

    if (error) {
      console.error('[HorariosEspecialistaService] Error al eliminar horarios de especialista', error);
      throw error;
    }
  }

  /**
   * Helper opcional: reemplaza todos los horarios de un especialista
   * por una nueva lista (ej. al guardar “Mis horarios” de una).
   */
  async reemplazarHorariosDeEspecialista(
    especialistaId: string,
    nuevosHorarios: HorarioEspecialistaCreate[],
  ): Promise<void> {

    // 1) Borrar todos los horarios actuales
    await this.eliminarHorariosDeEspecialista(especialistaId);

    if (!nuevosHorarios.length) {
      return;
    }

    // 2) Insertar los nuevos, asegurando que todos tienen especialista_id correcto
    const filas = nuevosHorarios.map(h => ({
      ...h,
      especialista_id: especialistaId,
    }));

    const { error } = await this.supa.client
      .from('horarios_especialista')
      .insert(filas);

    if (error) {
      console.error('[HorariosEspecialistaService] Error al insertar nuevos horarios', error);
      throw error;
    }
  }
}

