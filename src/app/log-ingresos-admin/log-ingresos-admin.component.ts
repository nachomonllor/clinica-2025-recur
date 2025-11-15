
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
// Si ya tenés un servicio real, importalo aquí y usalo en lugar del mock.

export interface LogIngreso {
  id?: string;
  email: string;
  // Puede venir como Date | string | number
  createdAt: Date | string | number;
}

@Component({
  selector: 'app-log-ingresos-admin',
  standalone:true,
  imports:[ CommonModule, FormsModule],
  templateUrl: './log-ingresos-admin.component.html',
  styleUrls: ['./log-ingresos-admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LogIngresosAdminComponent implements OnInit {

  // En un escenario real, reemplazá este observable por el de tu servicio:
  // this.logs$ = this.logIngresosService.getAllAsAdmin().pipe(…)
  logs$!: Observable<LogIngreso[]>;

  // Simulación de permisos. Si ya contás con AuthService, consumilo aquí.
  isAdmin = true;

  ngOnInit(): void {
    // MOCK: datos de ejemplo. Reemplazá por tu servicio.
    const mock: LogIngreso[] = [
      { email: 'racejihoibrei-1918@yopmail.com', createdAt: '2025-11-11T20:57:07Z' },
      { email: 'kobrolexobru-1395@yopmail.com', createdAt: '2025-11-11T20:56:49Z' },
      { email: 'racejihoibrei-1918@yopmail.com', createdAt: '2025-11-11T20:54:54Z' },
      { email: 'touppoibrouqoutrou-9644@yopmail.com', createdAt: '2025-11-11T20:54:13Z' },
      { email: 'kobrolexobru-1395@yopmail.com', createdAt: '2025-11-11T20:52:42Z' },
      { email: 'kobrolexobru-1395@yopmail.com', createdAt: '2025-11-11T20:51:41Z' },
      { email: 'racejihoibrei-1918@yopmail.com', createdAt: '2025-11-11T18:27:43Z' },
      { email: 'kobrolexobru-1395@yopmail.com', createdAt: '2025-11-11T18:05:31Z' }
    ];

    this.logs$ = of(mock).pipe(
      map(items =>
        // Ordena descendente por fecha
        [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      )
    );
  }

  trackByIndex = (_: number, __: unknown) => _;

  // ---------- Exportar a Excel ----------
  async exportarExcel(logs: LogIngreso[] | null | undefined) {
    if (!logs?.length) return;

    // Carga dinámica para no penalizar el bundle si no lo usás.
    const XLSX = await import('xlsx');

    const rows = logs.map(l => ({
      Usuario: l.email,
      'Fecha y Hora': this.formatDate(l.createdAt)
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ingresos');
    XLSX.writeFile(wb, `registro_ingresos_${this.simpleStamp()}.xlsx`);
  }

  private simpleStamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  // Formato dd/MM/yyyy, hh:mm:ss a (AM/PM). Usamos en-US para “AM/PM” como en la captura.
  formatDate(value: Date | string | number): string {
    const d = new Date(value);
    return d.toLocaleString('en-US', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true
    });
  }
}




// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-log-ingresos-admin',
//   standalone: true,
//   imports: [],
//   templateUrl: './log-ingresos-admin.component.html',
//   styleUrl: './log-ingresos-admin.component.scss'
// })
// export class LogIngresosAdminComponent {

// }


// import { ChangeDetectionStrategy, Component } from '@angular/core';
// import { Router } from '@angular/router';
// import { Observable, of } from 'rxjs';
// import { map } from 'rxjs/operators';

// export interface LogIngreso {
//   email: string;
//   createdAt: any; // Date | Firestore Timestamp | number | string
// }

// // TODO: Reemplaza el "any" por tu servicio real (p. ej. LogIngresosService)
// declare type LogIngresosService = {
//   getAll$: () => Observable<LogIngreso[]>;
// };

// @Component({
//   selector: 'app-log-ingresos-admin',
//   templateUrl: './log-ingresos-admin.component.html',
//   styleUrls: ['./log-ingresos-admin.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class LogIngresosAdminComponent {
//   /** Stream con los logs ordenados desc por fecha */
//   logs$: Observable<LogIngreso[]>;

//   constructor(
//     private router: Router,
//     // Inyecta tu servicio real aquí
//     // private logSvc: LogIngresosService
//   ) {
//     // ---- MOCK (elimínalo cuando conectes tu servicio) ----
//     const mock: LogIngreso[] = [
//       { email: 'racejihoibrei-1918@yopmail.com', createdAt: new Date('2025-11-11T20:57:07') },
//       { email: 'kobrolexobru-1395@yopmail.com', createdAt: new Date('2025-11-11T20:56:49') },
//       { email: 'racejihoibrei-1918@yopmail.com', createdAt: new Date('2025-11-11T20:54:54') },
//       { email: 'touppoi...9644@yopmail.com', createdAt: new Date('2025-11-11T20:54:13') },
//       { email: 'kobrolexobru-1395@yopmail.com', createdAt: new Date('2025-11-11T20:52:42') },
//       { email: 'kobrolexobru-1395@yopmail.com', createdAt: new Date('2025-11-11T20:51:41') },
//       { email: 'racejihoibrei-1918@yopmail.com', createdAt: new Date('2025-11-11T18:27:43') },
//       { email: 'kobrolexobru-1395@yopmail.com', createdAt: new Date('2025-11-11T18:05:31') },
//     ];
//     this.logs$ = of(mock).pipe(
//       map((list) =>
//         list
//           .map((l) => ({ ...l, createdAt: this.toDate(l.createdAt) }))
//           .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
//       )
//     );

//     // ---- REAL (descomenta al conectar) ----
//     // this.logs$ = this.logSvc.getAll$().pipe(
//     //   map(list =>
//     //     list
//     //       .map(l => ({ ...l, createdAt: this.toDate(l.createdAt) }))
//     //       .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
//     //   )
//     // );
//   }

//   /** Convierte a Date desde distintos formatos (Date, Firestore Timestamp, ms, ISO) */
//   private toDate(value: any): Date {
//     if (value instanceof Date) return value;
//     if (value && typeof value.toDate === 'function') return value.toDate();
//     if (typeof value === 'number') return new Date(value);
//     return new Date(value);
//   }

//   trackByIdx(i: number): number {
//     return i;
//   }

//   volverAlDashboard(): void {
//     this.router.navigateByUrl('/dashboard');
//   }

//   /** Exporta a Excel usando xlsx (import dinámico para lazy-load) */
//   async exportarExcel(logs: LogIngreso[]): Promise<void> {
//     const { utils, writeFile, book_new, book_append_sheet } = await import('xlsx');
//     const data = logs.map((l) => ({
//       Usuario: l.email,
//       'Fecha y Hora': this.formateaFecha(l.createdAt),
//     }));
//     const ws = utils.json_to_sheet(data);
//     const wb = book_new();
//     book_append_sheet(wb, ws, 'Ingresos');
//     writeFile(wb, `log_ingresos_${this.timestampParaArchivo()}.xlsx`);
//   }

//   private formateaFecha(d: Date): string {
//     const z = (n: number) => String(n).padStart(2, '0');
//     const dd = z(d.getDate());
//     const mm = z(d.getMonth() + 1);
//     const yyyy = d.getFullYear();
//     let h = d.getHours();
//     const ampm = h >= 12 ? 'PM' : 'AM';
//     h = h % 12 || 12;
//     const hh = z(h);
//     const mi = z(d.getMinutes());
//     const ss = z(d.getSeconds());
//     return `${dd}/${mm}/${yyyy}, ${hh}:${mi}:${ss} ${ampm}`;
//   }

//   private timestampParaArchivo(): string {
//     const d = new Date();
//     const z = (n: number) => String(n).padStart(2, '0');
//     return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(
//       d.getMinutes()
//     )}${z(d.getSeconds())}`;
//   }
// }
