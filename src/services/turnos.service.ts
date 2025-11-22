// src/app/services/turnos.service.ts

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EstadoTurno } from '../app/models/estado-turno.model';
import { EstadoTurnoCodigo } from '../app/models/tipos.model';
import { Turno, TurnoCreate, TurnoUpdate } from '../app/models/turno.model';

import { from, Observable } from 'rxjs';
import { TurnoEspecialista } from '../app/models/turno-especialista.model';


@Injectable({ providedIn: 'root' })
export class TurnosService {

  // Cache simple en memoria para no golpear estados_turno todo el tiempo
  private estadosPorCodigo = new Map<EstadoTurnoCodigo, EstadoTurno>();

  constructor(
    private readonly supa: SupabaseService,
  ) { }

  /* ================= ESTADOS DE TURNO ================= */

  async listarEstadosTurno(): Promise<EstadoTurno[]> {
    const { data, error } = await this.supa.client
      .from('estados_turno')
      .select('*')
      .order('orden', { ascending: true });

    if (error) {
      console.error('[TurnosService] Error al listar estados_turno', error);
      throw error;
    }

    const estados = (data ?? []) as EstadoTurno[];

    // refrescamos cache
    this.estadosPorCodigo.clear();
    for (const e of estados) {
      this.estadosPorCodigo.set(e.codigo, e);
    }

    return estados;
  }

  async obtenerEstadoPorCodigo(codigo: EstadoTurnoCodigo): Promise<EstadoTurno | null> {
    // 1) cache
    const enCache = this.estadosPorCodigo.get(codigo);
    if (enCache) return enCache;

    // 2) DB
    const { data, error } = await this.supa.client
      .from('estados_turno')
      .select('*')
      .eq('codigo', codigo)
      .maybeSingle();

    if (error) {
      console.error('[TurnosService] Error al obtener estado_turno por código', error);
      throw error;
    }

    const estado = data as EstadoTurno | null;
    if (estado) this.estadosPorCodigo.set(estado.codigo, estado);
    return estado;
  }

  async obtenerEstadoIdPorCodigo(codigo: EstadoTurnoCodigo): Promise<string> {
    const estado = await this.obtenerEstadoPorCodigo(codigo);
    if (!estado) {
      throw new Error(`No se encontró estado_turno con código ${codigo}`);
    }
    return estado.id;
  }

  /* ================== CRUD BÁSICO DE TURNOS ================== */

  async obtenerTurnoPorId(id: string): Promise<Turno | null> {
    const { data, error } = await this.supa.client
      .from('turnos')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[TurnosService] Error al obtener turno por id', error);
      throw error;
    }

