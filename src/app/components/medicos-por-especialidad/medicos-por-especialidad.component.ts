import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill, ApexGrid,
  ApexPlotOptions, ApexStroke, ApexTitleSubtitle, ApexTooltip, ApexXAxis, ApexYAxis,
  NgApexchartsModule
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
import { ChartOptions } from '../../models/estadistica.model';
import { EstadisticasService } from '../../../services/estadisticas.service';

@Component({
  selector: 'app-medicos-por-especialidad',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatRippleModule,
    MatTooltipModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
    ReactiveFormsModule,
    NgApexchartsModule
  ],
  templateUrl: './medicos-por-especialidad.component.html',
  styleUrls: ['./medicos-por-especialidad.component.scss']
})
export class MedicosPorEspecialidadComponent implements OnInit {

  cargando = false;
  error?: string;
  filtrosForm!: FormGroup;

  chartSeries: ApexAxisChartSeries = [{ name: 'Médicos', data: [] }];
  chartOptions: Partial<ChartOptions> = {
    chart: {
      type: 'bar',
      height: 420,
      toolbar: { show: false },
      foreColor: '#EAF2FF' // Texto claro
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
      labels: { rotate: -10, trim: true }
    },
    yaxis: {
      title: { text: 'Cantidad de Médicos' },
      min: 0,
      forceNiceScale: true
    },
    colors: ['#1565C0'],
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shadeIntensity: 0.35,
        gradientToColors: ['#FF8F00'],
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
  ) { }

  async ngOnInit(): Promise<void> {
    this.filtrosForm = this.fb.group({
      desde: [null as Date | null],
      hasta: [null as Date | null],
    });
    await this.cargarDatos();
  }

  aplicarFiltros(): void {
    this.cargarDatos();
  }

  private toIso(d?: Date | null): string | undefined {
    return d
      ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()
      : undefined;
  }

  private async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.error = undefined;

    const { desde, hasta } = this.filtrosForm.value;
    const isoDesde = this.toIso(desde ?? undefined);
    const isoHasta = this.toIso(hasta ?? undefined);

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

  // --- CORRECCIÓN EXPORTAR PDF ---
  async descargarPDF(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    // 1. FORZAMOS FONDO OSCURO (#0f172a)
    const canvas = await html2canvas(el, { 
      scale: 2, 
      backgroundColor: '#0f172a',
      logging: false 
    });
    
    const img = canvas.toDataURL('image/png');

    const pdf = new jsPDF('landscape', 'pt', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const imgW = canvas.width * ratio;
    const imgH = canvas.height * ratio;

    const x = (pageW - imgW) / 2;
    const y = 60; // bajamos para el título

    // Título oscuro
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(40);
    pdf.text('Médicos por Especialidad', 40, 40);

    pdf.addImage(img, 'PNG', x, y, imgW, imgH);
    pdf.save(`medicos_por_especialidad_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // --- CORRECCIÓN EXPORTAR IMAGEN ---
  async descargarImagen(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    try {
      // Forzamos fondo oscuro también aquí
      const canvas = await html2canvas(el, { 
        scale: 2, 
        backgroundColor: '#0f172a' 
      });
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `medicos_por_especialidad_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('[MedicosPorEspecialidad] Error al descargar imagen', err);
    }
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
// import { ChartOptions, EstadisticaMedicosPorEspecialidad } from '../../models/estadistica.model';
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
//       foreColor: '#EAF2FF'
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

//   async descargarPDF(): Promise<void> {
//     const el = document.getElementById('captura-pdf');
//     if (!el) return;

//     const canvas = await html2canvas(el, { scale: 2, backgroundColor: null });
//     const img = canvas.toDataURL('image/png');

//     const pdf = new jsPDF('landscape', 'pt', 'a4');
//     const pageW = pdf.internal.pageSize.getWidth();
//     const pageH = pdf.internal.pageSize.getHeight();

//     const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
//     const imgW = canvas.width * ratio;
//     const imgH = canvas.height * ratio;

//     const x = (pageW - imgW) / 2;
//     const y = 40;

//     pdf.setFont('helvetica', 'bold');
//     pdf.setFontSize(16);
//     pdf.text('Médicos por Especialidad', 40, 28);

//     pdf.addImage(img, 'PNG', x, y, imgW, imgH);
//     pdf.save(`medicos_por_especialidad_${new Date().toISOString().slice(0, 10)}.pdf`);
//   }

//   async descargarImagen(): Promise<void> {
//     const el = document.getElementById('captura-pdf');
//     if (!el) return;

//     try {
//       const canvas = await html2canvas(el, { scale: 2, backgroundColor: null });
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

