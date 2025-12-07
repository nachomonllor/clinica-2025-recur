import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

// Importamos el idioma español para las fechas
import localeEsAr from '@angular/common/locales/es-AR';

// Gráficos & PDF
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels, ApexTooltip, ApexStroke, ApexGrid, ApexFill } from 'ng-apexcharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { EstadisticasService } from '../../../services/estadisticas.service';

// Registramos la data del idioma
registerLocaleData(localeEsAr, 'es-AR');

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  grid: ApexGrid;
  fill: ApexFill;
  colors: string[];
};

@Component({
  selector: 'app-informes-generales',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, 
    MatProgressSpinnerModule, MatTabsModule, MatDatepickerModule, MatNativeDateModule,
    NgApexchartsModule
  ],
  providers: [
    // Proveedor para que el Datepicker use español por defecto
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' }
  ],
  templateUrl: './informes-generales.component.html',
  styleUrls: ['./informes-generales.component.scss']
})
export class InformesGeneralesComponent implements OnInit {

  filtrosForm!: FormGroup;
  cargando = false;
  error = '';
  tabIndex = 0; // 0 = Turnos, 1 = Logs

  // 1. GRÁFICO TURNOS (Barras) - Inicialización segura
  public chartTurnos: ChartOptions = {
    chart: { type: 'bar', height: 350, toolbar: { show: false }, foreColor: '#EAF2FF' },
    series: [],
    xaxis: { categories: [], labels: { style: { colors: '#EAF2FF' } } },
    yaxis: { title: { text: 'Cantidad' }, min: 0, forceNiceScale: true },
    colors: ['#FF8F00'], // Naranja
    grid: { borderColor: 'rgba(255,255,255,0.1)' },
    tooltip: { theme: 'dark' },
    dataLabels: { enabled: true, style: { colors: ['#EAF2FF'] } },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    fill: { opacity: 1 }
  };

  // 2. GRÁFICO LOGS (Área) - Inicialización segura
  public chartLog: ChartOptions = {
    chart: { type: 'area', height: 350, toolbar: { show: false }, foreColor: '#EAF2FF' },
    series: [],
    xaxis: { categories: [], labels: { style: { colors: '#EAF2FF' } } },
    yaxis: { title: { text: 'Ingresos' }, min: 0, forceNiceScale: true },
    colors: ['#22c55e'], // Verde
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
    stroke: { curve: 'smooth', width: 3 },
    grid: { borderColor: 'rgba(255,255,255,0.1)' },
    tooltip: { theme: 'dark' },
    dataLabels: { enabled: false }
  };

  constructor(
    private fb: FormBuilder, 
    private api: EstadisticasService,
    private _adapter: DateAdapter<any> // Inyectamos el adaptador de fecha
  ) {}

  async ngOnInit() {
    // Forzamos el idioma español Argentina (DD/MM/AAAA)
    this._adapter.setLocale('es-AR');

    this.filtrosForm = this.fb.group({
      desde: [null],
      hasta: [null]
    });
    
    // Carga inicial
    await this.cargarDatos();
  }

  aplicarFiltros() { this.cargarDatos(); }
  limpiarFiltros() { this.filtrosForm.reset(); this.cargarDatos(); }

