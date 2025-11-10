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



