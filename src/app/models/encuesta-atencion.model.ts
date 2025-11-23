export interface EncuestaAtencion {
  id: string;
  turno_id: string;
  paciente_id: string;
  especialista_id: string;
  fecha_respuesta: string;
  comentario: string | null;
  estrellas: number | null;
  respuesta_radio: string | null;
  respuesta_checkbox: string | null;   // ej: "op1,op3"
  valor_rango: number | null;          // 0..100
}

export interface EncuestaAtencionCreate {
  id?: string;
  turno_id: string;
  paciente_id: string;
  especialista_id: string;
  fecha_respuesta?: string;
  comentario?: string | null;
  estrellas?: number | null;
  respuesta_radio?: string | null;
  respuesta_checkbox?: string | null;
  valor_rango?: number | null;
}

export type EncuestaAtencionUpdate =
  Partial<Omit<EncuestaAtencion, 'id' | 'turno_id' | 'paciente_id' | 'especialista_id'>>;


  