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
import { MatOptionModule } from '@angular/material/core';

// Gráficos & PDF
import { NgApexchartsModule, ApexChart, ApexAxisChartSeries, ApexXAxis, ApexYAxis, ApexPlotOptions, ApexDataLabels, ApexGrid, ApexFill, ApexTooltip } from 'ng-apexcharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
    MatCardModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatOptionModule,
    NgApexchartsModule
  ],
  templateUrl: './resultados-encuesta.component.html',
  styleUrls: ['./resultados-encuesta.component.scss']
})
export class ResultadosEncuestaComponent implements OnInit {

  cargando = false;
  especialistas: any[] = [];
  filtroEspecialista: string | null = null;

  // Métricas (KPIs)
  totalEncuestas = 0;
  promedioEstrellas = 0;
  promedioPuntualidad = 0;
  porcentajeRecomendacion = 0;

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
    colors: ['#FF8F00'], 
    tooltip: { theme: 'dark' }
  };
  chartSeries: ApexAxisChartSeries = [{ name: 'Votos', data: [0, 0, 0, 0, 0] }];

  // Variable para el logo en Base64 (SVG)
  logoClinicaBase64: string = '';

  constructor(private statsService: EstadisticasService) {
    const svg = `<svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0099ff;stop-opacity:1"/><stop offset="100%" style="stop-color:#0055b3;stop-opacity:1"/></linearGradient></defs><g transform="translate(50,50)"><path d="M80 0H120A10 10 0 0 1 130 10V80H200A10 10 0 0 1 210 90V130A10 10 0 0 1 200 140H130V210A10 10 0 0 1 120 220H80A10 10 0 0 1 70 210V140H0A10 10 0 0 1-10 130V90A10 10 0 0 1 0 80H70V10A10 10 0 0 1 80 0Z" fill="url(#g)" transform="scale(0.5) translate(30,30)"/><path d="M60 115L90 145L150 85" stroke="white" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.5) translate(30,30)"/></g><g transform="translate(180,115)"><text x="0" y="-25" font-family="Arial" font-weight="bold" font-size="28" fill="#0077cc">CLINICA</text><text x="0" y="25" font-family="Arial" font-weight="bold" font-size="52" fill="#003366">MONLLOR</text></g></svg>`;
    this.logoClinicaBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  async ngOnInit() {
    this.cargando = true;
    try {
      this.especialistas = await this.statsService.obtenerListaEspecialistas();
      await this.cargarDatos(); 
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
    this.comentarios = datos; 

    if (this.totalEncuestas === 0) {
      this.resetearMetricas();
      return;
    }

    const sumaEstrellas = datos.reduce((acc, curr) => acc + (curr.estrellas || 0), 0);
    this.promedioEstrellas = parseFloat((sumaEstrellas / this.totalEncuestas).toFixed(1));

    const sumaPuntualidad = datos.reduce((acc, curr) => acc + (curr.valor_rango || 0), 0);
    this.promedioPuntualidad = Math.round(sumaPuntualidad / this.totalEncuestas);

    const recomendados = datos.filter(d => d.respuesta_radio === 'si').length;
    this.porcentajeRecomendacion = Math.round((recomendados / this.totalEncuestas) * 100);

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

  // === FUNCIÓN DESCARGAR PDF CORREGIDA ===
  async descargarPDF() {
    const DATA = document.getElementById('dashboard-content');
    if (!DATA) return;

    let nombreEspecialista = 'Todos los especialistas';
    if (this.filtroEspecialista) {
      const esp = this.especialistas.find(e => e.id === this.filtroEspecialista);
      if (esp) {
        nombreEspecialista = `Dr/a. ${esp.apellido}, ${esp.nombre}`;
      }
    }

    // 1. Capturar contenido del Dashboard
    const canvas = await html2canvas(DATA, { scale: 2, backgroundColor: '#020617' });
    const imgWidth = 190; 
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const contentDataURL = canvas.toDataURL('image/png');

    // 2. CONVERTIR LOGO SVG -> PNG (Solución del error "wrong PNG signature")
    // Creamos una imagen temporal con el SVG
    const logoImg = new Image();
    logoImg.src = this.logoClinicaBase64;
    // Esperamos a que cargue
    await new Promise(resolve => logoImg.onload = resolve);

    // Lo dibujamos en un canvas temporal
    const canvasLogo = document.createElement('canvas');
    canvasLogo.width = 600; // Ancho original de tu SVG
    canvasLogo.height = 200; // Alto original de tu SVG
    const ctxLogo = canvasLogo.getContext('2d');
    if (ctxLogo) ctxLogo.drawImage(logoImg, 0, 0);
    
    // Obtenemos el DATA URL ahora sí en formato PNG
    const logoPngUrl = canvasLogo.toDataURL('image/png');

    // 3. Generar PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Header: Logo (PNG)
    pdf.addImage(logoPngUrl, 'PNG', 10, 10, 50, 16); 

    // Header: Textos
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Resultados de Encuestas', 200, 18, { align: 'right' });
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text(`Filtro: ${nombreEspecialista}`, 200, 24, { align: 'right' });
    
    pdf.setFontSize(9);
    pdf.text(`Emisión: ${new Date().toLocaleDateString()}`, 200, 29, { align: 'right' });

    pdf.setDrawColor(200);
    pdf.line(10, 32, 200, 32);

    // Contenido
    pdf.addImage(contentDataURL, 'PNG', 10, 40, imgWidth, imgHeight);
    
    pdf.save('resultados_encuestas.pdf');
  }
}

