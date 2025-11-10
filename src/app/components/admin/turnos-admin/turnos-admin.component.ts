// turnos-admin.component.ts (fragmento relevante)
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { TurnoService } from '../../../services/turno.service';
import { EstadoTurno, Turno, TurnoVM, VMAdmin } from '../../../../models/interfaces';
import { FormGroup, Validators, NonNullableFormBuilder } from '@angular/forms';


@Component({
  selector: 'app-turnos-admin',
  standalone: true,
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

  // ... (resto: abrir/cerrar modal, confirmarCancelacion)
}






// import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormControl, ReactiveFormsModule, Validators, FormGroup, NonNullableFormBuilder } from '@angular/forms';
// import { combineLatest, map, startWith } from 'rxjs';
// import { Turno } from '../../../../models/interfaces';
// import { TurnoService } from '../../../services/turno.service';

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
