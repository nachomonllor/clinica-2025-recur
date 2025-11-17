// import { Injectable } from '@angular/core';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
// import type { PerfilInsert, PerfilRow } from '../models/perfil.model';
// import { environment } from '../environments/environment';

// @Injectable({ providedIn: 'root' })
// export class SupabaseService {
//   // antes: private supabase: SupabaseClient;
//   // ahora: público para quien prefiera usar .supabase
//   public supabase: SupabaseClient;

//   // alias para compatibilidad con código que use ".client"
//   get client(): SupabaseClient {
//     return this.supabase;
//   }

//   constructor() {
//     this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
//       auth: { persistSession: true, autoRefreshToken: true },
//     });
//   }

//   // =============== AUTH ===============
//   iniciarSesion(email: string, password: string) {
//     return this.supabase.auth.signInWithPassword({ email, password });
//   }

//   signUp(email: string, password: string) {
//     return this.supabase.auth.signUp({ email, password });
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
//   async obtenerPerfil(uid: string): Promise<{ data: PerfilRow | null; error: any }> {
//     const { data, error } = await this.supabase
//       .from('perfiles')
//       .select('id, rol, aprobado, nombre, apellido')
//       .eq('id', uid)
//       .single();
//     return { data: data as PerfilRow | null, error };
//   }

//   async upsertPerfil(perfil: PerfilInsert): Promise<{ data: PerfilRow | null; error: any }> {
//     const { data, error } = await this.supabase
//       .from('perfiles')
//       .upsert(perfil, { onConflict: 'id' })
//       .select('*')
//       .single();
//     return { data: data as PerfilRow | null, error };
//   }

//   async upsertPerfilPorUserId(
//     perfil: Omit<PerfilInsert, 'id'> & { user_id: string }
//   ): Promise<{ data: PerfilRow | null; error: any }> {
//     const { data, error } = await this.supabase
//       .from('perfiles')
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


