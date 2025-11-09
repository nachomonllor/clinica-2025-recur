// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-turnos-paciente',
//   standalone: true,
//   imports: [],
//   templateUrl: './turnos-paciente.component.html',
//   styleUrl: './turnos-paciente.component.scss'
// })
// export class TurnosPacienteComponent {

// }

import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {  TurnoVm } from '../../../../models/interfaces';

@Component({
  standalone: true,
  selector: 'app-turnos-paciente',
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './turnos-paciente.component.html',
  styleUrls: ['./turnos-paciente.component.scss'],
})
export class TurnosPacienteComponent {
  filtro = signal<'especialidad' | 'especialista' | ''>('');
  query = signal('');
  turnos = signal<TurnoVm[]>([]); // TODO: cargar desde servicio
  filtrados = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filtro();
    return this.turnos().filter(t => {
      if (!q) return true;
      if (f === 'especialidad') return t.especialidad.toLowerCase().includes(q);
      if (f === 'especialista') return t.especialista.toLowerCase().includes(q);
      return t.especialidad.toLowerCase().includes(q) || t.especialista.toLowerCase().includes(q);
    });
  });

  cancelar(id: string) { /* TODO: diálogo Y comentario */ }
}
