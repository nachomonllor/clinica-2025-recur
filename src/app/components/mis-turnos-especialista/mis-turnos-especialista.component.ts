
import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
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

import { MatDialogRef } from '@angular/material/dialog';
import { CapitalizarNombrePipe } from "../../../pipes/capitalizar-nombre.pipe";
import { ElevateOnHoverDirective } from "../../../directives/elevate-on-hover.directive";


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
    StatusBadgeDirective,
    FormsModule, ReactiveFormsModule,
    CapitalizarNombrePipe,
    ElevateOnHoverDirective
]
})
export class MisTurnosEspecialistaComponent implements OnInit {

  dataSource = new MatTableDataSource<TurnoEspecialista>([]);

  @ViewChild('resenaDialog') resenaDialog!: TemplateRef<any>;

  private resenaDialogRef?: MatDialogRef<any>;

  @ViewChild('verResenaDialog') verResenaDialog!: TemplateRef<unknown>;

  // Almacena los IDs de los turnos que tienen encuesta contestada
  encuestasIds = new Set<string>();

  @ViewChild('verEncuestaDialog') verEncuestaDialog!: TemplateRef<unknown>;


  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<unknown>;
  @ViewChild('rechazarDialog') rechazarDialog!: TemplateRef<unknown>;
  @ViewChild('cancelarDialog') cancelarDialog!: TemplateRef<unknown>;
  @ViewChild('historiaClinicaDialog') historiaClinicaDialog!: TemplateRef<unknown>;

  private historiaDialogRef?: MatDialogRef<any>;

  displayedColumns = [
    'id', 'fecha', 'hora', 'especialidad', 'paciente', 'estado', 'acciones'
  ];

  constructor(
    private turnoService: TurnosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public router: Router,
    private fb: FormBuilder,
    private supa: SupabaseService,

  ) { }


  // ngOnInit(): void {
  //   this.turnoService.getTurnosEspecialista$().subscribe({
  //     next: (ts: TurnoEspecialista[]) => {

  //       // 1. LÓGICA DE ORDENAMIENTO (PENDIENTE PRIMERO)
  //       const turnosOrdenados = ts.sort((a, b) => {
  //         const estadoA = String(a.estado || '').toUpperCase();
  //         const estadoB = String(b.estado || '').toUpperCase();

  //         // Prioridad absoluta: PENDIENTE va primero (-1 sube, 1 baja)
  //         if (estadoA === 'PENDIENTE' && estadoB !== 'PENDIENTE') return -1;
  //         if (estadoA !== 'PENDIENTE' && estadoB === 'PENDIENTE') return 1;

  //         // Orden secundario: Por fecha (los más viejos o próximos primero)
  //         if (a.fecha < b.fecha) return -1;
  //         if (a.fecha > b.fecha) return 1;

  //         // Orden terciario: Por hora
  //         if (a.hora < b.hora) return -1;
  //         if (a.hora > b.hora) return 1;

  //         return 0;
  //       });

  //       // Asignamos la lista ya ordenada
  //       this.dataSource.data = turnosOrdenados;

  //       // 2. CONFIGURACIÓN DEL FILTRO (INCLUYENDO RESEÑA)
  //       this.dataSource.filterPredicate = (t, f) => {
  //         // Concatenamos especialidad, paciente, estado, historia clínica...
  //         // Y AHORA AGREGAMOS: ${t.resena || ''}
  //         const haystack = `${t.especialidad} ${t.paciente} ${t.estado} ${t.historiaBusqueda || ''} ${t.resena || ''}`.toLowerCase();

  //         return haystack.includes(f);
  //       };
  //     },
  //     error: (e) => console.error('[MisTurnosEspecialista] Error', e)
  //   });
  // }


