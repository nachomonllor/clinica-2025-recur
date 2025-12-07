import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Angular Material Imports
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
import { ApexAxisChartSeries, NgApexchartsModule } from 'ng-apexcharts';

// Librerías externas
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { ChartOptions } from '../../models/estadistica.model';
import { EstadisticasService } from '../../../services/estadisticas.service';

@Component({
  selector: 'app-pacientes-por-especialidad',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatMenuModule, MatRippleModule,
    MatTooltipModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
    NgApexchartsModule
  ],
  templateUrl: './pacientes-por-especialidad.component.html',
  styleUrls: ['./pacientes-por-especialidad.component.scss']
})
export class PacientesPorEspecialidadComponent implements OnInit {

  cargando = false;
  error?: string;
  filtrosForm!: FormGroup;

  // VARIABLE NUEVA PARA EL LOGO
  logoClinicaBase64: string = '';

  chartSeries: ApexAxisChartSeries = [{ name: 'Pacientes', data: [] }];
  chartOptions: Partial<ChartOptions> = {
    chart: {
      type: 'bar',
      height: 420,
      toolbar: { show: false },
      foreColor: '#EAF2FF',
      background: 'transparent' // Importante para que tome el fondo del card
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
      labels: { rotate: -10, trim: true, style: { colors: '#cbd5e1' } }
    },
    yaxis: {
      title: { text: 'Cantidad de Pacientes', style: { color: '#cbd5e1' } },
      labels: { style: { colors: '#cbd5e1' } },
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
  ) {
    // GENERAR LOGO SVG EN BASE64 (Mismo que usaste en otros componentes)
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

  // Corrección de fechas (00:00 - 23:59)
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
      console.error('[PacientesPorEspecialidad] Error', err);
      this.error = 'No pudimos cargar los datos.';
    } finally {
      this.cargando = false;
    }
  }

  // // --- DESCARGA PDF ---
  // async descargarPDF(): Promise<void> {
  //   const el = document.getElementById('captura-pdf');
  //   if (!el) return;

  //   // Capturamos el panel completo (que ahora incluye el logo en el HTML)
  //   const canvas = await html2canvas(el, {
  //     scale: 2,
  //     backgroundColor: '#061126', // Fondo oscuro para mantener estética
  //     logging: false,
  //     useCORS: true // Importante para cargar imágenes externas/base64
  //   });

  //   const imgData = canvas.toDataURL('image/png');
  //   const pdf = new jsPDF('landscape', 'mm', 'a4');

  //   const pdfW = pdf.internal.pageSize.getWidth();
  //   const pdfH = pdf.internal.pageSize.getHeight();
  //   const ratio = canvas.width / canvas.height;

  //   let w = pdfW - 20;
  //   let h = w / ratio;

  //   if (h > pdfH - 20) {
  //     h = pdfH - 20;
  //     w = h * ratio;
  //   }

  //   const x = (pdfW - w) / 2;
  //   const y = (pdfH - h) / 2;

  //   pdf.addImage(imgData, 'PNG', x, y, w, h);
  //   pdf.save(`pacientes_especialidad_${new Date().getTime()}.pdf`);
  // }

  // // --- DESCARGA IMAGEN ---
  // async descargarImagen(): Promise<void> {
  //   const el = document.getElementById('captura-pdf');
  //   if (!el) return;

  //   const canvas = await html2canvas(el, {
  //     scale: 2,
  //     backgroundColor: '#061126',
  //     logging: false,
  //     useCORS: true
  //   });

  //   const link = document.createElement('a');
  //   link.href = canvas.toDataURL('image/jpeg', 0.9);
  //   link.download = `pacientes_especialidad_${new Date().getTime()}.jpg`;
  //   link.click();
  // }

  // --- DESCARGA PDF CON LOGO (Usando onclone) ---
  async descargarPDF(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#061126', // Fondo oscuro del tema
      logging: false,
      useCORS: true,
      // TRUCO DE MAGIA: Modificamos el clon antes de la foto
      onclone: (documentClone) => {
        const header = documentClone.querySelector('.chart-header') as HTMLElement;
        if (header) {
          header.style.display = 'flex'; // ¡Lo hacemos visible solo para la foto!
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
    pdf.save(`pacientes_especialidad_${new Date().getTime()}.pdf`);
  }

  // --- DESCARGA IMAGEN CON LOGO (Usando onclone) ---
  async descargarImagen(): Promise<void> {
    const el = document.getElementById('captura-pdf');
    if (!el) return;

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#061126',
      logging: false,
      useCORS: true,
      // TRUCO DE MAGIA
      onclone: (documentClone) => {
        const header = documentClone.querySelector('.chart-header') as HTMLElement;
        if (header) {
          header.style.display = 'flex';
        }
      }
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.download = `pacientes_especialidad_${new Date().getTime()}.jpg`;
    link.click();
  }

}



