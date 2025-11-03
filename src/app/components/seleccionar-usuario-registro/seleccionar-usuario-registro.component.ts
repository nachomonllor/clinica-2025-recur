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
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-seleccionar-usuario-registro',
    standalone:true,
    imports: [
        CommonModule,
        MatCardModule, // ya lo usas en registro-paciente :contentReference[oaicite:0]{index=0}
        MatButtonModule // idem :contentReference[oaicite:1]{index=1}
    ],
    templateUrl: './seleccionar-usuario-registro.component.html',
    styleUrl: './seleccionar-usuario-registro.component.scss'
})

export class SeleccionarUsuarioRegistroComponent {
  constructor(public router: Router) {}

}
