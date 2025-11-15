

import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { Router } from '@angular/router';
import { TurnoService } from '../../../services/turno.service';
import { TurnoEspecialista } from '../../../models/turno-especialista.model';
import { Turno } from '../../../models/turno.model';
import { SupabaseService } from '../../../services/supabase.service';
import { HistoriaClinica } from '../../../models/historia-clinica.model';
import { DatoDinamico } from '../../../models/dato-dinamico.model';
import Swal from 'sweetalert2';
import { StatusLabelPipe } from '../../../pipes/status-label.pipe';
import { StatusBadgeDirective } from '../../../directives/status-badge.directive';
import { ElevateOnHoverDirective } from '../../../directives/elevate-on-hover.directive';

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
    MatSnackBarModule,
    MatTooltipModule,
    MatSliderModule,
    MatSlideToggleModule,
    StatusLabelPipe,
    StatusBadgeDirective,
    ElevateOnHoverDirective
  ]
})
export class MisTurnosEspecialistaComponent implements OnInit {
  //dataSource = new MatTableDataSource<Turno>([]);
  //dataSource = new MatTableDataSource<(Turno & { pacienteNombre: string })>([]);

  dataSource = new MatTableDataSource<TurnoEspecialista>([]);

  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<unknown>;
  @ViewChild('rechazarDialog') rechazarDialog!: TemplateRef<unknown>;
  @ViewChild('cancelarDialog') cancelarDialog!: TemplateRef<unknown>;
  @ViewChild('historiaClinicaDialog') historiaClinicaDialog!: TemplateRef<unknown>;

  displayedColumns = [
    'id', 'fecha', 'hora', 'especialidad', 'paciente', 'estado', 'acciones'
  ];

  constructor(
    private turnoService: TurnoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public router: Router,
    private fb: FormBuilder,
    private supa: SupabaseService
  ) { }

