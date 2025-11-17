
export type UUID = string;

export interface EspecialistaOption {
    id: string;
    nombre: string;
    apellido: string;
    especialidad: string;
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

export type Especialidad =
  | 'clinica'
  | 'pediatria'
  | 'cardiologia'
  | 'dermatologia'
  | 'traumatologia'
  | 'ginecologia'
  | 'otorrinolaringologia'
  | 'neurologia';

  
// ========= Especialista =========
export interface Horario {
  especialidad: string;
  dias: string[];   // ["Lunes","Miércoles"]
  horas: string[];  // ["09:00","10:00"]
}
