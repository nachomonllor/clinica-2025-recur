
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
import { TurnosService } from '../../../../services/turnos.service';
import { EstadoTurnoUI, TurnoUI } from '../../../models/turno.model';
import { EstadoTurnoCodigo } from '../../../models/tipos.model';
import { EstadoTurnoLabelPipe } from "../../../../pipes/estado-turno-label.pipe";
import { DoctorPipe } from "../../../../pipes/doctor.pipe";

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
    MatSnackBarModule,
    EstadoTurnoLabelPipe,
    DoctorPipe
],
  templateUrl: './turnos-admin.component.html',
  styleUrls: ['./turnos-admin.component.scss']
})
export class TurnosAdminComponent implements OnInit {

  @ViewChild('cancelDialog') cancelDialog!: TemplateRef<unknown>;

  readonly USE_MOCK = false; 

  loading = false;
  busqueda = '';
  turnos: TurnoUI[] = [];
  filtrados: TurnoUI[] = [];
  seleccionado: TurnoUI | null = null;

  constructor(
    private supa: SupabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private turnosService: TurnosService
  ) { }

  // Inicia el ciclo de vida del componente. Su unica tarea es llamar a cargarTurnos() de forma asíncrona para traer los datos apenas se carga la pagina.
  async ngOnInit(): Promise<void> {
    await this.cargarTurnos();
  }


  /*
  cargarTurnos(): Controla el proceso de carga.
  Activa el spinner (loading = true).
  Decide si usa datos falsos (MOCK) o reales (DB) basandose en la constante USE_MOCK.
  Guarda los turnos en el array principal this.turnos.
  Aplica el filtro inicial (por si había algo escrito en el buscador).
  Desactiva el spinner al terminar (finally)
   */
  private async cargarTurnos(): Promise<void> {
    this.loading = true;
    try {
      const base = this.USE_MOCK  // <======= La deje en FALSE
        ? this.cargarTurnosMock()
        : await this.cargarTurnosDB();

      this.turnos = base;
      this.applyFilter(this.busqueda);
    } catch (e: any) {
      console.error('[TurnosAdmin] Error al cargar turnos', e);
      this.snackBar.open('Error al cargar turnos', 'Cerrar', { duration: 2500 });
    } finally {
      this.loading = false;
    }
  }


  /*
    cargarTurnosDB(): Realiza la consulta real a Supabase.
    Hace un SELECT a la tabla turnos.
    Usa JOINs (!fk_...) para traer automáticamente el nombre del paciente, 
    nombre y foto del especialista, nombre de la especialidad y el código del estado.
    Ordena por fecha descendente (más recientes primero).
    Si hay datos ==> llama a buildUIFromRows para formatearlos.
  */

  // -------------------------------------------------------
  // DB (Consultamos imagen_perfil_1 del especialista)
  // -------------------------------------------------------
  private async cargarTurnosDB(): Promise<TurnoUI[]> {
    const { data, error } = await this.supa.client
      .from('turnos')
      .select(`
        id,
        paciente_id,
        especialista_id,
        especialidad_id,
        estado:estados_turno!fk_turno_estado ( codigo ),
        fecha_hora_inicio,
        fecha_hora_fin,
        motivo,
        comentario,
        fecha_creacion,
        fecha_ultima_actualizacion,
        paciente:usuarios!fk_turno_paciente ( nombre, apellido ),
        especialista:usuarios!fk_turno_especialista ( nombre, apellido, imagen_perfil_1 ), 
        especialidad:especialidades!fk_turno_especialidad ( nombre )
      `)
      .order('fecha_hora_inicio', { ascending: false });

    if (error) throw error;

    const rows = (data ?? []) as any[];

    if (!rows.length) {
      console.log('[TurnosAdmin] No hay turnos en DB');
      return [];
    }

    const list = this.buildUIFromRows(rows);
    return list;
  }

  // private cargarTurnosMock(): TurnoUI[] {
  //   // ... tu código mock existente se mantiene igual ...
  //   // (Omitido para brevedad, no afecta la lógica real)
  //   return []; 
  // }

  // -------------------------------------------------------
  // MOCK (simula rows con misma forma que la consulta real)
  // -------------------------------------------------------
  private cargarTurnosMock(): TurnoUI[] {
    const today = new Date();
    const day = (offset: number) =>
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);

    const makeISO = (d: Date, hh = 10, mm = 30) => {
      const x = new Date(d);
      x.setHours(hh, mm, 0, 0);
      return x.toISOString();
    };

