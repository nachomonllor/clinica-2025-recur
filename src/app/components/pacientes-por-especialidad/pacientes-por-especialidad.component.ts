

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
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { ApexAxisChartSeries, NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-pacientes-por-especialidad',
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
  templateUrl: './pacientes-por-especialidad.component.html',
  styleUrls: ['./pacientes-por-especialidad.component.scss']
})
export class PacientesPorEspecialidadComponent implements OnInit {

  cargando = false;
  error?: string;
  filtrosForm!: FormGroup;

  chartSeries: ApexAxisChartSeries = [{ name: 'Pacientes', data: [] }];
  chartOptions: Partial<ChartOptions> = {
    chart: {
      type: 'bar',
      height: 420,
      toolbar: { show: false },
      foreColor: '#EAF2FF' // Texto claro para modo oscuro
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
      title: { text: 'Cantidad de Pacientes' },
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
      const items = await this.api.obtenerPacientesPorEspecialidad({ desde: isoDesde, hasta: isoHasta });

      const categorias = items.map(i => i.especialidad);
      const valores = items.map(i => i.cantidad_pacientes);

      this.chartSeries = [{ name: 'Pacientes', data: valores }];
      this.chartOptions = {
        ...this.chartOptions,
        xaxis: {
          ...(this.chartOptions.xaxis ?? {}),
          categories: categorias
        }
      };
    } catch (err) {
      console.error('[PacientesPorEspecialidad] Error al cargar datos', err);
      this.error = 'No pudimos cargar los datos.';
    } finally {
      this.cargando = false;
    }
  }

  // --- CORRECCIÓN EN EXPORTACIÓN PDF ---
  async descargarPDF(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    // 1. FORZAMOS EL COLOR DE FONDO OSCURO (#0f172a o el que uses en tu tema)
    // Esto asegura que las letras blancas se vean sobre fondo oscuro en el PDF
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#0f172a', // <--- CAMBIO CLAVE AQUÍ
      logging: false
    });

    const img = canvas.toDataURL('image/png');

    const pdf = new jsPDF('landscape', 'pt', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // Ajustar márgenes
    const margin = 40;
    const maxW = pageW - (margin * 2);
    const maxH = pageH - (margin * 2) - 50; // espacio para título

    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const imgW = canvas.width * ratio;
    const imgH = canvas.height * ratio;

    // Centrar horizontalmente
    const x = (pageW - imgW) / 2;
    const y = 60;

    // Título del PDF en negro (porque el fondo del papel es blanco)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(40);
    pdf.text('Pacientes por Especialidad', pageW / 2, 40, { align: 'center' });

    pdf.addImage(img, 'PNG', x, y, imgW, imgH);

    const fecha = new Date().toISOString().slice(0, 10);
    pdf.save(`estadisticas_especialidad_${fecha}.pdf`);
  }

  // --- CORRECCIÓN EN DESCARGA DE IMAGEN ---
  async descargarImagen(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    try {
      // También aplicamos el fondo oscuro aquí para que el PNG sea legible
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#0f172a' // <--- CAMBIO CLAVE AQUÍ
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `grafico_especialidades_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('[PacientesPorEspecialidad] Error al descargar imagen', err);
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
// import { ChartOptions, EstadisticaPacientesPorEspecialidad } from '../../models/estadistica.model';
// import { EstadisticasService } from '../../../services/estadisticas.service';

// @Component({
//   selector: 'app-pacientes-por-especialidad',
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
//   templateUrl: './pacientes-por-especialidad.component.html',
//   styleUrls: ['./pacientes-por-especialidad.component.scss']
// })
// export class PacientesPorEspecialidadComponent implements OnInit {

//   cargando = false;
//   error?: string;
//   filtrosForm!: FormGroup;

//   chartSeries: ApexAxisChartSeries = [{ name: 'Pacientes', data: [] }];
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
//       title: { text: 'Cantidad de Pacientes' },
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
//       const items = await this.api.obtenerPacientesPorEspecialidad({ desde: isoDesde, hasta: isoHasta });

//       const categorias = items.map(i => i.especialidad);
//       const valores = items.map(i => i.cantidad_pacientes);

//       this.chartSeries = [{ name: 'Pacientes', data: valores }];
//       this.chartOptions = {
//         ...this.chartOptions,
//         xaxis: {
//           ...(this.chartOptions.xaxis ?? {}),
//           categories: categorias
//         }
//       };
//     } catch (err) {
//       console.error('[PacientesPorEspecialidad] Error al cargar datos', err);
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
//     pdf.text('Pacientes por Especialidad', 40, 28);

//     pdf.addImage(img, 'PNG', x, y, imgW, imgH);
//     pdf.save(`pacientes_por_especialidad_${new Date().toISOString().slice(0, 10)}.pdf`);
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
//         link.download = `pacientes_por_especialidad_${new Date().toISOString().slice(0, 10)}.png`;
//         link.click();
//         URL.revokeObjectURL(url);
//       }, 'image/png');
//     } catch (err) {
//       console.error('[PacientesPorEspecialidad] Error al descargar imagen', err);
//     }
//   }
// }

