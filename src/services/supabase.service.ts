// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs'; // <--- IMPORTANTE
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

  private readonly _client: SupabaseClient<any, any, any, any, any>;

  // 1. ESTADO GLOBAL DEL USUARIO (Fuente de la verdad)
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  public usuario$ = this.usuarioSubject.asObservable();

  constructor() {
    this._client = createClient(environment.supabaseUrl, environment.supabaseKey, {
      db: { schema: 'esquema_clinica' },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage,

        // multiTab: false,
        storageKey: 'sb-clinica-online-auth-2025',
      },
    });

    //  Escuchar cambios de Auth automáticamente
    this.inicializarAuthListener();
  }

  get client(): SupabaseClient<any, any, any, any, any> {
    return this._client;
  }

  // --- LOGICA DE ESTADO AUTOMATICA --------------
  // private inicializarAuthListener() {
  //   this.client.auth.onAuthStateChange(async (event, session) => {
  //     // console.log('Auth Event:', event); // Debug

  //     if (session?.user) {
  //       // Si hay sesión, buscamos el perfil en la BD
  //       const { data } = await this.obtenerUsuarioPorId(session.user.id);

  //       // Emitimos el valor al BehaviorSubject (toda la app se entera)
  //       if (data) {
  //           this.usuarioSubject.next(data);
  //       } else {
  //           // Caso raro: Logueado en Auth pero sin perfil en tabla usuarios
  //           this.usuarioSubject.next(null); 
  //       }
  //     } else {
  //       // Si no hay sesión (Logout), emitimos null
  //       this.usuarioSubject.next(null);
  //     }
  //   });
  // }


  // --- LOGICA DE ESTADO AUTOMATICA (BLINDADA) --------------
  // private inicializarAuthListener() {
  //   this.client.auth.onAuthStateChange(async (event, session) => {
  //     console.log('🔄 [Supabase Auth Change]', event); // Debug para ver si se dispara

  //     try {
  //       if (session?.user) {
  //         // Si hay sesión, buscamos el perfil en la BD
  //         const { data, error } = await this.obtenerUsuarioPorId(session.user.id);

  //         if (error) {
  //           console.warn('⚠️ Error al recuperar perfil automático:', error.message);
  //           // No emitimos error fatal, solo null o el usuario incompleto si quisieras
  //           this.usuarioSubject.next(null);
  //         } else if (data) {
  //           this.usuarioSubject.next(data);
  //         } else {
  //           // Usuario en Auth pero no en BD
  //           this.usuarioSubject.next(null); 
  //         }
  //       } else {
  //         // Logout o sin sesión
  //         this.usuarioSubject.next(null);
  //       }
  //     } catch (err) {
  //       console.error('❌ Error crítico en listener de Auth:', err);
  //       // Importante: No dejar el subject colgado
  //       this.usuarioSubject.next(null);
  //     }
  //   });
  // }


  // src/app/services/supabase.service.ts

  // --- LOGICA DE ESTADO AUTOMATICA (DESACOPLADA) --------------
  private inicializarAuthListener() {
    // 1. Quitamos el 'async' de aquí para no bloquear el flujo principal de Auth
    this.client.auth.onAuthStateChange((event, session) => {
      console.log('[Supabase Auth Change]', event);

      // 2. Ejecutamos la lógica en una función asíncrona autoejecutable
      //    o simplemente llamamos a la lógica sin 'await' desde aquí.
      (async () => {
        try {
          if (session?.user) {
            // Si hay sesión, buscamos el perfil en la BD
            const { data, error } = await this.obtenerUsuarioPorId(session.user.id);

            if (error) {
              console.warn(' Error al recuperar perfil automático:', error.message);
              // Si falla la BD automática, no matamos la app, solo el subject
              // El login manual se encargará de reintentar esto con más autoridad
            } else if (data) {
              this.usuarioSubject.next(data);
            } else {
              // Usuario en Auth pero no en BD
              this.usuarioSubject.next(null);
            }
          } else {
            // Logout o sin sesión
            this.usuarioSubject.next(null);
          }
        } catch (err) {
          console.error('❌ Error crítico en listener de Auth:', err);
          this.usuarioSubject.next(null);
        }
      })(); // <====== Paréntesis que ejecuta la función async inmediatamente
    });
  }





  // LOGIN REGITRO

  iniciarSesion(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signInWithPassword({ email, password });
  }

  signUp(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signUp({ email, password });
  }

  cerrarSesion(): Promise<{ error: any | null }> {
    // Al cerrar sesion tambien limpiamos el subject manualmente por seguridad
    this.usuarioSubject.next(null);
    return this.client.auth.signOut();
  }

  getSession(): Promise<{ data: { session: Session | null }; error: any | null }> {
    return this.client.auth.getSession();
  }

  //     ya lo usamos internamente en el constructor
  onAuthChange(cb: (event: AuthChangeEvent, session: Session | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((event, session) => cb(event, session));
    return () => data.subscription.unsubscribe();
  }

  /* =========================================================
   * USUARIOS (tabla esquema_clinica.usuarios)
   * ========================================================= */
  async obtenerUsuarioPorId(id: string): Promise<{ data: Usuario | null; error: any | null }> {
    const { data, error } = await this.client
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return { data: data as Usuario | null, error };
  }

  /** Devuelve el usuario actual de Auth (no el de la tabla usuarios) */
  obtenerUsuarioActual(): Promise<UserResponse> {
    return this.client.auth.getUser();
  }

  // 
  async upsertUsuario(usuario: UsuarioCreate): Promise<{ data: Usuario | null; error: any | null }> {
    const { data, error } = await this.client
      .from('usuarios')
      .upsert(usuario, { onConflict: 'id' })
      .select('*')
      .maybeSingle();
    return { data: data as Usuario | null, error };
  }

  async uploadAvatar(userId: string, file: File, idx: 1 | 2): Promise<string> {
    // ... tu código existente
    const path = `${userId}/${Date.now()}_${idx}_${file.name}`;
    const { error: uploadError } = await this.client.storage.from('avatars').upload(path, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
    const { data: pubData } = this.client.storage.from('avatars').getPublicUrl(path);
    return pubData.publicUrl;
  }
}

