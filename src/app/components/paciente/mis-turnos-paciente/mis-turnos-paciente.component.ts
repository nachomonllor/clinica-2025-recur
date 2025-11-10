import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { TurnoService } from '../../../services/turno.service';
import { TurnoVM } from '../../../../models/interfaces';

@Component({
  selector: 'app-mis-turnos-paciente',
  standalone: true,
  templateUrl: './mis-turnos-paciente.component.html',
  styleUrls: ['./mis-turnos-paciente.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule
  ]
})
export class MisTurnosPacienteComponent implements OnInit {
  displayedColumns: string[] = ['id', 'fecha', 'hora', 'especialidad', 'especialista', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<TurnoVM>([]);

  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<unknown>;

  constructor(
    private turnoService: TurnoService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // cargar desde Supabase
    this.turnoService.getTurnosPacienteVM$().subscribe({
      next: (ts) => {
        this.dataSource.data = ts;

        // Filtro único (especialidad + especialista + estado)
        this.dataSource.filterPredicate = (t, f) => {
          const filtro = (f || '').toLowerCase();
          const especialistaTxt = (t.especialistaNombre ?? t.especialista ?? '').toLowerCase();
          const haystack = `${t.especialidad} ${especialistaTxt} ${t.estado}`.toLowerCase();
          return haystack.includes(filtro);
        };
      },
      error: (e) => console.error('[MisTurnosPaciente] Error', e)
    });
  }

  /* Buscar */
  applyFilter(value: string): void {
    this.dataSource.filter = (value || '').trim().toLowerCase();
  }

  /** El paciente puede cancelar si no está realizado/rechazado/cancelado y la fecha es futura */
  puedeCancelar(t: TurnoVM): boolean {
    if (t.estado === 'realizado' || t.estado === 'rechazado' || t.estado === 'cancelado') return false;
    if (!t.fechaISO) return false;
    const ms = Date.parse(t.fechaISO); // ISO
    if (Number.isNaN(ms)) return false;
    return ms > Date.now();
  }

  cancelarTurno(t: TurnoVM): void {
    const ref = this.dialog.open(this.confirmDialog, { data: { message: `¿Cancelar turno #${t.id}?` } });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;

      // Sprint 2: Debe dejar un comentario del porqué se cancela el turno
      const motivo = (prompt('Ingresá el motivo de cancelación:') ?? '').trim();
      if (!motivo) return;

      this.turnoService.cancelarTurno(t.id, motivo).subscribe({
        next: () => {
          // reflejamos en UI
          t.estado = 'cancelado';
          this.dataSource.data = [...this.dataSource.data];
          this.snackBar.open(`Turno ${t.id} cancelado`, 'Cerrar', { duration: 2000 });
        },
        error: (e) => this.snackBar.open(`Error al cancelar: ${e?.message || e}`, 'Cerrar', { duration: 2500 })
      });
    });
  }

  verResena(t: TurnoVM): void {
    this.router.navigate(['/resenia', t.id]);
  }

  completarEncuesta(t: TurnoVM): void {
    this.router.navigate(['/encuesta-atencion', t.id]);
  }

  calificarAtencion(_t: TurnoVM): void {
    
    // IMPLEMENTAR RUTA Y DIALOGO PARA CALIFICACION
  }
}





// import { CommonModule } from '@angular/common';
// import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { MatTableDataSource, MatTableModule } from '@angular/material/table';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatCardModule } from '@angular/material/card';
// import { Router } from '@angular/router';
// import { TurnoService } from '../../../services/turno.service';
// import { TurnoVM } from '../../../../models/interfaces';

// @Component({
//   selector: 'app-mis-turnos-paciente',
//   standalone: true,
//   templateUrl: './mis-turnos-paciente.component.html',
//   styleUrls: ['./mis-turnos-paciente.component.scss'],
//   imports: [
//     CommonModule,
//     FormsModule,
//     MatTableModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatButtonModule,
//     MatIconModule,
//     MatCardModule,
//     MatDialogModule,
//     MatSnackBarModule
//   ]
// })
// export class MisTurnosPacienteComponent implements OnInit {
//   displayedColumns: string[] = ['id', 'fecha', 'hora', 'especialidad', 'especialista', 'estado', 'acciones'];
//   dataSource = new MatTableDataSource<TurnoVM>([]);

