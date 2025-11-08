// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-especialista-home',
//   standalone: true,
//   imports: [],
//   templateUrl: './especialista-home.component.html',
//   styleUrl: './especialista-home.component.scss'
// })
// export class EspecialistaHomeComponent {

// }

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface SpecialistCounters {
  pacientes: number;               // pacientes atendidos al menos 1 vez
  turnosHoy: number;
  proximosTurnos: number;
  reseniasPendientes: number;      // cantidad de consultas sin reseña
}

export interface PacienteFav {
  id: string;
  nombre: string;
  avatarUrl: string;
  ultimaVisita?: string;           // ISO o texto amigable
}

export interface Turno {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  fechaISO: string;                // para ordenar y formatear
  motivo?: string;
}

@Component({
  selector: 'app-especialista-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, MatTooltipModule
  ],
  templateUrl: './especialista-home.component.html',
  styleUrls: ['./especialista-home.component.scss']
})
export class EspecialistaHomeComponent {
  @Input() counters: SpecialistCounters | null = null;
  @Input() pacientesFav: PacienteFav[] = [];  // inyectá tu lista real (solo atendidos ≥1)
  @Input() proximosTurnos: Turno[] = [];      // inyectá turnos ordenados por fecha asc

  showFab = false;
  toggleFab() { this.showFab = !this.showFab; }

  // Navegaciones/acciones (completa con Router si querés navegar desde TS)
  onNuevoTurno() { /* this.router.navigateByUrl('/solicitar-turno'); */ }
  onVerAgenda()  { /* this.router.navigateByUrl('/especialista/agenda'); */ }
  onResenias()   { /* this.router.navigateByUrl('/especialista/resenias'); */ }
}
