<<<<<<< HEAD
// turnos-admin.component.ts (fragmento relevante)
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { TurnoService } from '../../../services/turno.service';
import { EstadoTurno, Turno, TurnoVM, VMAdmin } from '../../../../models/interfaces';
import { FormGroup, Validators, NonNullableFormBuilder } from '@angular/forms';

=======
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
import { EstadoTurno, TurnoVM } from '../../../../models/turno.model';

type TurnoUI = TurnoVM & {
  paciente: string;
  especialista: string;
  fecha: Date;
  hora: string;
  patologiasText: string; // texto indexable desde historia clínica
};
>>>>>>> 1-6-mas-estilos

@Component({
  selector: 'app-turnos-admin',
  standalone: true,
<<<<<<< HEAD
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './turnos-admin.component.html',
  styleUrls: ['./turnos-admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TurnosAdminComponent {
  private readonly turnosSrv = inject(TurnoService);

  // === estado del modal de cancelación ===
  cancelTarget: TurnoVM | null = null;
  loadingCancel = false;

  private fb = inject(NonNullableFormBuilder);
  cancelForm: FormGroup = this.fb.group({
    motivo: this.fb.control('', { validators: [Validators.required, Validators.minLength(4)] })
  });

  filterControl = new FormControl<string>('', { nonNullable: true });

  readonly turnos$ = this.turnosSrv.listAll();

  
  // === ============================ utilidades para la tabla  ==================================
  trackById(_i: number, t: TurnoVM) { return t.id; }

  estadoClass(estado: EstadoTurno): string {
    switch (estado) {
      case 'pendiente':   return 'chip chip--pending';
      case 'aceptado':
      case 'confirmado':  return 'chip chip--accepted';
      case 'realizado':   return 'chip chip--done';
      case 'rechazado':   return 'chip chip--rejected';
      case 'cancelado':   return 'chip chip--canceled';
      default:            return 'chip';
    }
  }

  // === ciclo de vida del modal ===
  abrirCancelacion(t: TurnoVM) {
    this.cancelTarget = t;
    this.cancelForm.reset({ motivo: '' });
  }

  cerrarCancelacion() {
    this.loadingCancel = false;
    this.cancelTarget = null;
  }

  confirmarCancelacion() {
    if (!this.cancelTarget || this.cancelForm.invalid) return;
    this.loadingCancel = true;
    const motivo = this.cancelForm.get('motivo')!.value as string;
    this.turnosSrv.cancelarTurno(this.cancelTarget.id, motivo).subscribe({
      next: () => this.cerrarCancelacion(),
      error: () => this.cerrarCancelacion()
    });
  }


  // Armamos VM usando TUS interfaces (Turno -> TurnoVM)
  readonly vm$ = combineLatest([
    this.turnos$,
    this.filterControl.valueChanges.pipe(startWith(this.filterControl.value))
  ]).pipe(
    map(([turnos, filtroRaw]) => {
      const filtro = (filtroRaw ?? '').trim().toLowerCase();

      // 1) Adaptar a TurnoVM para UI
      const filas: TurnoVM[] = turnos.map((t: Turno) => {
        const esp = this.turnosSrv.getEspecialista(t.especialistaId);
        const especialista = this.turnosSrv.nombreCompleto(esp);
        const hora = this.turnosSrv.horaLocal(t.fecha);
        const fechaISO = t.fecha.toISOString();

        const vm: TurnoVM = {
          id: t.id,
          especialidad: t.especialidad,
          especialista,                // string: "Apellido, Nombre"
          estado: t.estado as EstadoTurno,
          fechaISO,                    // canónico en VM
          // compat legacy para pipes en template:
          fecha: new Date(fechaISO),
          hora,
          pacienteId: t.pacienteId,
          especialistaId: t.especialistaId
        };
        return vm;
      });

      // 2) Chips
      const especialidades = Array.from(new Set(filas.map(f => f.especialidad)))
        .sort((a, b) => a.localeCompare(b));

      const especialistasMap = new Map<string, { id: string; nombre: string; apellido: string }>();
      for (const f of filas) {
        const esp = this.turnosSrv.getEspecialista(f.especialistaId!);
        if (esp) especialistasMap.set(esp.id, { id: esp.id, nombre: esp.nombre, apellido: esp.apellido });
      }
      const especialistas = Array.from(especialistasMap.values())
        .sort((a, b) => `${a.apellido}${a.nombre}`.localeCompare(`${b.apellido}${b.nombre}`));

      // 3) Filtro único (especialidad o especialista)
      const turnosFiltrados = !filtro
        ? filas
        : filas.filter(f =>
          f.especialidad.toLowerCase().includes(filtro) ||
           // f.especialista.toLowerCase().includes(filtro)

           ((f.especialistaNombre ?? f.especialista) ?? '')
                    .toLowerCase()
                    .includes(filtro)

        );

      return <VMAdmin>{
        turnosFiltrados,
        especialidades,
        especialistas,
        total: filas.length
      };
    })
  );

  setFilter(value: string) { this.filterControl.setValue(value); }
  clearFilter() { this.filterControl.setValue(''); }

  puedeCancelar(estado: EstadoTurno) { return this.turnosSrv.puedeCancelar(estado); }

  // TODO ABRIR Y CERRAR EL modal, confirmarCancelacion)
=======
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
          paciente:profiles!turnos_paciente_id_fkey ( apellido, nombre ),
          especialista:profiles!turnos_especialista_id_fkey ( apellido, nombre )
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
>>>>>>> 1-6-mas-estilos
}





<<<<<<< HEAD

// import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormControl, ReactiveFormsModule, Validators, FormGroup, NonNullableFormBuilder } from '@angular/forms';
// import { combineLatest, map, startWith } from 'rxjs';
// import { Turno } from '../../../../models/interfaces';
// import { TurnoService } from '../../../services/turno.service';
=======
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
>>>>>>> 1-6-mas-estilos

// @Component({
//   selector: 'app-turnos-admin',
//   standalone: true,
<<<<<<< HEAD
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './turnos-admin.component.html',
//   styleUrls: ['./turnos-admin.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class TurnosAdminComponent {
//   private readonly turnosSrv = inject(TurnoService);
//   private readonly fb = inject(NonNullableFormBuilder);

//   // Filtro único (sin combobox): input de texto
//   readonly filterControl = new FormControl<string>('', { nonNullable: true });

//   // Modal de cancelación (simple, sin libs externas)
//   cancelTarget: Turno | null = null;
//   loadingCancel = false;
//   readonly cancelForm: FormGroup = this.fb.group({
//     motivo: this.fb.control<string>('', { validators: [Validators.required, Validators.minLength(4)] })
//   });

//   // Stream base de turnos
//   readonly turnos$ = this.turnosSrv.listAll();

//   // ViewModel combinado: lista filtrada + chips de ayuda
//   readonly vm$ = combineLatest([
//     this.turnos$,
//     this.filterControl.valueChanges.pipe(startWith(this.filterControl.value))
//   ]).pipe(
//     map(([turnos, filtroRaw]) => {
//       const filtro = (filtroRaw ?? '').trim().toLowerCase();

//       // Chips: especialidades únicas
//       const especialidades = Array.from(new Set(turnos.map(t => t.especialidad))).sort((a, b) => a.localeCompare(b));

//       // Chips: especialistas únicos (por id)
//       const especialistasMap = new Map<string, { id: string; nombre: string; apellido: string }>();
//       for (const t of turnos) {
//         const e = t.especialista;
//         especialistasMap.set(e.id, { id: e.id, nombre: e.nombre, apellido: e.apellido });
//       }
//       const especialistas = Array.from(especialistasMap.values())
//         .sort((a, b) => `${a.apellido}${a.nombre}`.localeCompare(`${b.apellido}${b.nombre}`));

//       // Filtro único: busca en especialidad y especialista (nombre/apellido)
//       const turnosFiltrados = !filtro
//         ? turnos
//         : turnos.filter(t => {
//             const fullName = `${t.especialista.nombre} ${t.especialista.apellido}`.toLowerCase();
//             return t.especialidad.toLowerCase().includes(filtro) || fullName.includes(filtro);
//           });

//       return <VM>{
//         turnosFiltrados,
//         especialidades,
//         especialistas,
//         total: turnos.length
//       };
//     })
//   );

//   // Interacción UI
//   setFilter(value: string) {
//     this.filterControl.setValue(value);
//   }

//   clearFilter() {
//     this.filterControl.setValue('');
//   }

//   puedeCancelar(t: Turno): boolean {
//     return this.turnosSrv.puedeCancelar(t.estado);
//   }

//   abrirCancelacion(t: Turno) {
//     this.cancelTarget = t;
//     this.cancelForm.reset({ motivo: '' });
//   }

//   cerrarCancelacion() {
//     this.cancelTarget = null;
//     this.loadingCancel = false;
//   }

//   async confirmarCancelacion() {
//     if (!this.cancelTarget || this.cancelForm.invalid) return;
//     this.loadingCancel = true;
//     const motivo = this.cancelForm.get('motivo')!.value!;
//     this.turnosSrv.cancelarTurno(this.cancelTarget.id, motivo).subscribe({
//       next: () => this.cerrarCancelacion(),
//       error: () => this.cerrarCancelacion()
//     });
//   }

//   // Utilidad para estilos de estado
//   estadoClass(estado: EstadoTurno): string {
//     switch (estado) {
//       case 'Pendiente': return 'chip chip--pending';
//       case 'Aceptado': return 'chip chip--accepted';
//       case 'Realizado': return 'chip chip--done';
//       case 'Rechazado': return 'chip chip--rejected';
//       case 'Cancelado': return 'chip chip--canceled';
//       default: return 'chip';
//     }
//   }

//   trackById(_i: number, t: Turno) { return t.id; }
// }




// import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormControl, ReactiveFormsModule, Validators, FormGroup, NonNullableFormBuilder } from '@angular/forms';
// import { combineLatest, map, startWith } from 'rxjs';
// import { EstadoTurno, Turno } from '../../../../models/interfaces';
// import { TurnoService } from '../../../services/turno.service';

// type VM = {
//   turnosFiltrados: Turno[];
//   especialidades: string[];
//   especialistas: { id: string; nombre: string; apellido: string }[];
//   total: number;

// };

// @Component({
//   selector: 'app-turnos-admin',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './turnos-admin.component.html',
//   styleUrls: ['./turnos-admin.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class TurnosAdminComponent {
//   private readonly turnosSrv = inject(TurnoService);
//   private readonly fb = inject(NonNullableFormBuilder);

//   // Filtro único (sin combobox): input de texto
//   readonly filterControl = new FormControl<string>('', { nonNullable: true });

//   // Modal de cancelación (simple, sin libs externas)
//   cancelTarget: Turno | null = null;
//   loadingCancel = false;
//   readonly cancelForm: FormGroup = this.fb.group({
//     motivo: this.fb.control<string>('', { validators: [Validators.required, Validators.minLength(4)] })
//   });

//   // Stream base de turnos
//   readonly turnos$ = this.turnosSrv.listAll();

//   // ViewModel combinado: lista filtrada + chips de ayuda
//   readonly vm$ = combineLatest([
//     this.turnos$,
//     this.filterControl.valueChanges.pipe(startWith(this.filterControl.value))
//   ]).pipe(
//     map(([turnos, filtroRaw]) => {
//       const filtro = (filtroRaw ?? '').trim().toLowerCase();

//       // Chips: especialidades únicas
//       const especialidades = Array.from(new Set(turnos.map(t => t.especialidad))).sort((a, b) => a.localeCompare(b));

//       // Chips: especialistas únicos (por id)
//       const especialistasMap = new Map<string, { id: string; nombre: string; apellido: string }>();
//       for (const t of turnos) {
//         const idEspecialista = t.especialistaId;
//         especialistasMap.set(idEspecialista, { id: idEspecialista, nombre: e.nombre, apellido: e.apellido });
//       }
//       const especialistas = Array.from(especialistasMap.values())
//         .sort((a, b) => `${a.apellido}${a.nombre}`.localeCompare(`${b.apellido}${b.nombre}`));

//       // Filtro único: busca en especialidad y especialista (nombre/apellido)
//       const turnosFiltrados = !filtro
//         ? turnos
//         : turnos.filter(t => {
//             const fullName = `${t.especialista.nombre} ${t.especialista.apellido}`.toLowerCase();
//             return t.especialidad.toLowerCase().includes(filtro) || fullName.includes(filtro);
//           });

//       return <VM>{
//         turnosFiltrados,
//         especialidades,
//         especialistas,
//         total: turnos.length
//       };
//     })
//   );

//   // Interacción UI
//   setFilter(value: string) {
//     this.filterControl.setValue(value);
//   }

//   clearFilter() {
//     this.filterControl.setValue('');
//   }

//   puedeCancelar(t: Turno): boolean {
//     return this.turnosSrv.puedeCancelar(t.estado);
//   }

//   abrirCancelacion(t: Turno) {
//     this.cancelTarget = t;
//     this.cancelForm.reset({ motivo: '' });
//   }

//   cerrarCancelacion() {
//     this.cancelTarget = null;
//     this.loadingCancel = false;
//   }

//   async confirmarCancelacion() {
//     if (!this.cancelTarget || this.cancelForm.invalid) return;
//     this.loadingCancel = true;
//     const motivo = this.cancelForm.get('motivo')!.value!;
//     this.turnosSrv.cancelarTurno(this.cancelTarget.id, motivo).subscribe({
//       next: () => this.cerrarCancelacion(),
//       error: () => this.cerrarCancelacion()
//     });
//   }

//   // Utilidad para estilos de estado
//   estadoClass(estado: EstadoTurno): string {
//     switch (estado) {
//       case 'pendiente': return 'chip chip--pending';
//       case 'aceptado': return 'chip chip--accepted';
//       case 'realizado': return 'chip chip--done';
//       case 'rechazado': return 'chip chip--rejected';
//       case 'cancelado': return 'chip chip--canceled';
//       default: return 'chip';
//     }
//   }

//   trackById(_i: number, t: Turno) { return t.id; }
// }



// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-turnos-admin',
//   standalone: true,
//   imports: [],
//   templateUrl: './turnos-admin.component.html',
//   styleUrl: './turnos-admin.component.scss'
// })
// export class TurnosAdminComponent {

// }
=======
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

>>>>>>> 1-6-mas-estilos
