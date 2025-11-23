// src/app/models/pacientes-especialista.model.ts

export interface PacienteAtendido {
  id: string;
  nombre: string;
  apellido: string;
  dni?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

/**
 * Turno tal como lo muestra el especialista para un paciente.
 *  ====> CONSIDERAR: `fechaTexto` ya viene formateada para la UI.
 */
export interface TurnoDetalle {
  id: string;
  especialidad: string;
  estado: string;       // 'pendiente' | 'aceptado' | 'realizado' | etc.
  fechaTexto: string;   // ej. "10 ene 2025, 14:30"
  resena?: string;      // reseña del especialista, opcional
}

// =====> Modelos usados en PacientesEspecialistaComponent

export interface PacienteAtendido {
  id: string;
  nombre: string;
  apellido: string;
  dni?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

export interface TurnoDetalle {
  id: string;
  especialidad: string;
  estado: string;      // texto de estado (pendiente, aceptado, etc.)
  fechaTexto: string;  // fecha ya formateada para mostrar
  resena?: string;     // reseña del especialista (opcional)
}
