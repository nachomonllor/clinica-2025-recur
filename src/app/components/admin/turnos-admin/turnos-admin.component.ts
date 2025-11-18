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
import { EstadoTurno, TurnoUI, TurnoRow, mapRowToVM } from '../../../../models/turno.model';

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

  /** ===== FLAG MOCK / DB ===== */
  readonly USE_MOCK = true; // <- ponelo en false para leer de Supabase

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
        // 'pendiente' / 'confirmado' => warn
        return 'warn';
    }
  }

  /** Entrada principal que respeta el flag */
  private async cargarTurnos(): Promise<void> {
    this.loading = true;
    try {
      const base = this.USE_MOCK ? this.cargarTurnosMock() : await this.cargarTurnosDB();
      this.turnos = base;
      this.applyFilter(this.busqueda);
    } catch (e: any) {
      console.error('[TurnosAdmin] Error al cargar turnos', e);
      this.snackBar.open('Error al cargar turnos', 'Cerrar', { duration: 2500 });
    } finally {
      this.loading = false;
    }
  }

  // -----------------------------
  // Helpers
  // -----------------------------

  /** Construye un TurnoUI partiendo de un TurnoRow y los nombres a mostrar */
  private toUI(row: TurnoRow, pacienteNombre: string, especialistaNombre: string, historiaBusqueda = ''): TurnoUI {
    const vm = mapRowToVM(row); // garantiza fechaISO/fecha/hora, flags y alias
    return {
      ...vm,
      paciente: (pacienteNombre || '-').trim(),
      especialista: (especialistaNombre || '-').trim(),
      especialistaNombre: especialistaNombre || undefined,
      pacienteNombre: pacienteNombre || undefined,
      patologiasText: historiaBusqueda.toLowerCase()
    };
  }

  // =============================
  // ========= MOCK ==============
  // =============================
  private cargarTurnosMock(): TurnoUI[] {
    const now = new Date();
    const addDays = (n: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + n);
      d.setHours(10, 30, 0, 0);
      return d.toISOString();
    };

    const rows: Array<{
      row: TurnoRow;
      pacienteNombre: string;
      especialistaNombre: string;
      historia: string;
    }> = [
      {
        row: {
          id: '11111111-1111-1111-1111-111111111111',
          paciente_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          especialista_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          especialidad: 'Dermatología', // tu TurnoRow pide string
          fecha_iso: addDays(0),
          estado: 'pendiente',
          resena_especialista: null,
          encuesta: null,
          ubicacion: null,
          notas: null
        },
        pacienteNombre: 'Gómez, Luisa',
        especialistaNombre: 'Pérez, Ana',
        historia: 'dermatitis atópica prurito eritema'
      },
      {
        row: {
          id: '22222222-2222-2222-2222-222222222222',
          paciente_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          especialista_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          especialidad: 'Dermatología',
          fecha_iso: addDays(1),
          estado: 'aceptado',
          resena_especialista: 'Control anual',
          encuesta: { estrellas: 5 },
          ubicacion: null,
          notas: null
        },
        pacienteNombre: 'Ríos, Marcos',
        especialistaNombre: 'Pérez, Ana',
        historia: 'revisión de lunares'
      },
      {
        row: {
          id: '33333333-3333-3333-3333-333333333333',
          paciente_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          especialista_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          especialidad: 'Neurología',
          fecha_iso: addDays(-3),
          estado: 'cancelado',
          resena_especialista: null,
          encuesta: null,
          ubicacion: null,
          notas: null
        },
        pacienteNombre: 'Molina, Sara',
        especialistaNombre: 'Sosa, Carlos',
        historia: 'migraña tensional cefalea'
      }
    ];

    return rows
      .map((x) => this.toUI(x.row, x.pacienteNombre, x.especialistaNombre, x.historia))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  // =============================
  // ========== DB ===============
  // =============================
  /**
   * Trae turnos y resuelve nombres de paciente/especialista con un 2do query a `perfiles`.
   * No depende de joins frágiles contra `especialidades` (si la tenés, podés mejorar el nombre).
   */
  private async cargarTurnosDB(): Promise<TurnoUI[]> {
    // 1) turnos base
    const { data: base, error } = await this.supa.client
      .from('turnos')
      .select(`
        id,
        paciente_id,
        especialista_id,
        especialidad_id,
        especialidad,        -- por si alguna view ya te trae el nombre
        fecha_iso,
        estado,
        resena_especialista,
        encuesta,
        ubicacion,
        notas,
        created_at,
        updated_at,
        historia_busqueda
      `)
      .order('fecha_iso', { ascending: false });

    if (error) throw error;

    const rows = (base ?? []) as any[];

    // 2) resolver nombres en `perfiles` (si RLS lo permite)
    const uidSet = new Set<string>();
    rows.forEach(r => {
      if (r.paciente_id) uidSet.add(r.paciente_id);
      if (r.especialista_id) uidSet.add(r.especialista_id);
    });
    const ids = Array.from(uidSet);

    const nombres = new Map<string, string>();
    if (ids.length) {
      try {
        const { data: perfs } = await this.supa.client
          .from('perfiles')
          .select('id, nombre, apellido')
          .in('id', ids);
        (perfs ?? []).forEach((p: any) => {
          const full = [p.apellido?.trim(), p.nombre?.trim()].filter(Boolean).join(', ');
          nombres.set(p.id, full || '-');
        });
      } catch {
        // Si falla por RLS o la tabla no existe, dejamos '-' como fallback.
      }
    }

    // 3) mapear a UI usando tu mapRowToVM
    const list: TurnoUI[] = rows.map((t: any) => {
      // `TurnoRow.especialidad` es string; si no tenés catálogo, uso el id como string.
      const especialidadStr =
        (t.especialidad && String(t.especialidad)) ||
        (t.especialidad_id && String(t.especialidad_id)) ||
        '—';

      const row: TurnoRow = {
        id: t.id,
        paciente_id: t.paciente_id,
        especialista_id: t.especialista_id,
        especialidad: especialidadStr,
        fecha_iso: t.fecha_iso,
        estado: t.estado as EstadoTurno,
        resena_especialista: t.resena_especialista ?? null,
        encuesta: t.encuesta ?? null,
        ubicacion: t.ubicacion ?? null,
        notas: t.notas ?? null,
        created_at: t.created_at,
        updated_at: t.updated_at
      };

      const pacienteNombre = nombres.get(t.paciente_id) ?? '-';
      const especialistaNombre = nombres.get(t.especialista_id) ?? '-';
      const historia = String(t.historia_busqueda ?? '');

      return this.toUI(row, pacienteNombre, especialistaNombre, historia);
    });

    return list;
  }

  // =============================
  // ======== FILTRO/UI ==========
  // =============================
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
    // Conservador: no permitir cancelar si ya está en un estado terminal
    return !['aceptado', 'realizado', 'rechazado', 'cancelado'].includes(turno.estado);
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
// import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatCardModule } from '@angular/material/card';
// import { SupabaseService } from '../../../../services/supabase.service';
// import { EstadoTurno, TurnoUI, TurnoVM } from '../../../../models/turno.model';

