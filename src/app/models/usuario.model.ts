import { Rol } from './tipos.model';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  edad: number | null;
  dni: string;
  obra_social: string | null;
  email: string;
  password: string;           // hash, NO texto plano
  perfil: Rol;                // PACIENTE / ESPECIALISTA / ADMIN
  imagen_perfil_1: string | null;
  imagen_perfil_2: string | null;
  esta_aprobado: boolean;
  mail_verificado: boolean;
  activo: boolean;
  idioma_preferido: string;
  fecha_registro: string;     // ISO (timestamptz)
}

export interface UsuarioCreate {
  id?: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password: string;
  perfil: Rol;

  edad?: number | null;
  obra_social?: string | null;
  imagen_perfil_1?: string | null;
  imagen_perfil_2?: string | null;
  esta_aprobado?: boolean;
  mail_verificado?: boolean;
  activo?: boolean;
  idioma_preferido?: string;
  fecha_registro?: string;
}

export type UsuarioUpdate = Partial<Omit<Usuario, 'id'>>;

