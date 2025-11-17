import { EstadoTurno, TurnoVM } from "./turno.model";

import { SpecialistCounters } from './especialista.model';

// ========= Comunes =========
export type UUID = string;
export type Rol = 'paciente' | 'especialista' | 'admin';

// Filtros para la sección Usuarios
export type RolTab = 'todos' | Rol;
export type EstadoTab = 'todos' | 'habilitados' | 'pendientes' | 'inhabilitados';

// // ========= Turnos (CANÓNICO) =========
// export type EstadoTurno =
//   | 'pendiente' | 'aceptado' | 'confirmado'
//   | 'realizado' | 'rechazado' | 'cancelado';


// Aliases de compatibilidad (no usar en código nuevo)
export type TurnoEstado = EstadoTurno;
export type Estado = EstadoTurno;

// Alias de compatibilidad
export type TurnoVm = TurnoVM;
export type Counters = SpecialistCounters;


// ========= VM para Admin =========
export interface VMAdmin {
  turnosFiltrados: TurnoVM[];
  especialidades: string[];
  especialistas: { id: string; nombre: string; apellido: string }[];
  total: number;
}
