import { LogIngresoTipo } from './tipos.model';

export interface LogIngreso {
  id: string;
  usuario_id: string;
  fecha_hora: string;
  tipo: LogIngresoTipo;
  ip: string | null;
  user_agent: string | null;
}

export interface LogIngresoCreate {
  id?: string;
  usuario_id: string;
  fecha_hora?: string;
  tipo?: LogIngresoTipo;
  ip?: string | null;
  user_agent?: string | null;
}

export type LogIngresoUpdate =
  Partial<Omit<LogIngreso, 'id' | 'usuario_id' | 'fecha_hora'>>;


  