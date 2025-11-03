// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { PerfilInsert } from '../models/perfil.model';
import { environment } from '../environments/environment';
import type { PerfilRow } from '../models/perfil.model';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  public supabase: SupabaseClient;

  // Alias para compatibilidad: permite usar inject(SupabaseService).client
  get client(): SupabaseClient {
    return this.supabase;
  }

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      { auth: { persistSession: true, autoRefreshToken: true } }
    );
  }

  // =============== AUTH ===============
  iniciarSesion(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password }); // envía mail de verificación
  }

  cerrarSesion() {
    return this.supabase.auth.signOut();
  }

  obtenerUsuarioActual() {
    return this.supabase.auth.getUser(); // { data: { user }, error }
  }

  getSession() {
    return this.supabase.auth.getSession();
  }

  // =============== PROFILES ===============
  // async obtenerPerfil(uid: string): Promise<{ data: PerfilRow | null; error: any }> {
  //   const { data, error } = await this.supabase
  //     .from('profiles')
  //     .select('id, rol, aprobado, nombre, apellido, avatar_url, created_at, updated_at')
  //     .eq('id', uid) // si usás user_id, cambiá aquí y en policies
  //     .single();

  //   return { data: data as PerfilRow | null, error };
  // }

  // SupabaseService
  async obtenerPerfil(uid: string): Promise<{ data: PerfilRow | null; error: any }> {

    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, rol, aprobado, nombre, apellido')
      .eq('id', uid)
      .single();
    return { data: data as PerfilRow | null, error };
  }

  // insert/update según conflicto en 'id'
  async upsertPerfil(perfil: PerfilInsert): Promise<{ data: PerfilRow | null; error: any }> {
    const { data, error } = await this.supabase
      .from('profiles')
      .upsert(perfil, { onConflict: 'id' }) // si tu unique es 'user_id', cambiá aquí
      .select('*')
      .single();

    return { data: data as PerfilRow | null, error };
  }

  // Variante si tu tabla usa 'user_id' (opcional)
  async upsertPerfilPorUserId(
    perfil: Omit<PerfilInsert, 'id'> & { user_id: string }
  ): Promise<{ data: PerfilRow | null; error: any }> {
    const { data, error } = await this.supabase
      .from('profiles')
      .upsert(perfil, { onConflict: 'user_id' })
      .select('*')
      .single();

    return { data: data as PerfilRow | null, error };
  }

  // =============== STORAGE ===============
  async uploadAvatar(userId: string, file: File, idx: 1 | 2) {
    const path = `${userId}/${Date.now()}_${idx}_${file.name}`;
    const { error } = await this.supabase.storage.from('avatars').upload(path, file);
    if (error) throw error;
    const { data: pub } = this.supabase.storage.from('avatars').getPublicUrl(path);
    return pub.publicUrl as string;
  }
}




