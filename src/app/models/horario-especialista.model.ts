export interface HorarioEspecialista {
  id: string;
  especialista_id: string;
  especialidad_id: string | null;
  dia_semana: number;               // 0=domingo ... 6=sábado
  hora_desde: string;               // 'HH:mm:ss'
  hora_hasta: string;               // 'HH:mm:ss'
  duracion_turno_minutos: number;
}

export interface HorarioEspecialistaCreate {
  id?: string;
  especialista_id: string;
  especialidad_id?: string | null;
  dia_semana: number;
  hora_desde: string;
  hora_hasta: string;
  duracion_turno_minutos?: number;  // default 30
}

export type HorarioEspecialistaUpdate =
  Partial<Omit<HorarioEspecialista, 'id' | 'especialista_id'>>;

  