//   @ViewChild('confirmDialog') confirmDialog!: TemplateRef<unknown>;

//   constructor(
//     private turnoService: TurnoService,
//     private router: Router,
//     private dialog: MatDialog,
//     private snackBar: MatSnackBar
//   ) { }

//   ngOnInit(): void {
//     // cargar desde Supabase
//     this.turnoService.getTurnosPacienteVM$().subscribe({
//       next: (ts) => {
//         this.dataSource.data = ts;
//         this.dataSource.filterPredicate = (t, f) => {
//           const haystack = `${t.especialidad} ${t.especialista} ${t.estado}`.toLowerCase();
//           return haystack.includes(f);
//         };
//       },
//       error: (e) => console.error('[MisTurnosPaciente] Error', e)
//     });
//   }

//   /* Buscar */
//   applyFilter(value: string): void {
//     this.dataSource.filter = (value || '').trim().toLowerCase();
//   }

//   /** El paciente puede cancelar si no está realizado/rechazado y la fecha es futura */
//   // puedeCancelar(t: TurnoVM): boolean {
//   //   if (t.estado === 'realizado' || t.estado === 'rechazado' || t.estado === 'cancelado') return false;
//   //   const ahora = new Date();
//   //   const fechaHora = new Date(
//   //     t.fechaISO.getFullYear(),
//   //     t.fecha.getMonth(),
//   //     t.fecha.getDate(),
//   //     Number(t.hora.slice(0, 2)), Number(t.hora.slice(3, 5))
//   //   );
//   //   return fechaHora.getTime() > ahora.getTime();
//   // }

//   puedeCancelar(t: TurnoVM): boolean {
//     if (t.estado === 'realizado' || t.estado === 'rechazado' || t.estado === 'cancelado') return false;
//     if (!t.fechaISO) return false;

//     const ms = Date.parse(t.fechaISO);     // parsea ISO con zona
//     if (Number.isNaN(ms)) return false;

//     return ms > Date.now();
//   }


//   cancelarTurno(t: TurnoVM): void {
//     const ref = this.dialog.open(this.confirmDialog, { data: { message: `¿Cancelar turno #${t.id}?` } });
//     ref.afterClosed().subscribe(ok => {
//       if (!ok) return;
//       this.turnoService.cancelarTurno(t.id).subscribe({
//         next: () => {
//           // reflejamos en UI
//           t.estado = 'cancelado';
//           this.dataSource.data = [...this.dataSource.data];
//           this.snackBar.open(`Turno ${t.id} cancelado`, 'Cerrar', { duration: 2000 });
//         },
//         error: (e) => this.snackBar.open(`Error al cancelar: ${e?.message || e}`, 'Cerrar', { duration: 2500 })
//       });
//     });
//   }

//   verResena(t: TurnoVM): void {
//     this.router.navigate(['/resenia', t.id]);
//   }

//   completarEncuesta(t: TurnoVM): void {
//     this.router.navigate(['/encuesta-atencion', t.id]);
//   }

//   calificarAtencion(t: TurnoVM): void {
//     // implementar si tenés ruta/diálogo para calificación
//   }
// }





// import { CommonModule } from '@angular/common';
// import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { MatTableDataSource, MatTableModule } from '@angular/material/table';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatCardModule } from '@angular/material/card';
// import { Router } from '@angular/router';
// import { Turno } from '../../../models/turno.model';
// import { TurnoService } from '../../../services/turno.service';

// @Component({
//   selector: 'app-mis-turnos-paciente',
//   standalone: true,
//   templateUrl: './mis-turnos-paciente.component.html',
//   styleUrl: './mis-turnos-paciente.component.scss',
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
//   ]
// })
// export class MisTurnosPacienteComponent implements OnInit {

//   displayedColumns: string[] = [
//     'id', 'fecha', 'hora', 'especialidad', 'especialista', 'estado', 'acciones'
//   ];

