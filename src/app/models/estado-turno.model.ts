import { EstadoTurnoCodigo } from './tipos.model';

export interface EstadoTurno {
  id: string;
  codigo: EstadoTurnoCodigo;
  descripcion: string | null;
  orden: number | null;
}

export interface EstadoTurnoCreate {
  id?: string;
  codigo: EstadoTurnoCodigo;
  descripcion?: string | null;
  orden?: number | null;
}

export type EstadoTurnoUpdate =
  Partial<Omit<EstadoTurno, 'id' | 'codigo'>>;


  