// ---------- Tipos de respuesta para las estadísticas ----------

import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexPlotOptions, ApexXAxis, ApexYAxis, ApexTitleSubtitle, ApexTooltip, ApexGrid, ApexStroke, ApexFill } from "ng-apexcharts";
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

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  stroke: ApexStroke;
  fill: ApexFill;
  colors: string[];
};