  // Función auxiliar para convertir "YYYY-MM-DD" a "DD-MM-YYYY"
  private formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    // Si viene en formato ISO (YYYY-MM-DD) hacemos split para evitar problemas de zona horaria
    if (fechaStr.includes('-')) {
      const partes = fechaStr.split('-'); 
      // Si tiene 3 partes (Año, Mes, Dia) lo invertimos
      if (partes.length === 3) {
        const [anio, mes, dia] = partes;
        return `${dia}-${mes}-${anio}`;
      }
    }
    // Fallback por si viene en otro formato
    return fechaStr;
  }

  async cargarDatos() {
    this.cargando = true;
    const { desde, hasta } = this.filtrosForm.value;

    let isoDesde: string | undefined;
    let isoHasta: string | undefined;

    if (desde) {
      const d = new Date(desde); d.setHours(0, 0, 0, 0); isoDesde = d.toISOString();
    }
    if (hasta) {
      const d = new Date(hasta); d.setHours(23, 59, 59, 999); isoHasta = d.toISOString();
    }

    try {
      // 1. Cargar Turnos
      const turnosData = await this.api.obtenerTurnosPorDia({ desde: isoDesde, hasta: isoHasta });
      
      // Reasignamos el objeto para refrescar el gráfico
      this.chartTurnos = {
        ...this.chartTurnos,
        series: [{ name: 'Turnos', data: turnosData.map(x => x.cantidad) }],
        // APLICAMOS EL FORMATEO AQUÍ
        xaxis: { ...this.chartTurnos.xaxis, categories: turnosData.map(x => this.formatearFecha(x.fecha)) }
      };

      // 2. Cargar Logs (Visitas)
      const logsData = await this.api.obtenerLogIngresosPorDia(isoDesde, isoHasta);
      
      this.chartLog = {
        ...this.chartLog,
        series: [{ name: 'Visitas', data: logsData.map(x => x.cantidad) }],
        // APLICAMOS EL FORMATEO AQUÍ TAMBIÉN
        xaxis: { ...this.chartLog.xaxis, categories: logsData.map(x => this.formatearFecha(x.fecha)) }
      };

    } catch (e: any) {
      this.error = 'Error al cargar los datos de estadísticas.';
      console.error(e);
    } finally {
      this.cargando = false;
    }
  }

  // async descargarPDF() {
  //   // Definimos el ID según el tab activo (o el panel completo)
  //   const idCaptura = 'captura-pdf'; 
  //   const titulo = this.tabIndex === 0 ? 'Informe: Turnos por Día' : 'Informe: Ingresos al Sistema';

  //   const el = document.getElementById(idCaptura);
  //   if (!el) return;

  //   // Aumentamos scale para mejor calidad
  //   const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#061126' });
  //   const img = canvas.toDataURL('image/png');
  //   const pdf = new jsPDF('l', 'mm', 'a4');
    
  //   const pageW = pdf.internal.pageSize.getWidth();
  //   const pageH = pdf.internal.pageSize.getHeight();
  //   const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
  //   const imgW = canvas.width * ratio * 0.9;
  //   const imgH = canvas.height * ratio * 0.9;
  //   const x = (pageW - imgW) / 2;

  //   pdf.setFont('helvetica', 'bold');
  //   pdf.setFontSize(18);
  //   pdf.text(titulo, 20, 20);
  //   pdf.setFontSize(10);
  //   pdf.setFont('helvetica', 'normal');
  //   // Usamos el locale español para la fecha de emisión también
  //   pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 20, 26);

  //   pdf.addImage(img, 'PNG', x, 35, imgW, imgH);
  //   pdf.save(`informe_${this.tabIndex === 0 ? 'turnos' : 'visitas'}.pdf`);
  // }


  // === REEMPLAZA TU FUNCIÓN descargarPDF POR ESTA ===
  async descargarPDF() {
    const DATA = document.getElementById('captura-pdf');
    if (!DATA) return;

    // 1. DEFINICIÓN DEL LOGO (Igual que en los otros componentes)
    const svgLogo = `
    <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0099ff;stop-opacity:1" /> 
          <stop offset="100%" style="stop-color:#0055b3;stop-opacity:1" /> 
        </linearGradient>
      </defs>
      <g transform="translate(50, 50)">
        <path d="M 80 0 H 120 A 10 10 0 0 1 130 10 V 80 H 200 A 10 10 0 0 1 210 90 V 130 A 10 10 0 0 1 200 140 H 130 V 210 A 10 10 0 0 1 120 220 H 80 A 10 10 0 0 1 70 210 V 140 H 0 A 10 10 0 0 1 -10 130 V 90 A 10 10 0 0 1 0 80 H 70 V 10 A 10 10 0 0 1 80 0 Z" fill="url(#gradBlue)" transform="scale(0.5) translate(30,30)"/>
        <path d="M 60 115 L 90 145 L 150 85" stroke="white" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.5) translate(30,30)"/>
      </g>
      <g transform="translate(180, 115)">
        <text x="0" y="-25" font-family="Arial" font-weight="bold" font-size="28" fill="#0077cc">CLINICA</text>
        <text x="0" y="25" font-family="Arial" font-weight="bold" font-size="52" fill="#003366">MONLLOR</text>
      </g>
    </svg>`;

    // 2. PROCESAR LOGO (SVG -> Canvas -> PNG)
    const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgLogo)));
    const logoImg = new Image();
    logoImg.src = svgBase64;
    await new Promise((resolve) => { logoImg.onload = resolve; });

    const canvasLogo = document.createElement('canvas');
    canvasLogo.width = 600; 
    canvasLogo.height = 200;
    const ctxLogo = canvasLogo.getContext('2d');
    if (ctxLogo) ctxLogo.drawImage(logoImg, 0, 0);
    const logoPng = canvasLogo.toDataURL('image/png');

    // 3. CAPTURAR EL GRÁFICO (HTML2CANVAS)
    // Usamos el fondo oscuro para que coincida con tu tema
    const canvasChart = await html2canvas(DATA, {
      scale: 2, 
      backgroundColor: '#061126', 
      logging: false,
      useCORS: true
    });
    const chartPng = canvasChart.toDataURL('image/png');

    // 4. ARMAR EL PDF
    const pdf = new jsPDF('l', 'mm', 'a4'); // Horizontal
    const w = pdf.internal.pageSize.getWidth();
    
    // A. Agregar Logo
    pdf.addImage(logoPng, 'PNG', 10, 10, 50, 16); 

    // B. Definir Título según el Tab seleccionado
    const titulo = this.tabIndex === 0 ? 'Informe: Turnos por Día' : 'Informe: Ingresos al Sistema';

    // C. Agregar Textos
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(titulo, w - 10, 18, { align: 'right' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, w - 10, 24, { align: 'right' });

    // D. Línea Separadora
    pdf.setDrawColor(200);
    pdf.line(10, 30, w - 10, 30);

    // E. Agregar la imagen del gráfico
    const margin = 10;
    const topMargin = 35; 
    
    const imgProps = pdf.getImageProperties(chartPng);
    const pdfImgWidth = w - (margin * 2);
    // Calculamos la altura proporcional para que no se deforme
    const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;

    pdf.addImage(chartPng, 'PNG', margin, topMargin, pdfImgWidth, pdfImgHeight);
    
    pdf.save(`informe_general_${Date.now()}.pdf`);
  }



}









