import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { LogIngresoTipo } from '../app/models/tipos.model';
import { LogIngreso, LogIngresoCreate } from '../app/models/log-ingresos.model';

@Injectable({ providedIn: 'root' })
export class LogIngresosService {

  constructor(
    private readonly supa: SupabaseService,
  ) {}

  /**
   * Registra un ingreso (por defecto LOGIN) para el usuario autenticado.
   * Si no hay usuario logueado, no hace nada pero loguea un warning.
   */
  async registrarIngreso(tipo: LogIngresoTipo = 'LOGIN'): Promise<void> {
    try {
      const { data, error } = await this.supa.obtenerUsuarioActual();

      if (error || !data?.user) {
        console.warn('[LogIngresosService] No hay usuario autenticado para registrar ingreso', error);
        return;
      }

      const user = data.user;

      const payload: LogIngresoCreate = {
        usuario_id: user.id,
        tipo,
        ip: null,                        // desde frontend es complicado obtener IP real
        user_agent: navigator.userAgent, // al menos registramos el user agent
      };

      const { error: insertError } = await this.supa.client
        .from('log_ingresos')
        .insert(payload);

      if (insertError) {
        console.error('[LogIngresosService] Error al insertar log de ingreso', insertError);
      }
    } catch (e) {
      console.error('[LogIngresosService] Excepción al registrar ingreso', e);
    }
  }

  /**
   * Obtiene logs de ingresos, con filtros opcionales para admin.
   */
  async obtenerLogIngresos(params?: {
    usuarioId?: string;
    desde?: string;  // ISO
    hasta?: string;  // ISO
    tipo?: LogIngresoTipo;
    limite?: number;
  }): Promise<{ data: LogIngreso[]; error: any | null }> {

    let query = this.supa.client
      .from('log_ingresos')
      .select('*')
      .order('fecha_hora', { ascending: false });

    if (params?.usuarioId) {
      query = query.eq('usuario_id', params.usuarioId);
    }
    if (params?.tipo) {
      query = query.eq('tipo', params.tipo);
    }
    if (params?.desde) {
      query = query.gte('fecha_hora', params.desde);
    }
    if (params?.hasta) {
      query = query.lte('fecha_hora', params.hasta);
    }
    if (params?.limite && params.limite > 0) {
      query = query.limit(params.limite);
    }

    const { data, error } = await query;

    return {
      data: (data ?? []) as LogIngreso[],
      error,
    };
  }

}
