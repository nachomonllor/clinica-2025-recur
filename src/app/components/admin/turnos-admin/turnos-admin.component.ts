import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { SupabaseService } from '../../../../services/supabase.service';
import { EstadoTurno, TurnoUI, TurnoVM } from '../../../../models/turno.model';

@Component({
  selector: 'app-turnos-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './turnos-admin.component.html',
  styleUrls: ['./turnos-admin.component.scss']
})
export class TurnosAdminComponent implements OnInit {
  @ViewChild('cancelDialog') cancelDialog!: TemplateRef<unknown>;

  // estado de UI
  loading = false;
  busqueda = '';
  turnos: TurnoUI[] = [];
  filtrados: TurnoUI[] = [];
  seleccionado: TurnoUI | null = null;

  constructor(
    private supa: SupabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) { }

  async ngOnInit(): Promise<void> {
    await this.cargarTurnos();
  }

  // Mapea estado a clase visual
  estadoClass(e?: EstadoTurno): 'ok' | 'warn' | 'bad' {
    switch (e) {
      case 'realizado':
      case 'aceptado':
        return 'ok';
      case 'cancelado':
      case 'rechazado':
        return 'bad';
      default:
        return 'warn';
    }
  }

  async cargarTurnos(): Promise<void> {
    this.loading = true;
    try {
      // 1) Turnos + nombres de paciente y especialista
      // const { data, error } = await this.supa.client
      //   .from('turnos')
      //   .select(`
      //     id,
      //     paciente_id,
      //     especialista_id,
      //     especialidad,
      //     fecha_iso,
      //     estado,
      //     resena_especialista,
      //     encuesta,
      //     paciente:profiles!turnos_paciente_id_fkey ( apellido, nombre ),
      //     especialista:profiles!turnos_especialista_id_fkey ( apellido, nombre )
      //   `)
      //   .order('fecha_iso', { ascending: false });


      const { data, error } = await this.supa.client
      .from('turnos')
      .select(`
        id,
        paciente_id,
        especialista_id,
        especialidad,
        fecha_iso,
        estado,
        resena_especialista,
        encuesta,
        paciente:perfiles!turnos_paciente_id_fkey ( apellido, nombre ),
        especialista:perfiles!turnos_especialista_id_fkey ( apellido, nombre )
      `)
      .order('fecha_iso', { ascending: false });


      if (error) throw error;

      const turnosBase: TurnoUI[] = (data || []).map((t: any) => {
        const dt = new Date(t.fecha_iso);
        const hora = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const fechaSolo = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        const especialista = t.especialista ? `${t.especialista.apellido || ''}, ${t.especialista.nombre || ''}`.trim() : '-';
        const paciente = t.paciente ? `${t.paciente.apellido || ''}, ${t.paciente.nombre || ''}`.trim() : '-';
        return {
          id: t.id,
          fecha: fechaSolo,
          hora,
          especialidad: t.especialidad,
          especialista,
          paciente,
          estado: t.estado as EstadoTurno,
          resena: t.resena_especialista || '',
          encuesta: !!t.encuesta,
          pacienteId: t.paciente_id
        } as TurnoUI;
      });

      // 2) Historias clínicas de esos turnos (para buscar por patología/diagnóstico/síntomas)
      const ids = turnosBase.map(t => t.id);
      let patologiasPorTurno = new Map<string, string>();

      if (ids.length) {
        const { data: historias, error: hcError } = await this.supa.client
          .from('historia_clinica')
          .select('turno_id, datos_dinamicos, diagnostico, motivo, observaciones')
          .in('turno_id', ids);

        if (hcError) throw hcError;

        (historias || []).forEach((h: any) => {
          const partes: string[] = [];
          if (h.diagnostico) partes.push(String(h.diagnostico));
          if (h.motivo) partes.push(String(h.motivo));
          if (h.observaciones) partes.push(String(h.observaciones));
          if (Array.isArray(h.datos_dinamicos)) {
            for (const d of h.datos_dinamicos) {
              const txt = [d?.clave, d?.titulo, d?.nombre, d?.tipo, d?.valor, d?.detalle]
                .filter(Boolean)
                .join(' ');
              if (txt) partes.push(txt);
            }
          }
          patologiasPorTurno.set(h.turno_id, partes.join(' ').toLowerCase());
        });
      }

      this.turnos = turnosBase.map(t => ({
        ...t,
        patologiasText: patologiasPorTurno.get(t.id) || ''
      }));

      // 3) Aplicar filtro inicial (vacío => todos)
      this.applyFilter(this.busqueda);
    } catch (e: any) {
      console.error('[TurnosAdmin] Error al cargar turnos', e);
      this.snackBar.open('Error al cargar turnos', 'Cerrar', { duration: 2500 });
    } finally {
      this.loading = false;
    }
  }

  applyFilter(value: string): void {
    this.busqueda = value || '';
    const f = this.busqueda.trim().toLowerCase();

    this.filtrados = this.turnos.filter(t => {
      const haystack = `${t.especialidad} ${t.especialista} ${t.paciente} ${t.estado} ${t.patologiasText}`.toLowerCase();
      return haystack.includes(f);
    });

    // seleccionar primero de la lista filtrada
    this.seleccionado = this.filtrados[0] ?? null;
  }

  onFilterInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.applyFilter(value);
  }

  seleccionarTurno(t: TurnoUI): void {
    this.seleccionado = t;
  }

  puedeCancelar(turno: TurnoUI | null | undefined): boolean {
    if (!turno) return false;
    return turno.estado !== 'aceptado' && turno.estado !== 'realizado' && turno.estado !== 'rechazado';
  }

  cancelarTurno(turno: TurnoUI): void {
    const comentarioForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(10)]]
    });

    const ref = this.dialog.open(this.cancelDialog, {
      data: { turno, form: comentarioForm },
      width: '500px'
    });

    ref.afterClosed().subscribe(result => {
      if (result && comentarioForm.valid) {
        this.supa.client
          .from('turnos')
          .update({ estado: 'cancelado' })
          .eq('id', turno.id)
          .then(({ error }) => {
            if (error) {
              this.snackBar.open(`Error al cancelar: ${error.message}`, 'Cerrar', { duration: 2500 });
            } else {
              turno.estado = 'cancelado';
              this.applyFilter(this.busqueda); // refrescar estado visual
              this.snackBar.open('Turno cancelado', 'Cerrar', { duration: 2000 });
            }
          });
      }
    });
  }
}





// import { CommonModule } from '@angular/common';
// import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
// import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { MatTableDataSource, MatTableModule } from '@angular/material/table';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatCardModule } from '@angular/material/card';
// import { from, map } from 'rxjs';
// import { SupabaseService } from '../../../services/supabase.service';
// import { TurnoVM, EstadoTurno } from '../../../models/turno.model';

// @Component({
//   selector: 'app-turnos-admin',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     MatTableModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatButtonModule,
//     MatIconModule,
//     MatCardModule,
//     MatDialogModule,
//     MatSnackBarModule
//   ],
//   templateUrl: './turnos-admin.component.html',
//   styleUrls: ['./turnos-admin.component.scss']
// })
// export class TurnosAdminComponent implements OnInit {
//   displayedColumns: string[] = ['id', 'fecha', 'hora', 'especialidad', 'especialista', 'paciente', 'estado', 'acciones'];
//   dataSource = new MatTableDataSource<TurnoVM & { paciente: string }>([]);

//   @ViewChild('cancelDialog') cancelDialog!: TemplateRef<unknown>;

//   constructor(
//     private supa: SupabaseService,
//     private dialog: MatDialog,
//     private snackBar: MatSnackBar,
//     private fb: FormBuilder
//   ) { }

//   ngOnInit(): void {
//     this.cargarTurnos();
//   }

//   cargarTurnos(): void {
//     from(
//       this.supa.client
//         .from('turnos')
//         .select(`
//           id,
//           paciente_id,
//           especialista_id,
//           especialidad,
//           fecha_iso,
//           estado,
//           resena_especialista,
//           encuesta,
//           paciente:profiles!turnos_paciente_id_fkey ( apellido, nombre ),
//           especialista:profiles!turnos_especialista_id_fkey ( apellido, nombre )
//         `)
//         .order('fecha_iso', { ascending: false })
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return (data || []).map((t: any) => {
//           const dt = new Date(t.fecha_iso);
//           const hora = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//           const fechaSolo = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
//           const especialista = t.especialista ? `${t.especialista.apellido || ''}, ${t.especialista.nombre || ''}`.trim() : '-';
//           const paciente = t.paciente ? `${t.paciente.apellido || ''}, ${t.paciente.nombre || ''}`.trim() : '-';
//           const encuesta = !!t.encuesta;
//           const calificacion = Number(t.encuesta?.estrellas ?? t.encuesta?.rating ?? NaN);
//           return {
//             id: t.id,
//             fecha: fechaSolo,
//             hora,
//             especialidad: t.especialidad,
//             especialista,
//             paciente,
//             estado: t.estado as EstadoTurno,
//             resena: t.resena_especialista || '',
//             encuesta,
//             pacienteId: t.paciente_id,
//             calificacion: isNaN(calificacion) ? undefined : calificacion
//           } as TurnoVM & { paciente: string };
//         });
//       })
//     ).subscribe({
//       next: (turnos) => {
//         this.dataSource.data = turnos;
//         this.dataSource.filterPredicate = (t, f) => {
//           const haystack = `${t.especialidad} ${t.especialista} ${t.paciente} ${t.estado}`.toLowerCase();
//           return haystack.includes(f);
//         };
//       },
//       error: (e) => {
//         console.error('[TurnosAdmin] Error al cargar turnos', e);
//         this.snackBar.open('Error al cargar turnos', 'Cerrar', { duration: 2500 });
//       }
//     });
//   }

//   applyFilter(value: string): void {
//     this.dataSource.filter = (value || '').trim().toLowerCase();
//   }

//   puedeCancelar(turno: TurnoVM): boolean {
//     return turno.estado !== 'aceptado' && turno.estado !== 'realizado' && turno.estado !== 'rechazado';
//   }

//   cancelarTurno(turno: TurnoVM & { paciente: string }): void {
//     const comentarioForm = this.fb.group({
//       comentario: ['', [Validators.required, Validators.minLength(10)]]
//     });

//     const ref = this.dialog.open(this.cancelDialog, {
//       data: {
//         turno: turno,
//         form: comentarioForm
//       },
//       width: '500px'
//     });

//     ref.afterClosed().subscribe(result => {
//       if (result && comentarioForm.valid) {
//         this.supa.client
//           .from('turnos')
//           .update({ estado: 'cancelado' })
//           .eq('id', turno.id)
//           .then(({ error }) => {
//             if (error) {
//               this.snackBar.open(`Error al cancelar: ${error.message}`, 'Cerrar', { duration: 2500 });
//             } else {
//               turno.estado = 'cancelado';
//               this.dataSource.data = [...this.dataSource.data];
//               this.snackBar.open('Turno cancelado', 'Cerrar', { duration: 2000 });
//             }
//           });
//       }
//     });
//   }
// }

