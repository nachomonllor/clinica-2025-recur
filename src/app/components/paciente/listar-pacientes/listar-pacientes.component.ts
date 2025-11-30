// import { Component, OnInit, ViewChild } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MatCardModule } from '@angular/material/card';
// import { MatTableModule, MatTableDataSource } from '@angular/material/table';
// import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
// import { MatSort, MatSortModule } from '@angular/material/sort';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { Paciente } from '../../../../models/interfaces';
// import { PacienteService } from '../../../services/paciente.service';


// @Component({
//   selector: 'app-listar-pacientes',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatCardModule,
//     MatTableModule,
//     MatPaginatorModule,
//     MatSortModule,
//     MatFormFieldModule,
//     MatInputModule
//   ],
//   templateUrl: './listar-pacientes.component.html',
//   styleUrls: ['./listar-pacientes.component.scss']
// })
// export class ListarPacientesComponent implements OnInit {
//   displayedColumns: string[] = ['avatar', 'nombre', 'apellido', 'email', 'obraSocial'];
//   dataSource = new MatTableDataSource<Paciente>([]);

//   @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
//   @ViewChild(MatSort, { static: true }) sort!: MatSort;

//   constructor(private pacienteSrv: PacienteService) { }

//   ngOnInit(): void {
//     this.dataSource.paginator = this.paginator;
//     this.dataSource.sort = this.sort;

//     // Filtro por texto (lowercase)
//     this.dataSource.filterPredicate = (row: Paciente, flt: string) => {
//       const haystack = `${row.apellido} ${row.nombre} ${row.email} ${row.obraSocial}`.toLowerCase();
//       return haystack.includes(flt);
//     };

//     this.pacienteSrv.getPacientes().subscribe({
//       next: (pacientes) => (this.dataSource.data = pacientes),
//       error: (e) => console.error('[ListarPacientes] Error', e)
//     });
//   }

//   // aplicarFiltro(valor: string) {
//   //   this.dataSource.filter = (valor || '').trim().toLowerCase();
//   //   if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
//   // }

//   aplicarFiltro(valor: string = ''): void {
//     this.dataSource.filter = (valor || '').trim().toLowerCase();
//     if (this.dataSource.paginator) this.dataSource.paginator.firstPage?.();
//   }

// }






// // // import { Component } from '@angular/core';

// // // @Component({
// // //   selector: 'app-listar-pacientes',
// // //   standalone: true,
// // //   imports: [],
// // //   templateUrl: './listar-pacientes.component.html',
// // //   styleUrl: './listar-pacientes.component.scss'
// // // })
// // // export class ListarPacientesComponent {

// // // }


// // import { Component, OnInit } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { MatTableModule } from '@angular/material/table';
// // import { MatCardModule } from '@angular/material/card';
// // import { MatPaginatorModule } from '@angular/material/paginator';
// // import { MatSortModule } from '@angular/material/sort';
// // import { Paciente } from '../../../models/paciente.model';

// // @Component({
// //     selector: 'app-listar-pacientes',
// //     standalone: true,
// //     imports: [
// //         CommonModule,
// //         MatCardModule,
// //         MatTableModule,
// //         MatPaginatorModule,
// //         MatSortModule
// //     ],
// //     templateUrl: './listar-pacientes.component.html',
// //     styleUrls: ['./listar-pacientes.component.scss']
// // })
// // export class ListarPacientesComponent implements OnInit {
// //   pacientes: Paciente[] = [];
// //   displayedColumns: string[] = ['avatar', 'nombre', 'apellido', 'email', 'obraSocial'];

// //   constructor(private fsService: FirestoreService) {}

// //   ngOnInit() {
// //     this.fsService.getPacientes().subscribe((data: Paciente[]) => {
// //       this.pacientes = data;
// //     });
// //   }
// // }