// @Component({
//   selector: 'app-turnos-admin',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
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
//   @ViewChild('cancelDialog') cancelDialog!: TemplateRef<unknown>;

//   // estado de UI
//   loading = false;
//   busqueda = '';
//   turnos: TurnoUI[] = [];
//   filtrados: TurnoUI[] = [];
//   seleccionado: TurnoUI | null = null;

//   constructor(
//     private supa: SupabaseService,
//     private dialog: MatDialog,
//     private snackBar: MatSnackBar,
//     private fb: FormBuilder
//   ) { }

//   async ngOnInit(): Promise<void> {
//     await this.cargarTurnos();
//   }

//   // Mapea estado a clase visual
//   estadoClass(e?: EstadoTurno): 'ok' | 'warn' | 'bad' {
//     switch (e) {
//       case 'realizado':
//       case 'aceptado':
//         return 'ok';
//       case 'cancelado':
//       case 'rechazado':
//         return 'bad';
//       default:
//         return 'warn';
//     }
//   }

//   async cargarTurnos(): Promise<void> {
//     this.loading = true;
//     try {
//       // 1) Turnos + nombres de paciente y especialista
//       // const { data, error } = await this.supa.client
//       //   .from('turnos')
//       //   .select(`
//       //     id,
//       //     paciente_id,
//       //     especialista_id,
//       //     especialidad,
//       //     fecha_iso,
//       //     estado,
//       //     resena_especialista,
//       //     encuesta,
//       //     paciente:profiles!turnos_paciente_id_fkey ( apellido, nombre ),
//       //     especialista:profiles!turnos_especialista_id_fkey ( apellido, nombre )
//       //   `)
//       //   .order('fecha_iso', { ascending: false });


