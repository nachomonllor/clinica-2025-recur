// src/app/models/admin.model.ts
import { Rol } from './tipos.model';

export type AccentColor = 'purple' | 'teal' | 'blue' | 'pink';

export interface UsuarioAdmin {
  id: string;
  rol: Rol;                    // 'PACIENTE' | 'ESPECIALISTA' | 'ADMIN'
  aprobado: boolean;           // esta_aprobado
  nombre: string;
  apellido: string;
  email: string;
  dni?: string | null;
  avatar_url?: string | null;  // imagen_perfil_1
  obra_social?: string | null;
  edad?: number | null;
  fecha_registro?: string | null;
  activo?: boolean;
}

export interface UsuarioAdminCard {
  id: string;
  rol: Rol;
  habilitado: boolean;
  nombre: string;
  apellido: string;
  email: string;
  dni?: string;
  avatarUrl?: string;
  obraSocial?: string;
  edad?: number;
  color: AccentColor;
  especialidades?: string[];
}

export interface TurnoAdminResumen {
  id: string;
  fechaTexto: string;
  estado: string;
  especialidad: string;
  contraparte: string;
}

export interface TurnoAdminSupabase {
  id: string;
  fecha_hora_inicio: string | null;
  motivo: string | null;
  comentario: string | null;
  estado?: { codigo?: string | null } | null;
  especialidad?: { nombre?: string | null } | null;
  paciente?: { nombre?: string | null; apellido?: string | null } | null;
  especialista?: { nombre?: string | null; apellido?: string | null } | null;
}

export interface PerfilMin {
  nombre?: string | null;
  apellido?: string | null;
}




// import { Rol } from "./tipos.model";

// // Usuario tal como lo maneja el admin (lo que ahora llamabas UsuarioDisplay)
// export interface UsuarioAdmin {
//   id: string;
//   rol: Rol;
//   aprobado: boolean;
//   nombre: string;
//   apellido: string;
//   email: string;
//   dni?: string | null;
//   avatar_url?: string | null;
//   obra_social?: string | null;
//   fecha_nacimiento?: string | null;
//   created_at?: string | null;
// }

// // Vista “tarjeta” del usuario
// export type AccentColor = 'purple' | 'teal' | 'blue' | 'pink';

// export interface UsuarioAdminCard {
//   id: string;
//   rol: Rol;                    // usa Rol del nuevo modelos
//   habilitado: boolean;
//   nombre: string;
//   apellido: string;
//   email: string;
//   dni?: string;
//   avatarUrl?: string;
//   obraSocial?: string;
//   edad?: number;
//   color: AccentColor;
//   especialidades?: string[];   // futuro, si lo querés llenar
// }

// // Turno breve para el panel lateral
// export interface TurnoAdminResumen {
//   id: string;
//   fechaTexto: string;
//   estado: string;        // ojo: acá seguís usando minúsculas
//   especialidad: string;
//   contraparte: string;
// }

// // Turno tal como viene de Supabase en obtenerTurnosUsuario
// export interface TurnoAdminSupabase {
//   id: string;
//   fecha_iso: string | null;
//   estado: string | null;
//   especialidad: string | null;
//   paciente?: { nombre?: string | null; apellido?: string | null } | null;
//   especialista?: { nombre?: string | null; apellido?: string | null } | null;
// }

// // Perfil mínimo (para nombreCompleto)
// export interface PerfilMin {
//   nombre?: string | null;
//   apellido?: string | null;
// }
