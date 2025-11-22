// ---------- Tipos de respuesta para las estadísticas ----------

import { EstadoTurnoCodigo } from "./tipos.model";

export interface EstadisticaTurnosPorEstado {
  estado_turno_id: string;
  codigo: EstadoTurnoCodigo;
  descripcion: string | null;
  cantidad: number;
}

export interface EstadisticaTurnosPorEspecialidad {
  especialidad_id: string;
  nombre_especialidad: string | null;
  cantidad: number;
}

export interface EstadisticaIngresosPorDia {
  fecha: string;  // 'YYYY-MM-DD'
  cantidad: number;
}

export interface EstadisticaPromedioEstrellasPorEspecialista {
  especialista_id: string;
  nombre: string | null;
  apellido: string | null;
  promedio_estrellas: number;
  cantidad_encuestas: number;
}
