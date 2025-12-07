
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Angular Material
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

// ApexCharts
import { ApexAxisChartSeries, ChartComponent, NgApexchartsModule } from 'ng-apexcharts';

// Librerías externas
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { ChartOptions } from '../../models/estadistica.model';
import { EstadisticasService } from '../../../services/estadisticas.service';

@Component({
  selector: 'app-medicos-por-especialidad',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatRippleModule,
    MatTooltipModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
    NgApexchartsModule
  ],
  templateUrl: './medicos-por-especialidad.component.html',
  styleUrls: ['./medicos-por-especialidad.component.scss']
})
export class MedicosPorEspecialidadComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;

  cargando = false;
  error?: string;
  filtrosForm!: FormGroup;

  // 1. LOGO DE LA CLÍNICA
  logoClinicaBase64: string = '';

  chartSeries: ApexAxisChartSeries = [{ name: 'Médicos', data: [] }];
  chartOptions: Partial<ChartOptions> = {
    chart: {
      type: 'bar',
      height: 420,
      toolbar: { show: false },
      foreColor: '#EAF2FF',
      background: 'transparent'
    },
    plotOptions: {
      bar: {
        columnWidth: '45%',
        borderRadius: 8,
        dataLabels: { position: 'top' }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: any) => (typeof val === 'number' ? val.toString() : `${val}`),
      offsetY: -18,
      style: { fontSize: '12px', fontWeight: '700', colors: ['#FFFFFF'] }
    },
    xaxis: {
      categories: [],
      title: { text: 'Especialidades' },
      labels: { rotate: -10, trim: true, style: { colors: '#cbd5e1' } }
    },
    yaxis: {
      title: { text: 'Cantidad de Médicos', style: { color: '#cbd5e1' } },
      labels: { style: { colors: '#cbd5e1' } },
      min: 0,
      forceNiceScale: true
    },
    colors: ['#008FFB'], // Azul diferente para distinguir de Pacientes
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shadeIntensity: 0.35,
        gradientToColors: ['#00E396'], // Verde agua
        opacityFrom: 0.9,
        opacityTo: 0.35,
        stops: [0, 100]
      }
    },
    stroke: { show: false },
    grid: { borderColor: 'rgba(255,255,255,.12)' },
    tooltip: { theme: 'dark' },
    title: { text: '' }
  };

  constructor(
    private fb: FormBuilder,
    private api: EstadisticasService
  ) {
    // 2. INICIALIZAR EL LOGO
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

  // 3. LÓGICA DE FECHAS CORREGIDA (00:00 - 23:59)
  private async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.error = undefined;

    const { desde, hasta } = this.filtrosForm.value;
    
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

    try {
      const items = await this.api.obtenerMedicosPorEspecialidad({ desde: isoDesde, hasta: isoHasta });

      const categorias = items.map(i => i.especialidad);
      const valores = items.map(i => i.cantidad_medicos);

      this.chartSeries = [{ name: 'Médicos', data: valores }];
      this.chartOptions = {
        ...this.chartOptions,
        xaxis: {
          ...(this.chartOptions.xaxis ?? {}),
          categories: categorias
        }
      };
    } catch (err) {
      console.error('[MedicosPorEspecialidad] Error al cargar datos', err);
      this.error = 'No pudimos cargar los datos.';
    } finally {
      this.cargando = false;
    }
  }

  // --- DESCARGA PDF CON LOGO ---
  async descargarPDF(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#061126', 
      logging: false,
      useCORS: true,
      // TRUCO: Mostrar el header oculto
      onclone: (documentClone) => {
        const header = documentClone.querySelector('.chart-header') as HTMLElement;
        if (header) {
          header.style.display = 'flex';
        }
      }
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
    pdf.save(`medicos_especialidad_${new Date().getTime()}.pdf`);
  }

  // --- DESCARGA IMAGEN CON LOGO ---
  async descargarImagen(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#061126',
      logging: false,
      useCORS: true,
      // TRUCO: Mostrar el header oculto
      onclone: (documentClone) => {
        const header = documentClone.querySelector('.chart-header') as HTMLElement;
        if (header) {
          header.style.display = 'flex';
        }
      }
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.download = `medicos_especialidad_${new Date().getTime()}.jpg`;
    link.click();
  }
}




// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

// import {
//   ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill, ApexGrid,
//   ApexPlotOptions, ApexStroke, ApexTitleSubtitle, ApexTooltip, ApexXAxis, ApexYAxis,
//   NgApexchartsModule
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
// import { ChartOptions } from '../../models/estadistica.model';
// import { EstadisticasService } from '../../../services/estadisticas.service';

// @Component({
//   selector: 'app-medicos-por-especialidad',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule,
//     RouterLink,
//     MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatRippleModule,
//     MatTooltipModule, MatFormFieldModule, MatInputModule,
//     MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
//     ReactiveFormsModule,
//     NgApexchartsModule
//   ],
//   templateUrl: './medicos-por-especialidad.component.html',
//   styleUrls: ['./medicos-por-especialidad.component.scss']
// })
// export class MedicosPorEspecialidadComponent implements OnInit {

//   cargando = false;
//   error?: string;
//   filtrosForm!: FormGroup;

