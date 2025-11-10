import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-turno-detalle-esp',
  standalone: true,
  templateUrl: './turno-detalle-esp.component.html',
  styleUrls: ['./turno-detalle-esp.component.scss'],
  imports: [CommonModule, RouterModule, DatePipe,
    CommonModule, RouterModule, DatePipe, MatCardModule, MatButtonModule, MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TurnoDetalleEspComponent implements OnInit {
  id!: string;

  // TODO: fetch real
  turno = {
    fechaISO: new Date().toISOString(),
    especialidad: 'Clínica médica',
    paciente: 'Pérez, Juan',
    estado: 'aceptado'
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    // Si la ruta puede cambiar sin destruir el componente:
    // this.route.paramMap.subscribe(m => this.id = m.get('id') ?? '');
  }
}



// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-turno-detalle-esp',
//   standalone: true,
//   imports: [],
//   templateUrl: './turno-detalle-esp.component.html',
//   styleUrl: './turno-detalle-esp.component.scss'
// })
// export class TurnoDetalleEspComponent {

// }

// import { Component } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { MatCardModule } from '@angular/material/card';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';

// @Component({
//   selector: 'app-turno-detalle-esp',
//   standalone: true,
//   templateUrl: './turno-detalle-esp.component.html',
//   styleUrls: ['./turno-detalle-esp.component.scss'],
//   imports: [CommonModule, RouterModule, DatePipe, MatCardModule, MatButtonModule, MatIconModule]
// })
// export class TurnoDetalleEspComponent {
//   id = this.route.snapshot.paramMap.get('id')!;
//   // TODO: fetch real
//   turno = { fechaISO: new Date().toISOString(), especialidad: 'Clínica médica', paciente: 'Pérez, Juan', estado: 'aceptado' };

//   constructor(private route: ActivatedRoute) {}
// }