// import { Component, OnInit } from '@angular/core';
// import { CommonModule, registerLocaleData } from '@angular/common';
// import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { RouterLink } from '@angular/router';

// // Material Imports
// import { MatButtonModule } from '@angular/material/button';
// import { MatCardModule } from '@angular/material/card';
// import { MatIconModule } from '@angular/material/icon';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatTabsModule } from '@angular/material/tabs';
// import { MatDatepickerModule } from '@angular/material/datepicker';
// import { MatNativeDateModule, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

// // Importamos el idioma español para las fechas
// import localeEsAr from '@angular/common/locales/es-AR';

// // Gráficos & PDF
// import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels, ApexTooltip, ApexStroke, ApexGrid, ApexFill } from 'ng-apexcharts';
// import { jsPDF } from 'jspdf';
// import html2canvas from 'html2canvas';

// import { EstadisticasService } from '../../../services/estadisticas.service';

// // Registramos la data del idioma
// registerLocaleData(localeEsAr, 'es-AR');

// export type ChartOptions = {
//   series: ApexAxisChartSeries;
//   chart: ApexChart;
//   xaxis: ApexXAxis;
//   yaxis: ApexYAxis;
//   dataLabels: ApexDataLabels;
//   tooltip: ApexTooltip;
//   stroke: ApexStroke;
//   grid: ApexGrid;
//   fill: ApexFill;
//   colors: string[];
// };

// @Component({
//   selector: 'app-informes-generales',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
//     MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, 
//     MatProgressSpinnerModule, MatTabsModule, MatDatepickerModule, MatNativeDateModule,
//     NgApexchartsModule
//   ],
//   providers: [
//     // Proveedor para que el Datepicker use español por defecto
//     { provide: MAT_DATE_LOCALE, useValue: 'es-AR' }
//   ],
//   templateUrl: './informes-generales.component.html',
//   styleUrls: ['./informes-generales.component.scss']
// })
// export class InformesGeneralesComponent implements OnInit {

//   filtrosForm!: FormGroup;
//   cargando = false;
//   error = '';
//   tabIndex = 0; // 0 = Turnos, 1 = Logs

//   // 1. GRÁFICO TURNOS (Barras) - Inicialización segura
//   public chartTurnos: ChartOptions = {
//     chart: { type: 'bar', height: 350, toolbar: { show: false }, foreColor: '#EAF2FF' },
//     series: [],
//     xaxis: { categories: [], labels: { style: { colors: '#EAF2FF' } } },
//     yaxis: { title: { text: 'Cantidad' }, min: 0, forceNiceScale: true },
//     colors: ['#FF8F00'], // Naranja
//     grid: { borderColor: 'rgba(255,255,255,0.1)' },
//     tooltip: { theme: 'dark' },
//     dataLabels: { enabled: true, style: { colors: ['#EAF2FF'] } },
//     stroke: { show: true, width: 2, colors: ['transparent'] },
//     fill: { opacity: 1 }
//   };

