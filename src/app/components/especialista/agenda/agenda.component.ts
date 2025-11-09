// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-agenda',
//   standalone: true,
//   imports: [],
//   templateUrl: './agenda.component.html',
//   styleUrl: './agenda.component.scss'
// })
// export class AgendaComponent {

// }


import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EstadoTurno, TurnoEspecialistaVM } from '../../../../models/interfaces';
import { TurnoService } from '../../../services/turno.service';

@Component({
  selector: 'app-agenda',
  standalone: true,
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss'],
  imports: [
    // Angular
    CommonModule,
    // Material
    MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, MatTooltipModule, MatTableModule, MatDialogModule, MatSnackBarModule
]
})
export class AgendaComponent implements OnInit {
  dataSource = new MatTableDataSource<TurnoEspecialistaVM>([]);
  displayedColumns = ['id','fecha','hora','especialidad','paciente','estado','acciones'];

  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<unknown>;

  constructor(
    private turnos: TurnoService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.turnos.getTurnosEspecialista$().subscribe({
      next: (list) => {
        this.dataSource.data = list;
        this.dataSource.filterPredicate = (t, f) =>
          (t.especialidad ?? '').toLowerCase().includes(f) ||
          (t.paciente ?? '').toLowerCase().includes(f);
      },
      error: (e) => console.error('[Agenda] Error', e)
    });
  }

  aplicarFiltro(value: string = ''): void {
    this.dataSource.filter = (value || '').trim().toLowerCase();
  }

  aceptarTurno(t: TurnoEspecialistaVM): void {
    if (['realizado','cancelado','rechazado'].includes(t.estado)) return;
    t.estado = 'aceptado' as EstadoTurno;
    this.snack.open(`Turno ${t.id} aceptado`, 'Cerrar', { duration: 2000 });
    this.dataSource.data = [...this.dataSource.data];
  }

  rechazarTurno(t: TurnoEspecialistaVM): void {
    if (['aceptado','realizado','cancelado'].includes(t.estado)) return;
    const ref = this.dialog.open(this.confirmDialog, { data: { message: `Motivo de rechazo del turno #${t.id}` } });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      t.estado = 'rechazado' as EstadoTurno;
      this.snack.open(`Turno ${t.id} rechazado`, 'Cerrar', { duration: 2000 });
      this.dataSource.data = [...this.dataSource.data];
    });
  }

  cancelarTurno(t: TurnoEspecialistaVM): void {
    if (['aceptado','realizado','rechazado'].includes(t.estado)) return;
    const ref = this.dialog.open(this.confirmDialog, { data: { message: `Motivo de cancelación del turno #${t.id}` } });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      t.estado = 'cancelado' as EstadoTurno;
      this.snack.open(`Turno ${t.id} cancelado`, 'Cerrar', { duration: 2000 });
      this.dataSource.data = [...this.dataSource.data];
    });
  }

  finalizarTurno(t: TurnoEspecialistaVM): void {
    if (t.estado !== 'aceptado') return;
    const ref = this.dialog.open(this.confirmDialog, { data: { message: `¿Dejar reseña para el turno #${t.id}?` } });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.router.navigate(['/especialista/resenia', t.id]);
    });
  }

  verResena(t: TurnoEspecialistaVM): void {
    this.snack.open(t.resenaEspecialista ?? 'Sin reseña', 'Cerrar', { duration: 4000 });
  }
}
