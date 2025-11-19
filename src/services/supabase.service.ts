
import {
  createClient,
  type SupabaseClient,
  type AuthChangeEvent,
  type Session,
  type User as SupaUser,
  type AuthResponse,     // <===
  type UserResponse      //  <===
} from '@supabase/supabase-js';
import { Injectable } from '@angular/core';


// Si usás tipos de perfil en tu app:
import type { PerfilInsert, PerfilRow } from '../models/perfil.model';
import { environment } from '../environments/environment';

/** Evitar múltiples instancias en dev/HMR */

// declare global {
//   interface Window { __supabaseClinica__: SupabaseClient | undefined }
// }

@Injectable({ providedIn: 'root' })
export class SupabaseService {

  private _client: SupabaseClient;

  constructor() {

    this._client = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage,
        // En algunas versiones no existe en typings; igual lo pasan al runtime:
        // @ts-expect-error - no siempre tipado en supabase-js
        multiTab: false,
        storageKey: 'sb-clinica-online-auth-2025',
      },
    });

   // window.__supabaseClinica__ = this._client;

  }

  get client(): SupabaseClient {
    return this._client;
  }

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

  onAuthChange(cb: (event: AuthChangeEvent, session: Session | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((event, session) => cb(event, session));
    return () => data.subscription.unsubscribe();
  }

  async obtenerPerfil(userId: string) {
    // columnas reales en `perfiles`
    const cols = 'id, rol, aprobado, nombre, apellido, email, avatar_url, imagen2_url';

    const { data, error } = await this.client
      .from('perfiles')
      .select(cols)
      .eq('id', userId)
      .maybeSingle();

    return { data, error };
  }


  async upsertPerfil(perfil: PerfilInsert): Promise<{ data: PerfilRow | null; error: any }> {
    const { data, error } = await this.client
      .from('perfiles')
      .upsert(perfil, { onConflict: 'id' })
      .select('*')
      .single();
    return { data: data as PerfilRow | null, error };
  }

  /* ========================= STORAGE ========================= */

  async uploadAvatar(userId: string, file: File, idx: 1 | 2): Promise<string> {
    const path = `${userId}/${Date.now()}_${idx}_${file.name}`;

    // Subir archivo
    const { data: uploadData, error: uploadError } = await this.client.storage
      .from('avatars')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Obtener URL pública
    const { data: pubData } = this.client.storage
      .from('avatars')
      .getPublicUrl(path);

    const publicUrl = pubData.publicUrl;

    if (!publicUrl) {
      throw new Error('No se pudo obtener la URL pública de la imagen');
    }

    return publicUrl;
  }

  /* ========================= Acceso directo (alias opcional) ========================= */

  /** this.supa.sdk en vez de this.supa.client */
  get sdk(): SupabaseClient {
    return this.client;
  }


}







