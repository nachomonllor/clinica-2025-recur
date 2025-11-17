// interface Usuario {
//     nombre: string;
//     apellido: string;
//     email: string;
//     imagenPerfil: string;
//     // Si el usuario es Especialista, puede tener horarios asignados.
//     horarios?: Horario[];
//   }

import { Rol } from "./perfil.model";


export interface UsuarioPerfil {
  id: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  edad?: number;
  dni?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  obraSocial?: string;             // pacientes
  especialidades?: string[];       // especialistas
  habilitado: boolean;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
}

export interface UsuarioDisplay {
  id: string;
  rol: Rol;
  aprobado: boolean;
  nombre: string;
  apellido: string;
  email: string;
  dni?: string | null;
  avatar_url?: string | null;
  obra_social?: string | null;
  fecha_nacimiento?: string | null;
  created_at?: string | null;
}

export type AccentColor = 'purple' | 'teal' | 'blue' | 'pink';

export interface UsuarioCardVM {
  id: string;
  rol: Rol;
  habilitado: boolean;          // mapea: especialista.aprobado; otros => true
  nombre: string;
  apellido: string;
  email: string;
  dni?: string | null;
  avatarUrl?: string | null;
  obraSocial?: string | null;   // pacientes
  edad?: number;                // opcional si hay fecha
  especialidades?: string[];    // opcional (si lo agregás luego)
  color: AccentColor;           // acento de tarjeta
}