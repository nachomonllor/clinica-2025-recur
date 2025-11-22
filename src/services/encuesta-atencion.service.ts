import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EncuestaAtencion, EncuestaAtencionCreate, EncuestaAtencionUpdate } from '../app/models/encuesta-atencion.model';

@Injectable({ providedIn: 'root' })
export class EncuestaAtencionService {

  constructor(
    private readonly supa: SupabaseService,
  ) {}

  /**
   * Devuelve la encuesta asociada a un turno (si existe).
   * Recordá que turno_id es UNIQUE en la tabla.
   */
  async obtenerPorTurno(turnoId: string): Promise<EncuestaAtencion | null> {
    const { data, error } = await this.supa.client
      .from('encuestas_atencion')
      .select('*')
      .eq('turno_id', turnoId)
      .maybeSingle();

    if (error) {
      console.error('[EncuestaAtencionService] Error al obtener encuesta por turno', error);
      throw error;
    }

    return data as EncuestaAtencion | null;
  }

  /**
   * Lista encuestas de un especialista (para estadísticas / reseñas).
   */
  async listarPorEspecialista(opciones: {
    especialistaId: string;
    desde?: string;
    hasta?: string;
    limite?: number;
  }): Promise<EncuestaAtencion[]> {

    let query = this.supa.client
      .from('encuestas_atencion')
      .select('*')
      .eq('especialista_id', opciones.especialistaId)
      .order('fecha_respuesta', { ascending: false });

    if (opciones.desde) {
      query = query.gte('fecha_respuesta', opciones.desde);
    }
    if (opciones.hasta) {
      query = query.lte('fecha_respuesta', opciones.hasta);
    }
    if (opciones.limite && opciones.limite > 0) {
      query = query.limit(opciones.limite);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[EncuestaAtencionService] Error al listar encuestas por especialista', error);
      throw error;
    }

    return (data ?? []) as EncuestaAtencion[];
  }

  /**
   * Lista encuestas completadas por un paciente (por si querés un historial).
   */
  async listarPorPaciente(opciones: {
    pacienteId: string;
    desde?: string;
    hasta?: string;
    limite?: number;
  }): Promise<EncuestaAtencion[]> {

    let query = this.supa.client
      .from('encuestas_atencion')
      .select('*')
      .eq('paciente_id', opciones.pacienteId)
      .order('fecha_respuesta', { ascending: false });

    if (opciones.desde) {
      query = query.gte('fecha_respuesta', opciones.desde);
    }
    if (opciones.hasta) {
      query = query.lte('fecha_respuesta', opciones.hasta);
    }
    if (opciones.limite && opciones.limite > 0) {
      query = query.limit(opciones.limite);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[EncuestaAtencionService] Error al listar encuestas por paciente', error);
      throw error;
    }

    return (data ?? []) as EncuestaAtencion[];
  }

  /**
   * Crea una encuesta nueva.
   * OJO: si ya existe una encuesta para ese turno, va a tirar error
   * por la UNIQUE(turno_id). Para comportamiento "reemplazar", usá guardarEncuestaParaTurno().
   */
  async crearEncuesta(payload: EncuestaAtencionCreate): Promise<EncuestaAtencion> {
    const { data, error } = await this.supa.client
      .from('encuestas_atencion')
      .insert(payload)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[EncuestaAtencionService] Error al crear encuesta', error);
      throw error;
    }

    return data as EncuestaAtencion;
  }

  /**
   * Crea o actualiza la encuesta para un turno (UPSET por turno_id).
   * Ideal para el formulario del paciente: si vuelve a enviar, se actualiza.
   */
  async guardarEncuestaParaTurno(input: {
    turnoId: string;
    pacienteId: string;
    especialistaId: string;
    valores: Omit<EncuestaAtencionCreate, 'id' | 'turno_id' | 'paciente_id' | 'especialista_id'>;
  }): Promise<EncuestaAtencion> {

    const payload: EncuestaAtencionCreate = {
      turno_id: input.turnoId,
      paciente_id: input.pacienteId,
      especialista_id: input.especialistaId,
      ...input.valores,
    };

    const { data, error } = await this.supa.client
      .from('encuestas_atencion')
      .upsert(payload, { onConflict: 'turno_id' }) // UNIQUE(turno_id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[EncuestaAtencionService] Error al guardar encuesta para turno', error);
      throw error;
    }

    return data as EncuestaAtencion;
  }

  /** Actualiza campos de una encuesta existente (por id). */
  async actualizarEncuesta(id: string, cambios: EncuestaAtencionUpdate): Promise<EncuestaAtencion> {
    const { data, error } = await this.supa.client
      .from('encuestas_atencion')
      .update(cambios)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[EncuestaAtencionService] Error al actualizar encuesta', error);
      throw error;
    }

    return data as EncuestaAtencion;
  }

  /** Elimina la encuesta asociada a un turno (si existiese). */
  async eliminarPorTurno(turnoId: string): Promise<void> {
    const { error } = await this.supa.client
      .from('encuestas_atencion')
      .delete()
      .eq('turno_id', turnoId);

    if (error) {
      console.error('[EncuestaAtencionService] Error al eliminar encuesta por turno', error);
      throw error;
    }
  }
}

