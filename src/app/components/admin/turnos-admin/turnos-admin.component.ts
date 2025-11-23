

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
    EstadoTurnoLabelPipe
],
  templateUrl: './turnos-admin.component.html',
  styleUrls: ['./turnos-admin.component.scss']
})
export class TurnosAdminComponent implements OnInit {

  @ViewChild('cancelDialog') cancelDialog!: TemplateRef<unknown>;

  /** FLAG MOCK / DB */
  readonly USE_MOCK = false; // poner en true si querés probar con data simulada

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

  async ngOnInit(): Promise<void> {
    await this.cargarTurnos();
  }


  // -------------------------------------------------------
  // Entrada principal que respeta el flag USE_MOCK
  // -------------------------------------------------------
  private async cargarTurnos(): Promise<void> {
    this.loading = true;
    try {
      const base = this.USE_MOCK
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

  // -------------------------------------------------------
  // DB (esquema nuevo)
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
        especialista:usuarios!fk_turno_especialista ( nombre, apellido ),
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
    console.log('[TurnosAdmin] Turnos desde DB:', list);
    return list;
  }

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
        return 'warn'; // PENDIENTE u otro
    }
  }

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

      // Normalizamos el código del estado a mayúsculas y lo tipamos
      const estadoCodigo = String(t.estado?.codigo ?? 'PENDIENTE').toUpperCase() as EstadoTurnoCodigo;
      const estado: EstadoTurnoUI = estadoCodigo;   // < ============== tipo correcto

      const pacienteNombre = t.paciente
        ? `${t.paciente.apellido ?? ''}, ${t.paciente.nombre ?? ''}`
          .trim()
          .replace(/^,\s*/, '')
        : '-';

      const especialistaNombre = t.especialista
        ? `${t.especialista.apellido ?? ''}, ${t.especialista.nombre ?? ''}`
          .trim()
          .replace(/^,\s*/, '')
        : '-';

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

        estado,                    // 'PENDIENTE' | 'ACEPTADO' | ...
        motivo: t.motivo ?? null,
        comentario: t.comentario ?? null,

        patologiasText,
      };

      return ui;
    });
  }


  // -------------------------------------------------------
  // FILTRO / UI helpers
  // -------------------------------------------------------
  applyFilter(value: string): void {
    this.busqueda = value || '';
    const f = this.busqueda.trim().toLowerCase();

    this.filtrados = this.turnos.filter(t => {
      const haystack = `${t.especialidad} ${t.especialista} ${t.paciente} ${t.estado} ${t.patologiasText}`.toLowerCase();
      return haystack.includes(f);
    });

    this.seleccionado = this.filtrados[0] ?? null;
  }

  onFilterInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.applyFilter(value);
  }

  seleccionarTurno(t: TurnoUI): void {
    this.seleccionado = t;
  }

  // puedeCancelar(turno: TurnoUI | null | undefined): boolean {
  //   if (!turno) return false;
  //   return !['aceptado', 'finalizado', 'rechazado', 'cancelado'].includes(turno.estado);
  // }

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
          // Usamos TurnosService para cambiar el estado en la tabla nueva
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

  // PARA EL PIPE
  formatearEstado(e: EstadoTurnoUI): string {
    return e.charAt(0) + e.slice(1).toLowerCase(); // 'PENDIENTE' → 'Pendiente'
  }

}