  /** Rechazar turno: abre diálogo y deja comentario */
  rechazarTurno(turno: TurnoEspecialista): void {
    const comentarioForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(10)]]
    });

    const ref = this.dialog.open(this.rechazarDialog, {
      data: {
        turno: turno,
        form: comentarioForm
      },
      width: '500px'
    });

    ref.afterClosed().subscribe(result => {
      if (result && comentarioForm.valid) {
        // TODO: Guardar comentario en BD si se agrega campo comentario_rechazo
        this.supa.client
          .from('turnos')
          .update({ estado: 'rechazado' })
          .eq('id', turno.id)
          .then(({ error }) => {
            if (error) {
              this.snackBar.open(`Error al rechazar: ${error.message}`, 'Cerrar', { duration: 2500 });
            } else {
              turno.estado = 'rechazado';
              this.dataSource.data = [...this.dataSource.data];
              this.snackBar.open('Turno rechazado', 'Cerrar', { duration: 2000 });
            }
          });
      }
    });
  }

  /** Cancelar turno: abre diálogo y deja comentario */
  cancelarTurno(turno: TurnoEspecialista): void {
    const comentarioForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(10)]]
    });

    const ref = this.dialog.open(this.cancelarDialog, {
      data: {
        turno: turno,
        form: comentarioForm
      },
      width: '500px'
    });

    ref.afterClosed().subscribe(result => {
      if (result && comentarioForm.valid) {
        // TODO: Guardar comentario en BD si se agrega campo comentario_cancelacion
        this.supa.client
          .from('turnos')
          .update({ estado: 'cancelado' })
          .eq('id', turno.id)
          .then(({ error }) => {
            if (error) {
              this.snackBar.open(`Error al cancelar: ${error.message}`, 'Cerrar', { duration: 2500 });
            } else {
              turno.estado = 'cancelado';
              this.dataSource.data = [...this.dataSource.data];
              this.snackBar.open('Turno cancelado', 'Cerrar', { duration: 2000 });
            }
          });
      }
    });
  }

  /** Finalizar turno: abre diálogo de historia clínica */
  finalizarTurno(turno: TurnoEspecialista): void {
    const historiaForm = this.fb.group({
      altura: [null, [Validators.required, Validators.min(0)]],
      peso: [null, [Validators.required, Validators.min(0)]],
      temperatura: [null, [Validators.required, Validators.min(0)]],
      presion: ['', Validators.required],
      riesgo: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      nivelGlucosa: [null, [Validators.required, Validators.min(0)]],
      requiereSeguimiento: [false]
    });

    const ref = this.dialog.open(this.historiaClinicaDialog, {
      data: {
        turno: turno,
        form: historiaForm
      },
      width: '600px',
      disableClose: true
    });

    ref.afterClosed().subscribe(result => {
      if (result && historiaForm.valid) {
        this.guardarHistoriaClinica(turno, historiaForm);
      }
    });
  }

  /** Guardar historia clínica en Supabase */
  async guardarHistoriaClinica(turno: TurnoEspecialista, form: FormGroup): Promise<void> {
    try {
      const { data: sessionData } = await this.supa.getSession();
      if (!sessionData?.session) {
        throw new Error('No hay sesión activa');
      }

      const especialistaId = sessionData.session.user.id;
      const fv = form.value;

      // Obtener paciente_id del turno
      const { data: turnoData, error: turnoError } = await this.supa.client
        .from('turnos')
        .select('paciente_id')
        .eq('id', turno.id)
        .single();

      if (turnoError || !turnoData) {
        throw new Error('No se pudo obtener el turno');
      }

      // Preparar datos dinámicos
      const datosDinamicos: DatoDinamico[] = [
        {
          clave: 'Índice de riesgo',
          valor: Number(fv.riesgo),
          tipo: 'rango',
          unidad: '%'
        },
        {
          clave: 'Nivel de glucosa',
          valor: Number(fv.nivelGlucosa),
          tipo: 'numero',
          unidad: 'mg/dL'
        },
        {
          clave: 'Requiere seguimiento',
          valor: !!fv.requiereSeguimiento,
          tipo: 'booleano'
        }
      ];

      // Insertar historia clínica
      const { error: historiaError } = await this.supa.client
        .from('historia_clinica')
        .insert({
          turno_id: turno.id,
          paciente_id: turnoData.paciente_id,
          especialista_id: especialistaId,
          altura: parseFloat(fv.altura),
          peso: parseFloat(fv.peso),
          temperatura: parseFloat(fv.temperatura),
          presion: fv.presion,
          datos_dinamicos: datosDinamicos
        });

      if (historiaError) {
        throw historiaError;
      }

      // Actualizar estado del turno a 'realizado'
      const { error: turnoUpdateError } = await this.supa.client
        .from('turnos')
        .update({ estado: 'realizado' })
        .eq('id', turno.id);

      if (turnoUpdateError) {
        throw turnoUpdateError;
      }

      // Actualizar tabla
      turno.estado = 'realizado';
      this.dataSource.data = [...this.dataSource.data];

      Swal.fire({
        icon: 'success',
        title: 'Historia clínica guardada',
        text: 'El turno ha sido finalizado correctamente.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      console.error('[MisTurnosEspecialista] Error al guardar historia clínica:', error);
      this.snackBar.open(`Error: ${error.message || 'No se pudo guardar la historia clínica'}`, 'Cerrar', { duration: 3000 });
    }
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
        this.dataSource.data = ts;
        // Configurar filtro por especialidad, paciente, estado o historia clínica
        this.dataSource.filterPredicate = (t, f) => {
          const haystack = `${t.especialidad} ${t.paciente} ${t.estado} ${t.historiaBusqueda || ''}`.toLowerCase();
          return haystack.includes(f);
        };
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

  puedeAceptar(turno: TurnoEspecialista): boolean {
    return turno.estado !== 'aceptado' && turno.estado !== 'realizado' &&
      turno.estado !== 'cancelado' && turno.estado !== 'rechazado';
  }

  puedeRechazar(turno: TurnoEspecialista): boolean {
    return turno.estado !== 'aceptado' && turno.estado !== 'realizado' &&
      turno.estado !== 'cancelado' && turno.estado !== 'rechazado';
  }

  puedeCancelar(turno: TurnoEspecialista): boolean {
    return turno.estado !== 'aceptado' && turno.estado !== 'realizado' &&
      turno.estado !== 'rechazado' && turno.estado !== 'cancelado';
  }

  puedeFinalizar(turno: TurnoEspecialista): boolean {
    return turno.estado === 'aceptado';
  }

  puedeVerResena(turno: TurnoEspecialista): boolean {
    return !!turno.resena && turno.resena.trim().length > 0;
  }

  aceptarTurno(turno: TurnoEspecialista): void {
    const ref = this.dialog.open(this.confirmDialog, {
      data: { message: `¿Aceptar el turno con ${turno.paciente}?` }
    });

    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.supa.client
          .from('turnos')
          .update({ estado: 'aceptado' })
          .eq('id', turno.id)
          .then(({ error }) => {
            if (error) {
              this.snackBar.open(`Error al aceptar: ${error.message}`, 'Cerrar', { duration: 2500 });
            } else {
              turno.estado = 'aceptado';
              this.dataSource.data = [...this.dataSource.data];
              this.snackBar.open('Turno aceptado', 'Cerrar', { duration: 2000 });
            }
          });
      }
    });
  }

  verResena(turno: TurnoEspecialista): void {
    this.snackBar.open(turno.resena ?? 'Sin reseña', 'Cerrar', { duration: 4000 });
  }


  get turnos(): TurnoEspecialista[] {
    const ds = this.dataSource as MatTableDataSource<TurnoEspecialista>;
    return (ds.filteredData?.length ? ds.filteredData : ds.data) || [];
  }


}