    return data as Turno | null;
  }

  async crearTurno(payload: TurnoCreate): Promise<Turno> {
    const { data, error } = await this.supa.client
      .from('turnos')
      .insert(payload)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[TurnosService] Error al crear turno', error);
      throw error;
    }

    return data as Turno;
  }

  /**
   * Atajo: crea un turno con estado PENDIENTE
   * (ideal para "Solicitar turno" del paciente).
   */
  async crearTurnoPendiente(params: {
    pacienteId: string;
    especialistaId: string;
    especialidadId: string;
    fechaHoraInicio: string;   // ISO
    fechaHoraFin: string;      // ISO
    motivo?: string | null;
  }): Promise<Turno> {
    const estadoId = await this.obtenerEstadoIdPorCodigo('PENDIENTE');

    const payload: TurnoCreate = {
      paciente_id: params.pacienteId,
      especialista_id: params.especialistaId,
      especialidad_id: params.especialidadId,
      estado_turno_id: estadoId,
      fecha_hora_inicio: params.fechaHoraInicio,
      fecha_hora_fin: params.fechaHoraFin,
      motivo: params.motivo ?? null,
      comentario: null,
    };

    return this.crearTurno(payload);
  }

  async actualizarTurno(id: string, cambios: TurnoUpdate): Promise<Turno> {
    const { data, error } = await this.supa.client
      .from('turnos')
      .update({
        ...cambios,
        fecha_ultima_actualizacion: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[TurnosService] Error al actualizar turno', error);
      throw error;
    }

    return data as Turno;
  }

  async eliminarTurno(id: string): Promise<void> {
    const { error } = await this.supa.client
      .from('turnos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[TurnosService] Error al eliminar turno', error);
      throw error;
    }
  }

  /* =============== CAMBIOS DE ESTADO DE TURNO =============== */

  /**
   * Cambia el estado de un turno (por código) y opcionalmente
   * registra un comentario (rechazo, cancelación, reseña final, etc.)
   */
  async cambiarEstadoPorCodigo(
    turnoId: string,
    codigo: EstadoTurnoCodigo,
    comentario?: string | null,
  ): Promise<Turno> {
    const estadoId = await this.obtenerEstadoIdPorCodigo(codigo);

    const cambios: TurnoUpdate = {
      estado_turno_id: estadoId,
      comentario: comentario ?? null,
    };

    return this.actualizarTurno(turnoId, cambios);
  }

  /* ================= LISTADOS POR ROL ================= */

  /**
   * Turnos de un paciente, con filtros opcionales.
   */
  async listarTurnosDePaciente(opciones: {
    pacienteId: string;
    desde?: string;  // ISO
    hasta?: string;  // ISO
    estadoId?: string;
  }): Promise<Turno[]> {
    let query = this.supa.client
      .from('turnos')
      .select('*')
      .eq('paciente_id', opciones.pacienteId)
      .order('fecha_hora_inicio', { ascending: true });

    if (opciones.estadoId) {
      query = query.eq('estado_turno_id', opciones.estadoId);
    }
    if (opciones.desde) {
      query = query.gte('fecha_hora_inicio', opciones.desde);
    }
    if (opciones.hasta) {
      query = query.lte('fecha_hora_inicio', opciones.hasta);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[TurnosService] Error al listar turnos de paciente', error);
      throw error;
    }

    return (data ?? []) as Turno[];
  }

  /**
   * Turnos de un especialista, con filtros opcionales.
   */
  async listarTurnosDeEspecialista(opciones: {
    especialistaId: string;
    desde?: string;
    hasta?: string;
    estadoId?: string;
    especialidadId?: string;
  }): Promise<Turno[]> {
    let query = this.supa.client
      .from('turnos')
      .select('*')
      .eq('especialista_id', opciones.especialistaId)
      .order('fecha_hora_inicio', { ascending: true });

    if (opciones.estadoId) {
      query = query.eq('estado_turno_id', opciones.estadoId);
    }
    if (opciones.especialidadId) {
      query = query.eq('especialidad_id', opciones.especialidadId);
    }
    if (opciones.desde) {
      query = query.gte('fecha_hora_inicio', opciones.desde);
    }
    if (opciones.hasta) {
      query = query.lte('fecha_hora_inicio', opciones.hasta);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[TurnosService] Error al listar turnos de especialista', error);
      throw error;
    }

    return (data ?? []) as Turno[];
  }

  /**
   * Listado “genérico” para admin.
   */
  async listarTurnosAdmin(filtros?: {
    pacienteId?: string;
    especialistaId?: string;
    especialidadId?: string;
    estadoId?: string;
    desde?: string;
    hasta?: string;
    limite?: number;
  }): Promise<Turno[]> {
    let query = this.supa.client
      .from('turnos')
      .select('*')
      .order('fecha_hora_inicio', { ascending: true });

    if (filtros?.pacienteId) {
      query = query.eq('paciente_id', filtros.pacienteId);
    }
    if (filtros?.especialistaId) {
      query = query.eq('especialista_id', filtros.especialistaId);
    }
    if (filtros?.especialidadId) {
      query = query.eq('especialidad_id', filtros.especialidadId);
    }
    if (filtros?.estadoId) {
      query = query.eq('estado_turno_id', filtros.estadoId);
    }
    if (filtros?.desde) {
      query = query.gte('fecha_hora_inicio', filtros.desde);
    }
    if (filtros?.hasta) {
      query = query.lte('fecha_hora_inicio', filtros.hasta);
    }
    if (filtros?.limite && filtros.limite > 0) {
      query = query.limit(filtros.limite);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[TurnosService] Error al listar turnos (admin)', error);
      throw error;
    }

    return (data ?? []) as Turno[];
  }


  /**
   * Devuelve los turnos del especialista logueado, ya mapeados a TurnoEspecialista
   * y ordenados por fecha descendente.
   */
  getTurnosEspecialista$(): Observable<TurnoEspecialista[]> {
    return from(this.cargarTurnosEspecialista());
  }

  private async cargarTurnosEspecialista(): Promise<TurnoEspecialista[]> {
    // 1) sesión actual
    const { data: sessionData, error: sessionError } = await this.supa.getSession();
    if (sessionError || !sessionData?.session?.user) {
      console.error('[TurnoService] No hay sesión de especialista', sessionError);
      return [];
    }

    const especialistaId = sessionData.session.user.id;

    // 2) query a turnos + joins mínimos para nombres
    const { data, error } = await this.supa.client
      .from('turnos')
      .select(`
        id,
        fecha_hora_inicio,
        fecha_hora_fin,
        comentario,
        estado_turno: estados_turno!fk_turno_estado ( codigo ),
        especialidad: especialidades!fk_turno_especialidad ( nombre ),
        paciente: usuarios!fk_turno_paciente ( nombre, apellido )
      `)
      .eq('especialista_id', especialistaId)
      .order('fecha_hora_inicio', { ascending: false });

    if (error) {
      console.error('[TurnoService] Error al obtener turnos especialista', error);
      return [];
    }

    const rows = (data ?? []) as any[];

    return rows.map((t): TurnoEspecialista => {
      const fechaISO: string = t.fecha_hora_inicio;
      const fecha = new Date(fechaISO);

      const pacienteNombre = t.paciente
        ? `${t.paciente.apellido ?? ''} ${t.paciente.nombre ?? ''}`.trim() || 'Paciente'
        : 'Paciente';

      const especialidadNombre =
        t.especialidad?.nombre ??
        t.especialidad ??
        'Sin especialidad';

      const estadoCodigo: string =
        (t.estado_turno?.codigo as string | undefined) ?? 'PENDIENTE';

      return {
        id: t.id,
        fechaISO,
        fecha: fecha.toLocaleDateString('es-AR'),
        hora: fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        especialidad: especialidadNombre,
        paciente: pacienteNombre,
        estado: estadoCodigo,
        historiaBusqueda: (t.comentario ?? '') as string,
        resena: t.comentario ?? null
      };
    });
  }

}

