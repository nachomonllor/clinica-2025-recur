

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


// export interface Turno {
//   pacienteId?: string;
//   paciente?: string;
//   id: number;
//   fecha: Date;            // reemplazo string por DATE
//   hora: string;
//   especialidad: string;
//   especialista: string;
//   estado: 'pendiente' | 'realizado' | 'cancelado' | 'rechazado' | 'aceptado';
//   resena?: string;
//   encuesta?: boolean;
//   calificacion?: number;
// }

// turno.model.ts
export type TurnoEstado = 
  | 'pendiente'
  | 'realizado'
  | 'cancelado'
  | 'rechazado'
  | 'aceptado';

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

export type EstadoTurno = 'pendiente'|'aceptado'|'realizado'|'cancelado'|'rechazado';

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
  created_at?: string;
  updated_at?: string;
}

/** Estructura para la vista (lo que muestra la tabla en la USER IINTERFACE) */
export interface TurnoVM {
  id: string;
  fecha: Date;                // sólo día
  hora: string;               // 'HH:mm'
  especialidad: string;
  especialista: string;       // "Apellido, Nombre"
  estado: EstadoTurno;
  resena?: string;
  encuesta?: boolean;         // true si tiene encuesta cargada
  pacienteId: string;
  calificacion?: number;      // p. ej. estrellas
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
