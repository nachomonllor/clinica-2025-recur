import { UUID } from "./admin.model";


// src/app/models/perfil.model.ts
export type Rol = 'paciente' | 'especialista' | 'admin';

// export interface PerfilRow {
//   id: string;               // PK = auth.users.id
//   rol: Rol;
//   aprobado: boolean | null;
//   nombre: string | null;
//   apellido: string | null;
//   avatar_url: string | null;
//   created_at: string;       // ISO string (timestamptz)
//   updated_at: string | null;
// }

// ========= Perfiles / Auth (alineado a Supabase) =========
export interface PerfilRow {
  id: UUID;                  // PK = auth.users.id
  rol: Rol;
  aprobado: boolean | null;
  nombre: string | null;
  apellido: string | null;
  avatar_url: string | null;
  created_at: string;        // ISO
  updated_at: string | null;
}

// // payload para insert/upsert
// export type PerfilInsert = {
//   id: string;               // requerido si onConflict: 'id'
//   rol: Rol;
//   aprobado?: boolean | null;
//   nombre?: string | null;
//   dni: string | null;
//   obra_social?: string | null;
//   fecha_nacimiento?: string | null;
//   email: string;
//   apellido?: string | null;
//   avatar_url?: string | null;
//   imagen2_url?: string | null;
// };

export type PerfilInsert = {
  id: UUID;                  // requerido si onConflict: 'id'
  rol: Rol;
  aprobado?: boolean | null;
  nombre?: string | null;
  apellido?: string | null;
  dni: string | null;
  obra_social?: string | null;
  fecha_nacimiento?: string | null;
  email: string;
  avatar_url?: string | null;
  imagen2_url?: string | null;
};

export interface PerfilMin {
  nombre?: string | null;
  apellido?: string | null;
}

export interface PerfilCompleto {
  id: string;
  rol: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  obra_social?: string;
  fecha_nacimiento?: string;
  avatar_url?: string;
  imagen2_url?: string;
  especialidades?: string[];
}


// // Para actualizar (id + campos opcionales)
// export type PerfilUpdate = {
//   id: string;
// } & Partial<Omit<PerfilInsert, 'id'>>;


export type PerfilUpdate = {
  id: UUID;
} & Partial<Omit<PerfilInsert, 'id'>>;

export interface Perfil {
  id: UUID;
  rol: Rol;
  aprobado?: boolean | null;
  email?: string | null;
}