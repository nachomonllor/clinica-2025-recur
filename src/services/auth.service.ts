
// ARCHIVO: src/services/auth.service.ts
import { Injectable } from '@angular/core';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private supa: SupabaseService) {}

  get client() { return this.supa.client; }

  // LOGIN
  async signIn(email: string, password: string): Promise<{
    data: { user: User | null; session: Session | null }, error: any | null
  }> {
    const res = await this.client.auth.signInWithPassword({ email, password });
    return { data: { user: res.data.user, session: res.data.session }, error: res.error };
  }

  // LOGOUT
  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  // Obtener sesión actual
  async getSession(): Promise<Session | null> {
    const { data } = await this.client.auth.getSession();
    return data.session ?? null;
  }

  // Listener de cambios de sesión
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: sub } = this.client.auth.onAuthStateChange((event, session) => callback(event, session));
    return () => sub.subscription.unsubscribe();
  }

  // Perfil real en 'perfiles' con columnas en español
  async getMyProfile(userId: string) {
    return await this.client
      .from('perfiles')
      .select('id, nombre, apellido, email, rol')
      .eq('id', userId)
      .maybeSingle();
  }

  // SignUp (opcionalmente crea fila en 'perfiles')
  async signUp(email: string, password: string, profile?: { nombre?: string; apellido?: string }) {
    const { data, error } = await this.client.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin + '/login' }
    });
    if (error) return { data, error };

    if (data.user) {
      await this.client.from('perfiles').upsert({
        id: data.user.id,
        email,
        nombre: profile?.nombre ?? null,
        apellido: profile?.apellido ?? null,
        rol: 'paciente' // ajusta si corresponde
      }, { onConflict: 'id' });
    }
    return { data, error };
  }
}



// import { Injectable } from '@angular/core';
// import { createClient, SupabaseClient, AuthError, Session, User } from '@supabase/supabase-js';
// import { environment } from '../environments/environment';

// @Injectable({ providedIn: 'root' })
// export class AuthService {
//   public client: SupabaseClient;

//   constructor() {
//     this.client = createClient(environment.supabaseUrl, environment.supabaseKey, {
//       auth: {
//         persistSession: true,           // guarda sesión en localStorage
//         autoRefreshToken: true
//       }
//     });
//   }

//   // LOGIN
//   async signIn(email: string, password: string): Promise<{ data: { user: User | null; session: Session | null }, error: AuthError | null }> {
//     return await this.client.auth.signInWithPassword({ email, password });
//   }

//   // LOGOUT
//   async signOut(): Promise<void> {
//     await this.client.auth.signOut();
//   }

//   // Obtener sesión actual  
//   async getSession(): Promise<Session | null> {
//     const { data } = await this.client.auth.getSession();
//     return data.session ?? null;
//   }

//   // Listener de cambios de sesión (opcional)
//   onAuthStateChange(callback: (event: string, session: Session | null) => void) {
//     const { data: sub } = this.client.auth.onAuthStateChange((event, session) => callback(event, session));
//     return () => sub.subscription.unsubscribe();
//   }

//   // AuthService
//   async getMyProfile(userId: string) {
//     return this.client
//       .from('perfiles')
//       .select('id, nombre, apellido, email, rol')   // <- CASTELLANO
//       .eq('id', userId)
//       .maybeSingle();
//   }


//   async signUp(email: string, password: string, profile?: { nombre?: string; apellido?: string; rol?: 'paciente' | 'especialista' | 'admin' }) {
//     const { data, error } = await this.client.auth.signUp({
//       email,
//       password,
//       options: { emailRedirectTo: window.location.origin + '/login' }
//     });
//     if (error) return { data, error };

//     if (data.user) {
//       await this.client.from('perfiles').insert({
//         id: data.user.id,
//         email,
//         nombre: profile?.nombre ?? null,
//         apellido: profile?.apellido ?? null,
//         rol: profile?.rol ?? 'paciente'
//       });
//       // Crear fila en tabla de extensión según ROL
//     }
//     return { data, error };
//   }




// }






