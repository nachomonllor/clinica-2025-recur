import { Rol } from './tipos.model';

// export interface Usuario {
//   id: string;
//   nombre: string;
//   apellido: string;
//   edad: number | null;
//   dni: string;
//   obra_social: string | null;
//   email: string;
//   password: string;           // hash, NO texto plano
//   perfil: Rol;                // PACIENTE / ESPECIALISTA / ADMIN
//   imagen_perfil_1: string | null;
//   imagen_perfil_2: string | null;
//   esta_aprobado: boolean;
//   mail_verificado: boolean;
//   activo: boolean;
//   idioma_preferido: string;
//   fecha_registro: string;     // ISO (timestamptz)
// }

// export interface UsuarioCreate {
//   id?: string;
//   nombre: string;
//   apellido: string;
//   dni: string;
//   email: string;
//   password: string;
//   perfil: Rol;

//   edad?: number | null;
//   obra_social?: string | null;
//   imagen_perfil_1?: string | null;
//   imagen_perfil_2?: string | null;
//   esta_aprobado?: boolean;
//   mail_verificado?: boolean;
//   activo?: boolean;
//   idioma_preferido?: string;
//   fecha_registro?: string;
// }

// export type UsuarioUpdate = Partial<Omit<Usuario, 'id'>>;


// // --- Tipado del metadata que guardaste en auth.user_metadata
// export type MetaUsuario = {
//   rol?: 'paciente' | 'especialista' | 'admin' | string;
//   nombre?: string;
//   apellido?: string;
//   dni?: string;
//   fecha_nacimiento?: string;
//   especialidad?: string;
//   especialidades?: string; // CSV
// };

// // Fila liviana desde esquema_clinica.usuarios
// export type UsuarioRowLite = Partial<{
//   id: string;
//   nombre: string;
//   apellido: string;
//   edad: number;
//   dni: string;
//   obra_social: string;
//   email: string;
//   perfil: string;
//   imagen_perfil_1: string | null;
//   imagen_perfil_2: string | null;
//   esta_aprobado: boolean;
//   mail_verificado: boolean;
//   activo: boolean;
// }>;

// // Modelo que usa la UI
// export interface UsuarioPerfil {
//   id: string;
//   nombre: string;
//   apellido: string;
//   rol: Rol;
//   edad?: number;
//   dni: string;
//   email: string;
//   telefono: string | null;
//   direccion: string | null;
//   ciudad: string | null;
//   obraSocial: string | null;
//   especialidades: string[];
//   habilitado: boolean;
//   avatarUrl: string | null;
//   bannerUrl: string | null;
//   bio: string;
// }

// -----------------------------------------------------------------


/**
 * Fila tal cual está en la tabla esquema_clinica.usuarios
 */
export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  edad: number | null;
  dni: string;
  obra_social: string | null;
  email: string;
  password: string;           // hash / marcador, la auth real la maneja Supabase Auth
  perfil: Rol;                // 'PACIENTE' | 'ESPECIALISTA' | 'ADMIN'
  imagen_perfil_1: string | null;
  imagen_perfil_2: string | null;
  esta_aprobado: boolean;
  mail_verificado: boolean;
  activo: boolean;
  idioma_preferido: string;
  fecha_registro: string;     // timestamptz → ISO string
}

/**
 * Payload para crear/insertar usuario en la tabla usuarios
 */
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

/**
 * Cambios parciales para update
 */
export type UsuarioUpdate = Partial<Omit<Usuario, 'id'>>;

/**
 * Fila liviana/ parcial de usuarios (para vistas donde no necesitás todo)
 */
export type UsuarioRowLite = Partial<Pick<Usuario,
  | 'id'
  | 'nombre'
  | 'apellido'
  | 'edad'
  | 'dni'
  | 'obra_social'
  | 'email'
  | 'perfil'
  | 'imagen_perfil_1'
  | 'imagen_perfil_2'
  | 'esta_aprobado'
  | 'mail_verificado'
  | 'activo'
>>;

/**
 * Metadata que podés haber guardado en auth.user_metadata
 *
 * OJO acá con tu pregunta:
 * En la APP y en la tabla usuarios usamos Rol = 'PACIENTE' | 'ESPECIALISTA' | 'ADMIN' (MAYÚSCULAS).
 * Pero en metadata viejo seguramente tengas 'paciente'/'especialista' en minúsculas.
 *
 * Por eso tipamos como UNION: Rol (mayúsculas) + minúsculas + string genérico.
 * En el componente siempre normalizamos a mayúsculas.
 */
export type MetaUsuario = {
  rol?: Rol | 'paciente' | 'especialista' | 'admin' | string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  fecha_nacimiento?: string;
  especialidad?: string;
  especialidades?: string; // CSV
};

/**
 * Modelo que usa la UI para el perfil de usuario
 */
export interface UsuarioPerfil {
  id: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  edad?: number;
  dni: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  obraSocial: string | null;
  especialidades: string[];
  habilitado: boolean;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string;
}