//       const { data, error } = await this.supa.client
//         .from('turnos')
//         .select(`
//         id,
//         paciente_id,
//         especialista_id,
//         especialidad,
//         fecha_iso,
//         estado,
//         resena_especialista,
//         encuesta,
//         paciente:perfiles!turnos_paciente_id_fkey ( apellido, nombre ),
//         especialista:perfiles!turnos_especialista_id_fkey ( apellido, nombre )
//       `)
//         .order('fecha_iso', { ascending: false });


//       if (error) throw error;

//       const turnosBase: TurnoUI[] = (data || []).map((t: any) => {
//         const dt = new Date(t.fecha_iso);
//         const hora = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//         const fechaSolo = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
//         const especialista = t.especialista ? `${t.especialista.apellido || ''}, ${t.especialista.nombre || ''}`.trim() : '-';
//         const paciente = t.paciente ? `${t.paciente.apellido || ''}, ${t.paciente.nombre || ''}`.trim() : '-';
//         return {
//           id: t.id,
//           fecha: fechaSolo,
//           hora,
//           especialidad: t.especialidad,
//           especialista,
//           paciente,
//           estado: t.estado as EstadoTurno,
//           resena: t.resena_especialista || '',
//           encuesta: !!t.encuesta,
//           pacienteId: t.paciente_id
//         } as TurnoUI;
//       });

//       // 2) Historias clínicas de esos turnos (para buscar por patología/diagnóstico/síntomas)
//       const ids = turnosBase.map(t => t.id);
//       let patologiasPorTurno = new Map<string, string>();

//       if (ids.length) {
//         const { data: historias, error: hcError } = await this.supa.client
//           .from('historia_clinica')
//           .select('turno_id, datos_dinamicos, diagnostico, motivo, observaciones')
//           .in('turno_id', ids);

//         if (hcError) throw hcError;

//         (historias || []).forEach((h: any) => {
//           const partes: string[] = [];
//           if (h.diagnostico) partes.push(String(h.diagnostico));
//           if (h.motivo) partes.push(String(h.motivo));
//           if (h.observaciones) partes.push(String(h.observaciones));
//           if (Array.isArray(h.datos_dinamicos)) {
//             for (const d of h.datos_dinamicos) {
//               const txt = [d?.clave, d?.titulo, d?.nombre, d?.tipo, d?.valor, d?.detalle]
//                 .filter(Boolean)
//                 .join(' ');
//               if (txt) partes.push(txt);
//             }
//           }
//           patologiasPorTurno.set(h.turno_id, partes.join(' ').toLowerCase());
//         });
//       }

//       this.turnos = turnosBase.map(t => ({
//         ...t,
//         patologiasText: patologiasPorTurno.get(t.id) || ''
//       }));

//       // 3) Aplicar filtro inicial (vacío => todos)
//       this.applyFilter(this.busqueda);
//     } catch (e: any) {
//       console.error('[TurnosAdmin] Error al cargar turnos', e);
//       this.snackBar.open('Error al cargar turnos', 'Cerrar', { duration: 2500 });
//     } finally {
//       this.loading = false;
//     }
//   }

//   applyFilter(value: string): void {
//     this.busqueda = value || '';
//     const f = this.busqueda.trim().toLowerCase();

//     this.filtrados = this.turnos.filter(t => {
//       const haystack = `${t.especialidad} ${t.especialista} ${t.paciente} ${t.estado} ${t.patologiasText}`.toLowerCase();
//       return haystack.includes(f);
//     });

//     // seleccionar primero de la lista filtrada
//     this.seleccionado = this.filtrados[0] ?? null;
//   }

//   onFilterInput(e: Event) {
//     const value = (e.target as HTMLInputElement).value;
//     this.applyFilter(value);
//   }

//   seleccionarTurno(t: TurnoUI): void {
//     this.seleccionado = t;
//   }

//   puedeCancelar(turno: TurnoUI | null | undefined): boolean {
//     if (!turno) return false;
//     return turno.estado !== 'aceptado' && turno.estado !== 'realizado' && turno.estado !== 'rechazado';
//   }

//   cancelarTurno(turno: TurnoUI): void {
//     const comentarioForm = this.fb.group({
//       comentario: ['', [Validators.required, Validators.minLength(10)]]
//     });

//     const ref = this.dialog.open(this.cancelDialog, {
//       data: { turno, form: comentarioForm },
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
//               this.applyFilter(this.busqueda); // refrescar estado visual
//               this.snackBar.open('Turno cancelado', 'Cerrar', { duration: 2000 });
//             }
//           });
//       }
//     });
//   }
// }



