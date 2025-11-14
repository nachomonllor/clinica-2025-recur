import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { TurnoService } from '../../../services/turno.service';
import { TurnoVM } from '../../../models/turno.model';
import { SupabaseService } from '../../../services/supabase.service';
import { StatusLabelPipe } from '../../../pipes/status-label.pipe';
import { StatusBadgeDirective } from '../../../directives/status-badge.directive';
import { ElevateOnHoverDirective } from '../../../directives/elevate-on-hover.directive';

@Component({
  selector: 'app-mis-turnos-paciente',
  standalone: true,
  templateUrl: './mis-turnos-paciente.component.html',
  styleUrls: ['./mis-turnos-paciente.component.scss'],
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
    MatSnackBarModule,
    MatSelectModule,
    StatusLabelPipe,
    StatusBadgeDirective,
    ElevateOnHoverDirective
  ]
})
export class MisTurnosPacienteComponent implements OnInit {
  displayedColumns: string[] = ['id', 'fecha', 'hora', 'especialidad', 'especialista', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<TurnoVM>([]);

  @ViewChild('cancelDialog') cancelDialog!: TemplateRef<unknown>;
  @ViewChild('calificarDialog') calificarDialog!: TemplateRef<unknown>;

  constructor(
    private turnoService: TurnoService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private supa: SupabaseService
  ) { }

  ngOnInit(): void {
    // cargar desde Supabase
    this.turnoService.getTurnosPacienteVM$().subscribe({
      next: (ts) => {
        this.dataSource.data = ts;
        this.dataSource.filterPredicate = (t, f) => {
          const haystack = `${t.especialidad} ${t.especialista} ${t.estado} ${t.historiaBusqueda || ''}`.toLowerCase();
          return haystack.includes(f);
        };
      },
      error: (e) => console.error('[MisTurnosPaciente] Error', e)
    });
  }

  /* Buscar */
  applyFilter(value: string): void {
    this.dataSource.filter = (value || '').trim().toLowerCase();
  }

  /** El paciente puede cancelar si no está realizado y la fecha es futura */
  puedeCancelar(t: TurnoVM): boolean {
    if (t.estado === 'realizado') return false;
    const ahora = new Date();
    const fechaHora = new Date(
      t.fecha.getFullYear(), t.fecha.getMonth(), t.fecha.getDate(),
      Number(t.hora.slice(0, 2)), Number(t.hora.slice(3, 5))
    );
    return fechaHora.getTime() > ahora.getTime();
  }

  cancelarTurno(t: TurnoVM): void {
    const comentarioForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(10)]]
    });

    const ref = this.dialog.open(this.cancelDialog, { 
      data: { 
        turno: t,
        form: comentarioForm
      },
      width: '500px'
    });

    ref.afterClosed().subscribe(result => {
      if (result && comentarioForm.valid) {
        // TODO: Guardar comentario en BD (podría agregarse un campo comentario_cancelacion en turnos)
      this.turnoService.cancelarTurno(t.id).subscribe({
        next: () => {
          t.estado = 'cancelado';
          this.dataSource.data = [...this.dataSource.data];
            this.snackBar.open(`Turno cancelado`, 'Cerrar', { duration: 2000 });
        },
        error: (e) => this.snackBar.open(`Error al cancelar: ${e?.message || e}`, 'Cerrar', { duration: 2500 })
      });
      }
    });
  }

  puedeVerResena(t: TurnoVM): boolean {
    return !!t.resena && t.resena.trim().length > 0;
  }

  puedeCompletarEncuesta(t: TurnoVM): boolean {
    return t.estado === 'realizado' && this.puedeVerResena(t) && !t.encuesta;
  }

  puedeCalificar(t: TurnoVM): boolean {
    return t.estado === 'realizado';
  }

  verResena(t: TurnoVM): void {
    this.router.navigate(['/resenia', t.id]);
  }

  completarEncuesta(t: TurnoVM): void {
    this.router.navigate(['/encuesta-atencion', t.id]);
  }

  calificarAtencion(t: TurnoVM): void {
    const calificacionForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(10)]],
      estrellas: [5, [Validators.required, Validators.min(1), Validators.max(5)]]
    });

    const ref = this.dialog.open(this.calificarDialog, {
      data: {
        turno: t,
        form: calificacionForm
      },
      width: '500px'
    });

    ref.afterClosed().subscribe(result => {
      if (result && calificacionForm.valid) {
        const fv = calificacionForm.value;
        // Guardar calificación en encuesta (JSONB)
        const encuestaData = {
          estrellas: fv.estrellas,
          comentario: fv.comentario,
          fecha: new Date().toISOString()
        };

        this.supa.client
          .from('turnos')
          .update({ encuesta: encuestaData })
          .eq('id', t.id)
          .then(({ error }) => {
            if (error) {
              this.snackBar.open(`Error al calificar: ${error.message}`, 'Cerrar', { duration: 2500 });
            } else {
              t.encuesta = true;
              t.calificacion = fv.estrellas ?? undefined;
              this.dataSource.data = [...this.dataSource.data];
              this.snackBar.open('Calificación guardada', 'Cerrar', { duration: 2000 });
            }
          });
      }
    });
  }
}




