// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-admin-home',
//   standalone: true,
//   imports: [],
//   templateUrl: './admin-home.component.html',
//   styleUrl: './admin-home.component.scss'
// })
// export class AdminHomeComponent {

// }


import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AdminCounters } from '../../../../models/interfaces';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatDividerModule,
],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.scss']
})
export class AdminHomeComponent {
  @Input() counters: AdminCounters | null = null;
  showFab = false;

  links = [
    { icon: 'group', title: 'Usuarios', desc: 'ABM y aprobación de especialistas.', route: '/admin/usuarios' },
    { icon: 'event', title: 'Turnos', desc: 'Listado global con filtros.', route: '/admin/turnos' },
    { icon: 'add_circle', title: 'Solicitar turno', desc: 'Cargar turno para un paciente.', route: '/solicitar-turno' },
    { icon: 'analytics', title: 'Reportes', desc: 'Gráficos y descargas (Excel/PDF).', route: '/admin/reportes' },
    { icon: 'person', title: 'Mi perfil', desc: 'Datos del administrador.', route: '/mi-perfil' }
  ];

  toggleFab() { this.showFab = !this.showFab; }

  onNuevoUsuario() {
    // TODO: navegar a alta de usuario o abrir diálogo
    // this.router.navigateByUrl('/admin/usuarios/nuevo');
  }
  onSolicitarTurno() {
    // TODO: navegar a flujo de solicitud
    // this.router.navigateByUrl('/solicitar-turno');
  }
  onExportarUsuarios() {
    // TODO: disparar exportación (servicio)
  }
}
