import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  ApexAxisChartSeries, 
  NgApexchartsModule
} from 'ng-apexcharts';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatRippleModule, MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { map } from 'rxjs/operators';
import { EstadisticasService } from '../../../services/estadisticas.service';
import { RouterLink } from '@angular/router';
import { ChartOptions } from '../../models/estadistica.model';

type ItemMedico = { medico: string; cantidad: number };

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

@Component({
  selector: 'app-turnos-por-medico',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatRippleModule,
    MatTooltipModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    NgApexchartsModule
  ],
  templateUrl: './turnos-por-medico.component.html',
  styleUrls: ['./turnos-por-medico.component.scss']
})

export class TurnosPorMedicoComponent implements OnInit {

  //  arriba en la clase
  private USO_EL_MOCK = true; // ← ponelo en false cuando conectes Supabase

  // Datos agregados listos para el chart (médico + cantidad)
  private readonly MOCK_ITEMS: Array<{ medico: string; cantidad: number }> = [
    { medico: 'Dave Mustaine', cantidad: 2 },
    { medico: 'Augusto Morelli', cantidad: 2 },
    { medico: 'James Hetfield', cantidad: 1 },
    { medico: 'Esteban Quiroz', cantidad: 7 },
  ];

  cargando = false;
  error?: string;

  filtrosForm!: FormGroup;

