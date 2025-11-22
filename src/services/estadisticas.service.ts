import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EstadoTurnoCodigo } from '../app/models/tipos.model';
import { Turno } from '../app/models/turno.model';
import { EstadoTurno } from '../app/models/estado-turno.model';
import { Especialidad } from '../app/models/especialidad.model';
import { LogIngreso } from '../app/models/log-ingresos.model';
import { EncuestaAtencion } from '../app/models/encuesta-atencion.model';
import { Usuario } from '../app/models/usuario.model';
import { EstadisticaIngresosPorDia, EstadisticaPromedioEstrellasPorEspecialista, EstadisticaTurnosPorEspecialidad, EstadisticaTurnosPorEstado } from '../app/models/estadistica.model';


@Injectable({ providedIn: 'root' })
export class EstadisticasService {

    constructor(
        private readonly supa: SupabaseService,
    ) { }

    // =======================================================
    // TURNOS POR ESTADO
    // =======================================================

    async obtenerTurnosPorEstado(filtros?: {
        desde?: string;
        hasta?: string;
        especialistaId?: string;
        pacienteId?: string;
    }): Promise<EstadisticaTurnosPorEstado[]> {

        // 1) Traer turnos filtrados (solo columnas necesarias)
        let query = this.supa.client
            .from('turnos')
            .select('id, estado_turno_id');

        if (filtros?.pacienteId) {
            query = query.eq('paciente_id', filtros.pacienteId);
        }
        if (filtros?.especialistaId) {
            query = query.eq('especialista_id', filtros.especialistaId);
        }
        if (filtros?.desde) {
            query = query.gte('fecha_hora_inicio', filtros.desde);
        }
        if (filtros?.hasta) {
            query = query.lte('fecha_hora_inicio', filtros.hasta);
        }

        const { data: turnosData, error: turnosError } = await query;

        if (turnosError) {
            console.error('[EstadisticasService] Error al obtener turnos para estadísticas', turnosError);
            throw turnosError;
        }

        const turnos = (turnosData ?? []) as Turno[];

        if (!turnos.length) {
            return [];
        }

        // 2) Agrupar por estado_turno_id
        const conteoPorEstado = new Map<string, number>();
        for (const t of turnos) {
            const key = t.estado_turno_id;
            conteoPorEstado.set(key, (conteoPorEstado.get(key) ?? 0) + 1);
        }

        const idsEstado = Array.from(conteoPorEstado.keys());

        // 3) Obtener info de estados_turno para mapear código/descripcion
        const { data: estadosData, error: estadosError } = await this.supa.client
            .from('estados_turno')
            .select('*')
            .in('id', idsEstado);

        if (estadosError) {
            console.error('[EstadisticasService] Error al obtener estados_turno', estadosError);
            throw estadosError;
        }

        const estados = (estadosData ?? []) as EstadoTurno[];
        const estadoPorId = new Map<string, EstadoTurno>();

        for (const e of estados) {
            estadoPorId.set(e.id, e);
        }

        const resultado: EstadisticaTurnosPorEstado[] = [];

        for (const [estadoId, cantidad] of conteoPorEstado.entries()) {
            const info = estadoPorId.get(estadoId);
            if (!info) continue;
            resultado.push({
                estado_turno_id: estadoId,
                codigo: info.codigo,
                descripcion: info.descripcion,
                cantidad,
            });
        }

        // Opcional: ordenar por cantidad desc
        resultado.sort((a, b) => b.cantidad - a.cantidad);

        return resultado;
    }

    // =======================================================
    // TURNOS POR ESPECIALIDAD
    // =======================================================

    async obtenerTurnosPorEspecialidad(filtros?: {
        desde?: string;
        hasta?: string;
    }): Promise<EstadisticaTurnosPorEspecialidad[]> {

        // 1) Traer turnos
        let query = this.supa.client
            .from('turnos')
            .select('id, especialidad_id');

        if (filtros?.desde) {
            query = query.gte('fecha_hora_inicio', filtros.desde);
        }
        if (filtros?.hasta) {
            query = query.lte('fecha_hora_inicio', filtros.hasta);
        }

        const { data: turnosData, error: turnosError } = await query;

        if (turnosError) {
            console.error('[EstadisticasService] Error al obtener turnos para especialidad', turnosError);
            throw turnosError;
        }

        const turnos = (turnosData ?? []) as Turno[];
        if (!turnos.length) return [];

        // 2) Agrupar por especialidad_id
        const conteoPorEsp = new Map<string, number>();
        for (const t of turnos) {
            const key = t.especialidad_id;
            conteoPorEsp.set(key, (conteoPorEsp.get(key) ?? 0) + 1);
        }

        const idsEspecialidad = Array.from(conteoPorEsp.keys());

        // 3) Obtener nombres de especialidades
        const { data: espData, error: espError } = await this.supa.client
            .from('especialidades')
            .select('*')
            .in('id', idsEspecialidad);

        if (espError) {
            console.error('[EstadisticasService] Error al obtener especialidades', espError);
            throw espError;
        }

        const especialidades = (espData ?? []) as Especialidad[];
        const espPorId = new Map<string, Especialidad>();
        for (const e of especialidades) {
            espPorId.set(e.id, e);
        }

        const resultado: EstadisticaTurnosPorEspecialidad[] = [];

        for (const [espId, cantidad] of conteoPorEsp.entries()) {
            const info = espPorId.get(espId);
            resultado.push({
                especialidad_id: espId,
                nombre_especialidad: info?.nombre ?? null,
                cantidad,
            });
        }

        resultado.sort((a, b) => b.cantidad - a.cantidad);

        return resultado;
    }

