
// src/app/models/perfil.model.ts
export type Rol = 'paciente' | 'especialista' | 'admin';

export interface PerfilRow {
  id: string;               // PK = auth.users.id
  rol: Rol;
  aprobado: boolean | null;
  nombre: string | null;
  apellido: string | null;
  avatar_url: string | null;
  created_at: string;       // ISO string (timestamptz)
  updated_at: string | null;
}

// payload para insert/upsert
export type PerfilInsert = {
  id: string;               // requerido si onConflict: 'id'
  rol: Rol;
  aprobado?: boolean | null;
  nombre?: string | null;
  dni: string | null;
  obra_social?: string | null;
  fecha_nacimiento?: string | null;
  email: string;
  apellido?: string | null;
  avatar_url?: string | null;
  imagen2_url?: string | null;
};

export interface PerfilMin {
  nombre?: string | null;
  apellido?: string | null;
}



// // src/app/models/perfil.model.ts
// export type Rol = 'paciente' | 'especialista' | 'admin';

// export interface PerfilRow {
//   id: string;                 // PK, = auth.users.id
//   rol: Rol;                   // NOT NULL en la BD (ideal)
//   aprobado: boolean | null;   // puede ser null si no decidiste
//   nombre: string | null;
//   apellido: string | null;
//   avatar_url: string | null;
//   created_at: string;         // timestamptz en texto ISO
//   updated_at: string | null;
// }

// // Para insertar / upsert (lo que realmente enviás):
// export type PerfilInsert = {
//   id: string;       // requerido para onConflict: 'id'
//   rol: Rol;
//   aprobado?: boolean | null;
//   nombre?: string | null;
//   apellido?: string | null;
//   avatar_url?: string | null;
// };

// Para actualizar (id + campos opcionales)
export type PerfilUpdate = {
  id: string;
} & Partial<Omit<PerfilInsert, 'id'>>;
