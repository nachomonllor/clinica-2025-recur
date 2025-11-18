import { UUID } from "./admin.model";
import { PerfilMin } from "./perfil.model";

export interface Turno {
  id: number;
  fecha: Date;
  hora: string;
  especialidad: string;
  especialista: string;
  pacienteId?: string;
  estado: TurnoEstado;
  // reseña que deja el especialista
  resenaEspecialista?: string;
  resena:string;
  calificacion: number;
  // comentario / calificación del paciente (opcional, si los usas)
  comentarioPaciente?: string;
  calificacionPaciente?: number;
  encuesta?: boolean;
}

// // turno.model.ts
// export type TurnoEstado = 
//   | 'pendiente'
//   | 'realizado'
//   | 'cancelado'
//   | 'rechazado'
//   | 'aceptado';

// Único dueño del estado
export type EstadoTurno =
  | 'pendiente'
  | 'aceptado'
  | 'confirmado'
  | 'realizado'
  | 'rechazado'
  | 'cancelado';

// ALIAS DE COMPATIBILIDAD
export type TurnoEstado = EstadoTurno;


export interface TurnoDto {
  pacienteId: string;
  id: number;
  fecha: string;
  hora: string;
  especialidad: string;
  especialista: string;
  estado: TurnoEstado;     // ← ahora es el mismo union
  resena?: string;
  encuesta?: boolean;
  calificacion?: number;
}

/** Estructura tal como viene de la BD (tabla 'turnos') */
export interface TurnoRow {
  id: string;
  paciente_id: string;
  especialista_id: string;
  especialidad: string;
  fecha_iso: string;          // ISO string
  estado: EstadoTurno;
  resena_especialista?: string | null;
  encuesta?: any | null;      // { estrellas?: number, comentario?: string, ... }
  ubicacion?: string | null;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
}


// ========= VM ÚNICO de turnos (con alias de compatibilidad) =========
export interface TurnoVM {
  id: UUID;
  especialidad: string;
  estado: EstadoTurno;

  // Fecha canónica
  fechaISO: string;
  fecha: Date;                // sólo día

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
  //fecha?: Date;
  hora: string ;
  /** @deprecated usar tieneResena */
  tieneResenia?: boolean;
  /** @deprecated usar encuesta */
  puedeEncuesta?: boolean;

    //id: string;
  //fecha: Date;                // sólo día
  //hora: string;               // 'HH:mm'
 // especialidad: string;
 // especialista: string;       // "Apellido, Nombre"
 // estado: EstadoTurno;
  resena?: string;
 // encuesta?: boolean;         // true si tiene encuesta cargada
 // pacienteId: string;
 // calificacion?: number;      // p. ej. estrellas
  historiaBusqueda?: string;  // string de búsqueda con datos de historia clínica
}


/**  interfaz antigua para mocks */
export interface TurnoMock {
  id: number;
  fecha: Date;
  hora: string;
  especialidad: string;
  especialista: string;
  estado: EstadoTurno;
  resena?: string;
  encuesta?: boolean;
  pacienteId: string;
  calificacion?: number;
}

export type TurnoUI = TurnoVM & {
  paciente: string;
  especialista: string;
  fecha: Date;
  hora: string;
  patologiasText: string; // texto indexable desde historia clínica
};

// export type TurnoUI = TurnoVM & {
//   paciente: string;
//   especialista: string;
//   patologiasText: string; // sin repetir fecha/hora
// };


export interface TurnoSupabase {
  id: string;
  fecha_iso: string | null;
  estado: string | null;
  especialidad: string | null;
  paciente?: PerfilMin | null;
  especialista?: PerfilMin | null;
}

export interface TurnoResumen {
  id: string;
  fechaTexto: string;
  estado: string;
  especialidad: string;
  contraparte: string;
}

export interface TurnoDetalle {
  id: string;
  especialidad: string;
  fechaTexto: string;
  estado: string;
  resena?: string;
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


// src/models/turno.model.ts

export function mapRowToVM(row: TurnoRow): TurnoVM {
  const d = new Date(row.fecha_iso);
  const fecha = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const hora =
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

  return {
    id: row.id,
    especialidad: row.especialidad,
    estado: row.estado,

    // tiempo
    fechaISO: row.fecha_iso,
    fecha,
    hora,

    // ids
    especialistaId: row.especialista_id,
    pacienteId: row.paciente_id,

    // extras
    ubicacion: row.ubicacion ?? null,
    notas: row.notas ?? null,
    resenaEspecialista: row.resena_especialista ?? null,
    resena: row.resena_especialista ?? undefined, // <=====================
    tieneResena: !!row.resena_especialista,
    encuesta: !!row.encuesta,
    calificacion:
      row.encuesta && typeof row.encuesta.estrellas === 'number'
        ? row.encuesta.estrellas
        : undefined,
  };
}




