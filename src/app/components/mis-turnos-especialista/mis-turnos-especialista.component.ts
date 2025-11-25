
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
import Swal from 'sweetalert2';

import { SupabaseService } from '../../../services/supabase.service';
import { TurnoEspecialista } from '../../models/turno-especialista.model';
import { DatoDinamico } from '../../models/dato-dinamico.model';

import { StatusLabelPipe } from '../../../pipes/status-label.pipe';
import { StatusBadgeDirective } from '../../../directives/status-badge.directive';
import { TurnosService } from '../../../services/turnos.service';

@Component({
  selector: 'app-mis-turnos-especialista',
  standalone: true,
  templateUrl: './mis-turnos-especialista.component.html',
  styleUrls: ['./mis-turnos-especialista.component.scss'],
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
    StatusBadgeDirective
  ]
})
export class MisTurnosEspecialistaComponent implements OnInit {

  dataSource = new MatTableDataSource<TurnoEspecialista>([]);

  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<unknown>;
  @ViewChild('rechazarDialog') rechazarDialog!: TemplateRef<unknown>;
  @ViewChild('cancelarDialog') cancelarDialog!: TemplateRef<unknown>;
  @ViewChild('historiaClinicaDialog') historiaClinicaDialog!: TemplateRef<unknown>;

  displayedColumns = [
    'id', 'fecha', 'hora', 'especialidad', 'paciente', 'estado', 'acciones'
  ];

  constructor(
    private turnoService: TurnosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public router: Router,
    private fb: FormBuilder,
    private supa: SupabaseService
  ) { }

  ngOnInit(): void {
    this.turnoService.getTurnosEspecialista$().subscribe({
      next: (ts: TurnoEspecialista[]) => {
        this.dataSource.data = ts;

        // filtro por especialidad, paciente, estado, historia
        this.dataSource.filterPredicate = (t, f) => {
          const haystack = `${t.especialidad} ${t.paciente} ${t.estado} ${t.historiaBusqueda || ''}`.toLowerCase();
          return haystack.includes(f);
        };
      },
      error: (e) => console.error('[MisTurnosEspecialista] Error', e)
    });
  }

  // =========================================================
  // ACCIONES DE FILTRO
  // =========================================================

  applyFilter(valor: string = ''): void {
    this.dataSource.filter = (valor || '').trim().toLowerCase();
    this.dataSource.paginator?.firstPage?.();
  }

  // =========================================================
  // ACCIONES SOBRE TURNOS
  // =========================================================