  ngOnInit(): void {
    this.turnoService.getTurnosEspecialista$().subscribe({
      next: (ts: TurnoEspecialista[]) => {
        // 1. ORDENAMIENTO (Tu lógica existente)
        const turnosOrdenados = ts.sort((a, b) => {
           // ... (tu lógica de sort se mantiene igual) ...
           const estadoA = String(a.estado || '').toUpperCase();
           const estadoB = String(b.estado || '').toUpperCase();
           if (estadoA === 'PENDIENTE' && estadoB !== 'PENDIENTE') return -1;
           if (estadoA !== 'PENDIENTE' && estadoB === 'PENDIENTE') return 1;
           if (a.fecha < b.fecha) return -1;
           if (a.fecha > b.fecha) return 1;
           return 0;
        });

        this.dataSource.data = turnosOrdenados;

        // 2. FILTRO (Tu lógica existente)
        this.dataSource.filterPredicate = (t, f) => {
          const haystack = `${t.especialidad} ${t.paciente} ${t.estado} ${t.historiaBusqueda || ''} ${t.resena || ''}`.toLowerCase();
          return haystack.includes(f);
        };

        // 3. NUEVO: Verificar qué turnos tienen encuesta
        this.verificarEncuestas(ts); 
      },
      error: (e) => console.error('[MisTurnosEspecialista] Error', e)
    });
  }

  /**
   * Consulta en lote cuáles de los turnos cargados tienen una entrada en 'encuestas_atencion'
   */
  async verificarEncuestas(turnos: TurnoEspecialista[]): Promise<void> {
    if (turnos.length === 0) return;

    const ids = turnos.map(t => t.id);

    // Traemos solo los IDs de las encuestas existentes para estos turnos
    const { data, error } = await this.supa.client
      .from('encuestas_atencion')
      .select('turno_id')
      .in('turno_id', ids);

    if (data && !error) {
      // Guardamos en un Set para acceso rápido (O(1)) en el HTML
      this.encuestasIds = new Set(data.map((d: any) => d.turno_id));
    }
  }

  puedeVerEncuesta(t: TurnoEspecialista): boolean {
    // Solo si el ID está en el set de encuestas encontradas
    return this.encuestasIds.has(t.id);
  }

  async verEncuesta(t: TurnoEspecialista): Promise<void> {
    // Buscamos el detalle completo de la encuesta al hacer click
    const { data, error } = await this.supa.client
      .from('encuestas_atencion')
      .select('*')
      .eq('turno_id', t.id)
      .single();

    if (error || !data) {
      this.snackBar.open('Error al cargar la encuesta.', 'Cerrar', { duration: 3000 });
      return;
    }

    // Abrimos el diálogo con los datos traídos
    this.dialog.open(this.verEncuestaDialog, {
      data: {
        turno: t,
        encuesta: data // Aquí vienen estrellas, comentario, rango, etc.
      },
      width: '500px'
    });
  }

  // =========================================================
  // ACCIONES DE FILTRO
  // =========================================================

  applyFilter(valor: string = ''): void {
    this.dataSource.filter = (valor || '').trim().toLowerCase();
    this.dataSource.paginator?.firstPage?.();
  }