//   chartSeries: ApexAxisChartSeries = [{ name: 'Médicos', data: [] }];
//   chartOptions: Partial<ChartOptions> = {
//     chart: {
//       type: 'bar',
//       height: 420,
//       toolbar: { show: false },
//       foreColor: '#EAF2FF' // Texto claro
//     },
//     plotOptions: {
//       bar: {
//         columnWidth: '45%',
//         borderRadius: 8,
//         dataLabels: { position: 'top' }
//       }
//     },
//     dataLabels: {
//       enabled: true,
//       formatter: (val: any) => (typeof val === 'number' ? val.toString() : `${val}`),
//       offsetY: -18,
//       style: { fontSize: '12px', fontWeight: '700', colors: ['#FFFFFF'] }
//     },
//     xaxis: {
//       categories: [],
//       title: { text: 'Especialidades' },
//       labels: { rotate: -10, trim: true }
//     },
//     yaxis: {
//       title: { text: 'Cantidad de Médicos' },
//       min: 0,
//       forceNiceScale: true
//     },
//     colors: ['#1565C0'],
//     fill: {
//       type: 'gradient',
//       gradient: {
//         type: 'vertical',
//         shadeIntensity: 0.35,
//         gradientToColors: ['#FF8F00'],
//         opacityFrom: 0.9,
//         opacityTo: 0.35,
//         stops: [0, 100]
//       }
//     },
//     stroke: { show: false },
//     grid: { borderColor: 'rgba(255,255,255,.12)' },
//     tooltip: { theme: 'dark' },
//     title: { text: '' }
//   };

//   constructor(
//     private fb: FormBuilder,
//     private api: EstadisticasService
//   ) { }

//   async ngOnInit(): Promise<void> {
//     this.filtrosForm = this.fb.group({
//       desde: [null as Date | null],
//       hasta: [null as Date | null],
//     });
//     await this.cargarDatos();
//   }

//   aplicarFiltros(): void {
//     this.cargarDatos();
//   }

//   private toIso(d?: Date | null): string | undefined {
//     return d
//       ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()
//       : undefined;
//   }

//   private async cargarDatos(): Promise<void> {
//     this.cargando = true;
//     this.error = undefined;

//     const { desde, hasta } = this.filtrosForm.value;
//     const isoDesde = this.toIso(desde ?? undefined);
//     const isoHasta = this.toIso(hasta ?? undefined);

//     try {
//       const items = await this.api.obtenerMedicosPorEspecialidad({ desde: isoDesde, hasta: isoHasta });

//       const categorias = items.map(i => i.especialidad);
//       const valores = items.map(i => i.cantidad_medicos);

//       this.chartSeries = [{ name: 'Médicos', data: valores }];
//       this.chartOptions = {
//         ...this.chartOptions,
//         xaxis: {
//           ...(this.chartOptions.xaxis ?? {}),
//           categories: categorias
//         }
//       };
//     } catch (err) {
//       console.error('[MedicosPorEspecialidad] Error al cargar datos', err);
//       this.error = 'No pudimos cargar los datos.';
//     } finally {
//       this.cargando = false;
//     }
//   }

//   // --- CORRECCIÓN EXPORTAR PDF ---
//   // async descargarPDF(): Promise<void> {
//   //   const el = document.getElementById('captura-pdf');
//   //   if (!el) return;

//   //   // 1. FORZAMOS FONDO OSCURO (#0f172a)
//   //   const canvas = await html2canvas(el, { 
//   //     scale: 2, 
//   //     backgroundColor: '#0f172a',
//   //     logging: false 
//   //   });
    
//   //   const img = canvas.toDataURL('image/png');

//   //   const pdf = new jsPDF('landscape', 'pt', 'a4');
//   //   const pageW = pdf.internal.pageSize.getWidth();
//   //   const pageH = pdf.internal.pageSize.getHeight();

//   //   const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
//   //   const imgW = canvas.width * ratio;
//   //   const imgH = canvas.height * ratio;

//   //   const x = (pageW - imgW) / 2;
//   //   const y = 60; // bajamos para el título

//   //   // Título oscuro
//   //   pdf.setFont('helvetica', 'bold');
//   //   pdf.setFontSize(18);
//   //   pdf.setTextColor(40);
//   //   pdf.text('Médicos por Especialidad', 40, 40);

//   //   pdf.addImage(img, 'PNG', x, y, imgW, imgH);
//   //   pdf.save(`medicos_por_especialidad_${new Date().toISOString().slice(0, 10)}.pdf`);
//   // }

//   async descargarPDF(): Promise<void> {
//     const el = document.getElementById('captura-pdf');
//     if (!el) return;

//     const canvas = await html2canvas(el, {
//       scale: 2,
//       backgroundColor: '#061126', 
//       logging: false,
//       useCORS: true,
//       // TRUCO: Mostrar el header oculto
//       onclone: (documentClone) => {
//         const header = documentClone.querySelector('.chart-header') as HTMLElement;
//         if (header) {
//           header.style.display = 'flex';
//         }
//       }
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
//     pdf.save(`medicos_especialidad_${new Date().getTime()}.pdf`);
//   }

//   // --- CORRECCIÓN EXPORTAR IMAGEN ---
//   async descargarImagen(): Promise<void> {
//     const el = document.getElementById('captura-pdf');
//     if (!el) return;

//     try {
//       // Forzamos fondo oscuro también aquí
//       const canvas = await html2canvas(el, { 
//         scale: 2, 
//         backgroundColor: '#0f172a' 
//       });
      
//       canvas.toBlob((blob) => {
//         if (!blob) return;
//         const url = URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = url;
//         link.download = `medicos_por_especialidad_${new Date().toISOString().slice(0, 10)}.png`;
//         link.click();
//         URL.revokeObjectURL(url);
//       }, 'image/png');
//     } catch (err) {
//       console.error('[MedicosPorEspecialidad] Error al descargar imagen', err);
//     }
//   }
// }










