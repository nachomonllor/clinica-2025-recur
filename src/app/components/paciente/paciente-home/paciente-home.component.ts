// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-paciente-home',
// //   standalone: true,
// //   imports: [],
// //   templateUrl: './paciente-home.component.html',
// //   styleUrl: './paciente-home.component.scss'
// // })
// // export class PacienteHomeComponent {

// // }

// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { MatCardModule } from '@angular/material/card';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatTooltipModule } from '@angular/material/tooltip';

// export interface PatientCounters {
//   proximosTurnos: number;
//   turnosPendientes: number;       // solicitados/confirmación pendiente
//   estudiosSubidos: number;        // cantidad de archivos en “Mis estudios”
//   encuestasPendientes: number;    // reseñas/encuestas post-consulta pendientes
// }

// export interface EspecialistaFav {
//   id: string;
//   nombre: string;
//   especialidad: string;
//   avatarUrl: string;
// }

// export interface TurnoPaciente {
//   id: string;
//   especialistaId: string;
//   especialistaNombre: string;
//   fechaISO: string;               // ISO 8601
//   estado: 'confirmado' | 'pendiente' | 'cancelado';
//   motivo?: string;
// }

// @Component({
//   selector: 'app-paciente-home',
//   standalone: true,
//   imports: [
//     CommonModule, RouterModule,
//     MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, MatTooltipModule
//   ],
//   templateUrl: './paciente-home.component.html',
//   styleUrls: ['./paciente-home.component.scss']
// })
// export class PacienteHomeComponent {
//   @Input() counters: PatientCounters | null = null;
//   @Input() proximosTurnos: TurnoPaciente[] = [];   // ordenar por fecha asc
//   @Input() especialistasFav: EspecialistaFav[] = [];

//   showFab = false;
//   toggleFab() { this.showFab = !this.showFab; }

//   // Acciones (enlazá Router/servicios reales)
//   onSolicitarTurno() { /* this.router.navigateByUrl('/solicitar-turno'); */ }
//   onVerTurnos()      { /* this.router.navigateByUrl('/paciente/turnos'); */ }
//   onSubirEstudio()   { /* this.router.navigateByUrl('/paciente/estudios/subir'); */ }
//   onEncuestas()      { /* this.router.navigateByUrl('/paciente/encuestas'); */ }
//   onCancelarTurno(tid: string) { /* TODO: abrir diálogo de confirmación y cancelar */ }
// }

