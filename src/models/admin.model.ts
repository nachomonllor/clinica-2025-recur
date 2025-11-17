import { TurnoVM } from "./turno.model";

// ========= VM para Admin =========
export interface VMAdmin {
  turnosFiltrados: TurnoVM[];
  especialidades: string[];
  especialistas: { id: string; nombre: string; apellido: string }[];
  total: number;
}
