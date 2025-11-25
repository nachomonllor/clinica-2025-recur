// src/app/components/mis-turnos-paciente/mis-turnos-paciente.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';

import { SupabaseService } from '../../../services/supabase.service';
import { TurnosService } from '../../../services/turnos.service';
import { TurnoVM } from '../../models/turno.model';

import { StatusLabelPipe } from '../../../pipes/status-label.pipe';
import { StatusBadgeDirective } from '../../../directives/status-badge.directive';
import { ElevateOnHoverDirective } from '../../../directives/elevate-on-hover.directive';

import * as XLSX from 'xlsx';

@Component({
  selector: 'app-mis-turnos-paciente',
  standalone: true,
  templateUrl: './mis-turnos-paciente.component.html',
  styleUrls: ['./mis-turnos-paciente.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
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

  displayedColumns: string[] = [
    'id',
    'fecha',
    'hora',
    'especialidad',
    'especialista',
    'estado',
    'acciones'
  ];

  dataSource = new MatTableDataSource<TurnoVM>([]);

  @ViewChild('cancelDialog') cancelDialog!: TemplateRef<unknown>;
  @ViewChild('calificarDialog') calificarDialog!: TemplateRef<unknown>;
  @ViewChild('verResenaDialog') verResenaDialog!: TemplateRef<unknown>;

  constructor(
    private turnoService: TurnosService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private supa: SupabaseService
  ) { }

  ngOnInit(): void {
    this.turnoService.getTurnosPacienteVM$().subscribe({
      next: (ts: TurnoVM[]) => {
        this.dataSource.data = ts;
        this.dataSource.filterPredicate = (t, f) => {
          const haystack = `${t.especialidad} ${t.especialista} ${t.estado} ${t.historiaBusqueda || ''}`.toLowerCase();
          return haystack.includes(f);
        };
      },
      error: (e: any) =>
        console.error('[MisTurnosPaciente] Error al cargar turnos', e)
    });
  }

  applyFilter(value: string): void {
    this.dataSource.filter = (value || '').trim().toLowerCase();
  }

  // ---------- Reglas de negocio ----------

  puedeCancelar(t: TurnoVM): boolean {
    if (t.estado === 'realizado' || t.estado === 'cancelado') return false;

    const ahora = new Date();
    const [hhStr, mmStr] = t.hora.split(':');
    const hh = Number(hhStr) || 0;
    const mm = Number(mmStr) || 0;

    const fechaHoraTurno = new Date(
      t.fecha.getFullYear(),
      t.fecha.getMonth(),
      t.fecha.getDate(),
      hh,
      mm
    );

    return fechaHoraTurno.getTime() > ahora.getTime();
  }

  cancelarTurno(t: TurnoVM): void {
    if (!this.puedeCancelar(t)) {
      this.snackBar.open('Este turno ya no puede cancelarse.', 'Cerrar', {
        duration: 2500
      });
      return;
    }

    const comentarioForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(10)]]
    });

    const ref = this.dialog.open(this.cancelDialog, {
      data: { turno: t, form: comentarioForm },
      width: '500px'
    });

    // ref.afterClosed().subscribe(result => {
    //   if (!result) return;

    //   if (comentarioForm.invalid) {
    //     this.snackBar.open(
    //       'Debes ingresar un motivo de al menos 10 caracteres.',
    //       'Cerrar',
    //       { duration: 2500 }
    //     );
    //     return;
    //   }

    //   // TODO: guardar comentario si querés
    //   this.turnoService.cancelarTurno(t.id).subscribe({
    //     next: () => {
    //       t.estado = 'cancelado';
    //       this.dataSource.data = [...this.dataSource.data];
    //       this.snackBar.open('Turno cancelado', 'Cerrar', { duration: 2000 });
    //     },
    //     error: (e: any) => {
    //       console.error(e);
    //       this.snackBar.open(
    //         `Error al cancelar: ${e?.message || e}`,
    //         'Cerrar',
    //         { duration: 2500 }
    //       );
    //     }
    //   });
    // });


    // dentro de ref.afterClosed()
    ref.afterClosed().subscribe(result => {
      if (!result) return;

      if (comentarioForm.invalid) {
        this.snackBar.open(
          'Debes ingresar un motivo de al menos 10 caracteres.',
          'Cerrar',
          { duration: 2500 }
        );
        return;
      }

      const comentario = comentarioForm.value.comentario ?? '';

      this.turnoService.cancelarTurno(t.id, comentario).subscribe({
        next: () => {
          t.estado = 'cancelado';
          this.dataSource.data = [...this.dataSource.data];
          this.snackBar.open('Turno cancelado', 'Cerrar', { duration: 2000 });
        },
        error: (e: any) => {
          console.error(e);
          this.snackBar.open(
            `Error al cancelar: ${e?.message || e}`,
            'Cerrar',
            { duration: 2500 }
          );
        }
      });
    });

  }

  puedeVerResena(t: TurnoVM): boolean {
    // Solo mostrar si hay reseña (comentario del especialista) y no está vacío
    // La reseña solo existe cuando el especialista finaliza el turno y deja un comentario
    return !!(t.resena && typeof t.resena === 'string' && t.resena.trim().length > 0);
  }

  puedeCompletarEncuesta(t: TurnoVM): boolean {
    return t.estado === 'realizado' && this.puedeVerResena(t) && !t.encuesta;
  }

  puedeCalificar(t: TurnoVM): boolean {
    return t.estado === 'realizado';
  }

  verResena(t: TurnoVM): void {
    if (!t.resena || t.resena.trim().length === 0) {
      this.snackBar.open('Este turno no tiene reseña disponible', 'Cerrar', { duration: 2500 });
      return;
    }
    // Mostrar la reseña en un diálogo
    this.dialog.open(this.verResenaDialog, {
      data: { turno: t, resena: t.resena },
      width: '500px'
    });
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
      data: { turno: t, form: calificacionForm },
      width: '500px'
    });

    ref.afterClosed().subscribe(result => {
      if (result && calificacionForm.valid) {
        const fv = calificacionForm.value;
        const encuestaData = {
          estrellas: fv.estrellas,
          comentario: fv.comentario,
          fecha: new Date().toISOString()
        };

        // OJO: idealmente esto debería ir a encuestas_atencion.
        this.supa.client
          .from('turnos')
          .update({ encuesta: encuestaData as any })
          .eq('id', t.id)
          .then(({ error }) => {
            if (error) {
              this.snackBar.open(
                `Error al calificar: ${error.message}`,
                'Cerrar',
                { duration: 2500 }
              );
            } else {
              t.encuesta = true;
              t.calificacion = fv.estrellas ?? undefined;
              this.dataSource.data = [...this.dataSource.data];
              this.snackBar.open('Calificación guardada', 'Cerrar', {
                duration: 2000
              });
            }
          });
      }
    });
  }

  get turnos(): TurnoVM[] {
    const ds = this.dataSource as MatTableDataSource<TurnoVM>;
    const filtered = ds.filteredData;
    return (filtered && filtered.length ? filtered : ds.data) || [];
  }

  exportarHistoriaClinicaExcel(): void {
    const turnos = this.turnos;  // respeta el filtro actual

    if (!turnos.length) {
      this.snackBar.open('No hay turnos para exportar.', 'Cerrar', {
        duration: 2500
      });
      return;
    }

    const filas = turnos.map((t, idx) => ({
      Nro: idx + 1,
      Fecha: t.fecha ? t.fecha.toLocaleDateString('es-AR') : '',
      Hora: t.hora ?? '',
      Estado: t.estado ?? '',
      Especialidad: t.especialidad ?? '',
      Profesional: t.especialista ?? '',
      Calificación: t.calificacion ?? '',
      'Reseña del especialista': t.resena ?? '',
      'Historia clínica (texto)': (t as any).historiaClinica || t.historiaBusqueda || ''
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(filas);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historia Clínica');

    const ahora = new Date();
    const fechaArchivo = `${ahora.getFullYear()}${(ahora.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${ahora.getDate().toString().padStart(2, '0')}_${ahora
        .getHours()
        .toString()
        .padStart(2, '0')}${ahora.getMinutes().toString().padStart(2, '0')}`;

    const fileName = `historia_clinica_${fechaArchivo}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

}


