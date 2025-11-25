// src/app/services/turnos.service.ts

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EstadoTurno } from '../app/models/estado-turno.model';
import { EstadoTurnoCodigo } from '../app/models/tipos.model';
import { mapEstadoCodigoToUI, Turno, TurnoCreate, TurnoUpdate, TurnoVM } from '../app/models/turno.model';

import { from, map, Observable } from 'rxjs';
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

  // async crearTurno(payload: TurnoCreate): Promise<Turno> {
  //   const { data, error } = await this.supa.client
  //     .from('turnos')
  //     .insert(payload as any)
  //     .select('*')
  //     .single();

  //   if (error) {
  //     console.error('[TurnosService] Error al crear turno', error);
  //     throw error;
  //   }

  //   return data as Turno;
  // }

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
        // La reseña solo existe si hay un comentario no vacío (del especialista al finalizar)
        resena: (t.comentario && String(t.comentario).trim().length > 0) ? String(t.comentario).trim() : null
      };
    });
  }


  // -----------------------  ----------------------------------------------------          

  /** Turnos del paciente actual mapeados a TurnoVM (para Mis turnos paciente) */
  getTurnosPacienteVM$(): Observable<TurnoVM[]> {
    return from(this.obtenerTurnosPacienteVM());
  }

  private async obtenerTurnosPacienteVM(): Promise<TurnoVM[]> {
    // 1) Sesión actual → paciente_id
    const { data: sessionData, error: sessionError } = await this.supa.getSession();
    if (sessionError) {
      console.error('[TurnosService] Error obteniendo sesión', sessionError);
      throw sessionError;
    }

    const pacienteId = sessionData?.session?.user?.id;
    if (!pacienteId) {
      console.warn('[TurnosService] No hay paciente logueado');
      return [];
    }

    // 2) Turnos del paciente (solo columnas necesarias)
    const { data: turnosData, error: turnosError } = await this.supa.client
      .from('turnos')
      .select(`
        id,
        paciente_id,
        especialista_id,
        especialidad_id,
        estado_turno_id,
        fecha_hora_inicio,
        motivo,
        comentario
      `)
      .eq('paciente_id', pacienteId)
      .order('fecha_hora_inicio', { ascending: false });

    if (turnosError) {
      console.error('[TurnosService] Error al obtener turnos del paciente', turnosError);
      throw turnosError;
    }

    const turnos = (turnosData ?? []) as any[];
    if (!turnos.length) return [];

    // 3) Armar sets de IDs para mapear nombres, especialidades, estados y encuestas
    const especialistaIds = Array.from(
      new Set(turnos.map(t => t.especialista_id).filter(Boolean))
    ) as string[];

    const especialidadIds = Array.from(
      new Set(turnos.map(t => t.especialidad_id).filter(Boolean))
    ) as string[];

    const estadoIds = Array.from(
      new Set(turnos.map(t => t.estado_turno_id).filter(Boolean))
    ) as string[];

    const turnoIds = turnos.map(t => t.id as string);

    // 4) Cargar mapas auxiliares en paralelo
    const [
      { data: usuariosData },
      { data: especialidadesData },
      { data: estadosData },
      { data: encuestasData }
    ] = await Promise.all([
      especialistaIds.length
        ? this.supa.client.from('usuarios')
          .select('id, nombre, apellido')
          .in('id', especialistaIds)
        : Promise.resolve({ data: [] as any[], error: null }),

      especialidadIds.length
        ? this.supa.client.from('especialidades')
          .select('id, nombre')
          .in('id', especialidadIds)
        : Promise.resolve({ data: [] as any[], error: null }),

      estadoIds.length
        ? this.supa.client.from('estados_turno')
          .select('id, codigo')
          .in('id', estadoIds)
        : Promise.resolve({ data: [] as any[], error: null }),

      turnoIds.length
        ? this.supa.client.from('encuestas_atencion')
          .select('turno_id, estrellas')
          .in('turno_id', turnoIds)
        : Promise.resolve({ data: [] as any[], error: null })
    ]);

    const usuariosMap = new Map<string, { nombre: string | null; apellido: string | null }>();
    (usuariosData ?? []).forEach((u: any) =>
      usuariosMap.set(u.id, { nombre: u.nombre ?? null, apellido: u.apellido ?? null })
    );

    const especialidadesMap = new Map<string, string>();
    (especialidadesData ?? []).forEach((e: any) =>
      especialidadesMap.set(e.id, e.nombre ?? 'Sin especialidad')
    );

    const estadosMap = new Map<string, string>();
    (estadosData ?? []).forEach((e: any) =>
      estadosMap.set(e.id, e.codigo ?? 'PENDIENTE')
    );

    const encuestasMap = new Map<string, number | null>();
    (encuestasData ?? []).forEach((e: any) =>
      encuestasMap.set(e.turno_id, e.estrellas ?? null)
    );

    // 5) Mapear a TurnoVM
    return turnos.map((t): TurnoVM => {
      const fecha = new Date(t.fecha_hora_inicio);
      const hora = fecha.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const especialistaInfo = usuariosMap.get(t.especialista_id) || null;
      const especialistaNombre = especialistaInfo
        ? `${especialistaInfo.apellido ?? ''} ${especialistaInfo.nombre ?? ''}`.trim() || 'Especialista'
        : 'Especialista';

      const especialidadNombre =
        especialidadesMap.get(t.especialidad_id) ?? 'Sin especialidad';

      const codigoEstado = estadosMap.get(t.estado_turno_id) ?? 'PENDIENTE';
      const estadoUI = mapEstadoCodigoToUI(codigoEstado);

      const estrellas = encuestasMap.get(t.id) ?? null;

      return {
        id: t.id,
        fecha,
        hora,
        especialidad: especialidadNombre,
        especialista: especialistaNombre,
        estado: estadoUI,
        historiaBusqueda: t.motivo ?? null,
        // La reseña solo existe si hay un comentario no vacío (del especialista al finalizar)
        resena: (t.comentario && String(t.comentario).trim().length > 0) ? String(t.comentario).trim() : null,
        encuesta: estrellas != null,
        calificacion: estrellas ?? undefined
      };
    });
  }

  /** Marca un turno como CANCELADO en la tabla turnos */
  cancelarTurno(turnoId: string): Observable<void> {
    return from(
      this.supa.client
        .from('turnos')
        .update({ estado_turno_id: null, /* opcional: columna texto si la tenés */ })
        .eq('id', turnoId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('[TurnosService] Error al cancelar turno', error);
          throw error;
        }
        return;
      })
    );
  }
  
}





