

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CapitalizarNombrePipe } from "../../../../pipes/capitalizar-nombre.pipe";

@Component({
  selector: 'app-pacientes',
  standalone: true,
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.scss'],
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule, CapitalizarNombrePipe]
})
export class PacientesComponent {
  // TODO: reemplazar por datos reales (solo atendidos ≥1 vez)
  pacientes = [
    { id: 'p1', nombre: 'Pérez, Juan', avatarUrl: '' },
    { id: 'p2', nombre: 'García, Ana', avatarUrl: '' },
  ];
}


// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-pacientes',
//   standalone: true,
//   imports: [],
//   templateUrl: './pacientes.component.html',
//   styleUrl: './pacientes.component.scss'
// })
// export class PacientesComponent {

// }