//   // 2. GRÁFICO LOGS (Área) - Inicialización segura
//   public chartLog: ChartOptions = {
//     chart: { type: 'area', height: 350, toolbar: { show: false }, foreColor: '#EAF2FF' },
//     series: [],
//     xaxis: { categories: [], labels: { style: { colors: '#EAF2FF' } } },
//     yaxis: { title: { text: 'Ingresos' }, min: 0, forceNiceScale: true },
//     colors: ['#22c55e'], // Verde
//     fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
//     stroke: { curve: 'smooth', width: 3 },
//     grid: { borderColor: 'rgba(255,255,255,0.1)' },
//     tooltip: { theme: 'dark' },
//     dataLabels: { enabled: false }
//   };

//   constructor(
//     private fb: FormBuilder, 
//     private api: EstadisticasService,
//     private _adapter: DateAdapter<any> // Inyectamos el adaptador de fecha
//   ) {}

//   async ngOnInit() {
//     // Forzamos el idioma español Argentina (DD/MM/AAAA)
//     this._adapter.setLocale('es-AR');

//     this.filtrosForm = this.fb.group({
//       desde: [null],
//       hasta: [null]
//     });
    
//     // Carga inicial
//     await this.cargarDatos();
//   }

//   aplicarFiltros() { this.cargarDatos(); }
//   limpiarFiltros() { this.filtrosForm.reset(); this.cargarDatos(); }

//   async cargarDatos() {
//     this.cargando = true;
//     const { desde, hasta } = this.filtrosForm.value;

//     let isoDesde: string | undefined;
//     let isoHasta: string | undefined;

//     if (desde) {
//       const d = new Date(desde); d.setHours(0, 0, 0, 0); isoDesde = d.toISOString();
//     }
//     if (hasta) {
//       const d = new Date(hasta); d.setHours(23, 59, 59, 999); isoHasta = d.toISOString();
//     }

//     try {
//       // 1. Cargar Turnos
//       const turnosData = await this.api.obtenerTurnosPorDia({ desde: isoDesde, hasta: isoHasta });
      
//       // Reasignamos el objeto para refrescar el gráfico
//       this.chartTurnos = {
//         ...this.chartTurnos,
//         series: [{ name: 'Turnos', data: turnosData.map(x => x.cantidad) }],
//         xaxis: { ...this.chartTurnos.xaxis, categories: turnosData.map(x => x.fecha) }
//       };

//       // 2. Cargar Logs (Visitas)
//       const logsData = await this.api.obtenerLogIngresosPorDia(isoDesde, isoHasta);
      
//       this.chartLog = {
//         ...this.chartLog,
//         series: [{ name: 'Visitas', data: logsData.map(x => x.cantidad) }],
//         xaxis: { ...this.chartLog.xaxis, categories: logsData.map(x => x.fecha) }
//       };

//     } catch (e: any) {
//       this.error = 'Error al cargar los datos de estadísticas.';
//       console.error(e);
//     } finally {
//       this.cargando = false;
//     }
//   }

//   async descargarPDF() {
//     const idCaptura = this.tabIndex === 0 ? 'captura-pdf' : 'captura-pdf'; // Capturamos todo el panel
//     const titulo = this.tabIndex === 0 ? 'Informe: Turnos por Día' : 'Informe: Ingresos al Sistema';

//     const el = document.getElementById(idCaptura);
//     if (!el) return;

//     const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#061126' });
//     const img = canvas.toDataURL('image/png');
//     const pdf = new jsPDF('l', 'mm', 'a4');
    
//     const pageW = pdf.internal.pageSize.getWidth();
//     const pageH = pdf.internal.pageSize.getHeight();
//     const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
//     const imgW = canvas.width * ratio * 0.9;
//     const imgH = canvas.height * ratio * 0.9;
//     const x = (pageW - imgW) / 2;

//     pdf.setFont('helvetica', 'bold');
//     pdf.setFontSize(18);
//     pdf.text(titulo, 20, 20);
//     pdf.setFontSize(10);
//     pdf.setFont('helvetica', 'normal');
//     pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 20, 26);

//     pdf.addImage(img, 'PNG', x, 35, imgW, imgH);
//     pdf.save(`informe_${this.tabIndex === 0 ? 'turnos' : 'visitas'}.pdf`);
//   }
// }



