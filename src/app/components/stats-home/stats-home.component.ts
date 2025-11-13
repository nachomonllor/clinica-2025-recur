// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-stats-home',
//   standalone: true,
//   imports: [],
//   templateUrl: './stats-home.component.html',
//   styleUrl: './stats-home.component.scss'
// })
// export class StatsHomeComponent {

// }


import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

type StatOption = {
  title: string;
  subtitle: string;
  icon: 'login' | 'list' | 'group' | 'calendar';
  route: string;
  accent: string; // color HEX para cada tarjeta
};

@Component({
  selector: 'app-stats-home',
  standalone:true,
  templateUrl: './stats-home.component.html',
  imports:[CommonModule, RouterModule],
  styleUrls: ['./stats-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsHomeComponent {
  options: StatOption[] = [
    {
      title: 'Log de Ingresos',
      subtitle: 'Visualiza el historial de accesos al sistema',
      icon: 'login',
      route: '/estadisticas/log-ingresos',
      accent: '#10B981' // verde
    },
    {
      title: 'Turnos por Especialidad',
      subtitle: 'Análisis de turnos agrupados por especialidad médica',
      icon: 'list',
      route: '/estadisticas/turnos-especialidad',
      accent: '#06B6D4' // cian
    },
    {
      title: 'Turnos por Médico',
      subtitle: 'Estadísticas de turnos por especialista',
      icon: 'group',
      route: '/estadisticas/turnos-medico',
      accent: '#7C3AED' // violeta
    },
    {
      title: 'Turnos por Día',
      subtitle: 'Visualización de la cantidad de turnos agendados por día',
      icon: 'calendar',
      route: '/estadisticas/turnos-dia',
      accent: '#22C55E' // verde claro
    }
  ];

  trackByTitle = (_: number, it: StatOption) => it.title;
}
