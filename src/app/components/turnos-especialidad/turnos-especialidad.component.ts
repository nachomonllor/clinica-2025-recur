
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-turnos-especialidad',
  standalone: true,
  templateUrl: './turnos-especialidad.component.html',
  styleUrls: ['./turnos-especialidad.component.scss'],
  imports: [CommonModule, MatCardModule]
})
export class TurnosEspecialidadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bar1', { static: true }) bar1!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bar2', { static: true }) bar2!: ElementRef<HTMLCanvasElement>;

  private chart1?: Chart;
  private chart2?: Chart;

  ngAfterViewInit(): void {
    // Datos de ejemplo; reemplazá por datos reales cuando tengas el servicio
    const labelsEsp = ['Clínica', 'Cardiología', 'Pediatría', 'Dermatología'];
    const valuesEsp = [12, 7, 10, 5];

    const labelsDia = ['2025-07-01', '2025-07-02', '2025-07-03', '2025-07-04'];
    const valuesDia = [4, 6, 3, 8];

    this.chart1 = new Chart(this.bar1.nativeElement, {
      type: 'bar',
      data: { labels: labelsEsp, datasets: [{ label: 'Turnos', data: valuesEsp }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    this.chart2 = new Chart(this.bar2.nativeElement, {
      type: 'line',
      data: { labels: labelsDia, datasets: [{ label: 'Turnos por día', data: valuesDia, tension: .2 }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  ngOnDestroy(): void {
    this.chart1?.destroy();
    this.chart2?.destroy();
  }
}





// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
// import { FormsModule } from '@angular/forms';

// @Component({
//   selector: 'app-turnos-especialidad',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//    templateUrl: './turnos-especialidad.component.html',
//    styleUrl: './turnos-especialidad.component.scss'
// })
// export class TurnosEspecialidadComponent /*implements OnInit*/ {
//   public barChartOptions: ChartConfiguration['options'] = {
//     responsive: true,
//     scales: {
//       x: {},
//       y: { beginAtZero: true }
//     }
//   };
//   public barChartType: ChartType = 'bar';
//   public barChartData: ChartData<'bar'> = {
//     labels: [],
//     datasets: [
//       { data: [], label: 'Turnos' }
//     ]
//   };

//   // constructor(private turnoService: TurnoService) {}

//   // ngOnInit(): void {
//   //   this.turnoService.getTurnosByEspecialidad().subscribe((counts: CountByKey[]) => {
//   //     this.barChartData.labels = counts.map(c => c.key);
//   //     this.barChartData.datasets[0].data = counts.map(c => c.count);
//   //   });
//   // }
// }



// // // src/app/components/turnos-especialidad/turnos-especialidad.component.ts
// // import { Component, OnInit } from '@angular/core';
// // import { CommonModule }      from '@angular/common';
// //  import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
// // import { CountByKey, TurnoService } from '../turno.service';
 
// // @Component({
// //     selector: 'app-turnos-especialidad',
// //     standalone: true,              
// //     imports: [
// //         CommonModule,
// //         NgChartsModule // ← en imports
// //     ],
// //    templateUrl: './turnos-especialidad.component.html',
// //    styleUrl: './turnos-especialidad.component.scss'
// // })
// // export class TurnosEspecialidadComponent implements OnInit {
// //   public barChartOptions: ChartConfiguration['options'] = {
// //     responsive: true,
// //     scales: { x: {}, y: { beginAtZero: true } }
// //   };
// //   public barChartType: ChartType = 'bar';
// //   public barChartData: ChartData<'bar'> = {
// //     labels: [],
// //     datasets: [{ data: [], label: 'Turnos' }]
// //   };

// //   constructor(private turnoService: TurnoService) {}

// //   ngOnInit(): void {
// //     this.turnoService.getTurnosByEspecialidad().subscribe((counts: CountByKey[]) => {
// //       this.barChartData.labels = counts.map(c => c.key);
// //       this.barChartData.datasets[0].data = counts.map(c => c.count);
// //     });
// //   }
// // }




// // // src/app/components/turnos-especialidad-chart/turno-especialidad-chart.component.ts
// // import { Component, OnInit } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// //  import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
// // import { CountByKey, TurnoService } from '../turno.service';
 
 
// // @Component({
// //   selector: 'app-turno-especialidad-chart',
// //   standalone: true,
// //   imports: [ CommonModule ],
// //   templateUrl: './turnos-especialidad.component.html',
// //   styleUrl: './turnos-especialidad.component.scss'
// // })
// // export class TurnoEspecialidadChartComponent implements OnInit {
// //   public barChartOptions: ChartConfiguration['options'] = {
// //     responsive: true,
// //     scales: {
// //       x: {},
// //       y: { beginAtZero: true }
// //     }
// //   };
// //   public barChartType: ChartType = 'bar';
// //   public barChartData: ChartData<'bar'> = {
// //     labels: [],
// //     datasets: [
// //       { data: [], label: 'Turnos' }
// //     ]
// //   };

// //   constructor(private turnoService: TurnoService) {}

// //   ngOnInit(): void {
// //     this.turnoService.getTurnosByEspecialidad().subscribe((counts: CountByKey[]) => {
// //       this.barChartData.labels = counts.map(c => c.key);
// //       this.barChartData.datasets[0].data = counts.map(c => c.count);
// //     });
// //   }
// // }