  //  -----------------------  ACCIONES SOBRE TURNOS -------------------------
  rechazarTurno(turno: TurnoEspecialista): void {
    const comentarioForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(10)]]
    });

    const ref = this.dialog.open(this.rechazarDialog, {
      data: { turno, form: comentarioForm },
      width: '500px'
    });

    ref.afterClosed().subscribe(result => {
      if (result && comentarioForm.valid) {
        const comentario = comentarioForm.get('comentario')?.value ?? null;

        this.turnoService.cambiarEstadoPorCodigo(turno.id, 'RECHAZADO', comentario)
          .then(() => {
            turno.estado = 'RECHAZADO';
            this.dataSource.data = [...this.dataSource.data];
            this.snackBar.open('Turno rechazado', 'Cerrar', { duration: 2000 });
          })
          .catch(error => {
            console.error('[MisTurnosEspecialista] Error al rechazar turno', error);
            this.snackBar.open(`Error al rechazar: ${error.message ?? error}`, 'Cerrar', { duration: 2500 });
          });
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

    ref.afterClosed().subscribe(result => {
      if (result && comentarioForm.valid) {
        const comentario = comentarioForm.get('comentario')?.value ?? null;

        this.turnoService.cambiarEstadoPorCodigo(turno.id, 'CANCELADO', comentario)
          .then(() => {
            turno.estado = 'CANCELADO';
            this.dataSource.data = [...this.dataSource.data];
            this.snackBar.open('Turno cancelado', 'Cerrar', { duration: 2000 });
          })
          .catch(error => {
            console.error('[MisTurnosEspecialista] Error al cancelar turno', error);
            this.snackBar.open(`Error al cancelar: ${error.message ?? error}`, 'Cerrar', { duration: 2500 });
          });
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
      requiereSeguimiento: [false],
      datosDinamicos: this.fb.array([]),
      comentario: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.historiaDialogRef = this.dialog.open(this.historiaClinicaDialog, {
      data: { turno, form: historiaForm },
      width: '600px',
      disableClose: true
    });

    this.historiaDialogRef.afterClosed().subscribe(result => {
      if (result && historiaForm.valid) {
        this.guardarHistoriaClinica(turno, historiaForm);
      }
    });
  }


  // closeHistoriaDialog(ok: boolean): void {
  //   this.historiaDialogRef?.close(ok);
  // }

  closeHistoriaDialog(ok: boolean): void {
    console.log('[HistoriaClinica] closeHistoriaDialog', ok);
    this.historiaDialogRef?.close(ok);
  }

  // ===== Datos dinámicos libres (clave/valor) =====

  getDatosDinamicos(form: FormGroup): FormArray {
    return form.get('datosDinamicos') as FormArray;
  }

  agregarDatoDinamico(form: FormGroup): void {
    const arr = this.getDatosDinamicos(form);
    if (arr.length >= 3) {
      this.snackBar.open('Solo se permiten hasta 3 datos dinámicos.', 'Cerrar', { duration: 2500 });
      return;
    }

    arr.push(
      this.fb.group({
        clave: ['', Validators.required],
        valor: ['', Validators.required]
      })
    );
  }

  eliminarDatoDinamico(form: FormGroup, index: number): void {
    this.getDatosDinamicos(form).removeAt(index);
  }


  // ---------------------------------------------------------------------------------------------------------------------------------
  // ---------------------------------------------------------------------------------------------------------------------------------

  async guardarHistoriaClinica(turno: TurnoEspecialista, form: FormGroup): Promise<void> {
    try {
      const { data: sessionData } = await this.supa.getSession();
      if (!sessionData?.session) {
        throw new Error('No hay sesión activa');
      }
      const especialistaId = sessionData.session.user.id;
      const fv = form.value;

      // 1) Obtener paciente_id del turno
      const { data: turnoData, error: turnoError } = await this.supa.client
        .from('turnos')
        .select('paciente_id')
        .eq('id', turno.id)
        .single();

      if (turnoError || !turnoData) {
        throw new Error('No se pudo obtener el turno');
      }

      // 2) Datos dinámicos "base" (fijos del formulario)
      const datosDinamicosBase: DatoDinamico[] = [
        { clave: 'Índice de riesgo', valor: Number(fv.riesgo), tipo: 'rango', unidad: '%' },
        { clave: 'Nivel de glucosa', valor: Number(fv.nivelGlucosa), tipo: 'numero', unidad: 'mg/dL' },
        { clave: 'Requiere seguimiento', valor: !!fv.requiereSeguimiento, tipo: 'booleano', unidad: null }
      ];

      // 3) Datos dinámicos libres (clave/valor) que agrega el especialista en el FormArray
      const datosLibresRaw = (fv.datosDinamicos ?? []) as { clave: string; valor: string }[];

      const datosLibres: DatoDinamico[] = datosLibresRaw
        .filter(d => d && d.clave && d.valor)
        .map(d => ({
          clave: (d.clave ?? '').trim(),
          valor: (d.valor ?? '').trim(),     // se guarda como texto
          tipo: 'texto' as any,              // cae en el default del switch → tipo_control = 'OTRO'
          unidad: null
        }));

      // 4) Unir todos los datos dinámicos
      const datosDinamicos: DatoDinamico[] = [
        ...datosDinamicosBase,
        ...datosLibres
      ];

      // 5) Insertar en historia_clinica y recuperar el id de la historia
      const { data: historiaData, error: historiaError } = await this.supa.client
        .from('historia_clinica')
        .insert({
          paciente_id: turnoData.paciente_id,
          especialista_id: especialistaId,
          turno_id: turno.id,
          altura: parseFloat(fv.altura),
          peso: parseFloat(fv.peso),
          temperatura: parseFloat(fv.temperatura),
          presion: fv.presion
        })
        .select('id')
        .single();

      if (historiaError || !historiaData) {
        throw historiaError || new Error('No se pudo crear la historia clínica');
      }

      const historiaId = historiaData.id;

      // 6) Mapear datos_dinamicos a la tabla historia_datos_dinamicos
      const dinamicosPayload = datosDinamicos.map(d => {
        let tipo_control: string | null = null;
        let valor_texto: string | null = null;
        let valor_numerico: number | null = null;
        let valor_boolean: boolean | null = null;

        switch (d.tipo) {
          case 'rango':
            tipo_control = 'RANGO_0_100';
            valor_numerico = Number(d.valor);
            break;

          case 'numero':
            tipo_control = 'NUMERICO';
            valor_numerico = Number(d.valor);
            break;

          case 'booleano':
            tipo_control = 'SI_NO';
            valor_boolean = Boolean(d.valor);
            break;

          default:
            tipo_control = 'OTRO';
            valor_texto = String(d.valor);
            break;
        }

        return {
          historia_id: historiaId,
          clave: d.clave,
          tipo_control,
          valor_texto,
          valor_numerico,
          valor_boolean
          // unidad no se guarda porque la tabla no la tiene
        };
      });

      // 7) Insertar los datos dinámicos
      const { error: dinamicosError } = await this.supa.client
        .from('historia_datos_dinamicos')
        .insert(dinamicosPayload);

      if (dinamicosError) throw dinamicosError;

      // 8) Tomar el comentario del formulario (reseña)
      const comentario: string | null = fv.comentario?.trim() || null;

      // 9) Cambiar estado del turno y guardar la reseña en turnos.comentario
      await this.turnoService.cambiarEstadoPorCodigo(
        turno.id,
        'FINALIZADO',
        comentario
      );

      // 10) Actualizar el objeto en memoria para que el especialista lo vea al instante
      turno.estado = 'FINALIZADO';
      turno.resena = comentario ?? undefined;
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
  // =================================== 

  puedeAceptar(turno: TurnoEspecialista): boolean {
    // El estado puede venir en mayúsculas o minúsculas desde la BD
    const estadoNormalizado = String(turno.estado || '').toUpperCase().trim();
    // Solo puede aceptar si está en estado PENDIENTE
    return estadoNormalizado === 'PENDIENTE';
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
    const ref = this.dialog.open(this.confirmDialog, {
      data: { message: `¿Aceptar el turno con ${turno.paciente}?` }
    });

    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.turnoService.cambiarEstadoPorCodigo(turno.id, 'ACEPTADO')
          .then(() => {
            turno.estado = 'ACEPTADO';
            this.dataSource.data = [...this.dataSource.data];
            this.snackBar.open('Turno aceptado', 'Cerrar', { duration: 2000 });
          })
          .catch(error => {
            console.error('[MisTurnosEspecialista] Error al aceptar turno', error);
            this.snackBar.open(`Error al aceptar: ${error.message ?? error}`, 'Cerrar', { duration: 2500 });
          });
      }
    });
  }

  verResena(t: TurnoEspecialista): void {
    if (!t.resena || t.resena.trim().length === 0) {
      this.snackBar.open('Este turno no tiene reseña disponible', 'Cerrar', { duration: 2500 });
      return;
    }
    this.dialog.open(this.verResenaDialog, {
      // data: { turno: t, resena: t.resena },

      data: {
        resena: t.resena,
        paciente: t.paciente,
        especialidad: t.especialidad,
        fecha: t.fecha,
        hora: t.hora
      },

      width: '500px'
    });
  }

  closeResenaDialog(): void {
    this.resenaDialogRef?.close();
  }

  // =========================================================
  // ------- HELPERS
  // =========================================================

  get turnos(): TurnoEspecialista[] {
    const ds = this.dataSource as MatTableDataSource<TurnoEspecialista>;
    return (ds.filteredData?.length ? ds.filteredData : ds.data) || [];
  }


}





