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

  private USO_EL_MOCK = false;

  // Logo Base64
  logoClinicaBase64: string = '';

  // Datos agregados listos para el chart
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
        horizontal: true,
        barHeight: '46%',
        borderRadius: 8,
        dataLabels: { position: 'center' }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number | string) =>
        typeof val === 'number' ? val.toString() : `${val}`,
      offsetY: -18,
      style: { fontSize: '12px', fontWeight: '700', colors: ['#FFFFFF'] }
    },
    xaxis: {
      title: { text: 'Cantidad de Turnos' },
      min: 0,
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
        type: 'horizontal',
        shadeIntensity: 0.35,
        gradientToColors: ['#22D3EE'],
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
    return d ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString() : undefined;
  }

  private cargarDatos(): void {
    this.cargando = true;
    this.error = undefined;

    if (this.USO_EL_MOCK) {
      setTimeout(() => {
        const items = [...this.MOCK_ITEMS].sort((a, b) => b.cantidad - a.cantidad);
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
      }, 250);
      return;
    }

    const { desde, hasta, soloFinalizados } = this.filtrosForm.value;
    const isoDesde = this.toIso(desde ?? undefined);
    const isoHasta = this.toIso(hasta ?? undefined);

    this.api
      .turnosPorMedico(isoDesde, isoHasta, !!soloFinalizados)
      .pipe(
        map((res: any) => Array.isArray(res) ? res : (res?.data ?? [])),
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

  // --- DESCARGA PDF ---
  async descargarPDF(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#061126', // Color de fondo oscuro (ajusta si tu tema es light)
      logging: false,
      useCORS: true,
      onclone: (clonedDoc) => {
        const logo = clonedDoc.querySelector('.logo-container') as HTMLElement;
        if (logo) {
          // AQUÍ LA MAGIA: Cambiamos display: none por display: flex
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
    pdf.save(`turnos_medico_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // --- DESCARGA IMAGEN ---
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
          // Misma lógica para la imagen
          logo.style.display = 'flex';
          logo.style.justifyContent = 'center';
          logo.style.marginBottom = '20px';
        }
      }
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.download = `turnos_medico_grafico_${new Date().getTime()}.jpg`;
    link.click();
  }


}



