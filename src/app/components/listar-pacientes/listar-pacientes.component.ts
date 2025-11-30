import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { SupabaseService } from '../../../services/supabase.service';
import { CapitalizarNombrePipe } from "../../../pipes/capitalizar-nombre.pipe";
/** Lo que necesita la tabla para mostrar pacientes */
interface PacienteListado {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  obraSocial: string | null;
  avatarUrl: string | null;
}

@Component({
  selector: 'app-listar-pacientes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    CapitalizarNombrePipe
],
  templateUrl: './listar-pacientes.component.html',
  styleUrls: ['./listar-pacientes.component.scss']
})
export class ListarPacientesComponent implements OnInit {
  displayedColumns: string[] = [
    'avatar',
    'nombre',
    'apellido',
    'email',
    'obraSocial'
  ];

  dataSource = new MatTableDataSource<PacienteListado>([]);

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  constructor(private supa: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Filtro por texto (lowercase)
    this.dataSource.filterPredicate = (
      row: PacienteListado,
      flt: string
    ): boolean => {
      const haystack = `${row.apellido} ${row.nombre} ${row.email} ${
        row.obraSocial ?? ''
      }`.toLowerCase();
      return haystack.includes(flt);
    };

    await this.cargarPacientes();
  }

  private async cargarPacientes(): Promise<void> {
    try {
      const { data, error } = await this.supa.client
        .from('usuarios')
        .select(
          `
          id,
          nombre,
          apellido,
          email,
          obra_social,
          imagen_perfil_1,
          perfil
        `
        )
        .eq('perfil', 'PACIENTE')
        .order('apellido', { ascending: true });

      if (error) throw error;

      const pacientes: PacienteListado[] = (data || []).map((u: any) => ({
        id: u.id,
        nombre: u.nombre || '',
        apellido: u.apellido || '',
        email: u.email || '',
        obraSocial: u.obra_social ?? null,
        avatarUrl: u.imagen_perfil_1 ?? null
      }));

      this.dataSource.data = pacientes;
    } catch (e) {
      console.error('[ListarPacientes] Error al cargar pacientes', e);
    }
  }

  aplicarFiltro(valor: string = ''): void {
    this.dataSource.filter = (valor || '').trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage?.();
    }
  }
}






// import { Component, OnInit, ViewChild } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MatCardModule } from '@angular/material/card';
// import { MatTableModule, MatTableDataSource } from '@angular/material/table';
// import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
// import { MatSort, MatSortModule } from '@angular/material/sort';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';

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

//   aplicarFiltro(valor: string = ''): void {
//     this.dataSource.filter = (valor || '').trim().toLowerCase();
//     if (this.dataSource.paginator) this.dataSource.paginator.firstPage?.();
//   }

// }




