import { Component, OnInit } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common'; // <--- IMPORTAR registerLocaleData
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
import { MatNativeDateModule, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core'; // <--- IMPORTAR DateAdapter

// Importar locale data de Español Argentina
import localeEsAr from '@angular/common/locales/es-AR';

// Gráficos & PDF
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels, ApexTooltip, ApexStroke, ApexGrid, ApexFill } from 'ng-apexcharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { EstadisticasService } from '../../../services/estadisticas.service';

// Registramos el idioma español
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
    // Proveedor a nivel de componente
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' }
  ],
  templateUrl: './informes-generales.component.html',
  styleUrls: ['./informes-generales.component.scss']
})
export class InformesGeneralesComponent implements OnInit {

  filtrosForm!: FormGroup;
  cargando = false;
  error = '';
  tabIndex = 0;

  // ... (Tus configuraciones de gráficos chartTurnos y chartLog IGUAL QUE ANTES) ...
  public chartTurnos: Partial<ChartOptions> | any = {
    chart: { type: 'bar', height: 350, toolbar: { show: false }, foreColor: '#EAF2FF' },
    series: [],
    xaxis: { categories: [], labels: { style: { colors: '#EAF2FF' } } },
    yaxis: { title: { text: 'Cantidad' }, min: 0, forceNiceScale: true },
    colors: ['#FF8F00'],
    grid: { borderColor: 'rgba(255,255,255,0.1)' },
    tooltip: { theme: 'dark' },
    dataLabels: { enabled: true, style: { colors: ['#EAF2FF'] } }
  };

  public chartLog: Partial<ChartOptions> | any = {
    chart: { type: 'area', height: 350, toolbar: { show: false }, foreColor: '#EAF2FF' },
    series: [],
    xaxis: { categories: [], labels: { style: { colors: '#EAF2FF' } } },
    yaxis: { title: { text: 'Ingresos' }, min: 0, forceNiceScale: true },
    colors: ['#22c55e'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
    stroke: { curve: 'smooth' },
    grid: { borderColor: 'rgba(255,255,255,0.1)' },
    tooltip: { theme: 'dark' }
  };

  constructor(
    private fb: FormBuilder, 
    private api: EstadisticasService,
    private _adapter: DateAdapter<any> // <--- INYECTAMOS EL ADAPTADOR
  ) {}

  async ngOnInit() {
    // FORZAMOS EL IDIOMA AQUÍ
    this._adapter.setLocale('es-AR');

    this.filtrosForm = this.fb.group({
      desde: [null],
      hasta: [null]
    });
    await this.cargarDatos();
  }

  aplicarFiltros() { this.cargarDatos(); }
  limpiarFiltros() { this.filtrosForm.reset(); this.cargarDatos(); }

  async cargarDatos() {
    this.cargando = true;
    const { desde, hasta } = this.filtrosForm.value; // Son objetos Date

    let isoDesde: string | undefined;
    let isoHasta: string | undefined;

    // Convertir fechas Date a string ISO para el servicio
    if (desde) {
      const d = new Date(desde); d.setHours(0, 0, 0, 0); isoDesde = d.toISOString();
    }
    if (hasta) {
      const d = new Date(hasta); d.setHours(23, 59, 59, 999); isoHasta = d.toISOString();
    }

    try {
      // 1. Turnos
      const turnosData = await this.api.obtenerTurnosPorDia({ desde: isoDesde, hasta: isoHasta });
      this.chartTurnos.series = [{ name: 'Turnos', data: turnosData.map(x => x.cantidad) }];
      this.chartTurnos.xaxis = { categories: turnosData.map(x => x.fecha) };

      // 2. Logs
      const logsData = await this.api.obtenerLogIngresosPorDia(isoDesde, isoHasta);
      this.chartLog.series = [{ name: 'Visitas', data: logsData.map(x => x.cantidad) }];
      this.chartLog.xaxis = { categories: logsData.map(x => x.fecha) };

    } catch (e: any) {
      this.error = 'Error al cargar los datos de estadísticas.';
      console.error(e);
    } finally {
      this.cargando = false;
    }
  }

  // ... (Tu función descargarPDF queda igual) ...
  async descargarPDF() {
    const idCaptura = this.tabIndex === 0 ? 'chart-turnos' : 'chart-logs';
    const titulo = this.tabIndex === 0 ? 'Informe: Turnos por Día' : 'Informe: Ingresos al Sistema';

    const el = document.getElementById(idCaptura);
    if (!el) return;

    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#061126' });
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    // Títulos
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(titulo, 20, 20);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 20, 26);

    // Imagen
    const props = pdf.getImageProperties(img);
    const pdfWidth = pdf.internal.pageSize.getWidth() - 40;
    const pdfHeight = (props.height * pdfWidth) / props.width;
    
    pdf.addImage(img, 'PNG', 20, 35, pdfWidth, pdfHeight);
    pdf.save(`informe_${this.tabIndex === 0 ? 'turnos' : 'visitas'}.pdf`);
  }
}








// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
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
// import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';

// import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels, ApexTooltip, ApexStroke, ApexGrid, ApexFill } from 'ng-apexcharts';
// import { jsPDF } from 'jspdf';
// import html2canvas from 'html2canvas';

// import { EstadisticasService } from '../../../services/estadisticas.service';

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
//   // AGREGAR ESTO PARA FORZAR EL FORMATO DD/MM/AAAA
//   providers: [
//     { provide: MAT_DATE_LOCALE, useValue: 'es-AR' } 
//   ],
//   imports: [
//     CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
//     MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, 
//     MatProgressSpinnerModule, MatTabsModule, MatDatepickerModule, MatNativeDateModule,
//     NgApexchartsModule
//   ],
//   templateUrl: './informes-generales.component.html',
//   styleUrls: ['./informes-generales.component.scss']
// })
// export class InformesGeneralesComponent implements OnInit {

//   filtrosForm!: FormGroup;
//   cargando = false;
//   error = '';
//   tabIndex = 0;

//   // INICIALIZACIÓN SEGURA: Definimos todos los valores por defecto para evitar NaN
//   public chartTurnos: ChartOptions = {
//     series: [],
//     chart: { type: 'bar', height: 350, toolbar: { show: false }, foreColor: '#EAF2FF' },
//     xaxis: { categories: [], labels: { style: { colors: '#EAF2FF' } } },
//     yaxis: { title: { text: 'Cantidad' }, min: 0, forceNiceScale: true },
//     dataLabels: { enabled: true, style: { colors: ['#EAF2FF'] } },
//     tooltip: { theme: 'dark' },
//     stroke: { show: true, width: 2, colors: ['transparent'] },
//     grid: { borderColor: 'rgba(255,255,255,0.1)' },
//     fill: { opacity: 1 },
//     colors: ['#FF8F00']
//   };

//   public chartLog: ChartOptions = {
//     series: [],
//     chart: { type: 'area', height: 350, toolbar: { show: false }, foreColor: '#EAF2FF' },
//     xaxis: { categories: [], labels: { style: { colors: '#EAF2FF' } } },
//     yaxis: { title: { text: 'Ingresos' }, min: 0, forceNiceScale: true },
//     dataLabels: { enabled: false },
//     tooltip: { theme: 'dark' },
//     stroke: { curve: 'smooth', width: 3 },
//     grid: { borderColor: 'rgba(255,255,255,0.1)' },
//     fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
//     colors: ['#22c55e']
//   };

//   constructor(private fb: FormBuilder, private api: EstadisticasService) {}

//   async ngOnInit() {
//     this.filtrosForm = this.fb.group({
//       desde: [null],
//       hasta: [null]
//     });
//     // Cargamos datos INMEDIATAMENTE para que el gráfico tenga algo que pintar
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
//       // 1. Turnos
//       const turnosData = await this.api.obtenerTurnosPorDia({ desde: isoDesde, hasta: isoHasta });
      
