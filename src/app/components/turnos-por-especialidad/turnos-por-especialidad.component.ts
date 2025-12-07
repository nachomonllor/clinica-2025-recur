import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  ApexChart, ApexDataLabels, ApexFill, ApexLegend,
  ApexNonAxisChartSeries, ApexPlotOptions, ApexResponsive, ApexStroke,
  ApexTitleSubtitle, ApexTooltip, ChartComponent, NgApexchartsModule
} from 'ng-apexcharts';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { EstadisticasService } from '../../../services/estadisticas.service';
import { EstadisticaTurnosPorEspecialidad } from '../../models/estadistica.model';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  fill: ApexFill;
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  colors: string[];
  tooltip: ApexTooltip;
  title: ApexTitleSubtitle;
  stroke: ApexStroke;
};

@Component({
  selector: 'app-turnos-por-especialidad',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatRippleModule,
    MatTooltipModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
    NgApexchartsModule
  ],
  templateUrl: './turnos-por-especialidad.component.html',
  styleUrls: ['./turnos-por-especialidad.component.scss']
})
export class TurnosPorEspecialidadComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;

  cargando = false;
  error?: string;
  filtrosForm!: FormGroup;
  logoClinicaBase64: string = '';

  chartSeries: ApexNonAxisChartSeries = [];

  chartOptions: ChartOptions = {
    series: [],
    chart: {
      type: 'pie',
      height: 380,
      foreColor: '#EAF2FF',
      background: 'transparent',
      toolbar: { show: true }
    },
    labels: [],
    colors: ['#1E88E5', '#43A047', '#E53935', '#FB8C00', '#8E24AA', '#00ACC1', '#FFD600', '#546E7A'],
    legend: {
      position: 'bottom',
      labels: { colors: '#EAF2FF' }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: any) {
        return val.toFixed(1) + "%";
      },
      dropShadow: { enabled: false }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function (val) {
          return val + " turnos";
        }
      }
    },
    stroke: {
      show: true,
      colors: ['#061126']
    },
    title: { text: '' },
    fill: {
      opacity: 1
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 300 },
          legend: { position: 'bottom' }
        }
      }
    ]
  };

  constructor(
    private fb: FormBuilder,
    private api: EstadisticasService
  ) {
    // Logo SVG en Base64
    const svg = `<svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0099ff;stop-opacity:1"/><stop offset="100%" style="stop-color:#0055b3;stop-opacity:1"/></linearGradient></defs><g transform="translate(50,50)"><path d="M80 0H120A10 10 0 0 1 130 10V80H200A10 10 0 0 1 210 90V130A10 10 0 0 1 200 140H130V210A10 10 0 0 1 120 220H80A10 10 0 0 1 70 210V140H0A10 10 0 0 1-10 130V90A10 10 0 0 1 0 80H70V10A10 10 0 0 1 80 0Z" fill="url(#g)" transform="scale(0.5) translate(30,30)"/><path d="M60 115L90 145L150 85" stroke="white" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.5) translate(30,30)"/></g><g transform="translate(180,115)"><text x="0" y="-25" font-family="Arial" font-weight="bold" font-size="28" fill="#0077cc">CLINICA</text><text x="0" y="25" font-family="Arial" font-weight="bold" font-size="52" fill="#003366">MONLLOR</text></g></svg>`;
    this.logoClinicaBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  async ngOnInit(): Promise<void> {
    this.filtrosForm = this.fb.group({
      desde: [null],
      hasta: [null],
    });
    await this.cargarDatos();
  }

  aplicarFiltros(): void {
    this.cargarDatos();
  }

  // === LÓGICA CORREGIDA PARA LAS FECHAS ===
  private async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.error = undefined;

    const { desde, hasta } = this.filtrosForm.value;
    
    let isoDesde: string | undefined;
    let isoHasta: string | undefined;

    // 1. Procesar "Desde": Forzamos inicio del día (00:00:00)
    if (desde) {
      const d = new Date(desde);
      d.setHours(0, 0, 0, 0);
      isoDesde = d.toISOString();
    }

    // 2. Procesar "Hasta": Forzamos FINAL del día (23:59:59)
    // Esto es clave para que incluya los turnos de ese día
    if (hasta) {
      const h = new Date(hasta);
      h.setHours(23, 59, 59, 999);
      isoHasta = h.toISOString();
    }

    try {
      const items: EstadisticaTurnosPorEspecialidad[] =
        await this.api.obtenerTurnosPorEspecialidad({ desde: isoDesde, hasta: isoHasta });

      const categorias = items.map(i => i.nombre_especialidad ?? 'Sin nombre');
      const valores = items.map(i => Number(i.cantidad));

      this.chartSeries = valores;
      
      this.chartOptions = {
        ...this.chartOptions,
        labels: categorias
      };

    } catch (err) {
      console.error(err);
      this.error = 'No pudimos cargar los datos.';
    } finally {
      this.cargando = false;
    }
  }

  // --- DESCARGA PDF ---
  async descargarPDF(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#061126',
      logging: false,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const ratio = canvas.width / canvas.height;

    let w = pdfW - 20;
    let h = w / ratio;

    if (h > pdfH - 20) {
      h = pdfH - 20;
      w = h * ratio;
    }

    const x = (pdfW - w) / 2;
    const y = (pdfH - h) / 2;

    pdf.addImage(imgData, 'PNG', x, y, w, h);
    pdf.save(`estadistica_tortas_${new Date().getTime()}.pdf`);
  }

  // --- DESCARGA IMAGEN ---
  async descargarImagen(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#061126',
      logging: false,
      useCORS: true
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.download = `estadistica_grafico_${new Date().getTime()}.jpg`;
    link.click();
  }
}