  chartSeries: ApexAxisChartSeries = [{ name: 'Turnos', data: [] }];
  chartOptions: Partial<ChartOptions> = {
    chart: {
      type: 'bar',
      height: 420,
      toolbar: { show: false },
      foreColor: '#EAF2FF'
    },
    plotOptions: {
      bar: {
        horizontal: true,         // <-- horizontal
        barHeight: '46%',
        borderRadius: 8,
        dataLabels: { position: 'center' }
      }
    },
    // dataLabels: {
    //   enabled: true,
    //   formatter: (val) => (typeof val === 'number' ? val.toString() : `${val}`),
    //   offsetY: 0,
    //   style: { fontSize: '12px', fontWeight: '700', colors: ['#FFFFFF'] }
    // },

    dataLabels: {
      enabled: true,
      formatter: (val: number | string) =>
        typeof val === 'number' ? val.toString() : `${val}`,
      offsetY: -18,
      style: { fontSize: '12px', fontWeight: '700', colors: ['#FFFFFF'] }
    },

    // En horizontal, Apex usa xaxis como numérica y coloca categorías en el eje Y automáticamente
    xaxis: {
      title: { text: 'Cantidad de Turnos' },
      min: 0,
      //  forceNiceScale: true,
      labels: { trim: true }
    },
    yaxis: {
      title: { text: 'Especialistas' },
      labels: { maxWidth: 220 }
    },
    colors: ['#1565C0'],
    fill: {
      type: 'gradient',
      gradient: {
        type: 'horizontal',       // <-- gradiente horizontal
        shadeIntensity: 0.35,
        gradientToColors: ['#22D3EE'], // celeste/teal para look parecido al screenshot
        opacityFrom: 0.95,
        opacityTo: 0.45,
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

  ngOnInit(): void {
    this.filtrosForm = this.fb.group({
      desde: [null as Date | null],
      hasta: [null as Date | null],
      soloFinalizados: [true]   // <-- por defecto sólo atendidos
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

  private toIso(d?: Date | null): string | undefined {
    return d ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString() : undefined;
  }


  // private cargarDatos(): void {
  //   this.cargando = true;
  //   this.error = undefined;

  //   const { desde, hasta, soloFinalizados } = this.filtrosForm.value;
  //   const isoDesde = this.toIso(desde ?? null);
  //   const isoHasta = this.toIso(hasta ?? null);

  //   this.api
  //     .turnosPorMedico(isoDesde, isoHasta, !!soloFinalizados)
  //     .pipe(
  //       // Si el servicio emite PostgrestSingleResponse, tomo .data; si ya es array, lo dejo
  //       map((res: any) => Array.isArray(res) ? res : (res?.data ?? [])),
  //       // Shape estable y orden descendente
  //       map((items: any[]) =>
  //         items.map(i => {
  //           const fallback = `${(i.apellido ?? '')} ${(i.nombre ?? '')}`.trim();
  //           const medico = ((i.medico ?? fallback) || 'Sin nombre');  // () para no mezclar ?? y ||
  //           return { medico, cantidad: Number(i.cantidad ?? 0) };
  //         }).sort((a, b) => b.cantidad - a.cantidad)
  //       )
  //     )
  //     .subscribe({
  //       next: (items) => {
  //         const categorias = items.map(i => i.medico);
  //         const valores = items.map(i => i.cantidad);

  //         // Altura dinámica según cantidad de especialistas
  //         const dynHeight = Math.max(320, 60 * categorias.length + 120);

  //         this.chartSeries = [{ name: 'Turnos', data: valores }];

  //         // Garantizamos 'type' y damos fallback si chart venía undefined
  //         const baseChart = this.chartOptions.chart ?? { type: 'bar' as const, height: 420 };

  //         this.chartOptions = {
  //           ...this.chartOptions,
  //           chart: { ...baseChart, type: 'bar', height: dynHeight },                // ✅ fija el tipo
  //           xaxis: { ...(this.chartOptions.xaxis ?? {}), categories: categorias },  // ✅ spread correcto
  //           // Si querés nice scale, hacelo en Y (no en X):
  //           // yaxis: { ...(this.chartOptions.yaxis ?? {}), forceNiceScale: true, title: { text: 'Especialistas' } }
  //         };

  //         this.cargando = false;
  //       },
  //       error: () => {
  //         this.error = 'No pudimos cargar los datos.';
  //         this.cargando = false;
  //       }
  //     });
  // }


  private cargarDatos(): void {
    this.cargando = true;
    this.error = undefined;

    // HARD CODEO  
    if (this.USO_EL_MOCK) {
      // Simulamos una latencia pequeña (opcional)
      setTimeout(() => {
        // Ordenamos desc por cantidad (igual que en la versión con backend)
        const items = [...this.MOCK_ITEMS].sort((a, b) => b.cantidad - a.cantidad);

        const categorias = items.map(i => i.medico);
        const valores = items.map(i => i.cantidad);

        // Altura dinámica para barras horizontales
        const dynHeight = Math.max(320, 60 * categorias.length + 120);

        this.chartSeries = [{ name: 'Turnos', data: valores }];

        // Garantizamos 'type' y fallback si chart venía undefined
        const baseChart = this.chartOptions.chart ?? { type: 'bar' as const, height: 420 };

        this.chartOptions = {
          ...this.chartOptions,
          chart: { ...baseChart, type: 'bar', height: dynHeight },
          xaxis: { ...(this.chartOptions.xaxis ?? {}), categories: categorias },
        };

        this.cargando = false;
      }, 250);

      return; //salimos para no llamar al backend
    }

    //  USE_MOCK = false
    const { desde, hasta, soloFinalizados } = this.filtrosForm.value;
    const isoDesde = this.toIso(desde ?? undefined);
    const isoHasta = this.toIso(hasta ?? undefined);

    this.api
      .turnosPorMedico(isoDesde, isoHasta, !!soloFinalizados)
      .pipe(
        // Si el servicio devuelve PostgrestSingleResponse, tomo .data; si ya es array, lo dejo
        map((res: any) => Array.isArray(res) ? res : (res?.data ?? [])),
        // Normalizo y ordeno desc
        map((items: any[]) =>
          items.map(i => {
            const fallback = `${(i.apellido ?? '')} ${(i.nombre ?? '')}`.trim();
            const medico = ((i.medico ?? fallback) || 'Sin nombre');
            return { medico, cantidad: Number(i.cantidad ?? 0) };
          }).sort((a, b) => b.cantidad - a.cantidad)
        )
      )
      .subscribe({
         next: (items: ItemMedico[]) => {
          const categorias = items.map(i => i.medico);
          const valores = items.map(i => i.cantidad);

          const dynHeight = Math.max(320, 60 * categorias.length + 120);
          this.chartSeries = [{ name: 'Turnos', data: valores }];

          const baseChart = this.chartOptions.chart ?? { type: 'bar' as const, height: 420 };
          this.chartOptions = {
            ...this.chartOptions,
            chart: { ...baseChart, type: 'bar', height: dynHeight },
            xaxis: { ...(this.chartOptions.xaxis ?? {}), categories: categorias },
          };

          this.cargando = false;
        },
        error: () => {
          this.error = 'No pudimos cargar los datos.';
          this.cargando = false;
        }
      });
  }


  async descargarPDF(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    const canvas = await html2canvas(el, { scale: 2, backgroundColor: null });
    const img = canvas.toDataURL('image/png');

    const pdf = new jsPDF('landscape', 'pt', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const imgW = canvas.width * ratio;
    const imgH = canvas.height * ratio;

    const x = (pageW - imgW) / 2;
    const y = 40;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    const solo = this.filtrosForm.value.soloFinalizados ? ' (solo finalizados)' : '';
    pdf.text(`Turnos por Médico${solo}`, 40, 28);

    pdf.addImage(img, 'PNG', x, y, imgW, imgH);
    pdf.save(`turnos_por_medico_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}


