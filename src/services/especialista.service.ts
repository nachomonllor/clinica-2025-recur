

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { PerfilInsert, PerfilRow } from '../models/perfil.model';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  // antes: private supabase: SupabaseClient;
  // ahora: público para quien prefiera usar .supabase
  public supabase: SupabaseClient;

  // alias para compatibilidad con código que use ".client"
  get client(): SupabaseClient {
    return this.supabase;
  }

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }

  // =============== AUTH ===============
  iniciarSesion(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
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
  async obtenerPerfil(uid: string): Promise<{ data: PerfilRow | null; error: any }> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, rol, aprobado, nombre, apellido')
      .eq('id', uid)
      .single();
    return { data: data as PerfilRow | null, error };
  }

  async upsertPerfil(perfil: PerfilInsert): Promise<{ data: PerfilRow | null; error: any }> {
    const { data, error } = await this.supabase
      .from('profiles')
      .upsert(perfil, { onConflict: 'id' })
      .select('*')
      .single();
    return { data: data as PerfilRow | null, error };
  }

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




// // src/app/services/especialista.service.ts  (o donde lo tengas)
// import { Injectable, inject } from '@angular/core';
// import { from, map } from 'rxjs';
// import { SupabaseService } from './supabase.service';

// export interface Especialista {
//   id: string;
//   nombre: string;
//   apellido: string;
//   email: string;
//   dni?: string | null;
//   aprobado?: boolean | null;
//   habilitado?: boolean | null;
// }

// @Injectable({ providedIn: 'root' })
// export class EspecialistaService {
//   private supa = inject(SupabaseService).supabase;

//   /** Observable con todos los especialistas */
//   getEspecialistas() {
//     return from(
//       this.supa
//         .from('profiles')
//         .select('id,nombre,apellido,email,dni,aprobado,habilitado')
//         .eq('rol','especialista')
//         .order('apellido', { ascending: true })
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return (data || []) as Especialista[];
//       })
//     );
//   }

//   /** Crear especialista (solo DB). Si querés crear auth-usuario, usar la Edge Function create-user */
//   addEspecialista(especialistaData: any) {
//     return this.supa.from('profiles')
//       .insert({ ...especialistaData, rol: 'especialista' });
//   }

//   /** Actualizar especialista por id */
//   updateEspecialista(id: string, updateData: any) {
//     return this.supa.from('profiles')
//       .update(updateData)
//       .eq('id', id);
//   }
// }





// // import { Injectable } from '@angular/core';
// // import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
// // import { Observable } from 'rxjs';

// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class EspecialistaService {
// //   private especialistasCol: AngularFirestoreCollection<Especialista>;

// //   constructor(private afs: AngularFirestore) {
// //     this.especialistasCol = this.afs.collection<Especialista>('especialistas');
// //   }

// //   /**
// //    * Obtiene un Observable con todos los especialistas (incluye campo 'id').
// //    */
// //   getEspecialistas(): Observable<Especialista[]> {
// //     return this.especialistasCol.valueChanges({ idField: 'id' });
// //   }

// //   /**
// //    * Crea un nuevo especialista.
// //    */
// //   addEspecialista(especialistaData: any): Promise<any> {
// //     return this.especialistasCol.add(especialistaData);
// //   }

// //   /**
// //    * Actualiza un especialista existente por su ID.
// //    */
// //   updateEspecialista(id: string, updateData: any): Promise<void> {
// //     return this.especialistasCol.doc(id).update(updateData);
// //   }
// // }


// // // import { Injectable } from '@angular/core';

// // // @Injectable({
// // //   providedIn: 'root'
// // // })
// // // export class EspecialistaService {

// // //   constructor() { }
// // // }
