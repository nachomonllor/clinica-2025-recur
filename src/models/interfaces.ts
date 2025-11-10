import type { Observable } from 'rxjs';

// ========= Comunes =========
export type UUID = string;
export type Rol = 'paciente' | 'especialista' | 'admin';

// Filtros para la sección Usuarios
export type RolTab = 'todos' | Rol;
export type EstadoTab = 'todos' | 'habilitados' | 'pendientes' | 'inhabilitados';

// ========= Turnos (CANÓNICO) =========
export type EstadoTurno =
  | 'pendiente' | 'aceptado' | 'confirmado'
  | 'realizado' | 'rechazado' | 'cancelado';

// Aliases de compatibilidad (no usar en código nuevo)
export type TurnoEstado = EstadoTurno;
export type Estado = EstadoTurno;

// Alias de compatibilidad
export type TurnoVm = TurnoVM;
export type Counters = SpecialistCounters;

// =================== Usuarios (VM para la sección Admin) ===================
export interface Usuario {
  id: UUID;
  rol: Rol;                         // 'paciente' | 'especialista' | 'admin'
  nombre: string;
  apellido: string;
  email: string;

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

// ========= VM ÚNICO de turnos (con alias de compatibilidad) =========
export interface TurnoVM {
  id: UUID;
  especialidad: string;
  estado: EstadoTurno;

  // Fecha canónica
  fechaISO: string;

  // Identidades
  especialistaId?: UUID;
  pacienteId?: UUID;

  // Nombres (preferido) y alias legacy
  especialistaNombre?: string; // Preferido: "Apellido, Nombre"
  especialista?: string;       // LEGACY: mismo contenido que especialistaNombre
  pacienteNombre?: string;

  // Extras
  ubicacion?: string | null;
  notas?: string | null;
  resenaEspecialista?: string | null;
  tieneResena?: boolean;
  encuesta?: boolean;
  calificacion?: number;
  motivo?: string | null;

  // ---- Compatibilidad legacy (evitar en código nuevo) ----
  fecha?: Date;
  hora?: string;
  /** @deprecated usar tieneResena */
  tieneResenia?: boolean;
  /** @deprecated usar encuesta */
  puedeEncuesta?: boolean;
}

// ========= Logins / Accesos =========
// VM para gráficos de “Log de ingresos”
export interface LoginLog {
  id: string;
  userId: UUID;
  email?: string | null;
  rol: Rol;
  atISO: string; // ISO 8601 del ingreso
}

// Fila cruda de BD (si usás una tabla de ingresos)
// Si tu tabla/consulta tiene otros nombres de columnas, ajustá acá:
export type IngresoRow = {
  user_id: UUID;
  email: string;
  rol: Rol;                  // 'admin' | 'paciente' | 'especialista'
  timestamp: string;         // timestamptz (ISO)
};

// ========= Misceláneos =========
export interface DatoDinamico {
  clave: string;
  valor: string;
}

export interface QuickItem {
  label: string;
  route: string;
  avatar: string;
  rol: Rol;
  tooltip?: string;
}

// ========= Admin =========
export interface AdminCounters {
  usuarios: number;
  especialistasPendientes: number;
  turnosHoy: number;
  turnosPendientes: number;
}

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

export type PerfilUpdate = {
  id: UUID;
} & Partial<Omit<PerfilInsert, 'id'>>;

export interface Perfil {
  id: UUID;
  rol: Rol;
  aprobado?: boolean | null;
  email?: string | null;
}

// ========= Especialista =========
export interface Horario {
  especialidad: string;
  dias: string[];   // ["Lunes","Miércoles"]
  horas: string[];  // ["09:00","10:00"]
}

export interface Especialista {
  id: UUID;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  // Opcionales / legacy:
  edad?: number;
  especialidad?: string | null; // si luego normalizás, lo quitás
  avatarUrl?: string | null;
  imagenPerfil?: string | null;
  horarios?: Horario[];
  aprobado?: boolean | null;
  password?: string;           // TODO: eliminar (no guardar password en modelos)
}

export interface SpecialistCounters {
  pacientes: number;               // atendidos ≥1 vez
  turnosHoy: number;
  proximosTurnos: number;
  reseniasPendientes: number;      // consultas sin reseña
}

export interface PacienteFav {
  id: UUID;
  nombre: string;
  avatarUrl: string;
  ultimaVisita?: string;           // ISO o texto
}

// ========= Paciente =========
export interface Paciente {
  id: UUID;
  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  obraSocial: string;
  email: string;
  avatarUrl: string;
  // Opcionales / legacy:
  imagenPerfil1?: string | null;
  imagenPerfil2?: string | null;
  password?: string;               // TODO: eliminar
}

// ========= Historia Clínica =========
export interface HistoriaClinica {
  altura: number;
  peso: number;
  temperatura: number;
  presion: string;
  resumen: string;
  datosDinamicos?: DatoDinamico[];
}

// ========= Turnos: Forma de BD (canónica) =========
export interface TurnoRow {
  id: UUID;
  paciente_id: UUID;
  especialista_id: UUID;
  especialidad: string;
  fecha_iso: string;                  // ISO 8601
  estado: EstadoTurno;
  resena_especialista?: string | null;
  encuesta?: { estrellas?: number; comentario?: string } | null;
  ubicacion?: string | null;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ========= Turnos: Vista/consulta denormalizada =========
// (Renombre del viejo "type TurnoRow = { ... }")
export interface TurnoRowView {
  id: string;
  fecha: string;                 // timestamptz (ISO)
  especialidad: string;
  especialista_id: string;
  especialista_nombre: string;
  paciente_id: string;
  estado: string;                // crudo desde la view
  creado_el: string;             // timestamptz
  finalizado_el: string | null;
}

// ========= Turnos: Dominio (normalizado) =========
export interface Turno {
  id: UUID;
  pacienteId: UUID;
  especialistaId: UUID;
  especialidad: string;
  fecha: Date;                        // normalizado
  estado: EstadoTurno;
  ubicacion?: string | null;
  notas?: string | null;
  resenaEspecialista?: string | null;
  encuesta?: boolean;
  calificacion?: number;              // ej. estrellas
}

// ========= VM para Admin =========
export interface VMAdmin {
  turnosFiltrados: TurnoVM[];
  especialidades: string[];
  especialistas: { id: string; nombre: string; apellido: string }[];
  total: number;
}

// ========= Legacy (mantener por compat mientras migrás) =========
export interface TurnoRowVM  {
  id: string;
  fecha: Date;
  hora: string;
  especialidad: string;
  especialista: { id: string; nombre: string; apellido: string };
  paciente: { id: string; nombre: string; apellido: string };
  estado: EstadoTurno;
}

export interface TurnoEspecialistaVM {
  id: UUID;
  fechaISO: string;
  hora?: string;
  especialidad: string;
  paciente: string;
  estado: EstadoTurno;
  resenaEspecialista?: string | null;
}

export interface TurnoEspecialista {
  id: number;
  fecha: string;    // ya formateada o para date pipe
  hora: string;
  especialidad: string;
  paciente: string;
  estado: EstadoTurno;  // unificado
  resena?: string;
}

