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
import { TarjetaEstadistica } from '../../models/estadistica.model';

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
      ruta: '/turnos-por-medico',
      aria: 'Ir a Turnos por Médico'
    },
    {
      titulo: 'Turnos por Día',
      subtitulo: 'Cantidad de turnos agendados por día',
      icono: 'event',
      ruta: '/turnos-por-dia',
      aria: 'Ir a Turnos por Día'
    },
    {
      titulo: 'Pacientes por Especialidad',
      subtitulo: 'Cantidad de pacientes únicos por especialidad',
      icono: 'people',
      ruta: '/pacientes-por-especialidad',
      aria: 'Ir a Pacientes por Especialidad'
    },
    {
      titulo: 'Médicos por Especialidad',
      subtitulo: 'Cantidad de médicos únicos por especialidad',
      icono: 'medical_services',
      ruta: '/medicos-por-especialidad',
      aria: 'Ir a Médicos por Especialidad'
    },
    {
      titulo: 'Informe de Encuestas',
      subtitulo: 'Respuestas completas de las encuestas de atención',
      icono: 'rate_review',
      ruta: '/informe-encuestas',
      aria: 'Ir a Informe de Encuestas'
    },
    {
      titulo: 'Turnos por Paciente',
      subtitulo: 'Visualiza todos los turnos de un paciente seleccionado',
      icono: 'assignment_ind',
      ruta: '/turnos-por-paciente',
      aria: 'Ir a Turnos por Paciente'
    },
    {
      titulo: 'Resultados Encuestas',
      subtitulo: 'Visualiza los resultados de las encuestas con informes',
      icono: 'assignment_ind',
      ruta: '/resultados-encuestas',
      aria: 'Ir a Resultados Encuestas'
    }

  ];

  constructor(private router: Router) {}

  abrir(tarjeta: TarjetaEstadistica) {
    this.router.navigateByUrl(tarjeta.ruta);
  }
}
