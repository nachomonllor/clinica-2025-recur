// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-resultados-encuesta',
//   standalone: true,
//   imports: [],
//   templateUrl: './resultados-encuesta.component.html',
//   styleUrl: './resultados-encuesta.component.scss'
// })
// export class ResultadosEncuestaComponent {

// }


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Gráficos
import { NgApexchartsModule, ApexChart, ApexAxisChartSeries, ApexXAxis, ApexYAxis, ApexPlotOptions, ApexDataLabels, ApexGrid, ApexFill, ApexTooltip } from 'ng-apexcharts';

import { EstadisticasService } from '../../../services/estadisticas.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  fill: ApexFill;
  tooltip: ApexTooltip;
  colors: string[];
};

@Component({
  selector: 'app-resultados-encuesta',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule,
    NgApexchartsModule
  ],
  templateUrl: './resultados-encuesta.component.html',
  styleUrls: ['./resultados-encuesta.component.scss']
})
export class ResultadosEncuestaComponent implements OnInit {

  cargando = false;
  especialistas: any[] = [];
  filtroEspecialista: string | null = null; // ID del especialista seleccionado

  // Métricas (KPIs)
  totalEncuestas = 0;
  promedioEstrellas = 0;
  promedioPuntualidad = 0;
  porcentajeRecomendacion = 0;

  // Datos para el listado
  comentarios: any[] = [];

  // Configuración del Gráfico
  chartOptions: Partial<ChartOptions> | any = {
    chart: { type: 'bar', height: 350, toolbar: { show: false }, foreColor: '#EAF2FF' },
    plotOptions: { bar: { borderRadius: 4, horizontal: false, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐'], axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { title: { text: 'Votos' } },
    fill: { opacity: 1 },
    grid: { borderColor: 'rgba(255,255,255,0.1)' },
    colors: ['#FF8F00'], // Naranja
    tooltip: { theme: 'dark' }
  };
  chartSeries: ApexAxisChartSeries = [{ name: 'Votos', data: [0, 0, 0, 0, 0] }];

  constructor(private statsService: EstadisticasService) {}

  async ngOnInit() {
    this.cargando = true;
    try {
      this.especialistas = await this.statsService.obtenerListaEspecialistas();
      await this.cargarDatos(); // Carga inicial (todos)
    } catch (e) {
      console.error(e);
    } finally {
      this.cargando = false;
    }
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      const datos = await this.statsService.obtenerResultadosEncuesta(this.filtroEspecialista || undefined);
      this.procesarDatos(datos);
    } catch (error) {
      console.error(error);
    } finally {
      this.cargando = false;
    }
  }

  private procesarDatos(datos: any[]) {
    this.totalEncuestas = datos.length;
    this.comentarios = datos; // Guardamos para el listado

    if (this.totalEncuestas === 0) {
      this.resetearMetricas();
      return;
    }

    // 1. Calcular Promedio Estrellas
    const sumaEstrellas = datos.reduce((acc, curr) => acc + (curr.estrellas || 0), 0);
    this.promedioEstrellas = parseFloat((sumaEstrellas / this.totalEncuestas).toFixed(1));

    // 2. Calcular Promedio Puntualidad (Rango 0-100)
    const sumaPuntualidad = datos.reduce((acc, curr) => acc + (curr.valor_rango || 0), 0);
    this.promedioPuntualidad = Math.round(sumaPuntualidad / this.totalEncuestas);

    // 3. Calcular % Recomendación (Radio 'si')
    const recomendados = datos.filter(d => d.respuesta_radio === 'si').length;
    this.porcentajeRecomendacion = Math.round((recomendados / this.totalEncuestas) * 100);

    // 4. Armar Gráfico de Distribución
    // Contamos cuántos 1s, 2s, 3s, 4s y 5s hay
    const distribucion = [0, 0, 0, 0, 0];
    datos.forEach(d => {
      if (d.estrellas >= 1 && d.estrellas <= 5) {
        distribucion[d.estrellas - 1]++;
      }
    });

    this.chartSeries = [{ name: 'Cantidad', data: distribucion }];
  }

  private resetearMetricas() {
    this.promedioEstrellas = 0;
    this.promedioPuntualidad = 0;
    this.porcentajeRecomendacion = 0;
    this.chartSeries = [{ name: 'Cantidad', data: [0, 0, 0, 0, 0] }];
  }
}