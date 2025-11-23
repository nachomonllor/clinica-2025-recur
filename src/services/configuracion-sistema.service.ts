import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ConfiguracionSistema, ConfiguracionSistemaCreate, ConfiguracionSistemaUpdate } from '../app/models/configuracion-sistema.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracionSistemaService {

  constructor(
    private readonly supa: SupabaseService,
  ) {}

  /** Lista todas las claves de configuración. */
  async listarConfiguraciones(): Promise<ConfiguracionSistema[]> {
    const { data, error } = await this.supa.client
      .from('configuracion_sistema')
      .select('*')
      .order('clave', { ascending: true });

    if (error) {
      console.error('[ConfiguracionSistemaService] Error al listar configuraciones', error);
      throw error;
    }

    return (data ?? []) as ConfiguracionSistema[];
  }

  /** Obtiene una configuración por clave. */
  async obtenerConfiguracion(clave: string): Promise<ConfiguracionSistema | null> {
    const { data, error } = await this.supa.client
      .from('configuracion_sistema')
      .select('*')
      .eq('clave', clave)
      .maybeSingle();

    if (error) {
      console.error('[ConfiguracionSistemaService] Error al obtener configuración', error);
      throw error;
    }

    return data as ConfiguracionSistema | null;
  }

  /**
   * Crea una nueva clave de configuración.
   * Si ya existe, Supabase va a tirar error por PK.
   */
  async crearConfiguracion(payload: ConfiguracionSistemaCreate): Promise<ConfiguracionSistema> {
    const { data, error } = await this.supa.client
      .from('configuracion_sistema')
      .insert(payload)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[ConfiguracionSistemaService] Error al crear configuración', error);
      throw error;
    }

    return data as ConfiguracionSistema;
  }

  /**
   * Actualiza una configuración existente (por clave).
   */
  async actualizarConfiguracion(
    clave: string,
    cambios: ConfiguracionSistemaUpdate
  ): Promise<ConfiguracionSistema> {

    const { data, error } = await this.supa.client
      .from('configuracion_sistema')
      .update(cambios)
      .eq('clave', clave)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[ConfiguracionSistemaService] Error al actualizar configuración', error);
      throw error;
    }

    return data as ConfiguracionSistema;
  }

  /**
   * Crea o actualiza una configuración en una sola llamada (UPSERT).
   */
  async upsertConfiguracion(payload: ConfiguracionSistemaCreate): Promise<ConfiguracionSistema> {
    const { data, error } = await this.supa.client
      .from('configuracion_sistema')
      .upsert(payload, { onConflict: 'clave' })
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[ConfiguracionSistemaService] Error en upsert de configuración', error);
      throw error;
    }

    return data as ConfiguracionSistema;
  }

  /** Helper: lee la config 'captcha_habilitado' como boolean. */
  async isCaptchaHabilitado(): Promise<boolean> {
    const conf = await this.obtenerConfiguracion('captcha_habilitado');
    if (!conf || conf.valor_boolean === null || typeof conf.valor_boolean === 'undefined') {
      // default del script era true
      return true;
    }
    return !!conf.valor_boolean;
  }

  /** Helper: setea la config 'captcha_habilitado'. */
  async setCaptchaHabilitado(valor: boolean): Promise<ConfiguracionSistema> {
    return this.upsertConfiguracion({
      clave: 'captcha_habilitado',
      valor_boolean: valor,
    });
  }
}

