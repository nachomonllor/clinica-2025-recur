import { Interaction } from "chart.js";

// --------- Comunes ---------
export type UUID = string;
export type Rol = 'paciente' | 'especialista' | 'admin';

// --------- Turnos (CANÓNICO) ---------
export type EstadoTurno =
  | 'pendiente' | 'aceptado' | 'confirmado'
  | 'realizado' | 'rechazado' | 'cancelado';

// Aliases de compatibilidad (no usar en código nuevo):
export type TurnoEstado = EstadoTurno;
export type Estado = EstadoTurno;

type VM = {
  turnosFiltrados: Turno[];
  especialidades: string[];
  especialistas: { id: string; nombre: string; apellido: string }[];
  total: number;
};

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

// --------- Admin ---------
export interface AdminCounters {
  usuarios: number;
  especialistasPendientes: number;
  turnosHoy: number;
  turnosPendientes: number;
}

// --------- Perfiles / Auth (alineado a Supabase) ---------
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

// --------- Especialista ---------
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

// --------- Paciente ---------
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

// --------- Historia Clínica ---------
export interface HistoriaClinica {
  altura: number;
  peso: number;
  temperatura: number;
  presion: string;
  resumen: string;
  datosDinamicos?: DatoDinamico[];
}

// Forma de BD
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

// Dominio (normalizado)
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

export interface VMAdmin 
{
  turnosFiltrados: TurnoVM[];
  especialidades: string[];
  especialistas: { id: string; nombre: string; apellido: string }[];
  total: number;
};

export interface TurnoRowVM  {
  id: string;
  fecha: Date;
  hora: string;
  especialidad: string;
  especialista: { id: string; nombre: string; apellido: string };
  paciente: { id: string; nombre: string; apellido: string };
  estado: EstadoTurno;
};


export interface TurnoVM {
  id: UUID;
  especialidad: string;
  especialista: string;    // "Apellido, Nombre"
  estado: EstadoTurno;

  // Canónico:
  fechaISO: string;

  // Compatibilidad legacy:
  fecha?: Date;
  hora?: string;

  // Extras:
  pacienteId?: UUID;
  especialistaId?: UUID;
  ubicacion?: string | null;
  notas?: string | null;
  tieneResena?: boolean;
  resenaEspecialista?: string | null;
  encuesta?: boolean;
  calificacion?: number;

  // =============================
  pacienteNombre?: string;
  motivo?: string | null;
}


// VM para especialista POR SI SE NECESITA SEPARADO
export interface TurnoEspecialistaVM {
  id: UUID;
  fechaISO: string;
  hora?: string;
  especialidad: string;
  paciente: string;
  estado: EstadoTurno;
  resenaEspecialista?: string | null;
}

// src/app/models/turno-especialista.model.ts
export interface TurnoEspecialista {
    id: number;
    fecha: string;    // la mostrarás con un date pipe, o viene ya formateada
    hora: string;
    especialidad: string;
    paciente: string; // aquí guardas el nombre o “Nombre Apellido (ID)”
    estado: 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado';
    resena?: string;  // la reseña que deja el especialista
}

export interface TurnoVm {
  id: string;
  especialidad: string;
  especialista: string;
  fechaISO: string;
  estado: Estado;
  tieneResenia?: boolean;
  puedeEncuesta?: boolean;
}

export interface Counters {
  pacientes: number;
  turnosHoy: number;
  proximosTurnos: number;
  reseniasPendientes: number;
}










