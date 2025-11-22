// src/app/services/historia-clinica.service.ts

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { HistoriaClinica, HistoriaClinicaCreate, HistoriaClinicaUpdate, HistoriaDatoDinamico, HistoriaDatoDinamicoCreate, HistoriaDatoDinamicoUpdate } from '../app/models/historia-clinica.model';

/**
 * Tipo de conveniencia: una historia con sus datos dinámicos.
 * Si preferís, podés mover esto al archivo de modelos.
 */
export interface HistoriaClinicaConDatos extends HistoriaClinica {
  datos: HistoriaDatoDinamico[];
}

@Injectable({ providedIn: 'root' })
export class HistoriaClinicaService {

  constructor(
    private readonly supa: SupabaseService,
  ) {}

  /* ================= HISTORIA CLÍNICA ================= */

  /** Crea una historia clínica junto con sus datos dinámicos (opcional) */
  async crearHistoriaConDatos(input: {
    historia: HistoriaClinicaCreate;
    datos?: Omit<HistoriaDatoDinamicoCreate, 'historia_id'>[];
  }): Promise<HistoriaClinicaConDatos> {

    // 1) Insert de la historia
    const { data: historiaData, error: historiaError } = await this.supa.client
      .from('historia_clinica')
      .insert(input.historia)
      .select('*')
      .maybeSingle();

    if (historiaError) {
      console.error('[HistoriaClinicaService] Error al crear historia_clinica', historiaError);
      throw historiaError;
    }

    const historia = historiaData as HistoriaClinica;
    let datos: HistoriaDatoDinamico[] = [];

    // 2) Insert de datos dinámicos (si vinieron)
    if (input.datos && input.datos.length > 0) {
      const filas: HistoriaDatoDinamicoCreate[] = input.datos.map(d => ({
        ...d,
        historia_id: historia.id,
      }));

      const { data: datosData, error: datosError } = await this.supa.client
        .from('historia_datos_dinamicos')
        .insert(filas)
        .select('*');

      if (datosError) {
        console.error('[HistoriaClinicaService] Error al crear datos dinámicos', datosError);
        // NO hacemos rollback porque desde frontend no hay transacciones,
        // pero al menos devolvemos la historia principal.
        throw datosError;
      }

      datos = (datosData ?? []) as HistoriaDatoDinamico[];
    }

    return { ...historia, datos };
  }

  /** Actualiza solo los datos fijos de la historia clínica */
  async actualizarHistoria(id: string, cambios: HistoriaClinicaUpdate): Promise<HistoriaClinica> {
    const { data, error } = await this.supa.client
      .from('historia_clinica')
      .update(cambios)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[HistoriaClinicaService] Error al actualizar historia_clinica', error);
      throw error;
    }

    return data as HistoriaClinica;
  }

  /** Elimina una historia clínica (los datos dinámicos se borran por cascade) */
  async eliminarHistoria(id: string): Promise<void> {
    const { error } = await this.supa.client
      .from('historia_clinica')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[HistoriaClinicaService] Error al eliminar historia_clinica', error);
      throw error;
    }
  }

  /** Lista historias de un paciente, con filtros opcionales. */
  async listarHistoriasDePaciente(opciones: {
    pacienteId: string;
    desde?: string;
    hasta?: string;
    especialistaId?: string;
  }): Promise<HistoriaClinica[]> {
    let query = this.supa.client
      .from('historia_clinica')
      .select('*')
      .eq('paciente_id', opciones.pacienteId)
      .order('fecha_registro', { ascending: false });

    if (opciones.especialistaId) {
      query = query.eq('especialista_id', opciones.especialistaId);
    }
    if (opciones.desde) {
      query = query.gte('fecha_registro', opciones.desde);
    }
    if (opciones.hasta) {
      query = query.lte('fecha_registro', opciones.hasta);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[HistoriaClinicaService] Error al listar historias de paciente', error);
      throw error;
    }

    return (data ?? []) as HistoriaClinica[];
  }

  /** Lista historias registradas por un especialista. */
  async listarHistoriasDeEspecialista(opciones: {
    especialistaId: string;
    desde?: string;
    hasta?: string;
    pacienteId?: string;
  }): Promise<HistoriaClinica[]> {
    let query = this.supa.client
      .from('historia_clinica')
      .select('*')
      .eq('especialista_id', opciones.especialistaId)
      .order('fecha_registro', { ascending: false });

    if (opciones.pacienteId) {
      query = query.eq('paciente_id', opciones.pacienteId);
    }
    if (opciones.desde) {
      query = query.gte('fecha_registro', opciones.desde);
    }
    if (opciones.hasta) {
      query = query.lte('fecha_registro', opciones.hasta);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[HistoriaClinicaService] Error al listar historias de especialista', error);
      throw error;
    }

    return (data ?? []) as HistoriaClinica[];
  }

  /* ================= DATOS DINÁMICOS ================= */

  /** Obtiene una historia + todos sus datos dinámicos. */
  async obtenerHistoriaConDatos(id: string): Promise<HistoriaClinicaConDatos | null> {
    const { data: histData, error: histError } = await this.supa.client
      .from('historia_clinica')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (histError) {
      console.error('[HistoriaClinicaService] Error al obtener historia_clinica', histError);
      throw histError;
    }

    if (!histData) {
      return null;
    }

    const historia = histData as HistoriaClinica;

    const { data: datosData, error: datosError } = await this.supa.client
      .from('historia_datos_dinamicos')
      .select('*')
      .eq('historia_id', id)
      .order('id', { ascending: true });

    if (datosError) {
      console.error('[HistoriaClinicaService] Error al obtener datos dinámicos', datosError);
      throw datosError;
    }

    const datos = (datosData ?? []) as HistoriaDatoDinamico[];

    return { ...historia, datos };
  }

  /** Agrega nuevos datos dinámicos a una historia ya existente. */
  async agregarDatosDinamicos(
    historiaId: string,
    nuevos: Omit<HistoriaDatoDinamicoCreate, 'historia_id'>[],
  ): Promise<HistoriaDatoDinamico[]> {

    if (!nuevos.length) return [];

    const filas: HistoriaDatoDinamicoCreate[] = nuevos.map(d => ({
      ...d,
      historia_id: historiaId,
    }));

    const { data, error } = await this.supa.client
      .from('historia_datos_dinamicos')
      .insert(filas)
      .select('*');

    if (error) {
      console.error('[HistoriaClinicaService] Error al insertar datos dinámicos', error);
      throw error;
    }

    return (data ?? []) as HistoriaDatoDinamico[];
  }

  /** Actualiza un dato dinámico puntual. */
  async actualizarDatoDinamico(
    id: string,
    cambios: HistoriaDatoDinamicoUpdate,
  ): Promise<HistoriaDatoDinamico> {
    const { data, error } = await this.supa.client
      .from('historia_datos_dinamicos')
      .update(cambios)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[HistoriaClinicaService] Error al actualizar dato dinámico', error);
      throw error;
    }

    return data as HistoriaDatoDinamico;
  }

  /** Elimina un dato dinámico puntual. */
  async eliminarDatoDinamico(id: string): Promise<void> {
    const { error } = await this.supa.client
      .from('historia_datos_dinamicos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[HistoriaClinicaService] Error al eliminar dato dinámico', error);
      throw error;
    }
  }
}

