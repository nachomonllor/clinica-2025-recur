// src/services/estadisticas.service.ts
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';

import { SupabaseService } from './supabase.service';

import { Turno } from '../app/models/turno.model';
import { EstadoTurno } from '../app/models/estado-turno.model';
import { Especialidad } from '../app/models/especialidad.model';
import { EncuestaAtencion } from '../app/models/encuesta-atencion.model';
import { Usuario } from '../app/models/usuario.model';

import {
    EstadisticaIngresosPorDia,
    EstadisticaPromedioEstrellasPorEspecialista,
    EstadisticaTurnosPorDia,
    EstadisticaTurnosPorEspecialidad,
    EstadisticaTurnosPorEstado,
    EstadisticaTurnosPorMedico,
    PerfilBasico,
    TurnoEstadistica
} from '../app/models/estadistica.model';

@Injectable({ providedIn: 'root' })
export class EstadisticasService {

    constructor(
        private readonly supa: SupabaseService,
    ) { }

    // =======================================================
    // TURNOS POR DÍA
    // =======================================================

    async obtenerTurnosPorDia(filtros?: {
        desde?: string;
        hasta?: string;
        soloFinalizados?: boolean;
    }): Promise<EstadisticaTurnosPorDia[]> {

        let query = this.supa.client
            .from('turnos')
            .select(`
        id,
        fecha_hora_inicio,
        estado:estados_turno!fk_turno_estado ( codigo )
      `);

        if (filtros?.desde) {
            query = query.gte('fecha_hora_inicio', filtros.desde);
        }
        if (filtros?.hasta) {
            query = query.lte('fecha_hora_inicio', filtros.hasta);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[EstadisticasService] Error al obtener turnos por día', error);
            throw error;
        }

        const rows = (data ?? []) as any[];

        const conteoPorDia = new Map<string, number>();

        for (const t of rows) {
            const fechaIso: string | null = t.fecha_hora_inicio;
            if (!fechaIso) continue;

            const estadoCodigo: string = t.estado?.codigo ?? '';

            if (filtros?.soloFinalizados && estadoCodigo !== 'FINALIZADO') {
                continue;
            }

            const dia = fechaIso.slice(0, 10); // yyyy-mm-dd
            conteoPorDia.set(dia, (conteoPorDia.get(dia) ?? 0) + 1);
        }

        const resultado: EstadisticaTurnosPorDia[] = [];
        for (const [fecha, cantidad] of conteoPorDia.entries()) {
            resultado.push({ fecha, cantidad });
        }

        resultado.sort((a, b) => a.fecha.localeCompare(b.fecha));

        return resultado;
    }

    /** Wrapper observable que usan los componentes de charts */
    turnosPorDia(
        desde?: string,
        hasta?: string,
        soloFinalizados?: boolean
    ): Observable<EstadisticaTurnosPorDia[]> {
        return from(
            this.obtenerTurnosPorDia({ desde, hasta, soloFinalizados })
        );
    }

    // =======================================================
    // TURNOS POR ESTADO
    // =======================================================

    async obtenerTurnosPorEstado(filtros?: {
        desde?: string;
        hasta?: string;
        especialistaId?: string;
        pacienteId?: string;
    }): Promise<EstadisticaTurnosPorEstado[]> {

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

        const conteoPorEstado = new Map<string, number>();
        for (const t of turnos) {
            const key = t.estado_turno_id;
            conteoPorEstado.set(key, (conteoPorEstado.get(key) ?? 0) + 1);
        }

        const idsEstado = Array.from(conteoPorEstado.keys());

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

        resultado.sort((a, b) => b.cantidad - a.cantidad);

        return resultado;
    }

    turnosPorEstado(filtros?: {
        desde?: string;
        hasta?: string;
        especialistaId?: string;
        pacienteId?: string;
    }): Observable<EstadisticaTurnosPorEstado[]> {
        return from(this.obtenerTurnosPorEstado(filtros));
    }

    // =======================================================
    // TURNOS POR ESPECIALIDAD
    // =======================================================

