import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';


@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  //  AUTH
  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  //  STORAGE
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await this.supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data: urlData } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
  }

  // DATABASE
  async insertPaciente(paciente: any) {
    const { data, error } = await this.supabase.from('pacientes').insert(paciente).select();
    if (error) throw error;
    return data?.[0];
  }
}
