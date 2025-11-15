
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, AuthError, Session, User } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  public client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: true,           // guarda sesión en localStorage
        autoRefreshToken: true
      }
    });
  }

  // LOGIN
  async signIn(email: string, password: string): Promise<{ data: { user: User | null; session: Session | null }, error: AuthError | null }> {
    return await this.client.auth.signInWithPassword({ email, password });
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

  // Listener de cambios de sesión (opcional)
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: sub } = this.client.auth.onAuthStateChange((event, session) => callback(event, session));
    return () => sub.subscription.unsubscribe();
  }

  // (Opcional) Leer perfil TABLA ‘profiles’
  async getMyProfile(userId: string) {
    return await this.client
      .from('profiles')
      .select('id, first_name, last_name, email, role')
      .eq('id', userId)
      .maybeSingle();
  }

  //  SignUp con verificación por email
  async signUp(email: string, password: string, profile?: { first_name?: string; last_name?: string }) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/login' // adonde vuelve tras confirmar
      }
    });
    if (error) return { data, error };

    // si querés crear fila en profiles después de signUp:
    if (data.user && profile) {
      await this.client.from('profiles').insert({
        id: data.user.id,
        email,
        first_name: profile.first_name ?? null,
        last_name: profile.last_name ?? null
      });
    }
    return { data, error };
  }
}








// // // src/app/services/auth.service.ts
// // import { Injectable } from '@angular/core';

// // @Injectable({ providedIn: 'root' })
// // export class AuthService {
// //   // Simula el usuario logueado; en producción vendrá de tu backend o Firebase Auth
// //   get currentUser() {
// //     return { uid: 'abc123-especialista' };
// //   }
// // }


// // // src/app/services/auth.service.ts
// // import { Injectable } from '@angular/core';
// // import { AngularFireAuth } from '@angular/fire/compat/auth';
// // import { Observable } from 'rxjs';
// // import { User } from '@firebase/auth';

// // @Injectable({ providedIn: 'root' })
// // export class AuthService {
// //   user$: Observable<User | null>;

// //   constructor(private afAuth: AngularFireAuth) {
// //     this.user$ = this.afAuth.authState;  // emite null o el usuario cuando cambia
// //   }
// // }

// // // src/app/services/auth.service.ts
// // import { Injectable } from '@angular/core';
// // import { AngularFireAuth } from '@angular/fire/compat/auth';
// // import firebase from 'firebase/compat/app';        // <— IMPORT
// // import { Observable } from 'rxjs';

// // @Injectable({ providedIn: 'root' })
// // export class AuthService {
// //   // declara user$ como firebase.User en lugar de @firebase/auth User
// //   user$: Observable<firebase.User | null>;

// //   constructor(private afAuth: AngularFireAuth) {
// //     this.user$ = this.afAuth.authState;
// //   }
// // }