    async obtenerTurnosPorEspecialidad(filtros?: {
        desde?: string;
        hasta?: string;
    }): Promise<EstadisticaTurnosPorEspecialidad[]> {

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

        const conteoPorEsp = new Map<string, number>();
        for (const t of turnos) {
            const key = t.especialidad_id;
            conteoPorEsp.set(key, (conteoPorEsp.get(key) ?? 0) + 1);
        }

        const idsEspecialidad = Array.from(conteoPorEsp.keys());

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

    turnosPorEspecialidad(
        desde?: string,
        hasta?: string
    ): Observable<EstadisticaTurnosPorEspecialidad[]> {
        return from(this.obtenerTurnosPorEspecialidad({ desde, hasta }));
    }

    // // Perfiles básicos por id, para mostrar nombres en gráficos
    // async obtenerPerfiles(ids: string[]): Promise<Map<string, PerfilBasico>> {
    //     const mapa = new Map<string, PerfilBasico>();

    //     if (!ids || !ids.length) {
    //         return mapa;
    //     }

    //     const { data, error } = await this.supa.client
    //         .from('perfiles')
    //         .select('id, nombre, apellido, email, created_at, updated_at')
    //         .in('id', ids);

    //     if (error) {
    //         console.error('[EstadisticasService] Error al obtener perfiles', error);
    //         throw error;
    //     }

    //     (data ?? []).forEach((row: any) => {
    //         mapa.set(row.id, {
    //             id: row.id,
    //             nombre: row.nombre ?? null,
    //             apellido: row.apellido ?? null,
    //             email: row.email ?? null,
    //             created_at: row.created_at ?? null,
    //             updated_at: row.updated_at ?? null
    //         });
    //     });

    //     return mapa;
    // }

    // Perfiles básicos por id, para mostrar nombres en gráficos
    async obtenerPerfiles(ids: string[]): Promise<Map<string, PerfilBasico>> {
        const mapa = new Map<string, PerfilBasico>();

        if (!ids || !ids.length) {
            return mapa;
        }

        // CAMBIO =========>>  ahora leemos de esquema_clinica.usuarios en vez de 'perfiles'
        const { data, error } = await this.supa.client
            .from('usuarios')
            .select('id, nombre, apellido, email, fecha_registro')
            .in('id', ids);

        if (error) {
            console.error('[EstadisticasService] Error al obtener perfiles/usuarios', error);
            throw error;
        }

        (data ?? []).forEach((row: any) => {
            mapa.set(row.id, {
                id: row.id,
                nombre: row.nombre ?? null,
                apellido: row.apellido ?? null,
                email: row.email ?? null,
                // El modelo Estadistica.PerfilBasico espera created_at / updated_at:
                // usamos fecha_registro como created_at y dejamos updated_at igual o null.
                created_at: row.fecha_registro ?? null,
                updated_at: row.fecha_registro ?? null
            });
        });

        return mapa;
    }

    // =======================================================
    // INGRESOS POR DÍA (log_ingresos)
    // =======================================================
    async obtenerIngresosPorDia(filtros?: {
        desde?: string;
        hasta?: string;
        usuarioId?: string;
        tipo?: string;
    }): Promise<EstadisticaIngresosPorDia[]> {

        // Tipo mínimo que realmente devuelve esta consulta
        type LogRow = {
            fecha_hora: string;
            usuario_id: string | null;
            tipo: string | null;
        };

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

        const logs = (data ?? []) as LogRow[];

        const conteoPorDia = new Map<string, number>();

        for (const log of logs) {
            const fechaIso = log.fecha_hora;
            if (!fechaIso) continue;

            const dia = fechaIso.slice(0, 10); // yyyy-mm-dd
            conteoPorDia.set(dia, (conteoPorDia.get(dia) ?? 0) + 1);
        }

        const resultado: EstadisticaIngresosPorDia[] = [];
        for (const [fecha, cantidad] of conteoPorDia.entries()) {
            resultado.push({ fecha, cantidad });
        }

        // Orden cronológico ascendente
        resultado.sort((a, b) => a.fecha.localeCompare(b.fecha));

        return resultado;
    }

    // =======================================================
    // LOGS DE INGRESO PARA DASHBOARD
    // Devuelve "PerfilBasico" con created/updated = fecha de ingreso
    // =======================================================
    async obtenerLogsDeIngreso(limit = 200): Promise<PerfilBasico[]> {
        // 1) Traigo logs crudos
        const { data, error } = await this.supa.client
            .from('log_ingresos')
            .select('fecha_hora, usuario_id')
            .order('fecha_hora', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[EstadisticasService] Error al obtener log_ingresos', error);
            throw error;
        }

        const logs = (data ?? []) as { fecha_hora: string; usuario_id: string | null }[];

        // 2) Junto ids de usuario y traigo perfiles
        const ids = Array.from(new Set(logs.map(l => l.usuario_id).filter(Boolean))) as string[];
        const perfilesMap = await this.obtenerPerfiles(ids);

        // 3) Armo salida en forma de PerfilBasico "enriquecido" con la fecha del log
        const salida: PerfilBasico[] = logs.map(log => {
            const base = log.usuario_id ? perfilesMap.get(log.usuario_id) : undefined;
            const ts = log.fecha_hora ?? null;

            return {
                id: log.usuario_id ?? 'sin-id',
                nombre: base?.nombre ?? null,
                apellido: base?.apellido ?? null,
                email: base?.email ?? null,
                created_at: ts,
                updated_at: ts
            };
        });

        return salida;
    }

    ingresosPorDia(filtros?: {
        desde?: string;
        hasta?: string;
        usuarioId?: string;
        tipo?: string;
    }): Observable<EstadisticaIngresosPorDia[]> {
        return from(this.obtenerIngresosPorDia(filtros));
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

    promedioEstrellasPorEspecialista(
        desde?: string,
        hasta?: string
    ): Observable<EstadisticaPromedioEstrellasPorEspecialista[]> {
        return from(this.obtenerPromedioEstrellasPorEspecialista({ desde, hasta }));
    }


    // =======================================================
    // TURNOS CRUDOS PARA DASHBOARD
    // =======================================================
    async obtenerTurnos(): Promise<TurnoEstadistica[]> {
        const { data, error } = await this.supa.client
            .from('turnos')
            .select('id, especialista_id, especialidad, fecha_iso, estado, created_at');

        if (error) {
            console.error('[EstadisticasService] Error al obtener turnos', error);
            throw error;
        }

        return (data ?? []) as TurnoEstadistica[];
    }


    // =======================================================
    // TURNOS POR MÉDICO / ESPECIALISTA
    // =======================================================

    async obtenerTurnosPorMedico(filtros?: {
        desde?: string;
        hasta?: string;
        soloFinalizados?: boolean;
    }): Promise<EstadisticaTurnosPorMedico[]> {

        // 1) Traer turnos con info de estado
        let query = this.supa.client
            .from('turnos')
            .select(`
      especialista_id,
      fecha_hora_inicio,
      estado:estados_turno!fk_turno_estado ( codigo )
    `);

        if (filtros?.desde) {
            query = query.gte('fecha_hora_inicio', filtros.desde);
        }
        if (filtros?.hasta) {
            query = query.lte('fecha_hora_inicio', filtros.hasta);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[EstadisticasService] Error al obtener turnos por médico', error);
            throw error;
        }

        const rows = (data ?? []) as {
            especialista_id: string;
            fecha_hora_inicio: string;
            estado: { codigo?: string | null } | null;
        }[];

        // 2) Contar turnos por especialista
        const conteo = new Map<string, number>();

        for (const row of rows) {
            if (!row.especialista_id) continue;

            if (filtros?.soloFinalizados) {
                const cod = (row.estado?.codigo ?? '').toUpperCase();
                if (cod !== 'FINALIZADO') continue;
            }

            const key = row.especialista_id;
            conteo.set(key, (conteo.get(key) ?? 0) + 1);
        }

        if (!conteo.size) {
            return [];
        }

        const idsEspecialistas = Array.from(conteo.keys());

        // 3) Traer nombre y apellido de cada especialista
        const { data: usuariosData, error: usuariosError } = await this.supa.client
            .from('usuarios')                     // 👈 ajusta a tu tabla real si fuera necesario
            .select('id, nombre, apellido')
            .in('id', idsEspecialistas);

        if (usuariosError) {
            console.error('[EstadisticasService] Error al obtener usuarios para turnos por médico', usuariosError);
            throw usuariosError;
        }

        const usuarios = (usuariosData ?? []) as Usuario[];
        const usuarioPorId = new Map<string, Usuario>();
        for (const u of usuarios) {
            usuarioPorId.set(u.id, u);
        }

        // 4) Armar resultado tipado
        const resultado: EstadisticaTurnosPorMedico[] = [];

        for (const [especialista_id, cantidad] of conteo.entries()) {
            const info = usuarioPorId.get(especialista_id);
            resultado.push({
                especialista_id,
                nombre: info?.nombre ?? null,
                apellido: info?.apellido ?? null,
                cantidad
            });
        }

        // Ordenar por cantidad desc
        resultado.sort((a, b) => b.cantidad - a.cantidad);

        return resultado;
    }

    /**
     WRAPPER EN MODO OBSERVABLE ====> para que el componente pueda hacer .pipe(...).subscribe(...)
     */
    turnosPorMedico(
        desde?: string | null,
        hasta?: string | null,
        soloFinalizados?: boolean
    ): Observable<EstadisticaTurnosPorMedico[]> {
        const filtros: { desde?: string; hasta?: string; soloFinalizados?: boolean } = {};
        if (desde) filtros.desde = desde;
        if (hasta) filtros.hasta = hasta;
        if (soloFinalizados) filtros.soloFinalizados = soloFinalizados;
        return from(this.obtenerTurnosPorMedico(filtros));
    }

    // =======================================================
    // PACIENTES POR ESPECIALIDAD
    // =======================================================
    async obtenerPacientesPorEspecialidad(filtros?: {
        desde?: string;
        hasta?: string;
    }): Promise<{ especialidad: string; cantidad_pacientes: number }[]> {
        let query = this.supa.client
            .from('turnos')
            .select('paciente_id, especialidad_id');

        if (filtros?.desde) {
            query = query.gte('fecha_hora_inicio', filtros.desde);
        }
        if (filtros?.hasta) {
            query = query.lte('fecha_hora_inicio', filtros.hasta);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[EstadisticasService] Error al obtener turnos para pacientes por especialidad', error);
            throw error;
        }

        const turnos = (data ?? []) as { paciente_id: string; especialidad_id: string }[];

        // Agrupar por especialidad y contar pacientes únicos
        const pacientesPorEspecialidad = new Map<string, Set<string>>();

        for (const t of turnos) {
            if (!t.especialidad_id || !t.paciente_id) continue;
            if (!pacientesPorEspecialidad.has(t.especialidad_id)) {
                pacientesPorEspecialidad.set(t.especialidad_id, new Set());
            }
            pacientesPorEspecialidad.get(t.especialidad_id)!.add(t.paciente_id);
        }

        // Obtener nombres de especialidades
        const idsEspecialidad = Array.from(pacientesPorEspecialidad.keys());
        const { data: espData, error: espError } = await this.supa.client
            .from('especialidades')
            .select('id, nombre')
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

        const resultado: { especialidad: string; cantidad_pacientes: number }[] = [];

        for (const [espId, pacientesSet] of pacientesPorEspecialidad.entries()) {
            const esp = espPorId.get(espId);
            resultado.push({
                especialidad: esp?.nombre ?? 'Sin nombre',
                cantidad_pacientes: pacientesSet.size
            });
        }

        resultado.sort((a, b) => b.cantidad_pacientes - a.cantidad_pacientes);

        return resultado;
    }

    // =======================================================
    // MÉDICOS POR ESPECIALIDAD
    // =======================================================
    async obtenerMedicosPorEspecialidad(filtros?: {
        desde?: string;
        hasta?: string;
    }): Promise<{ especialidad: string; cantidad_medicos: number }[]> {
        let query = this.supa.client
            .from('turnos')
            .select('especialista_id, especialidad_id');

        if (filtros?.desde) {
            query = query.gte('fecha_hora_inicio', filtros.desde);
        }
        if (filtros?.hasta) {
            query = query.lte('fecha_hora_inicio', filtros.hasta);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[EstadisticasService] Error al obtener turnos para médicos por especialidad', error);
            throw error;
        }

        const turnos = (data ?? []) as { especialista_id: string; especialidad_id: string }[];

        // Agrupar por especialidad y contar médicos únicos
        const medicosPorEspecialidad = new Map<string, Set<string>>();

        for (const t of turnos) {
            if (!t.especialidad_id || !t.especialista_id) continue;
            if (!medicosPorEspecialidad.has(t.especialidad_id)) {
                medicosPorEspecialidad.set(t.especialidad_id, new Set());
            }
            medicosPorEspecialidad.get(t.especialidad_id)!.add(t.especialista_id);
        }

        // Obtener nombres de especialidades
        const idsEspecialidad = Array.from(medicosPorEspecialidad.keys());
        const { data: espData, error: espError } = await this.supa.client
            .from('especialidades')
            .select('id, nombre')
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

        const resultado: { especialidad: string; cantidad_medicos: number }[] = [];

        for (const [espId, medicosSet] of medicosPorEspecialidad.entries()) {
            const esp = espPorId.get(espId);
            resultado.push({
                especialidad: esp?.nombre ?? 'Sin nombre',
                cantidad_medicos: medicosSet.size
            });
        }

        resultado.sort((a, b) => b.cantidad_medicos - a.cantidad_medicos);

        return resultado;
    }

    // =======================================================
    // ENCUESTAS COMPLETAS
    // =======================================================
    async obtenerEncuestasCompletas(filtros?: {
        desde?: string;
        hasta?: string;
        especialistaId?: string;
    }): Promise<any[]> {
        let query = this.supa.client
            .from('encuestas_atencion')
            .select(`
                *,
                turno:turnos!fk_encuesta_turno (
                    especialidad:especialidades!fk_turno_especialidad ( nombre ),
                    fecha_hora_inicio
                ),
                paciente:usuarios!fk_encuesta_paciente ( nombre, apellido ),
                especialista:usuarios!fk_encuesta_especialista ( nombre, apellido )
            `);

        if (filtros?.desde) {
            query = query.gte('fecha_respuesta', filtros.desde);
        }
        if (filtros?.hasta) {
            query = query.lte('fecha_respuesta', filtros.hasta);
        }
        if (filtros?.especialistaId) {
            query = query.eq('especialista_id', filtros.especialistaId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[EstadisticasService] Error al obtener encuestas completas', error);
            throw error;
        }

        const encuestas = (data ?? []) as any[];

        return encuestas.map(e => ({
            id: e.id,
            turno_id: e.turno_id,
            paciente_id: e.paciente_id,
            especialista_id: e.especialista_id,
            fecha_respuesta: e.fecha_respuesta,
            comentario: e.comentario,
            estrellas: e.estrellas,
            respuesta_radio: e.respuesta_radio,
            respuesta_checkbox: e.respuesta_checkbox,
            valor_rango: e.valor_rango,
            especialista_nombre: e.especialista?.nombre ?? null,
            especialista_apellido: e.especialista?.apellido ?? null,
            paciente_nombre: e.paciente?.nombre ?? null,
            paciente_apellido: e.paciente?.apellido ?? null,
            especialidad: e.turno?.especialidad?.nombre ?? null,
            fecha_turno: e.turno?.fecha_hora_inicio ?? null
        }));
    }

    // =======================================================
    // TURNOS POR PACIENTE
    // =======================================================
    async obtenerTurnosPorPaciente(pacienteId: string): Promise<any[]> {
        const { data, error } = await this.supa.client
            .from('turnos')
            .select(`
                *,
                estado:estados_turno!fk_turno_estado ( codigo, descripcion ),
                especialidad:especialidades!fk_turno_especialidad ( nombre ),
                especialista:usuarios!fk_turno_especialista ( nombre, apellido )
            `)
            .eq('paciente_id', pacienteId)
            .order('fecha_hora_inicio', { ascending: false });

        if (error) {
            console.error('[EstadisticasService] Error al obtener turnos por paciente', error);
            throw error;
        }

        const turnos = (data ?? []) as any[];

        return turnos.map(t => ({
            id: t.id,
            fecha_hora_inicio: t.fecha_hora_inicio,
            fecha_hora_fin: t.fecha_hora_fin,
            estado: t.estado?.codigo ?? 'PENDIENTE',
            estado_descripcion: t.estado?.descripcion ?? null,
            especialidad: t.especialidad?.nombre ?? 'Sin especialidad',
            especialista_nombre: t.especialista?.nombre ?? null,
            especialista_apellido: t.especialista?.apellido ?? null,
            motivo: t.motivo,
            comentario: t.comentario
        }));
    }

    // En estadisticas.service.ts

    async obtenerResultadosEncuesta(especialistaId?: string) {
        let query = this.supa.client
            .from('encuestas_atencion')
            .select(`
        estrellas,
        
        comentario,
        respuesta_radio,
        valor_rango,
        fecha_respuesta,
        especialista:usuarios!fk_encuesta_especialista (nombre, apellido)
      `);

        if (especialistaId) {
            query = query.eq('especialista_id', especialistaId);
        }

        // Ordenar por fecha descendente (lo más nuevo primero)
        query = query.order('fecha_respuesta', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    // Método auxiliar para cargar la lista de especialistas (para el filtro)
    async obtenerListaEspecialistas() {
        const { data, error } = await this.supa.client
            .from('usuarios')
            .select('id, nombre, apellido')
            .eq('perfil', 'ESPECIALISTA');

        if (error) throw error;
        return data;
    }

}


