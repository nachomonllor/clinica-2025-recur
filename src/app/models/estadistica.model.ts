// ==== Tipos base para estadísticas ====
// export interface EstadisticaTurnosPorEstado {
//   estado_turno_id: string;
//   codigo: EstadoTurnoCodigo;
//   descripcion: string | null;
//   cantidad: number;
// }

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

// export type ChartOptions = {
//   series: ApexAxisChartSeries;
//   chart: ApexChart;
//   dataLabels: ApexDataLabels;
//   plotOptions: ApexPlotOptions;
//   xaxis: ApexXAxis;
//   yaxis: ApexYAxis;
//   title: ApexTitleSubtitle;
//   tooltip: ApexTooltip;
//   grid: ApexGrid;
//   stroke: ApexStroke;
//   fill: ApexFill;
//   colors: string[];
// };

// models/estadisticas.models.ts (o donde tengas los tipos)
export interface EstadisticaTurnosPorDia {
  fecha: string;    // 'YYYY-MM-DD'
  cantidad: number;
}

// src/app/models/estadistica.model.ts

// ==== Tipos base para estadísticas ====

export interface EstadisticaTurnosPorDia {
  fecha: string;      // 'YYYY-MM-DD'
  cantidad: number;
}

export interface EstadisticaIngresosPorDia {
  fecha: string;      // 'YYYY-MM-DD'
  cantidad: number;
}

export interface EstadisticaTurnosPorEstado {
  estado_turno_id: string;
  codigo: string | null;
  descripcion: string | null;
  cantidad: number;
}

export interface EstadisticaTurnosPorEspecialidad {
  especialidad_id: string;
  nombre_especialidad: string | null;
  cantidad: number;
}

export interface EstadisticaPromedioEstrellasPorEspecialista {
  especialista_id: string;
  nombre: string | null;
  apellido: string | null;
  promedio_estrellas: number;
  cantidad_encuestas: number;
}

// ==== Tipos usados por el dashboard de estadísticas ====

export interface TurnoEstadistica {
  id: string;
  especialista_id: string | null;
  especialidad: string | null;
  fecha_iso: string | null;
  created_at: string | null;
  estado: string | null;   // 'pendiente', 'realizado', etc
}

export interface PerfilBasico {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ==== Opcional: tipo "suave" para ApexCharts ====

export interface ChartOptions {
  chart?: any;
  plotOptions?: any;
  dataLabels?: any;
  xaxis?: any;
  yaxis?: any;
  stroke?: any;
  tooltip?: any;
  fill?: any;
  grid?: any;
  colors?: any;
  title?: any;
  [key: string]: any;
}

export type TarjetaEstadistica = {
  titulo: string;
  subtitulo: string;
  icono: string;
  ruta: string;
  aria?: string;
};

export interface EstadisticaTurnosPorMedico {
  especialista_id: string;
  nombre: string | null;
  apellido: string | null;
  cantidad: number;
}

export interface EstadisticaPacientesPorEspecialidad {
  especialidad: string;
  cantidad_pacientes: number;
}

export interface EstadisticaMedicosPorEspecialidad {
  especialidad: string;
  cantidad_medicos: number;
}

export interface EncuestaCompleta {
  id: string;
  turno_id: string;
  paciente_id: string;
  especialista_id: string;
  fecha_respuesta: string;
  comentario: string | null;
  estrellas: number | null;
  respuesta_radio: string | null;
  respuesta_checkbox: string | null;
  valor_rango: number | null;
  especialista_nombre: string | null;
  especialista_apellido: string | null;
  paciente_nombre: string | null;
  paciente_apellido: string | null;
  especialidad: string | null;
  fecha_turno: string | null;
}

export interface TurnoPacienteCompleto {
  id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: string;
  estado_descripcion: string | null;
  especialidad: string;
  especialista_nombre: string | null;
  especialista_apellido: string | null;
  motivo: string | null;
  comentario: string | null;
}
