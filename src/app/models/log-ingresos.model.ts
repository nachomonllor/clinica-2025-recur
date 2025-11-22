import { LogIngresoTipo } from './tipos.model';

// export interface LogIngreso {
//   id: string;
//   usuario_id: string;
//   email: string | null;
//   fecha_hora: string;
//   tipo: LogIngresoTipo;
//   ip: string | null;
//   user_agent: string | null;
// }

export interface LogIngreso {
  id: string;
  usuario_id: string;

  /** Viene de log_ingresos.fecha_hora */
  createdAt: string;

  tipo: string;
  ip: string | null;
  user_agent: string | null;

  /** Info opcional del usuario */
  email?: string | null;
  nombre?: string | null;
  apellido?: string | null;
}


export interface LogIngresoCreate {
  id?: string;
  usuario_id: string;
  fecha_hora?: string;
  tipo?: LogIngresoTipo;
  ip?: string | null;
  user_agent?: string | null;
}

// // src/models/log-ingresos.model.ts
// export interface LogIngreso {
// id: string;
// usuario_id: string | null;
// email: string | null;
// tipo: string | null;
// fecha_hora: string; // ISO string de Supabase
// }

export type LogIngresoUpdate =
  Partial<Omit<LogIngreso, 'id' | 'usuario_id' | 'fecha_hora'>>;

  export type PageToken = number | '…';