// import { Component, OnInit, ViewChild } from '@angular/core';
// import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

// import {
//   ApexChart, ApexDataLabels, ApexFill, ApexLegend,
//   ApexNonAxisChartSeries, ApexPlotOptions, ApexResponsive, ApexStroke,
//   ApexTitleSubtitle, ApexTooltip, ChartComponent, NgApexchartsModule
// } from 'ng-apexcharts';

// import { jsPDF } from 'jspdf';
// import html2canvas from 'html2canvas';

// import { MatButtonModule } from '@angular/material/button';
// import { MatCardModule } from '@angular/material/card';
// import { MatRippleModule, MatNativeDateModule } from '@angular/material/core';
// import { MatDatepickerModule } from '@angular/material/datepicker';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatIconModule } from '@angular/material/icon';
// import { MatInputModule } from '@angular/material/input';
// import { MatMenuModule } from '@angular/material/menu';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { CommonModule } from '@angular/common';
// import { RouterLink } from '@angular/router';

// import { EstadisticasService } from '../../../services/estadisticas.service';
// import { EstadisticaTurnosPorEspecialidad } from '../../models/estadistica.model';

// // Definición estricta de tipos para el gráfico
// export type ChartOptions = {
//   series: ApexNonAxisChartSeries;
//   chart: ApexChart;
//   responsive: ApexResponsive[];
//   labels: any;
//   fill: ApexFill;
//   legend: ApexLegend;
//   dataLabels: ApexDataLabels;
//   colors: string[];
//   tooltip: ApexTooltip;
//   title: ApexTitleSubtitle;
//   stroke: ApexStroke;
// };

// @Component({
//   selector: 'app-turnos-por-especialidad',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
//     MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatRippleModule,
//     MatTooltipModule, MatFormFieldModule, MatInputModule,
//     MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
//     NgApexchartsModule
//   ],
//   templateUrl: './turnos-por-especialidad.component.html',
//   styleUrls: ['./turnos-por-especialidad.component.scss']
// })
// export class TurnosPorEspecialidadComponent implements OnInit {
//   @ViewChild('chart') chart!: ChartComponent;

//   cargando = false;
//   error?: string;
//   filtrosForm!: FormGroup;
//   logoClinicaBase64: string = '';

//   // Configuración de datos de la serie
//   chartSeries: ApexNonAxisChartSeries = [];

//   // CORRECCIÓN: Inicializamos TODAS las propiedades obligatorias
//   // Ya no usamos Partial<ChartOptions>, sino ChartOptions completo.
//   chartOptions: ChartOptions = {
//     series: [],
//     chart: {
//       type: 'pie',
//       height: 380,
//       foreColor: '#EAF2FF',
//       background: 'transparent',
//       toolbar: { show: true }
//     },
//     labels: [],
//     colors: ['#1E88E5', '#43A047', '#E53935', '#FB8C00', '#8E24AA', '#00ACC1', '#FFD600', '#546E7A'],
//     legend: {
//       position: 'bottom',
//       labels: { colors: '#EAF2FF' }
//     },
//     dataLabels: {
//       enabled: true,
//       formatter: function (val: any) {
//         return val.toFixed(1) + "%";
//       },
//       dropShadow: { enabled: false }
//     },
//     tooltip: {
//       theme: 'dark',
//       y: {
//         formatter: function (val) {
//           return val + " turnos";
//         }
//       }
//     },
//     stroke: {
//       show: true,
//       colors: ['#061126']
//     },
//     title: { text: '' },
//     // Propiedades extra que pide el HTML (aunque estén vacías, deben existir)
//     fill: {
//       opacity: 1
//     },
//     responsive: [
//       {
//         breakpoint: 480,
//         options: {
//           chart: { width: 300 },
//           legend: { position: 'bottom' }
//         }
//       }
//     ]
//   };