    const raw = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        paciente_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        especialista_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        especialidad_id: 'esp-derma',
        fecha_hora_inicio: makeISO(day(0), 9, 0),
        motivo: 'dermatitis atópica prurito eritema',
        comentario: null,
        estado: { codigo: 'PENDIENTE' },
        paciente: { apellido: 'Gómez', nombre: 'Luisa' },
        especialista: { apellido: 'Pérez', nombre: 'Ana' },
        especialidad: { nombre: 'Dermatología' },
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        paciente_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        especialista_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        especialidad_id: 'esp-derma',
        fecha_hora_inicio: makeISO(day(1), 14, 30),
        motivo: 'revisión de lunares',
        comentario: 'Control anual',
        estado: { codigo: 'ACEPTADO' },
        paciente: { apellido: 'Ríos', nombre: 'Marcos' },
        especialista: { apellido: 'Pérez', nombre: 'Ana' },
        especialidad: { nombre: 'Dermatología' },
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        paciente_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        especialista_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        especialidad_id: 'esp-neuro',
        fecha_hora_inicio: makeISO(day(-3), 11, 15),
        motivo: 'migraña tensional cefalea',
        comentario: null,
        estado: { codigo: 'CANCELADO' },
        paciente: { apellido: 'Molina', nombre: 'Sara' },
        especialista: { apellido: 'Sosa', nombre: 'Carlos' },
        especialidad: { nombre: 'Neurología' },
      }
    ];

    const ui = this.buildUIFromRows(raw);
    return ui.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }


  estadoClass(e?: EstadoTurnoUI): 'ok' | 'warn' | 'bad' {
    switch (e) {
      case 'ACEPTADO':
      case 'FINALIZADO':
        return 'ok';
      case 'CANCELADO':
      case 'RECHAZADO':
        return 'bad';
      default:
        return 'warn'; 
    }
  }

  // Contiene la Regla de Negocio para cancelar. 
  // Devuelve true solo si el turno NO está en un estado final (Aceptado, Finalizado, Cancelado, Rechazado). 
  // Si ya paso no se puede cancelar

  puedeCancelar(turno: TurnoUI | null | undefined): boolean {
    if (!turno) return false;
    return !['ACEPTADO', 'FINALIZADO', 'RECHAZADO', 'CANCELADO'].includes(turno.estado);
  }


  private buildUIFromRows(rows: any[]): TurnoUI[] {
    return (rows || []).map((t: any) => {
      const fechaISO: string = t.fecha_hora_inicio;
      const fecha = new Date(fechaISO);
      const hora = fecha.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const estadoCodigo = String(t.estado?.codigo ?? 'PENDIENTE').toUpperCase() as EstadoTurnoCodigo;
      const estado: EstadoTurnoUI = estadoCodigo;

      const pacienteNombre = t.paciente
        ? `${t.paciente.apellido ?? ''}, ${t.paciente.nombre ?? ''}`.trim().replace(/^,\s*/, '')
        : '-';

      const especialistaNombre = t.especialista
        ? `${t.especialista.apellido ?? ''}, ${t.especialista.nombre ?? ''}`.trim().replace(/^,\s*/, '')
        : '-';

      // 1. Extraemos el avatar del especialista
      const especialistaAvatar = t.especialista?.imagen_perfil_1 || null;

      const especialidadNombre = t.especialidad?.nombre ?? '(sin especialidad)';
      const patologiasText = `${t.motivo ?? ''} ${t.comentario ?? ''}`.toLowerCase();

      const ui: TurnoUI = {
        id: t.id,
        pacienteId: t.paciente_id,
        especialistaId: t.especialista_id,
        especialidadId: t.especialidad_id,

        paciente: pacienteNombre,
        especialista: especialistaNombre,
        especialidad: especialidadNombre,

        fecha,
        fechaISO,
        hora,

        estado,
        motivo: t.motivo ?? null,
        comentario: t.comentario ?? null,

        patologiasText,
        
        // 2. Agregamos el avatar al objeto (usando index signature)
        especialistaAvatar 
      };

      return ui;
    });
  }


  /*
  applyFilter(value): Filtra la lista de turnos en tiempo real según lo que escriba el admin.
  Busca coincidencias en: Especialidad, Nombre Especialista, Nombre Paciente, Estado y Motivos-Comentarios.
  Actualiza el array filtrados que es el que se muestra en el *ngFor.
*/
  applyFilter(value: string): void {
    this.busqueda = value || '';
    const f = this.busqueda.trim().toLowerCase();

    this.filtrados = this.turnos.filter(t => {
      const haystack = `${t.especialidad} ${t.especialista} ${t.paciente} ${t.estado} ${t.patologiasText}`.toLowerCase();
      return haystack.includes(f);
    });

    this.seleccionado = this.filtrados[0] ?? null;
  }


  /* 
  Es el manejador del evento (input) del buscador. 
  Simplemente captura el texto y llama a applyFilter.
  */
  onFilterInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.applyFilter(value);
  }

  // Guarda el turno sobre el que se hizo clic en la variable seleccionado
  // para resaltarlo visualmente o mostrar detalles.
  seleccionarTurno(t: TurnoUI): void {
    this.seleccionado = t;
  }


  /*
  cancelarTurno(turno): Maneja el flujo completo de cancelacion administrativa:
  Crea un formulario reactivo para pedir el motivo (obligatorio).
  Abre un diálogo modal (MatDialog).
  Si el usuario confirma, llama al servicio turnosService.cambiarEstadoPorCodigo para actualizar la BD.
  Si sale bien, actualiza la interfaz localmente y muestra un mensaje de éxito (SnackBar)
  */
  cancelarTurno(turno: TurnoUI): void {
    const comentarioForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(10)]]
    });

    const ref = this.dialog.open(this.cancelDialog, {
      data: { turno, form: comentarioForm },
      width: '500px'
    });

    ref.afterClosed().subscribe(async result => {
      if (result && comentarioForm.valid) {
        const comentario = comentarioForm.value.comentario ?? '';
        try {
          await this.turnosService.cambiarEstadoPorCodigo(turno.id, 'CANCELADO', comentario);
          turno.estado = 'CANCELADO';
          this.applyFilter(this.busqueda);
          this.snackBar.open('Turno cancelado', 'Cerrar', { duration: 2000 });
        } catch (err: any) {
          console.error('[TurnosAdmin] Error al cancelar turno', err);
          this.snackBar.open(`Error al cancelar: ${err?.message ?? 'Error desconocido'}`, 'Cerrar', { duration: 2500 });
        }
      }
    });
  }
}












