// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-seleccionar-usuario-registro',
//   standalone: true,
//   imports: [],
//   templateUrl: './seleccionar-usuario-registro.component.html',
//   styleUrl: './seleccionar-usuario-registro.component.scss'
// })
// export class SeleccionarUsuarioRegistroComponent {

// }

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-seleccionar-usuario-registro',
    standalone:true,
    imports: [
        CommonModule,
        MatCardModule,
        MatRippleModule,
        MatIconModule
    ],
    templateUrl: './seleccionar-usuario-registro.component.html',
    styleUrl: './seleccionar-usuario-registro.component.scss'
})

export class SeleccionarUsuarioRegistroComponent {
  opciones = [
    {
      rol: 'Paciente',
      descripcion: 'Solicitá turnos y llevá tu historia clínica digital.',
      imagen: 'assets/img/register-paciente.svg',
      route: '/registro-paciente',
      color: '#2563eb'
    },
    {
      rol: 'Especialista',
      descripcion: 'Gestioná tu agenda y registrá historias clínicas.',
      imagen: 'assets/img/register-especialista.svg',
      route: '/registro-especialista',
      color: '#7c3aed'
    }
  ];

  constructor(private router: Router) {}

  seleccionar(opcion: typeof this.opciones[number]): void {
    this.router.navigate([opcion.route]);
  }
}