//   dataSource = new MatTableDataSource<Turno>([]);

//   // --- Datos mock para pruebas ---
//   private mockTurnos: Turno[] = [
//     {
//       id: 100,
//       fecha: new Date('2025-06-25'),
//       hora: '09:30',
//       especialidad: 'Cardio',
//       especialista: 'Dra. Pérez',
//       estado: 'aceptado',
//       resena: 'Muy bien',
//       encuesta: false,
//       pacienteId: '1',
//       calificacion: 10
//     },

//     {
//       id: 101,
//       fecha: new Date('2025-06-25'),
//       hora: '09:30',
//       especialidad: 'Cardiología',
//       especialista: 'Dra. Pérez',
//       estado: 'aceptado',
//       resena: 'Excelente atención, muy profesional.',
//       encuesta: false,
//       pacienteId: '2',
//       calificacion: 9
//     },
//     {
//       id: 102,
//       fecha: new Date('2025-06-28'),
//       hora: '14:00',
//       especialidad: 'Dermatología',
//       especialista: 'Dr. Gómez',
//       estado: 'realizado',
//       resena: 'Me gustó mucho la consulta.',
//       encuesta: true,
//       pacienteId: '3',
//       calificacion: 7
//     },
//     {
//       id: 103,
//       fecha: new Date('2025-07-02'),
//       hora: '11:15',
//       especialidad: 'Pediatría',
//       especialista: 'Dra. Ruiz',
//       estado: 'pendiente',
//       // sin reseña aún
//       encuesta: false,
//       pacienteId: '4',
//       resena: '',
//       calificacion: 10
//     },
//     {
//       id: 104,
//       fecha: new Date('2025-09-02'),
//       hora: '11:15',
//       especialidad: 'Cardiologia',
//       especialista: 'Dra. Nora Da Puente',
//       estado: 'pendiente',
//       // sin reseña aún
//       encuesta: false,
//       pacienteId: '5',
//       resena: '',
//       calificacion: 10
//     },
//     {
//       id: 105,
//       fecha: new Date('2025-06-22'),
//       hora: '11:15',
//       especialidad: 'Diabetóloga',
//       especialista: 'Dra. Florencia De Césare',
//       estado: 'pendiente',
//       // sin reseña aún
//       encuesta: false,
//       pacienteId: '6',
//       resena: '',
//       calificacion: 10
//     }
//   ];

//   @ViewChild('confirmDialog') confirmDialog!: TemplateRef<unknown>;


//   constructor(
//     private turnoService: TurnoService,
//     private router: Router,
//     private dialog: MatDialog,
//     private snackBar: MatSnackBar
//   ) { }

//   ngOnInit(): void {
//     // en lugar de un mock local, llamo al servicio
//     this.turnoService.getMockTurnos().subscribe(ts => {
//       this.dataSource.data = ts;
//       this.dataSource.filterPredicate = (t, f) =>
//         t.especialidad.toLowerCase().includes(f) ||
//         t.especialista.toLowerCase().includes(f);
//     });
//   }

//   /** Buscar */
//   public applyFilter(value: string): void {
//     this.dataSource.filter = value.trim().toLowerCase();
//   }

//   /** Cancelar turno (solo si no está realizado) */
//   public cancelarTurno(turno: Turno): void {
//     const ref = this.dialog.open(this.confirmDialog, {
//       data: { message: `¿Cancelar turno #${turno.id}?` }
//     });

//     ref.afterClosed().subscribe(ok => {
//       if (ok) {
//         turno.estado = 'cancelado';
//         this.snackBar.open(`Turno ${turno.id} cancelado`, 'Cerrar', { duration: 2000 });
//         this.dataSource.data = [...this.dataSource.data];
//       }
//     });
//   }

//   public verResena(turno: Turno): void {
//     this.router.navigate(['/resenia', turno.id]);
//   }

//   /** Abrir la encuesta para el turno seleccionado */
//   public completarEncuesta(turno: Turno): void {
//     // Asumiendo que en routing esta esto:
//     // { path: 'encuesta-atencion/:id', component: EncuestaAtencionComponent }
//     this.router.navigate(['/encuesta-atencion', turno.id]);
//   }

