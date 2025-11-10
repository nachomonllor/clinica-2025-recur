import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-paciente-detalle',
  standalone: true,
  templateUrl: './paciente-detalle.component.html',
  styleUrls: ['./paciente-detalle.component.scss'],
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule]
})
export class PacienteDetalleComponent {
  // id = this.route.snapshot.paramMap.get('id')!;
  // TODO: fetch real por id
  id!: string;

  paciente = { nombre: 'Apellido, Nombre', dni: '00.000.000', edad: 40, avatarUrl: '' };

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    // Si la ruta puede cambiar sin destruir el componente:
    // this.route.paramMap.subscribe(m => this.id = m.get('id') ?? '');
  }

}


// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-paciente-detalle',
//   standalone: true,
//   imports: [],
//   templateUrl: './paciente-detalle.component.html',
//   styleUrl: './paciente-detalle.component.scss'
// })
// export class PacienteDetalleComponent {

// }

