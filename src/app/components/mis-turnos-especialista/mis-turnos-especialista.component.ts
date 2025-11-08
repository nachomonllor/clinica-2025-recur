

import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';

import { Router } from '@angular/router';
import { TurnoEspecialista } from '../../../models/turno-especialista.model';
import { Turno } from '../../../models/turno.model';
import { TurnoService } from '../../services/turno.service';

@Component({
  selector: 'app-mis-turnos-especialista',
  standalone: true,
  templateUrl: './mis-turnos-especialista.component.html',
  styleUrl: './mis-turnos-especialista.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule
  ]
})
export class MisTurnosEspecialistaComponent implements OnInit {
  //dataSource = new MatTableDataSource<Turno>([]);
  //dataSource = new MatTableDataSource<(Turno & { pacienteNombre: string })>([]);

  dataSource = new MatTableDataSource<TurnoEspecialista>([]);

  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<unknown>;

  displayedColumns = [
    'id', 'fecha', 'hora', 'especialidad', 'paciente', 'estado', 'acciones'
  ];

  constructor(
    private turnoService: TurnoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public router: Router

  ) { }

  /** Rechazar turno: abre diálogo y deja comentario */
  rechazarTurno(turno: Turno): void {
    const ref = this.dialog.open(this.confirmDialog, {
      data: { message: `Indica motivo de rechazo para el turno #${turno.id}` }
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        turno.estado = 'rechazado';
        this.snackBar.open(`Turno ${turno.id} rechazado`, 'Cerrar', { duration: 2000 });
        this.dataSource.data = [...this.dataSource.data];
      }
    });
  }

  /** Cancelar turno: abre diálogo y deja comentario */
  cancelarTurno(turno: Turno): void {
    const ref = this.dialog.open(this.confirmDialog, {
      data: { message: `Indica motivo de cancelación para el turno #${turno.id}` }
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        turno.estado = 'cancelado';
        this.snackBar.open(`Turno ${turno.id} cancelado`, 'Cerrar', { duration: 2000 });
        this.dataSource.data = [...this.dataSource.data];
      }
    });
  }

  /** Finalizar turno: abre confirm y navega a formulario de reseña */
  finalizarTurno(turno: Turno): void {
    const ref = this.dialog.open(this.confirmDialog, {
      data: { message: `¿Quieres dejar reseña para el turno #${turno.id}?` }
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.router.navigate(['/resena-especialista', turno.id]);
      }
    });
  }

  // ngOnInit(): void {
  //   this.turnoService.getMockTurnosEspecialista()
  //     .subscribe((list: TurnoEspecialista[]) => {
  //       this.dataSource.data = list;
  //       this.dataSource.filterPredicate = (t, f) =>
  //         t.especialidad.toLowerCase().includes(f) ||
  //         t.paciente.toLowerCase().includes(f);
  //     });
  // }

  ngOnInit(): void {
  this.turnoService.getTurnosEspecialista$().subscribe({
    next: (ts) => {
      // si usás MatTable:
      this.dataSource.data = ts;              // <- si tenés MatTableDataSource
      // PARA GUARDAR EN UN ARRAY SIMPLE:
      // this.turnos = ts;
    },
    error: (e) => console.error('[MisTurnosEspecialista] Error', e)
  });
}


  // applyFilter(value: string): void {
  //   this.dataSource.filter = value.trim().toLowerCase();
  // }

  applyFilter(valor: string = ''): void {
    this.dataSource.filter = (valor || '').trim().toLowerCase();
    this.dataSource.paginator?.firstPage?.();
  }

  aceptarTurno(turno: TurnoEspecialista): void {
    turno.estado = 'aceptado';
    this.snackBar.open(`Turno ${turno.id} aceptado`, 'Cerrar', { duration: 2000 });
    this.dataSource.data = [...this.dataSource.data];
  }

  verResena(turno: TurnoEspecialista): void {
    this.snackBar.open(turno.resena ?? 'Sin reseña', 'Cerrar', { duration: 4000 });
  }

}



// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-mis-turnos-especialista',
//   imports: [],
//   templateUrl: './mis-turnos-especialista.component.html',
//   styleUrl: './mis-turnos-especialista.component.scss'
// })
// export class MisTurnosEspecialistaComponent {

// }