//   /** Calificar atención */
//   public calificarAtencion(turno: Turno): void {
//     // abrir diálogo o ruta de calificación
//   }
// }



// // import { CommonModule } from '@angular/common';
// // import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
// // import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// // import { MatTableDataSource, MatTableModule } from '@angular/material/table';
// // import { MatFormFieldModule } from '@angular/material/form-field';
// // import { MatInputModule } from '@angular/material/input';
// // import { MatButtonModule } from '@angular/material/button';
// // import { MatIconModule } from '@angular/material/icon';
// // import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// // import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// // import { MatCardModule } from '@angular/material/card';
// // import { Turno } from '../../models/turno.model';
// // import { TurnoService } from '../../turno.service';

// // @Component({
// //   selector: 'app-mis-turnos-paciente',
// //   standalone: true,
// //   templateUrl: './mis-turnos-paciente.component.html',
// //   styleUrl: './mis-turnos-paciente.component.scss',
// //   imports: [
// //     CommonModule,
// //     FormsModule,
// //     ReactiveFormsModule,
// //     MatTableModule,
// //     MatFormFieldModule,
// //     MatInputModule,
// //     MatButtonModule,
// //     MatIconModule,
// //     MatCardModule,
// //     MatDialogModule,
// //     MatSnackBarModule
// //   ]
// // })
// // export class MisTurnosPacienteComponent implements OnInit {

// //   displayedColumns: string[] = [
// //     'id',
// //     'fecha',
// //     'hora',
// //     'especialidad',
// //     'especialista',
// //     'estado',
// //     'acciones'
// //   ];

// //   dataSource = new MatTableDataSource<Turno>([]);
// //   @ViewChild('confirmDialog') confirmDialog!: TemplateRef<unknown>;

// //   constructor(
// //     private turnoService: TurnoService,
// //     private dialog: MatDialog,
// //     private snackBar: MatSnackBar
// //   ) { }

// //   ngOnInit(): void {
// //     this.turnoService.getTurnosPaciente().subscribe(turnos => {
// //       this.dataSource.data = turnos;

// //       // filtro único (especialidad o especialista)
// //       this.dataSource.filterPredicate = (t, f) =>
// //         t.especialidad.toLowerCase().includes(f) ||
// //         t.especialista.toLowerCase().includes(f);
// //     });
// //   }

// //   /** Buscar */
// //   applyFilter(value: string): void {
// //     this.dataSource.filter = value.trim().toLowerCase();
// //   }

// //   /** Cancelar turno (solo si no está realizado) */
// //   cancelarTurno(turno: Turno): void {
// //     const ref = this.dialog.open(this.confirmDialog, {
// //       data: { message: `¿Cancelar turno #${turno.id}?` }
// //     });

// //     ref.afterClosed().subscribe(ok => {
// //       if (ok) {
// //         /* aquí llamarías al endpoint */
// //         turno.estado = 'cancelado';
// //         this.snackBar.open(`Turno ${turno.id} cancelado`, 'Cerrar', { duration: 2000 });
// //         this.dataSource.data = [...this.dataSource.data]; // refresca tabla
// //       }
// //     });
// //   }
// //   /** Ver reseña */
// //   verResena(turno: Turno): void {
// //     this.snackBar.open(turno.resena ?? 'Sin reseña', 'Cerrar', { duration: 4000 });
// //   }

// //   /** Completar encuesta – redirecciona o abre diálogo */
// //   completarEncuesta(turno: Turno): void {
// //     // TODO: navega a /encuesta/:id o abre diálogo
// //   }

// //   /** Calificar atención – redirecciona a componente de estrellas */
// //   calificarAtencion(turno: Turno): void {
// //     // TODO: navega a /calificar/:id o abre diálogo
// //   }
// // }


// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-mis-turnos-paciente',
// //   imports: [],
// //   templateUrl: './mis-turnos-paciente.component.html',
// //   styleUrl: './mis-turnos-paciente.component.scss'
// // })
// // export class MisTurnosPacienteComponent {

// // }
