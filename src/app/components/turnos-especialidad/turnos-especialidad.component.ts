
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



