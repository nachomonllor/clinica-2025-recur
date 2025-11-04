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
  type AuthResponse,     // 👈
  type UserResponse      // 👈
} from '@supabase/supabase-js';
import { Injectable } from '@angular/core';


// Si usás tipos de perfil en tu app:
import type { PerfilInsert, PerfilRow } from '../models/perfil.model';
import { environment } from '../environments/environment';

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
}








// // src/app/services/supabase.service.ts
// import { Injectable } from '@angular/core';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
// import type { PerfilInsert } from '../models/perfil.model';
// import { environment } from '../environments/environment';
// import type { PerfilRow } from '../models/perfil.model';

// @Injectable({ providedIn: 'root' })
// export class SupabaseService {
//   public supabase!: SupabaseClient;

//   // Alias para compatibilidad: permite usar inject(SupabaseService).client
//   get client(): SupabaseClient {
//     return this.supabase;
//   }

//   // constructor() {
//   //   this.supabase = createClient(
//   //     environment.supabaseUrl,
//   //     environment.supabaseKey,
//   //     { auth: { persistSession: true, autoRefreshToken: true } }
//   //   );
//   // }

//    constructor() {
//     this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
//       auth: {
//         persistSession: true,
//         autoRefreshToken: true,
//         detectSessionInUrl: true,
//         // Fuerza storage del navegador y desactiva el multi-tab lock:
//         storage: localStorage,
//         // @ts-expect-error: multiTab puede no existir en ciertos typings; si no existe, se ignora
//         multiTab: false
//       }
//     });
//   }
//   // =============== AUTH ===============
//   iniciarSesion(email: string, password: string) {
//     return this.supabase.auth.signInWithPassword({ email, password });
//   }

//   signUp(email: string, password: string) {
//     return this.supabase.auth.signUp({ email, password }); // envía mail de verificación
//   }

//   cerrarSesion() {
//     return this.supabase.auth.signOut();
//   }

//   obtenerUsuarioActual() {
//     return this.supabase.auth.getUser(); // { data: { user }, error }
//   }

//   getSession() {
//     return this.supabase.auth.getSession();
//   }

//   // =============== PROFILES ===============
//   // async obtenerPerfil(uid: string): Promise<{ data: PerfilRow | null; error: any }> {
//   //   const { data, error } = await this.supabase
//   //     .from('profiles')
//   //     .select('id, rol, aprobado, nombre, apellido, avatar_url, created_at, updated_at')
//   //     .eq('id', uid) // si usás user_id, cambiá aquí y en policies
//   //     .single();

//   //   return { data: data as PerfilRow | null, error };
//   // }

//   // SupabaseService
//   async obtenerPerfil(uid: string): Promise<{ data: PerfilRow | null; error: any }> {

//     const { data, error } = await this.supabase
//       .from('profiles')
//       .select('id, rol, aprobado, nombre, apellido')
//       .eq('id', uid)
//       .single();
//     return { data: data as PerfilRow | null, error };
//   }

//   // insert/update según conflicto en 'id'
//   async upsertPerfil(perfil: PerfilInsert): Promise<{ data: PerfilRow | null; error: any }> {
//     const { data, error } = await this.supabase
//       .from('profiles')
//       .upsert(perfil, { onConflict: 'id' }) // si tu unique es 'user_id', cambiá aquí
//       .select('*')
//       .single();

//     return { data: data as PerfilRow | null, error };
//   }

//   // Variante si tu tabla usa 'user_id' (opcional)
//   async upsertPerfilPorUserId(
//     perfil: Omit<PerfilInsert, 'id'> & { user_id: string }
//   ): Promise<{ data: PerfilRow | null; error: any }> {
//     const { data, error } = await this.supabase
//       .from('profiles')
//       .upsert(perfil, { onConflict: 'user_id' })
//       .select('*')
//       .single();

//     return { data: data as PerfilRow | null, error };
//   }

//   // =============== STORAGE ===============
//   async uploadAvatar(userId: string, file: File, idx: 1 | 2) {
//     const path = `${userId}/${Date.now()}_${idx}_${file.name}`;
//     const { error } = await this.supabase.storage.from('avatars').upload(path, file);
//     if (error) throw error;
//     const { data: pub } = this.supabase.storage.from('avatars').getPublicUrl(path);
//     return pub.publicUrl as string;
//   }
// }