//       // Actualizamos objeto completo para forzar redibujado limpio
//       this.chartTurnos = {
//         ...this.chartTurnos,
//         series: [{ name: 'Turnos', data: turnosData.map(x => x.cantidad) }],
//         xaxis: { ...this.chartTurnos.xaxis, categories: turnosData.map(x => x.fecha) }
//       };

//       // 2. Logs
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
//     // ... (Tu código de PDF que ya estaba bien, mantenlo igual) ...
//     const idCaptura = this.tabIndex === 0 ? 'chart-turnos' : 'chart-logs';
//     const titulo = this.tabIndex === 0 ? 'Informe: Turnos por Día' : 'Informe: Ingresos al Sistema';

//     const el = document.getElementById(idCaptura);
//     if (!el) return;

//     const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#061126' });
//     const img = canvas.toDataURL('image/png');
//     const pdf = new jsPDF('l', 'mm', 'a4');
    
//     // ... resto de tu lógica PDF ...
//     pdf.addImage(img, 'PNG', 15, 30, 270, 150); // Ajuste simple de tamaño
//     pdf.save(`informe_${this.tabIndex === 0 ? 'turnos' : 'visitas'}.pdf`);
//   }
// }




// // import { Component, OnInit } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
// // import { RouterLink } from '@angular/router';

// // // Material Imports
// // import { MatButtonModule } from '@angular/material/button';
// // import { MatCardModule } from '@angular/material/card';
// // import { MatIconModule } from '@angular/material/icon';
// // import { MatFormFieldModule } from '@angular/material/form-field';
// // import { MatInputModule } from '@angular/material/input';
// // import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// // import { MatTabsModule } from '@angular/material/tabs';
// // import { MatDatepickerModule } from '@angular/material/datepicker';
// // import { MatNativeDateModule } from '@angular/material/core';

// // // Charts & PDF
// // import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels, ApexTooltip, ApexStroke, ApexGrid, ApexFill } from 'ng-apexcharts';
// // import { jsPDF } from 'jspdf';
// // import html2canvas from 'html2canvas';

// // // Servicio
// // import { EstadisticasService } from '../../../services/estadisticas.service';

// // export type ChartOptions = {
// //   series: ApexAxisChartSeries;
// //   chart: ApexChart;
// //   xaxis: ApexXAxis;
// //   yaxis: ApexYAxis;
// //   dataLabels: ApexDataLabels;
// //   tooltip: ApexTooltip;
// //   stroke: ApexStroke;
// //   grid: ApexGrid;
// //   fill: ApexFill;
// //   colors: string[];
// // };

// // @Component({
// //   selector: 'app-informes-generales',
// //   standalone: true,
// //   imports: [
// //     CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
// //     MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, 
// //     MatProgressSpinnerModule, MatTabsModule, MatDatepickerModule, MatNativeDateModule,
// //     NgApexchartsModule
// //   ],
// //   templateUrl: './informes-generales.component.html',
// //   styleUrls: ['./informes-generales.component.scss']
// // })
// // export class InformesGeneralesComponent implements OnInit {

// //   filtrosForm!: FormGroup;
// //   cargando = false;
// //   error = '';
// //   tabIndex = 0; // 0 = Turnos, 1 = Logs

// //   // 1. GRÁFICO TURNOS (Barras)
// //   chartTurnos: Partial<ChartOptions> | any = {
// //     chart: { type: 'bar', height: 350, toolbar: { show: false }, foreColor: '#EAF2FF' },
// //     series: [],
// //     xaxis: { categories: [], labels: { style: { colors: '#EAF2FF' } } },
// //     yaxis: { title: { text: 'Cantidad' }, min: 0, forceNiceScale: true },
// //     colors: ['#FF8F00'], // Naranja
// //     grid: { borderColor: 'rgba(255,255,255,0.1)' },
// //     tooltip: { theme: 'dark' },
// //     dataLabels: { enabled: true, style: { colors: ['#EAF2FF'] } }
// //   };

