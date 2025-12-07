import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import localeEsAr from '@angular/common/locales/es-AR';

registerLocaleData(localeEsAr, 'es-AR');

import {
  ApexAxisChartSeries,
  ChartComponent,
  NgApexchartsModule
} from 'ng-apexcharts';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatRippleModule, MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterLink } from '@angular/router';

import { EstadisticasService } from '../../../services/estadisticas.service';
import { ChartOptions, EstadisticaTurnosPorDia } from '../../models/estadistica.model';

@Component({
  selector: 'app-turnos-por-dia',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatRippleModule,
    MatTooltipModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
    MatCheckboxModule, ReactiveFormsModule, NgApexchartsModule
  ],
  templateUrl: './turnos-por-dia.component.html',
  styleUrls: ['./turnos-por-dia.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' }
  ]
})
export class TurnosPorDiaComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;

  // Variable para el HTML (vista en pantalla)
  logoClinicaBase64: string = '';
  cargando = false;
  error?: string;
  filtrosForm!: FormGroup;

  chartSeries: ApexAxisChartSeries = [{ name: 'Turnos', data: [] }];
  
  chartOptions: Partial<ChartOptions> = {
    chart: {
      type: 'area',
      height: 420,
      toolbar: { show: false },
      foreColor: '#EAF2FF',
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: {
      categories: [],
      title: { text: 'Fecha' },
      tickAmount: 10,
      labels: { rotate: -20, trim: true, style: { colors: '#cbd5e1' } }
    },
    yaxis: {
      title: { text: 'Cantidad de Turnos', style: { color: '#cbd5e1' } },
      labels: { formatter: (val: number) => val.toFixed(0), style: { colors: '#cbd5e1' } },
      min: 0,
      forceNiceScale: true
    },
    colors: ['#22D3EE'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100]
      }
    },
    grid: {
      borderColor: 'rgba(255,255,255,.08)',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    tooltip: {
      theme: 'dark',
      x: { show: true },
      y: { formatter: (val: number) => `${val} turnos` }
    },
    title: { text: '' }
  };

  constructor(
    private fb: FormBuilder,
    private api: EstadisticasService
  ) {
    // Inicializamos el Logo PARA EL HTML (la vista normal)
    const svg = `<svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0099ff;stop-opacity:1"/><stop offset="100%" style="stop-color:#0055b3;stop-opacity:1"/></linearGradient></defs><g transform="translate(50,50)"><path d="M80 0H120A10 10 0 0 1 130 10V80H200A10 10 0 0 1 210 90V130A10 10 0 0 1 200 140H130V210A10 10 0 0 1 120 220H80A10 10 0 0 1 70 210V140H0A10 10 0 0 1-10 130V90A10 10 0 0 1 0 80H70V10A10 10 0 0 1 80 0Z" fill="url(#g)" transform="scale(0.5) translate(30,30)"/><path d="M60 115L90 145L150 85" stroke="white" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.5) translate(30,30)"/></g><g transform="translate(180,115)"><text x="0" y="-25" font-family="Arial" font-weight="bold" font-size="28" fill="#0077cc">CLINICA</text><text x="0" y="25" font-family="Arial" font-weight="bold" font-size="52" fill="#003366">MONLLOR</text></g></svg>`;
    this.logoClinicaBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  ngOnInit(): void {
    this.filtrosForm = this.fb.group({
      desde: [null],
      hasta: [null],
      soloFinalizados: [true]
    });
    this.cargarDatos();
  }

  aplicarFiltros(): void {
    this.cargarDatos();
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      desde: null,
      hasta: null,
      soloFinalizados: true
    });
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.cargando = true;
    this.error = undefined;

    const { desde, hasta, soloFinalizados } = this.filtrosForm.value;
    
    let isoDesde: string | undefined;
    let isoHasta: string | undefined;

    if (desde) {
      const d = new Date(desde);
      d.setHours(0, 0, 0, 0);
      isoDesde = d.toISOString();
    }

    if (hasta) {
      const h = new Date(hasta);
      h.setHours(23, 59, 59, 999);
      isoHasta = h.toISOString();
    }

    this.api
      .turnosPorDia(isoDesde, isoHasta, !!soloFinalizados)
      .subscribe({
        next: (items: EstadisticaTurnosPorDia[]) => {
          const normalizados = items.map(i => ({
            dia: i.fecha.slice(0, 10),
            cantidad: i.cantidad
          }));
          this.renderByDayItems(normalizados);
        },
        error: () => {
          this.error = 'No pudimos cargar los datos.';
          this.cargando = false;
        }
      });
  }

  private labelFromDayKey(dayKey: string): string {
    const [y, m, d] = dayKey.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  }

  private renderByDayItems(items: Array<{ dia: string; cantidad: number }>): void {
    const sorted = [...items].sort((a, b) => a.dia.localeCompare(b.dia));
    const categorias = sorted.map(i => this.labelFromDayKey(i.dia));
    const valores = sorted.map(i => i.cantidad);

    this.chartSeries = [{ name: 'Turnos', data: valores }];
    this.chartOptions = {
      ...this.chartOptions,
      xaxis: {
        ...(this.chartOptions.xaxis ?? {}),
        categories: categorias
      }
    };
    this.cargando = false;
  }

  // === EXPORTAR PDF (LOGO DEFINIDO EN FUNCION) ===
  async descargarPDF(): Promise<void> {
    const DATA = document.getElementById('captura-pdf');
    if (!DATA) return;

    // 1. Definimos el SVG EXACTO que pasaste (para el PDF)
    const svgLogo = `
    <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0099ff;stop-opacity:1" /> 
          <stop offset="100%" style="stop-color:#0055b3;stop-opacity:1" /> 
        </linearGradient>
      </defs>
      <g transform="translate(50, 50)">
        <path d="M 80 0 H 120 A 10 10 0 0 1 130 10 V 80 H 200 A 10 10 0 0 1 210 90 V 130 A 10 10 0 0 1 200 140 H 130 V 210 A 10 10 0 0 1 120 220 H 80 A 10 10 0 0 1 70 210 V 140 H 0 A 10 10 0 0 1 -10 130 V 90 A 10 10 0 0 1 0 80 H 70 V 10 A 10 10 0 0 1 80 0 Z" fill="url(#gradBlue)" transform="scale(0.5) translate(30,30)"/>
        <path d="M 60 115 L 90 145 L 150 85" stroke="white" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.5) translate(30,30)"/>
      </g>
      <g transform="translate(180, 115)">
        <text x="0" y="-25" font-family="Arial" font-weight="bold" font-size="28" fill="#0077cc">CLINICA</text>
        <text x="0" y="25" font-family="Arial" font-weight="bold" font-size="52" fill="#003366">MONLLOR</text>
      </g>
    </svg>`;

    // 2. Convertimos SVG a PNG (Paso critico para que jsPDF no falle)
    const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgLogo)));
    
    const logoImg = new Image();
    logoImg.src = svgBase64;
    // Esperamos que cargue la imagen
    await new Promise((resolve) => { logoImg.onload = resolve; });

    // Dibujamos en un canvas temporal invisible
    const canvasLogo = document.createElement('canvas');
    canvasLogo.width = 600; 
    canvasLogo.height = 200;
    const ctxLogo = canvasLogo.getContext('2d');
    if (ctxLogo) ctxLogo.drawImage(logoImg, 0, 0);
    const logoPng = canvasLogo.toDataURL('image/png');

    // 3. Capturamos el Gráfico (IMPORTANTE: Ocultamos el header HTML para no duplicarlo)
    const canvasChart = await html2canvas(DATA, {
      scale: 2, 
      backgroundColor: '#061126', 
      logging: false,
      useCORS: true,
      onclone: (clonedDoc) => {
        // Buscamos el header en el clon y lo ocultamos, porque lo vamos a dibujar manualmente arriba
        const htmlHeader = clonedDoc.querySelector('.chart-header') as HTMLElement;
        if (htmlHeader) {
          htmlHeader.style.display = 'none';
        }
      }
    });

    const chartPng = canvasChart.toDataURL('image/png');

    // 4. Armamos el PDF
    const pdf = new jsPDF('l', 'mm', 'a4'); // Horizontal
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();

    // A. Logo (Arriba Izquierda)
    pdf.addImage(logoPng, 'PNG', 10, 10, 50, 16); 

    // B. Textos (Arriba Derecha)
    pdf.setFontSize(18);
    pdf.text('Reporte de Turnos por Día', w - 10, 18, { align: 'right' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, w - 10, 24, { align: 'right' });

    // C. Línea divisoria
    pdf.setDrawColor(200);
    pdf.line(10, 30, w - 10, 30);

    // D. Gráfico
    const margin = 10;
    const topMargin = 35; 
    
    // Calculamos proporciones para ajustar al ancho
    const imgProps = pdf.getImageProperties(chartPng);
    const pdfImgWidth = w - (margin * 2);
    const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;

    pdf.addImage(chartPng, 'PNG', margin, topMargin, pdfImgWidth, pdfImgHeight);
    
    pdf.save(`Turnos_Por_Dia_${Date.now()}.pdf`);
  }

  async descargarImagen(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#061126',
      logging: false,
      useCORS: true,
      onclone: (clonedDoc) => {
        // Para la imagen JPG, SÍ queremos ver el header HTML si estaba oculto
        const header = clonedDoc.querySelector('.chart-header') as HTMLElement;
        if (header) {
          header.style.display = 'flex'; 
        }
      }
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.download = `turnos_por_dia_${Date.now()}.jpg`;
    link.click();
  }
}