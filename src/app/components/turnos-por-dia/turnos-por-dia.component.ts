// src/app/components/turnos-por-dia/turnos-por-dia.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

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
import { MatRippleModule, MatNativeDateModule } from '@angular/material/core';
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
  styleUrls: ['./turnos-por-dia.component.scss']
})
export class TurnosPorDiaComponent implements OnInit {

  /** Ponelo en true si querés probar sólo con RAW_MOCK */
  private readonly USE_MOCK = false;

  /** Mock para pruebas rápidas (no depende de la DB) */
  private readonly RAW_MOCK: Array<{
    fecha: string;
    estado: 'finalizado' | 'pendiente' | 'cancelado' | 'completado' | 'atendido' | 'realizado';
  }> = [
      { fecha: '2025-10-10T10:00:00Z', estado: 'finalizado' },
      { fecha: '2025-10-10T11:00:00Z', estado: 'finalizado' },
      { fecha: '2025-10-11T10:00:00Z', estado: 'pendiente' },
      { fecha: '2025-10-12T09:00:00Z', estado: 'completado' },
      { fecha: '2025-10-14T13:30:00Z', estado: 'realizado' },
      { fecha: '2025-10-14T16:15:00Z', estado: 'completado' },
      { fecha: '2025-10-15T08:00:00Z', estado: 'cancelado' },
      { fecha: '2025-10-16T08:00:00Z', estado: 'finalizado' },
      { fecha: '2025-10-18T08:00:00Z', estado: 'atendido' },
      { fecha: '2025-10-20T08:00:00Z', estado: 'finalizado' },
      { fecha: '2025-10-22T10:00:00Z', estado: 'finalizado' },
      { fecha: '2025-10-22T14:00:00Z', estado: 'finalizado' }
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
        horizontal: false,
        columnWidth: '45%',
        borderRadius: 8,
        dataLabels: { position: 'top' }
      }
    },
    // dataLabels: {
    //   enabled: true,
    //   formatter: (val) => (typeof val === 'number' ? val.toString() : `${val}`),
    //   offsetY: -18,
    //   style: { fontSize: '12px', fontWeight: '700', colors: ['#FFFFFF'] }
    // },

    // dataLabels: {
    //   enabled: true,
    //   formatter: (val: number | string) =>
    //     typeof val === 'number' ? val.toString() : `${val}`,
    //   offsetY: -18,
    //   style: { fontSize: '12px', fontWeight: '700', colors: ['#FFFFFF'] }
    // },

    dataLabels: {
      enabled: true,
      formatter: (val: number | { [key: string]: any }) =>
        typeof val === 'number' ? val.toString() : `${val}`,
      offsetY: -18,
      style: {
        fontSize: '12px',
        fontWeight: '700',
        colors: ['#FFFFFF']
      }
    },

    xaxis: {
      categories: [],
      title: { text: 'Fecha' },
      labels: { rotate: -20, trim: true }
    },
    yaxis: {
      title: { text: 'Cantidad de Turnos' },
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

  /** Construye un rango inclusivo de días YYYY-MM-DD */
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

  /** Etiqueta dd/MM a partir de YYYY-MM-DD */
  private labelFromDayKey(dayKey: string): string {
    const [y, m, d] = dayKey.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  }

  // =========================================================
  // Carga de datos (mock o API)
  // =========================================================
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

    // --- MODO MOCK ---
    if (this.USE_MOCK) {
      this.cargarDatosMockConFiltros(isoDesde, isoHasta, !!soloFinalizados);
      return;
    }

    // --- MODO API ---
    this.api
      .turnosPorDia(isoDesde, isoHasta, !!soloFinalizados)
      .subscribe({
        next: (items: EstadisticaTurnosPorDia[]) => {
          // map -> estructura común { dia, cantidad }
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

  /** Renderiza la serie a partir de [{dia, cantidad}] */
  private renderByDayItems(items: Array<{ dia: string; cantidad: number }>): void {
    const sorted = [...items].sort((a, b) => a.dia.localeCompare(b.dia));
    const categorias = sorted.map(i => this.labelFromDayKey(i.dia));
    const valores = sorted.map(i => i.cantidad);

    const baseChart = this.chartOptions.chart ?? { type: 'bar' as const, height: 420 };

    this.chartSeries = [{ name: 'Turnos', data: valores }];
    this.chartOptions = {
      ...this.chartOptions,
      chart: { ...baseChart, type: 'bar', height: 420 },
      xaxis: { ...(this.chartOptions.xaxis ?? {}), categories: categorias }
    };

    this.cargando = false;
  }

  /** MOCK con filtros (rango + sólo finalizados) */
  private cargarDatosMockConFiltros(
    isoDesde?: string,
    isoHasta?: string,
    soloFinalizados = true
  ): void {
    const allTimes = this.RAW_MOCK.map(r => new Date(r.fecha).getTime()).sort((a, b) => a - b);
    const startISO = isoDesde ?? new Date(allTimes[0]).toISOString();
    const endISO = isoHasta ?? new Date(allTimes[allTimes.length - 1]).toISOString();

    const dayKeys = this.buildDayRange(startISO, endISO);
    const mapCount = new Map<string, number>(dayKeys.map(k => [k, 0]));
    const estadosOk = soloFinalizados
      ? new Set(['finalizado', 'completado', 'atendido', 'realizado'])
      : null;

    for (const r of this.RAW_MOCK) {
      const t = new Date(r.fecha).getTime();
      if (t < new Date(startISO).getTime() || t > new Date(endISO).getTime()) continue;
      if (estadosOk && !estadosOk.has(r.estado)) continue;

      const dt = new Date(r.fecha);
      const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
      mapCount.set(key, (mapCount.get(key) ?? 0) + 1);
    }

    const items = dayKeys.map(k => ({ dia: k, cantidad: mapCount.get(k) ?? 0 }));
    this.renderByDayItems(items);
  }

  // =========================================================
  // Exportar a PDF
  // =========================================================
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
    pdf.text(`Turnos por Día${solo}`, 40, 28);

    pdf.addImage(img, 'PNG', x, y, imgW, imgH);
    pdf.save(`turnos_por_dia_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}




