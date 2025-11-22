import { EstadoTurnoCodigo } from './tipos.model';

export interface Turno {
  id: string;
  paciente_id: string;
  especialista_id: string;
  especialidad_id: string;
  estado_turno_id: string;
  fecha_hora_inicio: string;           // ISO
  fecha_hora_fin: string;             // ISO
  motivo: string | null;
  comentario: string | null;
  fecha_creacion: string;
  fecha_ultima_actualizacion: string;
}

export interface TurnoCreate {
  id?: string;
  paciente_id: string;
  especialista_id: string;
  especialidad_id: string;
  estado_turno_id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  motivo?: string | null;
  comentario?: string | null;
  fecha_creacion?: string;
  fecha_ultima_actualizacion?: string;
}

export type TurnoUpdate =
  Partial<Omit<Turno, 'id' | 'paciente_id' | 'especialista_id'>>;

// Vista enriquecida para joins (opcional, muy útil para la UI)
export interface TurnoConDetalle extends Turno {
  paciente_nombre?: string;
  paciente_apellido?: string;
  especialista_nombre?: string;
  especialista_apellido?: string;
  especialidad_nombre?: string;
  estado_codigo?: EstadoTurnoCodigo;
}

export type EstadoTurnoUI = EstadoTurnoCodigo;  // <===== misma unión 


/**
 * Modelo de vista para la tabla de turnos del admin.
 * Tiene lo que necesita la UI, con algunos campos clave fuertemente tipados
 * y una index signature para que el template pueda usar extras sin que TS se queje.
 */
export interface TurnoUI {
  id: string;
  pacienteId: string;
  especialistaId: string;
  especialidadId: string;

  paciente: string;
  especialista: string;
  especialidad: string;

  fecha: Date;
  fechaISO: string;
  hora: string;

  estado: EstadoTurnoUI;
  motivo: string | null;
  comentario: string | null;

  patologiasText: string;   // usado para búsqueda (motivo + comentario)

  [key: string]: any;       // para campos adicionales que el template pudiera usar
}
