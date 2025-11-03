import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  // 👇 uso template inline para evitar el error del .html faltante
  template: `
    <mat-card>
      <mat-card-title>Estadísticas</mat-card-title>
      <mat-card-content>
        Esta pantalla fue temporalmente simplificada (sin gráficos) para compilar.
        Luego la migramos a Chart.js.
      </mat-card-content>
    </mat-card>
  `,
})
export class EstadisticasComponent {}






// import { Component, OnInit } from '@angular/core';
// import { GoogleChartInterface, Ng2GoogleChartsModule } from 'ng2-google-charts';  // ←

// @Component({
//   selector: 'app-estadisticas',
//   standalone: true,
//   imports: [Ng2GoogleChartsModule],
//   templateUrl: './estadisticas.component.html',
//   styleUrl: './estadisticas.component.scss'
// })
// export class EstadisticasComponent implements OnInit {

//   public visitasChart: GoogleChartInterface = {
//     chartType: 'ColumnChart',
//     dataTable: [
//       ['Mes', 'Visitas'],
//       // aca irán los datos reales
//     ],
//     options: {
//       title: 'Visitas por mes',
//       height: 400,
//       legend: { position: 'none' }
//     }
//   };

//   public especialistasChart: GoogleChartInterface = {
//     chartType: 'PieChart',
//     dataTable: [['Especialidad', 'Cantidad']],
//     options: {
//       title: 'Especialistas por especialidad',
//       height: 400
//     }
//   };

//   constructor(private statsSvc: EstadisticasService) { }

//   ngOnInit() {
//     // Carga visitas
//     this.statsSvc.getVisitasPorMes().subscribe((data: any) => {
//       this.visitasChart = {
//         ...this.visitasChart,
//         dataTable: [['Mes', 'Visitas'], ...data]
//       };
//     });

//     // Carga pacientes por especialidad
//     this.statsSvc.getPacientesPorEspecialidad().subscribe((data: any) => {
//       this.pacientesChart = {
//         ...this.pacientesChart,
//         dataTable: [['Especialidad', 'Pacientes'], ...data]
//       };
//     });

//     // Carga de especialistas
//     this.statsSvc.getEspecialistasPorEspecialidad().subscribe((data: any) => {
//       this.especialistasChart = {
//         ...this.especialistasChart,
//         dataTable: [['Especialidad', 'Cantidad'], ...data]
//       };
//     });
//   }

//   public pacientesChart: GoogleChartInterface = {
//     chartType: 'PieChart',
//     dataTable: [['Especialidad', 'Pacientes']],
//     options: {
//       title: 'Pacientes por especialidad',
//       height: 400
//     }
//   };

// }

