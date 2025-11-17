import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexPlotOptions, ApexXAxis, ApexYAxis, ApexTitleSubtitle, ApexTooltip, ApexGrid, ApexStroke, ApexFill } from "ng-apexcharts";

export interface TarjetaEstadistica {
  titulo: string;
  subtitulo: string;
  icono: string;
  ruta: string;
  aria?: string;
};

export interface ChartOptions {
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


