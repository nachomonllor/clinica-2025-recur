import { Observable } from "rxjs";
import { Rol } from "./perfil.model";
import { UUID } from "./admin.model";

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

// =================== Usuarios (VM para la sección Admin) ===================
export interface Usuario {
  id: UUID;
  rol: Rol;                         // 'paciente' | 'especialista' | 'admin'
  nombre: string;
  apellido: string;
  email: string;

  edad?:number;
  color?: string;

  // Opcionales por rol:
  dni?: string | null;
  obraSocial?: string | null;       // paciente
  especialidades?: string[] | null; // especialista

  // Estados de acceso/aprobación:
  habilitado?: boolean | null;      // especialista puede ingresar
  aprobado?: boolean | null;        // especialista aprobado por admin
  mailVerificado?: boolean | null;  // verificación de email

  avatarUrl?: string | null;
  createdAt?: string | null;        // ISO
}

// Puerto opcional (si tenés un servicio, implementalo con este contrato)
export interface UsuariosPort {
  getAll(): Observable<Usuario[]>;
  toggleHabilitado(id: string, habilitado: boolean): Promise<void> | Observable<void>;
  aprobarEspecialista(id: string): Promise<void> | Observable<void>;
}
