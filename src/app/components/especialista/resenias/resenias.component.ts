

import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-resenias',
  standalone: true,
  templateUrl: './resenias.component.html',
  styleUrls: ['./resenias.component.scss'],
  imports: [CommonModule, RouterModule, DatePipe, MatCardModule, MatButtonModule]
})

// PENDIENTES DE RESEÑA

export class ReseniasComponent {
  // TODO: traer turnos del especialista con resena pendiente
  pendientes = [
    { id: 't1', fechaISO: new Date().toISOString(), paciente: 'Pérez, Juan', especialidad: 'Clínica médica' }
  ];
}


// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-resenias',
//   standalone: true,
//   imports: [],
//   templateUrl: './resenias.component.html',
//   styleUrl: './resenias.component.scss'
// })
// export class ReseniasComponent {

// }