    // =======================================================
    // INGRESOS POR DÍA
    // =======================================================

    async obtenerIngresosPorDia(filtros?: {
        desde?: string;
        hasta?: string;
        usuarioId?: string;
        tipo?: string;
    }): Promise<EstadisticaIngresosPorDia[]> {

        let query = this.supa.client
            .from('log_ingresos')
            .select('fecha_hora, usuario_id, tipo');

        if (filtros?.usuarioId) {
            query = query.eq('usuario_id', filtros.usuarioId);
        }
        if (filtros?.tipo) {
            query = query.eq('tipo', filtros.tipo);
        }
        if (filtros?.desde) {
            query = query.gte('fecha_hora', filtros.desde);
        }
        if (filtros?.hasta) {
            query = query.lte('fecha_hora', filtros.hasta);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[EstadisticasService] Error al obtener log_ingresos', error);
            throw error;
        }

        const logs = (data ?? []) as LogIngreso[];

        const conteoPorDia = new Map<string, number>();

        for (const log of logs) {
            const fechaIso = log.fecha_hora;
            const dia = fechaIso.slice(0, 10); // yyyy-mm-dd
            conteoPorDia.set(dia, (conteoPorDia.get(dia) ?? 0) + 1);
        }

        const resultado: EstadisticaIngresosPorDia[] = [];
        for (const [fecha, cantidad] of conteoPorDia.entries()) {
            resultado.push({ fecha, cantidad });
        }

        resultado.sort((a, b) => a.fecha.localeCompare(b.fecha));

        return resultado;
    }

    // =======================================================
    // PROMEDIO ESTRELLAS POR ESPECIALISTA
    // =======================================================

    async obtenerPromedioEstrellasPorEspecialista(filtros?: {
        desde?: string;
        hasta?: string;
    }): Promise<EstadisticaPromedioEstrellasPorEspecialista[]> {

        let query = this.supa.client
            .from('encuestas_atencion')
            .select('especialista_id, estrellas, fecha_respuesta');

        if (filtros?.desde) {
            query = query.gte('fecha_respuesta', filtros.desde);
        }
        if (filtros?.hasta) {
            query = query.lte('fecha_respuesta', filtros.hasta);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[EstadisticasService] Error al obtener encuestas', error);
            throw error;
        }

        const encuestas = (data ?? []) as EncuestaAtencion[];

        // Agrupar por especialista_id
        const sumas = new Map<string, { suma: number; cantidad: number }>();

        for (const e of encuestas) {
            if (e.estrellas == null) continue;
            const key = e.especialista_id;
            const actual = sumas.get(key) ?? { suma: 0, cantidad: 0 };
            actual.suma += e.estrellas;
            actual.cantidad += 1;
            sumas.set(key, actual);
        }

        if (!sumas.size) {
            return [];
        }

        const idsEspecialistas = Array.from(sumas.keys());

        // Obtener nombres de especialistas
        const { data: usuariosData, error: usuariosError } = await this.supa.client
            .from('usuarios')
            .select('id, nombre, apellido')
            .in('id', idsEspecialistas);

        if (usuariosError) {
            console.error('[EstadisticasService] Error al obtener usuarios especialistas', usuariosError);
            throw usuariosError;
        }

        const usuarios = (usuariosData ?? []) as Usuario[];
        const usuarioPorId = new Map<string, Usuario>();
        for (const u of usuarios) {
            usuarioPorId.set(u.id, u);
        }

        const resultado: EstadisticaPromedioEstrellasPorEspecialista[] = [];

        for (const [id, { suma, cantidad }] of sumas.entries()) {
            const usr = usuarioPorId.get(id);
            resultado.push({
                especialista_id: id,
                nombre: usr?.nombre ?? null,
                apellido: usr?.apellido ?? null,
                promedio_estrellas: cantidad > 0 ? suma / cantidad : 0,
                cantidad_encuestas: cantidad,
            });
        }

        resultado.sort((a, b) => b.promedio_estrellas - a.promedio_estrellas);

        return resultado;
    }
}