//   constructor(
//     private fb: FormBuilder,
//     private api: EstadisticasService
//   ) {
//     // Logo SVG en Base64
//     const svg = `<svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0099ff;stop-opacity:1"/><stop offset="100%" style="stop-color:#0055b3;stop-opacity:1"/></linearGradient></defs><g transform="translate(50,50)"><path d="M80 0H120A10 10 0 0 1 130 10V80H200A10 10 0 0 1 210 90V130A10 10 0 0 1 200 140H130V210A10 10 0 0 1 120 220H80A10 10 0 0 1 70 210V140H0A10 10 0 0 1-10 130V90A10 10 0 0 1 0 80H70V10A10 10 0 0 1 80 0Z" fill="url(#g)" transform="scale(0.5) translate(30,30)"/><path d="M60 115L90 145L150 85" stroke="white" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.5) translate(30,30)"/></g><g transform="translate(180,115)"><text x="0" y="-25" font-family="Arial" font-weight="bold" font-size="28" fill="#0077cc">CLINICA</text><text x="0" y="25" font-family="Arial" font-weight="bold" font-size="52" fill="#003366">MONLLOR</text></g></svg>`;
//     this.logoClinicaBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
//   }

//   async ngOnInit(): Promise<void> {
//     this.filtrosForm = this.fb.group({
//       desde: [null],
//       hasta: [null],
//     });
//     await this.cargarDatos();
//   }

//   aplicarFiltros(): void {
//     this.cargarDatos();
//   }

//   private toIso(d?: Date | null): string | undefined {
//     return d ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString() : undefined;
//   }

//   private async cargarDatos(): Promise<void> {
//     this.cargando = true;
//     this.error = undefined;

//     const { desde, hasta } = this.filtrosForm.value;
//     const isoDesde = this.toIso(desde);
//     const isoHasta = this.toIso(hasta);

//     try {
//       const items: EstadisticaTurnosPorEspecialidad[] =
//         await this.api.obtenerTurnosPorEspecialidad({ desde: isoDesde, hasta: isoHasta });

//       const categorias = items.map(i => i.nombre_especialidad ?? 'Sin nombre');
//       const valores = items.map(i => Number(i.cantidad));

//       // Actualizar datos
//       this.chartSeries = valores;
      
//       // Actualizar etiquetas (OJO: Al no ser Partial, debemos asignar con spread operator con cuidado o actualizar la propiedad específica)
//       this.chartOptions = {
//         ...this.chartOptions,
//         labels: categorias
//       };

//     } catch (err) {
//       console.error(err);
//       this.error = 'No pudimos cargar los datos.';
//     } finally {
//       this.cargando = false;
//     }
//   }

//   // --- DESCARGA PDF ---
//   async descargarPDF(): Promise<void> {
//     const el = document.getElementById('captura-pdf');
//     if (!el) return;

//     const canvas = await html2canvas(el, {
//       scale: 2,
//       backgroundColor: '#061126',
//       logging: false,
//       useCORS: true
//     });

//     const imgData = canvas.toDataURL('image/png');
//     const pdf = new jsPDF('landscape', 'mm', 'a4');

//     const pdfW = pdf.internal.pageSize.getWidth();
//     const pdfH = pdf.internal.pageSize.getHeight();
//     const ratio = canvas.width / canvas.height;

//     let w = pdfW - 20;
//     let h = w / ratio;

//     if (h > pdfH - 20) {
//       h = pdfH - 20;
//       w = h * ratio;
//     }

//     const x = (pdfW - w) / 2;
//     const y = (pdfH - h) / 2;

//     pdf.addImage(imgData, 'PNG', x, y, w, h);
//     pdf.save(`estadistica_tortas_${new Date().getTime()}.pdf`);
//   }

//   // --- DESCARGA IMAGEN ---
//   async descargarImagen(): Promise<void> {
//     const el = document.getElementById('captura-pdf');
//     if (!el) return;

//     const canvas = await html2canvas(el, {
//       scale: 2,
//       backgroundColor: '#061126',
//       logging: false,
//       useCORS: true
//     });

//     const link = document.createElement('a');
//     link.href = canvas.toDataURL('image/jpeg', 0.9);
//     link.download = `estadistica_grafico_${new Date().getTime()}.jpg`;
//     link.click();
//   }
// }