import { DatoDinamico } from './dato-dinamico.model';
import { TipoControl } from './tipos.model';

export interface HistoriaClinica {
  id: string;

  paciente_id: string;
  especialista_id: string;

  // en la tabla es opcional, en el código a veces puede venir null
  turno_id: string | null;

  // en tu esquema SQL se llama fecha_registro (timestamptz)
  fecha_registro: string;       // ISO string

  // por compatibilidad con Supabase (created_at) si en algún momento lo usaste
  created_at?: string;

  // datos fijos (mejor permitir null por si vienen vacíos)
  altura: number | null;
  peso: number | null;
  temperatura: number | null;
  presion: string | null;

  // columna JSONB o campo que traés “join-eado” con historia_datos_dinamicos
  datos_dinamicos?: DatoDinamico[] | null;
}

export interface HistoriaClinicaCreate {
  id?: string;
  paciente_id: string;
  especialista_id: string;
  turno_id?: string | null;
  fecha_registro?: string;
  altura?: number | null;
  peso?: number | null;
  temperatura?: number | null;
  presion?: string | null;
}

export type HistoriaClinicaUpdate =
  Partial<Omit<HistoriaClinica, 'id' | 'paciente_id' | 'especialista_id'>>;

export interface HistoriaDatoDinamico {
  id: string;
  historia_id: string;
  clave: string;
  tipo_control: TipoControl | null;
  valor_texto: string | null;
  valor_numerico: number | null;
  valor_boolean: boolean | null;
}

export interface HistoriaDatoDinamicoCreate {
  id?: string;
  historia_id: string;
  clave: string;
  tipo_control?: TipoControl | null;
  valor_texto?: string | null;
  valor_numerico?: number | null;
  valor_boolean?: boolean | null;
}

export type HistoriaDatoDinamicoUpdate =
  Partial<Omit<HistoriaDatoDinamico, 'id' | 'historia_id'>>;

  