// //   // 2. GRÁFICO LOGS (Área)
// //   chartLog: Partial<ChartOptions> | any = {
// //     chart: { type: 'area', height: 350, toolbar: { show: false }, foreColor: '#EAF2FF' },
// //     series: [],
// //     xaxis: { categories: [], labels: { style: { colors: '#EAF2FF' } } },
// //     yaxis: { title: { text: 'Ingresos' }, min: 0, forceNiceScale: true },
// //     colors: ['#22c55e'], // Verde
// //     fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
// //     stroke: { curve: 'smooth' },
// //     grid: { borderColor: 'rgba(255,255,255,0.1)' },
// //     tooltip: { theme: 'dark' }
// //   };

// //   constructor(private fb: FormBuilder, private api: EstadisticasService) {}

// //   async ngOnInit() {
// //     this.filtrosForm = this.fb.group({
// //       desde: [null],
// //       hasta: [null]
// //     });
// //     await this.cargarDatos();
// //   }

// //   aplicarFiltros() {
// //     this.cargarDatos();
// //   }

// //   limpiarFiltros() {
// //     this.filtrosForm.reset();
// //     this.cargarDatos();
// //   }

// //   async cargarDatos() {
// //     this.cargando = true;
// //     const { desde, hasta } = this.filtrosForm.value; // Son objetos Date

// //     let isoDesde: string | undefined;
// //     let isoHasta: string | undefined;

// //     // Convertir fechas Date a string ISO para el servicio
// //     if (desde) {
// //       const d = new Date(desde);
// //       d.setHours(0, 0, 0, 0);
// //       isoDesde = d.toISOString();
// //     }
// //     if (hasta) {
// //       const d = new Date(hasta);
// //       d.setHours(23, 59, 59, 999);
// //       isoHasta = d.toISOString();
// //     }

// //     try {
// //       // 1. Cargar Turnos
// //       const turnosData = await this.api.obtenerTurnosPorDia({ desde: isoDesde, hasta: isoHasta });
// //       this.chartTurnos.series = [{ name: 'Turnos', data: turnosData.map(x => x.cantidad) }];
// //       this.chartTurnos.xaxis = { categories: turnosData.map(x => x.fecha) };

// //       // 2. Cargar Logs (Visitas)
// //       // Ajusta la llamada según tu servicio (si acepta objeto o params sueltos)
// //       const logsData = await this.api.obtenerLogIngresosPorDia(isoDesde, isoHasta);
// //       this.chartLog.series = [{ name: 'Visitas', data: logsData.map(x => x.cantidad) }];
// //       this.chartLog.xaxis = { categories: logsData.map(x => x.fecha) };

// //     } catch (e: any) {
// //       this.error = 'Error al cargar los datos de estadísticas.';
// //       console.error(e);
// //     } finally {
// //       this.cargando = false;
// //     }
// //   }

// //   async descargarPDF() {
// //     const el = document.getElementById('captura-pdf');
// //     if (!el) return;

// //     // Título dinámico según el tab activo
// //     const titulo = this.tabIndex === 0 ? 'Informe: Turnos por Día' : 'Informe: Ingresos al Sistema';

// //     // Captura con fondo oscuro forzado
// //     const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#061126' });
// //     const img = canvas.toDataURL('image/png');

// //     const pdf = new jsPDF('l', 'mm', 'a4');
// //     const pageW = pdf.internal.pageSize.getWidth();
// //     const pageH = pdf.internal.pageSize.getHeight();

// //     // Ajuste de tamaño de imagen para que entre bien
// //     const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
// //     const imgW = canvas.width * ratio * 0.95;
// //     const imgH = canvas.height * ratio * 0.95;
// //     const x = (pageW - imgW) / 2;
// //     const y = 30; // Margen superior para el título

// //     // Encabezado PDF
// //     pdf.setFont('helvetica', 'bold');
// //     pdf.setFontSize(18);
// //     pdf.text(titulo, 20, 20);
// //     pdf.setFontSize(10);
// //     pdf.setFont('helvetica', 'normal');
// //     pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 20, 26);

// //     pdf.addImage(img, 'PNG', x, y, imgW, imgH);
// //     pdf.save(`informe_general_${new Date().toISOString().slice(0, 10)}.pdf`);
// //   }
// // }