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

import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { Counters, EstadoTurno, TurnoVM, UUID } from '../../../../models/interfaces';

@Component({
  selector: 'app-especialista-home',
  standalone: true,
  templateUrl: './especialista-home.component.html',
  styleUrls: ['./especialista-home.component.scss'],
  imports: [
    // Angular
    CommonModule, RouterModule, DatePipe,
    // Material
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EspecialistaHomeComponent {
  counters?: Counters;

  /** La vista consume este arreglo y el HTML actual funciona sin cambios */
  proximosTurnos: TurnoVM[] = [];

  /** Inicializá a [] para evitar *ngIf con undefined */
  pacientesFav: { id: string; nombre: string; avatarUrl: string }[] = [];

  showFab = false;

  // ---------------------------
  // Carga/normalización de datos
  // ---------------------------
  /**
   * Llamá a este método con el arreglo crudo que te entregue tu servicio.
   * Ejemplo de uso:
   *   this.turnosSrv.proximos().subscribe(raw => this.setProximosTurnos(raw));
   */
  setProximosTurnos(rawTurnos: any[] | null | undefined): void {
    this.proximosTurnos = (rawTurnos ?? [])
      .map(t => this.toVM(t))
      // descartamos los que no tengan fecha o paciente
      .filter(vm => !!vm.fechaISO && !!vm.pacienteId)
      // ordenamos por fecha ascendente
      .sort((a, b) => +new Date(a.fechaISO) - +new Date(b.fechaISO));
  }

  // // ---------------------------
  // // Helpers de normalización
  // // ---------------------------
  // private toVM(t: any): TurnoVM {
  //   const fecha = this.pickDate(t);
  //   const pacienteId =
  //     t.pacienteId ?? t.paciente?.id ?? t.paciente?.uid ?? t.pacienteUID ?? '';

  //   const pacienteNombre =
  //     t.pacienteNombre ??
  //     t.paciente?.nombre ??
  //     t.paciente?.displayName ??
  //     t.paciente?.name ??
  //     'Paciente';

  //   const motivo: string | null =
  //     t.motivo ?? t.motivoConsulta ?? t.descripcion ?? null;

  //   return {
  //       id: String(t.id ?? t.uid ?? t._id ?? crypto.randomUUID?.() ?? Math.random()),
  //       fechaISO: fecha ? fecha.toISOString() : '',
  //       pacienteId,
  //       pacienteNombre,
  //       motivo,

  //       especialidad: '',
  //       especialista: '',
  //       estado: 'realizado',

  //     };
  // }


  // private toVM(t: any): TurnoVM {
  //   const fecha: Date | null = this.pickDate(t) ?? null;

  //   const pacienteId: UUID | undefined =
  //     (t.pacienteId ?? t.paciente?.id ?? t.paciente?.uid ?? t.pacienteUID) || undefined;

  //   const pacienteNombre: string =
  //     t.pacienteNombre ??
  //     t.paciente?.nombre ??
  //     t.paciente?.displayName ??
  //     t.paciente?.name ??
  //     'Paciente';

  //   const motivo: string | null =
  //     t.motivo ?? t.motivoConsulta ?? t.descripcion ?? null;

  //   // Derivados/obligatorios
  //   const especialidad: string =
  //     t.especialidad?.nombre ?? t.especialidad ?? '—';

  //   const especialista: string =
  //     t.especialista?.nombreCompleto ??
  //     [t.especialista?.apellido, t.especialista?.nombre].filter(Boolean).join(', ') ||
  //     t.especialistaNombre ||
  //     '—';

  //   const estado: EstadoTurno = (t.estado as EstadoTurno) ?? 'pendiente';

  //   return {
  //     id: String(t.id ?? t.uid ?? t._id ?? crypto.randomUUID?.() ?? Math.random()) as UUID,
  //     fechaISO: fecha ? fecha.toISOString() : '',
  //     especialidad,
  //     especialista,
  //     estado,

  //     // opcionales / extras:
  //     pacienteId,
  //     pacienteNombre,
  //     motivo,
  //   };
  // }

  private toVM(t: any): TurnoVM {
  const fecha: Date | null = this.pickDate(t) ?? null;

  const pacienteId: UUID | undefined =
    (t.pacienteId ?? t.paciente?.id ?? t.paciente?.uid ?? t.pacienteUID) || undefined;

  const nombre =
    t.pacienteNombre ??
    t.paciente?.nombre ??
    t.paciente?.displayName ??
    t.paciente?.name ??
    'Paciente';

  const motivo: string | null =
    t.motivo ?? t.motivoConsulta ?? t.descripcion ?? null;

  const especialidad: string =
    t.especialidad?.nombre ?? t.especialidad ?? '—';

  // const especialista: string =
  //   t.especialista?.nombreCompleto ??
  //   [t.especialista?.apellido, t.especialista?.nombre].filter(Boolean).join(', ') ||
  //   t.especialistaNombre ||
  //   '—';

  
  const especialista =
  [t.especialista?.apellido, t.especialista?.nombre].filter(Boolean).join(', ') || 
  t.especialistaNombre ?? 
  '—';


  const estado: EstadoTurno = (t.estado as EstadoTurno) ?? 'pendiente';

  return {
    id: String(t.id ?? t.uid ?? t._id ?? crypto.randomUUID?.() ?? Math.random()) as UUID,
    fechaISO: fecha ? fecha.toISOString() : '',
    especialidad,
    especialista,
    estado,

    // opcionales existentes
    pacienteId,
    notas: [nombre, motivo].filter(Boolean).join(' — ') || null,
  };
}



  /** Detecta la fecha sin importar cómo venga (Date, string, number, Timestamp) */
  private pickDate(t: any): Date | null {
    // Candidatos más comunes en modelos de citas
    const candidates = [
      t.fechaISO,
      t.fecha,
      t.fechaHora,
      t.inicio,
      t.start,
      t.horario,
      t.date
    ];

    for (const c of candidates) {
      const d = this.toDate(c);
      if (d) return d;
    }

    // Firestore Timestamp en propiedades anidadas (fallback)
    if (t?.fecha?.toDate) {
      try { return t.fecha.toDate(); } catch { }
    }
    if (t?.inicio?.toDate) {
      try { return t.inicio.toDate(); } catch { }
    }

    return null;
  }

  private toDate(v: any): Date | null {
    if (!v) return null;
    if (v instanceof Date) return v;

    // Firestore Timestamp
    if (typeof v === 'object' && typeof v.toDate === 'function') {
      try { return v.toDate(); } catch { return null; }
    }

    if (typeof v === 'number') {
      // Si viene en segundos, lo pasamos a ms
      return new Date(v > 1e12 ? v : v * 1000);
    }

    if (typeof v === 'string') {
      const d = new Date(v);
      return isNaN(+d) ? null : d;
    }

    return null;
  }

  // ---------------------------
  // UI actions
  // ---------------------------
  trackByTurno = (_: number, t: TurnoVM) => t.id;

  toggleFab() { this.showFab = !this.showFab; }
  onNuevoTurno() { /* navegar/abrir modal */ }
  onVerAgenda() { /* navegar a agenda */ }
  onResenias() { /* navegar a reseñas */ }
}









// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { MatCardModule } from '@angular/material/card';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { PacienteFav, SpecialistCounters, Turno } from '../../../../models/interfaces';

// @Component({
//   selector: 'app-especialista-home',
//   standalone: true,
//   imports: [
//     CommonModule, RouterModule,
//     MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, MatTooltipModule
//   ],
//   templateUrl: './especialista-home.component.html',
//   styleUrls: ['./especialista-home.component.scss']
// })
// export class EspecialistaHomeComponent {
//   @Input() counters: SpecialistCounters | null = null;
//   @Input() pacientesFav: PacienteFav[] = [];  // INYECTAR lista real (solo atendidos ≥1)
//   @Input() proximosTurnos: Turno[] = [];      // inyectá turnos ordenados por fecha asc

//   showFab = false;
//   toggleFab() { this.showFab = !this.showFab; }

//   // Navegaciones/acciones (completa con Router si querés navegar desde TS)
//   onNuevoTurno() { /* this.router.navigateByUrl('/solicitar-turno'); */ }
//   onVerAgenda()  { /* this.router.navigateByUrl('/especialista/agenda'); */ }
//   onResenias()   { /* this.router.navigateByUrl('/especialista/resenias'); */ }
// }
