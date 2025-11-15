// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-seleccion-estadisticas',
//   standalone: true,
//   imports: [],
//   templateUrl: './seleccion-estadisticas.component.html',
//   styleUrl: './seleccion-estadisticas.component.scss'
// })
// export class SeleccionEstadisticasComponent {

// }


import { Component } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';

type TarjetaEstadistica = {
  titulo: string;
  subtitulo: string;
  icono: string;
  ruta: string;
  aria?: string;
};

@Component({
  selector: 'app-seleccion-estadisticas',
  standalone:true,
  templateUrl: './seleccion-estadisticas.component.html',
  imports: [ CommonModule,
     MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatRippleModule,
    MatTooltipModule ,
    RouterLink
  ],
  styleUrls: ['./seleccion-estadisticas.component.scss'],
  animations: [
    trigger('entradaCuadricula', [
      transition(':enter', [
        query('.tarjeta-estadistica', [
          style({ opacity: 0, transform: 'translateY(12px) scale(.98)' }),
          stagger(80, animate('250ms ease-out', style({ opacity: 1, transform: 'none' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class SeleccionEstadisticasComponent {

  tarjetas: TarjetaEstadistica[] = [
    {
      titulo: 'Log de Ingresos',
      subtitulo: 'Visualiza el historial de accesos al sistema',
      icono: 'login',
      //  ruta: '/estadisticas/log',
      ruta: '/log-ingreso',

      aria: 'Ir a Log de Ingresos'
    },
    {
      titulo: 'Turnos por Especialidad',
      subtitulo: 'Análisis de turnos agrupados por especialidad médica',
      icono: 'assignment',
      //ruta: '/estadisticas/por-especialidad',
      ruta: '/turnos-por-especialidad',
      aria: 'Ir a Turnos por Especialidad'
    },
    {
      titulo: 'Turnos por Médico',
      subtitulo: 'Estadísticas de turnos por especialista',
      icono: 'local_hospital',
      ruta: '/estadisticas/por-medico',
      aria: 'Ir a Turnos por Médico'
    },
    {
      titulo: 'Turnos por Día',
      subtitulo: 'Cantidad de turnos agendados por día',
      icono: 'event',
      ruta: '/estadisticas/por-dia',
      aria: 'Ir a Turnos por Día'
    }
  ];

  constructor(private router: Router) {}

  abrir(tarjeta: TarjetaEstadistica) {
    this.router.navigateByUrl(tarjeta.ruta);
  }
}
