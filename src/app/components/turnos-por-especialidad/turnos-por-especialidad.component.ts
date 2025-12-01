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
import { ChartOptions, EstadisticaTurnosPorEspecialidad } from '../../models/estadistica.model';
import { EstadisticasService } from '../../../services/estadisticas.service';

// ... ChartOptions igual que antes

@Component({
  selector: 'app-turnos-por-especialidad',
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
  templateUrl: './turnos-por-especialidad.component.html',
  styleUrls: ['./turnos-por-especialidad.component.scss']
})
export class TurnosPorEspecialidadComponent implements OnInit {

  cargando = false;
  error?: string;
  filtrosForm!: FormGroup;

  chartSeries: ApexAxisChartSeries = [{ name: 'Turnos', data: [] }];
  chartOptions: Partial<ChartOptions> = {
    // ... igual que lo tenías
    chart: {
      type: 'bar',
      height: 420,
      toolbar: { show: false },
      foreColor: '#EAF2FF'
    },
    plotOptions: { /* ... */ },
    dataLabels: { /* ... */ },
    xaxis: {
      categories: [],
      title: { text: 'Especialidades' },
      labels: { rotate: -10, trim: true }
    },
    yaxis: {
      title: { text: 'Cantidad de Turnos' },
      min: 0,
      forceNiceScale: true
    },
    colors: ['#1565C0'],
    fill: { /* ... */ },
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
    this.cargarDatos();  // no hace falta await acá
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
      // USAMOS PROMISE NO OBSERVABLE
      const items: EstadisticaTurnosPorEspecialidad[] =
        await this.api.obtenerTurnosPorEspecialidad({ desde: isoDesde, hasta: isoHasta });

      const categorias = items.map(i => i.nombre_especialidad ?? 'Sin nombre');
      const valores = items.map(i => i.cantidad);

      this.chartSeries = [{ name: 'Turnos', data: valores }];
      this.chartOptions = {
        ...this.chartOptions,
        xaxis: {
          ...(this.chartOptions.xaxis ?? {}),
          categories: categorias
        }
      };
    } catch (err) {
      console.error('[TurnosPorEspecialidad] Error al cargar datos', err);
      this.error = 'No pudimos cargar los datos.';
    } finally {
      this.cargando = false;
    }
  }

  // descargarPDF() queda igual
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
    pdf.text('Turnos por Especialidad', 40, 28);

    pdf.addImage(img, 'PNG', x, y, imgW, imgH);
    pdf.save(`turnos_por_especialidad_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}



