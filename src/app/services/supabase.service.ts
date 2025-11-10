// // src/app/services/supabase.service.ts
// import { Injectable } from '@angular/core';
// import {
//   createClient,
//   type SupabaseClient,
//   type AuthChangeEvent,
//   type Session,
//   type User as SupaUser,
// } from '@supabase/supabase-js';

import {
  createClient,
  type SupabaseClient,
  type AuthChangeEvent,
  type Session,
  type User as SupaUser,
  type AuthResponse,     // /////////-------------
  type UserResponse      //////////// ------------
} from '@supabase/supabase-js';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { PerfilInsert, PerfilRow } from '../../models/interfaces';

/** Evitar múltiples instancias en dev/HMR */
declare global {
  interface Window { __supabaseClinica__: SupabaseClient | undefined }
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {

  private _client: SupabaseClient;

  constructor() {
    this._client = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // necesario si usas verificación por email
      }
    });
  }

  get client(): SupabaseClient {
    return this._client;
  }


  // public readonly client: SupabaseClient;

  // constructor() {
  //   if (!window.__supabaseClinica__) {
  //     window.__supabaseClinica__ = createClient(
  //       environment.supabaseUrl,
  //       environment.supabaseKey,
  //       {
  //         auth: {
  //           persistSession: true,
  //           autoRefreshToken: true,
  //           detectSessionInUrl: true,
  //           // Estas 2 líneas evitan el "NavigatorLockAcquireTimeoutError"
  //           storage: localStorage,
  //           // @ts-expect-error: multiTab puede no existir en typings antiguos
  //           multiTab: false,
  //           // Clave de storage única para este proyecto (evita colisiones en localhost)
  //           storageKey: 'sb-clinica-online-auth-2025',
  //         },
  //       }
  //     );
  //   }
  //   this.client = window.__supabaseClinica__!;
  // }

  /* ========================= AUTH ========================= */

  // Devuelve { data, error } como Supabase
  iniciarSesion(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signInWithPassword({ email, password });
  }

  signUp(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signUp({ email, password });
  }

  cerrarSesion(): Promise<{ error: any | null }> {
    return this.client.auth.signOut();
  }

  // Devuelve { data: { user }, error }
  obtenerUsuarioActual(): Promise<UserResponse> {
    return this.client.auth.getUser();
  }

  // (opcional) Devuelve { data: { session }, error }
  getSession(): Promise<{ data: { session: Session | null }, error: any | null }> {
    return this.client.auth.getSession();
  }


  /* -----------------------------------------------------------------*/

  // async getSession(): Promise<Session | null> {
  //   const { data, error } = await this.client.auth.getSession();
  //   if (error) throw error;
  //   return data.session;
  // }

  onAuthChange(cb: (event: AuthChangeEvent, session: Session | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((event, session) => cb(event, session));
    return () => data.subscription.unsubscribe();
  }

  // async obtenerUsuarioActual(): Promise<SupaUser | null> {
  //   const { data, error } = await this.client.auth.getUser();
  //   if (error) {

  //     // cuando no hay sesión suele decir "Auth session missing!"
  //     if (String(error.message || '').toLowerCase().includes('session')) return null;
  //     throw error;
  //   }
  //   return data.user;
  // }

  // async iniciarSesion(email: string, password: string) {
  //   const { data, error } = await this.client.auth.signInWithPassword({ email, password });
  //   if (error) throw error;
  //   return data; // { user, session }
  // }

  // async signUp(email: string, password: string) {
  //   const { data, error } = await this.client.auth.signUp({ email, password });
  //   if (error) throw error;
  //   return data;
  // }

  // async cerrarSesion(): Promise<void> {
  //   const { error } = await this.client.auth.signOut();
  //   if (error) throw error;
  // }

  /* ========================= PROFILES ========================= */

  // async obtenerPerfil(uid: string): Promise<{ data: PerfilRow | null; error: any }> {
  //   const { data, error } = await this.client
  //     .from('profiles')
  //     .select('id, rol, aprobado, nombre, apellido, email, avatar_url')
  //     .eq('id', uid)
  //     .single();
  //   return { data: data as PerfilRow | null, error };
  // }

  async obtenerPerfil(uid: string) {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, rol, aprobado, nombre, apellido, avatar_url') // /////
      .eq('id', uid)
      .single();
    return { data, error };
  }

  async upsertPerfil(perfil: PerfilInsert): Promise<{ data: PerfilRow | null; error: any }> {
    const { data, error } = await this.client
      .from('profiles')
      .upsert(perfil, { onConflict: 'id' })
      .select('*')
      .single();
    return { data: data as PerfilRow | null, error };
  }

  /* ========================= STORAGE ========================= */

  async uploadAvatar(userId: string, file: File, idx: 1 | 2) {
    const path = `${userId}/${Date.now()}_${idx}_${file.name}`;
    const { error } = await this.client.storage.from('avatars').upload(path, file);
    if (error) throw error;
    const { data: pub } = this.client.storage.from('avatars').getPublicUrl(path);
    return pub.publicUrl as string;
  }

  /* ========================= Acceso directo (alias opcional) ========================= */

  /** this.supa.sdk en vez de this.supa.client */
  get sdk(): SupabaseClient {
    return this.client;
  }

  // TURNOS: lee por rango (usa la columna que tengas indexada: creado_el o fecha)
  async fetchTurnos(desde: Date, hasta: Date): Promise<any[]> {
    const d1 = desde.toISOString();
    const d2 = hasta.toISOString();
    const { data, error } = await this._client
      .from('turnos')
      .select('id, fecha, especialidad, especialista_id, especialista_nombre, paciente_id, estado, creado_el, finalizado_el')
      .gte('creado_el', d1)
      .lte('creado_el', d2);

    if (error) throw error;

    // Normalizo fechas a Date y nombres de campos simples
    return (data ?? []).map((r: any) => ({
      id: String(r.id),
      fecha: new Date(r.fecha),
      especialidad: r.especialidad || '',
      especialistaNombre: r.especialista_nombre || '',
      especialistaId: String(r.especialista_id || ''),
      pacienteId: String(r.paciente_id || ''),
      estado: String(r.estado || ''),
      creadoEl: new Date(r.creado_el),
      finalizadoEl: r.finalizado_el ? new Date(r.finalizado_el) : null,
    }));
  }

  // LOGINS/INGRESOS: lee por rango
  async fetchIngresos(desde: Date, hasta: Date): Promise<any[]> {
    const d1 = desde.toISOString();
    const d2 = hasta.toISOString();
    const { data, error } = await this._client
      .from('ingresos')
      .select('user_id, email, rol, timestamp')
      .gte('timestamp', d1)
      .lte('timestamp', d2);

    if (error) throw error;

    return (data ?? []).map((r: any) => ({
      userId: String(r.user_id || ''),
      email: r.email || '',
      rol: String(r.rol || ''),
      timestamp: new Date(r.timestamp),
    }));
  }


}