  rechazarTurno(turno: TurnoEspecialista): void {
    const comentarioForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(10)]]
    });

    const ref = this.dialog.open(this.rechazarDialog, {
      data: { turno, form: comentarioForm },
      width: '500px'
    });

    ref.afterClosed().subscribe(async result => {
      if (result && comentarioForm.valid) {
        try {
          await this.turnoService.cambiarEstadoPorCodigo(
            turno.id, 
            'RECHAZADO', 
            comentarioForm.value.comentario
          );
          turno.estado = 'RECHAZADO';
          this.dataSource.data = [...this.dataSource.data];
          this.snackBar.open('Turno rechazado', 'Cerrar', { duration: 2000 });
        } catch (error: any) {
          this.snackBar.open(`Error al rechazar: ${error.message || 'Error desconocido'}`, 'Cerrar', { duration: 2500 });
        }
      }
    });
  }

  cancelarTurno(turno: TurnoEspecialista): void {
    const comentarioForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(10)]]
    });

    const ref = this.dialog.open(this.cancelarDialog, {
      data: { turno, form: comentarioForm },
      width: '500px'
    });

    ref.afterClosed().subscribe(async result => {
      if (result && comentarioForm.valid) {
        try {
          await this.turnoService.cambiarEstadoPorCodigo(
            turno.id, 
            'CANCELADO', 
            comentarioForm.value.comentario
          );
          turno.estado = 'CANCELADO';
          this.dataSource.data = [...this.dataSource.data];
          this.snackBar.open('Turno cancelado', 'Cerrar', { duration: 2000 });
        } catch (error: any) {
          this.snackBar.open(`Error al cancelar: ${error.message || 'Error desconocido'}`, 'Cerrar', { duration: 2500 });
        }
      }
    });
  }

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
      data: { turno, form: historiaForm },
      width: '600px',
      disableClose: true
    });

    ref.afterClosed().subscribe(result => {
      if (result && historiaForm.valid) {
        this.guardarHistoriaClinica(turno, historiaForm);
      }
    });
  }

  /** Guarda historia clínica + cambia estado a FINALIZADO */
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

      const datosDinamicos: DatoDinamico[] = [
        { clave: 'Índice de riesgo', valor: Number(fv.riesgo), tipo: 'rango', unidad: '%' },
        { clave: 'Nivel de glucosa', valor: Number(fv.nivelGlucosa), tipo: 'numero', unidad: 'mg/dL' },
        { clave: 'Requiere seguimiento', valor: !!fv.requiereSeguimiento, tipo: 'booleano' }
      ];

      // Insertar en historia_clinica
      const { error: historiaError } = await this.supa.client
        .from('historia_clinica')
        .insert({
          paciente_id: turnoData.paciente_id,
          especialista_id: especialistaId,
          turno_id: turno.id,
          altura: parseFloat(fv.altura),
          peso: parseFloat(fv.peso),
          temperatura: parseFloat(fv.temperatura),
          presion: fv.presion,
          //  ACA: mapear datos_dinamicos a la tabla historia_datos_dinamicos.
         
        });

      if (historiaError) throw historiaError;

      await this.turnoService.cambiarEstadoPorCodigo(turno.id, 'FINALIZADO');

      turno.estado = 'FINALIZADO';
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
      this.snackBar.open(
        `Error: ${error.message || 'No se pudo guardar la historia clínica'}`,
        'Cerrar',
        { duration: 3000 }
      );
    }
  }

  // =========================================================
  // HABILITACIONES POR ESTADO
  // =========================================================

  puedeAceptar(turno: TurnoEspecialista): boolean {
    return !['ACEPTADO', 'FINALIZADO', 'CANCELADO', 'RECHAZADO'].includes(turno.estado.toString().toUpperCase());
  }

  puedeRechazar(turno: TurnoEspecialista): boolean {
    return this.puedeAceptar(turno);
  }

  puedeCancelar(turno: TurnoEspecialista): boolean {
    const e = turno.estado.toString().toUpperCase();
    return !['FINALIZADO', 'CANCELADO', 'RECHAZADO'].includes(e);
  }

  puedeFinalizar(turno: TurnoEspecialista): boolean {
    return turno.estado.toString().toUpperCase() === 'ACEPTADO';
  }

  puedeVerResena(turno: TurnoEspecialista): boolean {
    return !!(turno.resena && turno.resena.trim().length > 0);
  }

  aceptarTurno(turno: TurnoEspecialista): void {
    Swal.fire({
      title: '¿Aceptar turno?',
      text: `¿Estás seguro de que deseas aceptar el turno con ${turno.paciente}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, aceptar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await this.turnoService.cambiarEstadoPorCodigo(turno.id, 'ACEPTADO');
          turno.estado = 'ACEPTADO';
          this.dataSource.data = [...this.dataSource.data];
          this.snackBar.open('Turno aceptado', 'Cerrar', { duration: 2000 });
        } catch (error: any) {
          this.snackBar.open(`Error al aceptar: ${error.message || 'Error desconocido'}`, 'Cerrar', { duration: 2500 });
        }
      }
    });
  }

  verResena(turno: TurnoEspecialista): void {
    this.snackBar.open(turno.resena ?? 'Sin reseña', 'Cerrar', { duration: 4000 });
  }

  // =========================================================
  // HELPERS
  // =========================================================

  get turnos(): TurnoEspecialista[] {
    const ds = this.dataSource as MatTableDataSource<TurnoEspecialista>;
    return (ds.filteredData?.length ? ds.filteredData : ds.data) || [];
  }

  
}





