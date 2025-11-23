
// src/app/services/supabase.service.ts

import { Injectable } from '@angular/core';
import {
  AuthChangeEvent,
  AuthResponse,
  createClient,
  Session,
  SupabaseClient,
  UserResponse,
} from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { Usuario, UsuarioCreate } from '../app/models/usuario.model';


@Injectable({ providedIn: 'root' })
export class SupabaseService {

  // IMPORTANTÍSIMO: relajamos los genéricos para poder usar un schema distinto de "public"
  private readonly _client: SupabaseClient<any, any, any, any, any>;

  constructor() {
    this._client = createClient(environment.supabaseUrl, environment.supabaseKey, {
      // Usamos el schema de la clínica
      db: {
        schema: 'esquema_clinica',
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage,
        // @ts-expect-error - multiTab no siempre está tipado en supabase-js
        multiTab: false,
        storageKey: 'sb-clinica-online-auth-2025',
      },
    });
  }

  /** Client “oficial” a usar en el resto de la app */
  get client(): SupabaseClient<any, any, any, any, any> {
    return this._client;
  }

  /** Alias, por si preferís this.supa.sdk.from(...) */
  get sdk(): SupabaseClient<any, any, any, any, any> {
    return this._client;
  }

  /* =========================================================
   * AUTH (schema auth de Supabase)
   * ========================================================= */

  /** Login con email/contraseña (usa auth.signInWithPassword) */
  iniciarSesion(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signInWithPassword({ email, password });
  }

  /** Registro en Supabase Auth (NO crea fila en esquema_clinica.usuarios) */
  signUp(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signUp({ email, password });
  }

  /** Cierra la sesión actual */
  cerrarSesion(): Promise<{ error: any | null }> {
    return this.client.auth.signOut();
  }

  /** Devuelve el usuario actual de Auth (no el de la tabla usuarios) */
  obtenerUsuarioActual(): Promise<UserResponse> {
    return this.client.auth.getUser();
  }

  /** Devuelve la sesión actual (tokens, expiración, etc.) */
  getSession(): Promise<{ data: { session: Session | null }; error: any | null }> {
    return this.client.auth.getSession();
  }

