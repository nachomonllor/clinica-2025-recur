import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  Optional,
  Input,
  Output,
  EventEmitter,
  OnInit,
  Inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  of,
  map,
  tap,
  catchError,
  firstValueFrom,
} from 'rxjs';
import { RolTab, EstadoTab, Usuario, UsuariosPort } from '../../../../models/interfaces';
import { USUARIOS_PORT } from '../../../ports/usuarios.port';

import { TitleCasePipe } from '@angular/common';


@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  standalone: true,
  styleUrls: ['./usuarios.component.scss'],
  imports: [NgIf, NgFor, AsyncPipe, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuariosComponent implements OnInit {
  /* ========== Filtros (únicos y tipados) ========== */
  private _rol$ = new BehaviorSubject<RolTab>('todos');
  private _estado$ = new BehaviorSubject<EstadoTab>('todos');
  private _search$ = new BehaviorSubject<string>('');

  rolFilter$ = this._rol$.asObservable();
  estadoFilter$ = this._estado$.asObservable();
  search$ = this._search$.asObservable();

  setRol(v: RolTab) { this._rol$.next(v); }
  setEstado(v: EstadoTab) { this._estado$.next(v); }
  setSearch(v: string) { this.searchTerm = v; this._search$.next(v); }
  searchTerm = '';

  /* Fuente alternativa: inyectar datos desde el padre */
  @Input() data$?: Observable<Usuario[]>;

  /* Outputs por si no hay servicio inyectado */
  @Output() aprobar = new EventEmitter<Usuario>();
  @Output() toggleHabilitado = new EventEmitter<{ user: Usuario; habilitado: boolean }>();

  /* ========== Estado UI ========== */
  private _cargando$ = new BehaviorSubject<boolean>(true);
  cargando$ = this._cargando$.asObservable();

  private _error$ = new BehaviorSubject<string | null>(null);
  error$ = this._error$.asObservable();

  /* ========== Datos ========== */
  usuarios$!: Observable<Usuario[]>;
  filtrados$!: Observable<Usuario[]>;

  // constructor(
  //   @Optional() private readonly usuariosSvc: UsuariosPort | null,
  //   private readonly router: Router
  // ) {}

  constructor(
    @Optional() @Inject(USUARIOS_PORT) private readonly usuariosSvc: UsuariosPort | null,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    const base$ =
      this.data$ ??
      (this.usuariosSvc ? this.usuariosSvc.getAll() : of<Usuario[]>([]));

    this.usuarios$ = base$.pipe(
      tap(() => this._cargando$.next(false)),
      catchError(() => {
        this._error$.next('No pudimos cargar los usuarios.');
        this._cargando$.next(false);
        return of<Usuario[]>([]);
      })
    );

    this.filtrados$ = combineLatest([
      this.usuarios$,
      this.search$,
      this.rolFilter$,
      this.estadoFilter$,
    ]).pipe(
      map(([usuarios, term, rol, estado]) => {
        const t = term.toLowerCase().trim();

        let res = usuarios.slice();

        // Rol
        if (rol !== 'todos') {
          res = res.filter((u) => u.rol === rol);
        }

        // Estado (solo especialistas)
        if (rol === 'especialista') {
          res = res.filter((u) => {
            if (estado === 'habilitados') return !!u.habilitado;
            if (estado === 'inhabilitados') return u.habilitado === false;
            if (estado === 'pendientes') return !u.aprobado || !u.mailVerificado;
            return true; // 'todos'
          });
        }

        // Búsqueda libre
        if (t) {
          res = res.filter((u) => {
            const text = [
              u.nombre,
              u.apellido,
              u.email,
              u.dni ?? '',
              u.obraSocial ?? '',
              ...(u.especialidades ?? []),
            ].join(' ').toLowerCase();
            return text.includes(t);
          });
        }

        // Orden sugerido por apellido
        return res.sort((a, b) => a.apellido.localeCompare(b.apellido));
      })
    );
  }

  /* ====== Acciones UI ====== */

  private async awaitMaybe<T>(maybe: Promise<T> | Observable<T>): Promise<T> {
    return typeof (maybe as any)?.then === 'function'
      ? await (maybe as Promise<T>)
      : await firstValueFrom(maybe as Observable<T>);
  }

  async onToggleHabilitado(u: Usuario, checked: boolean) {
    if (u.rol !== 'especialista') return;

    const ok = checked
      ? confirm(`¿Habilitar a ${u.apellido}, ${u.nombre}? Podrá ingresar al sistema.`)
      : confirm(`¿Inhabilitar a ${u.apellido}, ${u.nombre}? No podrá ingresar al sistema.`);
    if (!ok) return;

    if (this.usuariosSvc) {
      try {
        await this.awaitMaybe(this.usuariosSvc.toggleHabilitado(u.id, checked));
      } catch {
        alert('No se pudo actualizar el estado. Intente nuevamente.');
      }
    } else {
      this.toggleHabilitado.emit({ user: u, habilitado: checked });
    }
  }

  async onAprobar(u: Usuario) {
    if (u.rol !== 'especialista') return;

    const ok = confirm(`¿Aprobar la cuenta del especialista ${u.apellido}, ${u.nombre}?`);
    if (!ok) return;

    if (this.usuariosSvc) {
      try {
        await this.awaitMaybe(this.usuariosSvc.aprobarEspecialista(u.id));
      } catch {
        alert('No se pudo aprobar el usuario.');
      }
    } else {
      this.aprobar.emit(u);
    }
  }

  onCrearUsuario() { this.router.navigate(['/admin/usuarios/nuevo']); }
  onVerDetalle(u: Usuario) { this.router.navigate(['/admin/usuarios', u.id]); }
  onVerHistoriaClinica(u: Usuario) {
    if (u.rol !== 'paciente') return;
    this.router.navigate(['/admin/historias', u.id]);
  }
  trackById(_i: number, u: Usuario) { return u.id; }

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.src = 'assets/avatar.svg';
  }

  /* ====== Exportar a Excel (fallback CSV) – Sprint 3 ====== */
  async exportar() {
    const usuarios = await firstValueFrom(this.filtrados$);
    if (!usuarios?.length) {
      alert('No hay datos para exportar.');
      return;
    }

    try {
      const XLSX = await import('xlsx'); // opcional, si está instalado
      const data = usuarios.map((u) => ({
        ID: u.id,
        Apellido: u.apellido,
        Nombre: u.nombre,
        DNI: u.dni ?? '',
        Email: u.email,
        Rol: u.rol,
        Especialidades: (u.especialidades ?? []).join('; '),
        Obra_Social: u.obraSocial ?? '',
        Habilitado: u.habilitado ? 'Sí' : 'No',
        Aprobado: u.aprobado ? 'Sí' : 'No',
        Mail_Verificado: u.mailVerificado ? 'Sí' : 'No',
        Alta: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      this.descargarBlob(new Blob([wbout], { type: 'application/octet-stream' }), 'usuarios.xlsx');
    } catch {
      // Fallback CSV (abre perfecto en Excel)
      const csv = this.toCSV(usuarios);
      this.descargarBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'usuarios.csv');
    }
  }

  private toCSV(usuarios: Usuario[]): string {
    const headers = [
      'ID', 'Apellido', 'Nombre', 'DNI', 'Email', 'Rol', 'Especialidades',
      'Obra Social', 'Habilitado', 'Aprobado', 'Mail Verificado', 'Alta',
    ];
    const rows = usuarios.map((u) => [
      u.id,
      u.apellido,
      u.nombre,
      u.dni ?? '',
      u.email,
      u.rol,
      (u.especialidades ?? []).join('; '),
      u.obraSocial ?? '',
      u.habilitado ? 'Sí' : 'No',
      u.aprobado ? 'Sí' : 'No',
      u.mailVerificado ? 'Sí' : 'No',
      u.createdAt ? new Date(u.createdAt as any).toISOString().slice(0, 10) : '',
    ]);
    return [headers, ...rows]
      .map((r) => r.map((f) => `"${String(f ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  private descargarBlob(blob: Blob, nombre: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    window.URL.revokeObjectURL(url);
  }

}






// import { AsyncPipe, NgFor, NgIf } from '@angular/common';
// import {
//   Component,
//   ChangeDetectionStrategy,
//   Optional,
//   Input,
//   Output,
//   EventEmitter,
//   OnInit,
// } from '@angular/core';
// import { Router } from '@angular/router';
// import {
//   BehaviorSubject,
//   Observable,
//   combineLatest,
//   of,
//   map,
//   tap,
//   catchError,
//   firstValueFrom,
// } from 'rxjs';
// import { EstadoTab, Rol, RolTab } from '../../../../models/interfaces';

// @Component({
//   selector: 'app-usuarios',
//   templateUrl: './usuarios.component.html',
//   standalone: true,
//   styleUrls: ['./usuarios.component.scss'],
//   imports: [NgIf, NgFor, AsyncPipe],
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class UsuariosComponent implements OnInit {


//   private _rol$ = new BehaviorSubject<RolTab>('todos');
//   private _estado$ = new BehaviorSubject<EstadoTab>('todos');

//   rolFilter$ = this._rol$.asObservable();
//   estadoFilter$ = this._estado$.asObservable();

//   // -----------------------
//   setRol(v: RolTab) { this._rol$.next(v); }
//   setEstado(v: EstadoTab) { this._estado$.next(v); }
//   /* Fuente alternativa: si preferís, podés inyectar los datos desde el padre */
//   @Input() data$?: Observable<Usuario[]>;

//   /* Outputs por si no hay servicio inyectado */
//   @Output() aprobar = new EventEmitter<Usuario>();
//   @Output() toggleHabilitado = new EventEmitter<{ user: Usuario; habilitado: boolean }>();

//   // Estado UI
//   private _cargando$ = new BehaviorSubject<boolean>(true);
//   cargando$ = this._cargando$.asObservable();
//   private _error$ = new BehaviorSubject<string | null>(null);
//   error$ = this._error$.asObservable();

//   // Filtros & búsqueda
//   searchTerm = '';
//   private _search$ = new BehaviorSubject<string>('');
//   private _rolFilter$ = new BehaviorSubject<Rol | 'todos'>('todos');
//   private _estadoFilter$ =
//     new BehaviorSubject<'todos' | 'habilitados' | 'pendientes' | 'inhabilitados'>('todos');

//   // Datos
//   usuarios$!: Observable<Usuario[]>;
//   filtrados$!: Observable<Usuario[]>;

//   constructor(
//     @Optional() private readonly usuariosSvc: UsuariosPort | null,
//     private readonly router: Router
//   ) { }

//   ngOnInit(): void {
//     const base$ =
//       this.data$ ??
//       (this.usuariosSvc ? this.usuariosSvc.getAll() : of<Usuario[]>([]));

//     this.usuarios$ = base$.pipe(
//       tap(() => this._cargando$.next(false)),
//       catchError(() => {
//         this._error$.next('No pudimos cargar los usuarios.');
//         this._cargando$.next(false);
//         return of<Usuario[]>([]);
//       })
//     );

//     this.filtrados$ = combineLatest([
//       this.usuarios$,
//       this._search$,
//       this._rolFilter$,
//       this._estadoFilter$,
//     ]).pipe(
//       map(([usuarios, term, rol, estado]) => {
//         const t = term.toLowerCase().trim();

//         let res = usuarios.slice();

//         // Rol
//         if (rol !== 'todos') {
//           res = res.filter((u) => u.rol === rol);
//         }

//         // Estado (solo especialistas)
//         if (rol === 'especialista') {
//           res = res.filter((u) => {
//             if (estado === 'habilitados') return !!u.habilitado;
//             if (estado === 'inhabilitados') return u.habilitado === false;
//             if (estado === 'pendientes') return !u.aprobado || !u.mailVerificado;
//             return true;
//           });
//         }

//         // Búsqueda libre
//         if (t) {
//           res = res.filter((u) => {
//             const text = [
//               u.nombre,
//               u.apellido,
//               u.email,
//               u.dni,
//               u.obraSocial ?? '',
//               ...(u.especialidades ?? []),
//             ]
//               .join(' ')
//               .toLowerCase();
//             return text.includes(t);
//           });
//         }

//         // Orden sugerido por apellido
//         return res.sort((a, b) => a.apellido.localeCompare(b.apellido));
//       })
//     );
//   }

//   /* ====== Acciones UI ====== */
//   setSearch(value: string) {
//     this.searchTerm = value;
//     this._search$.next(value);
//   }
//   // setRol(rol: Rol | 'todos') {
//   //   this._rolFilter$.next(rol);
//   // }
//   // setEstado(v: 'todos' | 'habilitados' | 'pendientes' | 'inhabilitados') {
//   //   this._estadoFilter$.next(v);
//   // }

//   async onToggleHabilitado(u: Usuario, checked: boolean) {
//     if (u.rol !== 'especialista') return;

//     const ok = checked
//       ? confirm(`¿Habilitar a ${u.apellido}, ${u.nombre}? Podrá ingresar al sistema.`)
//       : confirm(`¿Inhabilitar a ${u.apellido}, ${u.nombre}? No podrá ingresar al sistema.`);

//     if (!ok) return;

//     if (this.usuariosSvc) {
//       try {
//         await this.usuariosSvc.toggleHabilitado(u.id, checked);
//       } catch {
//         alert('No se pudo actualizar el estado. Intente nuevamente.');
//       }
//     } else {
//       this.toggleHabilitado.emit({ user: u, habilitado: checked });
//     }
//   }

//   async onAprobar(u: Usuario) {
//     if (u.rol !== 'especialista') return;

//     const ok = confirm(`¿Aprobar la cuenta del especialista ${u.apellido}, ${u.nombre}?`);
//     if (!ok) return;

//     if (this.usuariosSvc) {
//       try {
//         await this.usuariosSvc.aprobarEspecialista(u.id);
//       } catch {
//         alert('No se pudo aprobar el usuario.');
//       }
//     } else {
//       this.aprobar.emit(u);
//     }
//   }

//   onCrearUsuario() {
//     this.router.navigate(['/admin/usuarios/nuevo']);
//   }
//   onVerDetalle(u: Usuario) {
//     this.router.navigate(['/admin/usuarios', u.id]);
//   }
//   onVerHistoriaClinica(u: Usuario) {
//     if (u.rol !== 'paciente') return;
//     this.router.navigate(['/admin/historias', u.id]);
//   }
//   trackById(_i: number, u: Usuario) {
//     return u.id;
//   }
//   onImgError(ev: Event) {
//     const img = ev.target as HTMLImageElement;
//     img.src = 'assets/avatar.svg';
//   }

//   /* ====== Exportar a Excel (fallback CSV) – Sprint 3 ====== */
//   async exportar() {
//     const usuarios = await firstValueFrom(this.filtrados$);
//     if (!usuarios?.length) {
//       alert('No hay datos para exportar.');
//       return;
//     }

//     try {
//       const XLSX = await import('xlsx'); // opcional, si está instalado
//       const data = usuarios.map((u) => ({
//         ID: u.id,
//         Apellido: u.apellido,
//         Nombre: u.nombre,
//         DNI: u.dni,
//         Email: u.email,
//         Rol: u.rol,
//         Especialidades: (u.especialidades ?? []).join('; '),
//         Obra_Social: u.obraSocial ?? '',
//         Habilitado: u.habilitado ? 'Sí' : 'No',
//         Aprobado: u.aprobado ? 'Sí' : 'No',
//         Mail_Verificado: u.mailVerificado ? 'Sí' : 'No',
//         Alta: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
//       }));
//       const ws = XLSX.utils.json_to_sheet(data);
//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
//       const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//       this.descargarBlob(new Blob([wbout], { type: 'application/octet-stream' }), 'usuarios.xlsx');
//     } catch {
//       // Fallback CSV (abre perfecto en Excel)
//       const csv = this.toCSV(usuarios);
//       this.descargarBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'usuarios.csv');
//     }
//   }

//   private toCSV(usuarios: Usuario[]): string {
//     const headers = [
//       'ID',
//       'Apellido',
//       'Nombre',
//       'DNI',
//       'Email',
//       'Rol',
//       'Especialidades',
//       'Obra Social',
//       'Habilitado',
//       'Aprobado',
//       'Mail Verificado',
//       'Alta',
//     ];
//     const rows = usuarios.map((u) => [
//       u.id,
//       u.apellido,
//       u.nombre,
//       u.dni,
//       u.email,
//       u.rol,
//       (u.especialidades ?? []).join('; '),
//       u.obraSocial ?? '',
//       u.habilitado ? 'Sí' : 'No',
//       u.aprobado ? 'Sí' : 'No',
//       u.mailVerificado ? 'Sí' : 'No',
//       u.createdAt ? new Date(u.createdAt as any).toISOString().slice(0, 10) : '',
//     ]);
//     return [headers, ...rows]
//       .map((r) => r.map((f) => `"${String(f ?? '').replace(/"/g, '""')}"`).join(','))
//       .join('\n');
//   }

//   private descargarBlob(blob: Blob, nombre: string) {
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = nombre;
//     a.click();
//     window.URL.revokeObjectURL(url);
//   }
// }



// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-usuarios',
// //   standalone: true,
// //   imports: [],
// //   templateUrl: './usuarios.component.html',
// //   styleUrl: './usuarios.component.scss'
// // })
// // export class UsuariosComponent {

// // }