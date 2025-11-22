import { TipoControl } from './tipos.model';

export interface HistoriaClinica {
  id: string;
  paciente_id: string;
  especialista_id: string;
  turno_id: string | null;
  fecha_registro: string;
  altura: number | null;
  peso: number | null;
  temperatura: number | null;
  presion: string | null;
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

  