  /**
   * Suscripción a cambios de auth (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.).
   * Devuelve una función para desuscribirse.
   */
  onAuthChange(cb: (event: AuthChangeEvent, session: Session | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((event, session) => cb(event, session));
    return () => data.subscription.unsubscribe();
  }

  /* =========================================================
   * USUARIOS (tabla esquema_clinica.usuarios)
   * ========================================================= */

  /**
   * Obtiene un usuario por id desde la tabla `usuarios`.
   * Normalmente usarás el id de auth.user.id.
   */
  async obtenerUsuarioPorId(id: string): Promise<{ data: Usuario | null; error: any | null }> {
    const { data, error } = await this.client
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { data: data as Usuario | null, error };
  }

  /**
   * Inserta o actualiza un usuario (upsert sobre la pk id).
   * - Si viene id, lo usa.
   * - Si no viene id, la BD genera uno (gen_random_uuid()).
   *
   * OJO: en tu esquema `password` es NOT NULL. La app de login real
   * sigue usando Supabase Auth; este campo es solo para cumplir el esquema.
   */
  async upsertUsuario(usuario: UsuarioCreate): Promise<{ data: Usuario | null; error: any | null }> {
    const { data, error } = await this.client
      .from('usuarios')
      .upsert(usuario, { onConflict: 'id' })
      .select('*')
      .maybeSingle();

    return { data: data as Usuario | null, error };
  }

  /* =========================================================
   * STORAGE: Avatares (bucket 'avatars')
   * ========================================================= */

  /**
   * Sube un archivo de avatar al bucket 'avatars' y devuelve la URL pública.
   * idx = 1 o 2 para distinguir imagen_perfil_1 / imagen_perfil_2.
   */
  async uploadAvatar(userId: string, file: File, idx: 1 | 2): Promise<string> {
    const path = `${userId}/${Date.now()}_${idx}_${file.name}`;

    // Subir archivo
    const { error: uploadError } = await this.client.storage
      .from('avatars')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
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
}


// --------------------------


// import { Injectable } from '@angular/core';
// import { environment } from '../../environments/environment';
// import { AuthChangeEvent, AuthResponse, createClient, Session, SupabaseClient, UserResponse } from '@supabase/supabase-js';
// import { Usuario, UsuarioCreate } from '../models/usuario.model';


// @Injectable({ providedIn: 'root' })
// export class SupabaseService {

//     // Usá siempre this.client, no accedas directo a _client
//   private readonly _client: SupabaseClient<any, any, any, any, any>;

//     constructor() {
//         this._client = createClient(environment.supabaseUrl, environment.supabaseKey, {
//             //  MUY IMPORTANTE: usar el esquema correcto
//             db: {
//                 schema: 'esquema_clinica',
//             },
//             auth: {
//                 persistSession: true,
//                 autoRefreshToken: true,
//                 detectSessionInUrl: true,
//                 storage: localStorage,
//                 // @ts-expect-error - multiTab no siempre está tipado en supabase-js
//                 multiTab: false,
//                 storageKey: 'sb-clinica-online-auth-2025',
//             },
//         });
//     }

//     get client(): SupabaseClient<any, any, any, any, any> {
//         return this._client;
//     }

//     /** Alias corto  */
//     get sdk(): SupabaseClient<any, any, any, any, any> {
//         return this._client;
//     }

//     /* =========================================================
//      * AUTH (schema auth de Supabase, no cambia con el esquema)
//      * ========================================================= */

//     /** Login con email/contraseña (auth.users) */
//     iniciarSesion(email: string, password: string): Promise<AuthResponse> {
//         return this.client.auth.signInWithPassword({ email, password });
//     }

//     /** Registro en auth.users (NO crea fila en esquema_clinica.usuarios) */
//     signUp(email: string, password: string): Promise<AuthResponse> {
//         return this.client.auth.signUp({ email, password });
//     }

//     /** Cerrar sesión */
//     cerrarSesion(): Promise<{ error: any | null }> {
//         return this.client.auth.signOut();
//     }

//     /** Usuario actual de auth (no el de la tabla usuarios) */
//     obtenerUsuarioActual(): Promise<UserResponse> {
//         return this.client.auth.getUser();
//     }

//     /** Sesión actual (token, expiración, etc.) */
//     getSession(): Promise<{ data: { session: Session | null }; error: any | null }> {
//         return this.client.auth.getSession();
//     }

//     /**
//      * Suscripción a cambios de auth (login, logout, token refresh).
//      * Devuelve función para desuscribirse.
//      */
//     onAuthChange(cb: (event: AuthChangeEvent, session: Session | null) => void): () => void {
//         const { data } = this.client.auth.onAuthStateChange((event, session) => cb(event, session));
//         return () => data.subscription.unsubscribe();
//     }

//     /* =========================================================
//      * USUARIOS (tabla esquema_clinica.usuarios)
//      * ========================================================= */

//     async obtenerUsuarioPorId(id: string): Promise<{ data: Usuario | null; error: any | null }> {

//         const { data, error } = await this.client
//             .from('usuarios')
//             .select('*')
//             .eq('id', id)
//             .maybeSingle();

//         return { data: data as Usuario | null, error };
//     }

//     async upsertUsuario(usuario: UsuarioCreate): Promise<{ data: Usuario | null; error: any | null }> {
//         const { data, error } = await this.client
//             .from('usuarios')                        // 👈 sin genérico
//             .upsert(usuario, { onConflict: 'id' })   // usa id si viene, si no lo genera la DB
//             .select('*')
//             .maybeSingle();

//         return { data: data as Usuario | null, error };
//     }

//     /* =========================================================
//      * STORAGE: Avatares de usuario (bucket 'avatars')
//      * ========================================================= */

//     /**
//      * Sube una imagen de avatar al bucket 'avatars' y devuelve la URL pública.
//      * idx = 1 o 2 para distinguir imagen_perfil_1 / imagen_perfil_2.
//      */
//     async uploadAvatar(userId: string, file: File, idx: 1 | 2): Promise<string> {
//         const path = `${userId}/${Date.now()}_${idx}_${file.name}`;

//         // Subir archivo
//         const { error: uploadError } = await this.client.storage
//             .from('avatars')
//             .upload(path, file, {
//                 cacheControl: '3600',
//                 upsert: false,
//             });

//         if (uploadError) {
//             throw uploadError;
//         }

//         // Obtener URL pública
//         const { data: pubData } = this.client.storage
//             .from('avatars')
//             .getPublicUrl(path);

//         const publicUrl = pubData.publicUrl;

//         if (!publicUrl) {
//             throw new Error('No se pudo obtener la URL pública de la imagen');
//         }

//         return publicUrl;
//     }
// }

