
import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common'; // <--- 1. Importar registerLocaleData
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import localeEsAr from '@angular/common/locales/es-AR'; // <--- 2. Importar datos de Argentina

// Registramos el idioma español AR
registerLocaleData(localeEsAr, 'es-AR');

import {
  ApexAxisChartSeries,
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
    CommonModule,
    FormsModule,
    RouterLink,
    // Material
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatRippleModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    // Forms y Charts
    ReactiveFormsModule,
    NgApexchartsModule
  ],
  templateUrl: './turnos-por-dia.component.html',
  styleUrls: ['./turnos-por-dia.component.scss'],
  // ESTO AHORA SÍ FUNCIONARÁ PORQUE REGISTRAMOS EL IDIOMA ARRIBA
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' } 
  ]
})
export class TurnosPorDiaComponent implements OnInit {

  private readonly USE_MOCK = false;
  logoClinicaBase64: string = '';

  // private readonly RAW_MOCK: Array<{
  //   fecha: string;
  //   estado: 'finalizado' | 'pendiente' | 'cancelado' | 'completado' | 'atendido' | 'realizado';
  // }> = [
  //     { fecha: '2025-10-10T10:00:00Z', estado: 'finalizado' },
  //     { fecha: '2025-10-10T11:00:00Z', estado: 'finalizado' },
  //     { fecha: '2025-10-11T10:00:00Z', estado: 'pendiente' },
  //     { fecha: '2025-10-12T09:00:00Z', estado: 'completado' },
  //     { fecha: '2025-10-14T13:30:00Z', estado: 'realizado' },
  //     { fecha: '2025-10-14T16:15:00Z', estado: 'completado' },
  //     { fecha: '2025-10-15T08:00:00Z', estado: 'cancelado' },
  //     { fecha: '2025-10-16T08:00:00Z', estado: 'finalizado' },
  //     { fecha: '2025-10-18T08:00:00Z', estado: 'atendido' },
  //     { fecha: '2025-10-20T08:00:00Z', estado: 'finalizado' },
  //     { fecha: '2025-10-22T10:00:00Z', estado: 'finalizado' },
  //     { fecha: '2025-10-22T14:00:00Z', estado: 'finalizado' }
  //   ];

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
      labels: { rotate: -20, trim: true }
    },
    yaxis: {
      title: { text: 'Cantidad de Turnos' },
      min: 0,
      forceNiceScale: true,
      // CORRECCIÓN DEL TIPO: Agregamos ": number"
      labels: { formatter: (val: number) => val.toFixed(0) } 
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
      y: { formatter: (val:number) => `${val} turnos` }
    },
    title: { text: '' }
  };

  constructor(
    private fb: FormBuilder,
    private api: EstadisticasService
  ) { 
    const svg = `<svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0099ff;stop-opacity:1"/><stop offset="100%" style="stop-color:#0055b3;stop-opacity:1"/></linearGradient></defs><g transform="translate(50,50)"><path d="M80 0H120A10 10 0 0 1 130 10V80H200A10 10 0 0 1 210 90V130A10 10 0 0 1 200 140H130V210A10 10 0 0 1 120 220H80A10 10 0 0 1 70 210V140H0A10 10 0 0 1-10 130V90A10 10 0 0 1 0 80H70V10A10 10 0 0 1 80 0Z" fill="url(#g)" transform="scale(0.5) translate(30,30)"/><path d="M60 115L90 145L150 85" stroke="white" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.5) translate(30,30)"/></g><g transform="translate(180,115)"><text x="0" y="-25" font-family="Arial" font-weight="bold" font-size="28" fill="#0077cc">CLINICA</text><text x="0" y="25" font-family="Arial" font-weight="bold" font-size="52" fill="#003366">MONLLOR</text></g></svg>`;
    this.logoClinicaBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  ngOnInit(): void {
    this.filtrosForm = this.fb.group({
      desde: [null as Date | null],
      hasta: [null as Date | null],
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

  private toIso(d?: Date | null): string | undefined {
    return d
      ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()
      : undefined;
  }

  private buildDayRange(startISO: string, endISO: string): string[] {
    const out: string[] = [];
    const start = new Date(startISO);
    const end = new Date(endISO);

    let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const endMid = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

    while (cur <= endMid) {
      const y = cur.getUTCFullYear();
      const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
      const d = String(cur.getUTCDate()).padStart(2, '0');
      out.push(`${y}-${m}-${d}`);
      cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1));
    }
    return out;
  }

  private labelFromDayKey(dayKey: string): string {
    const [y, m, d] = dayKey.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    // Formato visual para el gráfico
    return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  }

  private cargarDatos(): void {
    this.cargando = true;
    this.error = undefined;

    const { desde, hasta, soloFinalizados } = this.filtrosForm.value as {
      desde: Date | null;
      hasta: Date | null;
      soloFinalizados: boolean;
    };

    const isoDesde = this.toIso(desde ?? null);
    const isoHasta = this.toIso(hasta ?? null);

    // if (this.USE_MOCK) {
    //   this.cargarDatosMockConFiltros(isoDesde, isoHasta, !!soloFinalizados);
    //   return;
    // }

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

  private renderByDayItems(items: Array<{ dia: string; cantidad: number }>): void {
    const sorted = [...items].sort((a, b) => a.dia.localeCompare(b.dia));
    const categorias = sorted.map(i => this.labelFromDayKey(i.dia));
    const valores = sorted.map(i => i.cantidad);

    const baseChart = this.chartOptions.chart ?? { type: 'area' as const, height: 420 };

    this.chartSeries = [{ name: 'Turnos', data: valores }];
    this.chartOptions = {
      ...this.chartOptions,
      chart: { ...baseChart, type: 'area', height: 420 },
      xaxis: { ...(this.chartOptions.xaxis ?? {}), categories: categorias }
    };
    this.cargando = false;
  }

  // private cargarDatosMockConFiltros(isoDesde?: string, isoHasta?: string, soloFinalizados = true): void {
  //   const allTimes = this.RAW_MOCK.map(r => new Date(r.fecha).getTime()).sort((a, b) => a - b);
  //   const startISO = isoDesde ?? new Date(allTimes[0]).toISOString();
  //   const endISO = isoHasta ?? new Date(allTimes[allTimes.length - 1]).toISOString();

  //   const dayKeys = this.buildDayRange(startISO, endISO);
  //   const mapCount = new Map<string, number>(dayKeys.map(k => [k, 0]));
  //   const estadosOk = soloFinalizados
  //     ? new Set(['finalizado', 'completado', 'atendido', 'realizado'])
  //     : null;

  //   for (const r of this.RAW_MOCK) {
  //     const t = new Date(r.fecha).getTime();
  //     if (t < new Date(startISO).getTime() || t > new Date(endISO).getTime()) continue;
  //     if (estadosOk && !estadosOk.has(r.estado)) continue;

  //     const dt = new Date(r.fecha);
  //     const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
  //     mapCount.set(key, (mapCount.get(key) ?? 0) + 1);
  //   }
  //   const items = dayKeys.map(k => ({ dia: k, cantidad: mapCount.get(k) ?? 0 }));
  //   this.renderByDayItems(items);
  // }

  async descargarPDF(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    const canvas = await html2canvas(el, { 
      scale: 2, 
      backgroundColor: '#061126', 
      logging: false,
      useCORS: true,
      onclone: (clonedDoc) => {
        const logo = clonedDoc.querySelector('.logo-container') as HTMLElement;
        if (logo) {
          logo.style.display = 'flex';
          logo.style.justifyContent = 'center';
          logo.style.marginBottom = '20px';
        }
      }
    });
    
    const img = canvas.toDataURL('image/png');
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

    pdf.addImage(img, 'PNG', x, y, w, h);
    pdf.save(`turnos_por_dia_${new Date().toISOString().slice(0, 10)}.pdf`);
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
        const logo = clonedDoc.querySelector('.logo-container') as HTMLElement;
        if (logo) {
          logo.style.display = 'flex';
          logo.style.justifyContent = 'center';
          logo.style.marginBottom = '20px';
        }
      }
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.download = `turnos_por_dia_grafico_${new Date().getTime()}.jpg`;
    link.click();
  }
}


