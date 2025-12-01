// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-turnos-por-paciente',
//   standalone: true,
//   imports: [],
//   templateUrl: './turnos-por-paciente.component.html',
//   styleUrl: './turnos-por-paciente.component.scss'
// })
// export class TurnosPorPacienteComponent {

// }

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';

// Pipes y Directivas (Reutilizamos las que ya tienes)
import { StatusLabelPipe } from '../../../pipes/status-label.pipe';
import { StatusBadgeDirective } from '../../../directives/status-badge.directive';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-turnos-por-paciente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    StatusLabelPipe,
    StatusBadgeDirective
  ],
  templateUrl: './turnos-por-paciente.component.html',
  styleUrls: ['./turnos-por-paciente.component.scss']
})
export class TurnosPorPacienteComponent implements OnInit {

  pacientes: any[] = [];
  turnos: any[] = [];
  
  cargando = false;
  buscandoTurnos = false;
  pacienteSeleccionado: any = null;

  filtroForm: FormGroup;

  constructor(
    private supa: SupabaseService,
    private fb: FormBuilder
  ) {
    this.filtroForm = this.fb.group({
      pacienteId: ['', Validators.required]
    });
  }

  async ngOnInit() {
    await this.cargarPacientes();
  }

  // 1. Cargar lista de pacientes para el selector
  async cargarPacientes() {
    this.cargando = true;
    try {
      const { data, error } = await this.supa.client
        .from('usuarios')
        .select('id, nombre, apellido, dni, imagen_perfil_1')
        .eq('perfil', 'PACIENTE')
        .order('apellido');

      if (error) throw error;
      this.pacientes = data || [];
    } catch (error) {
      console.error('Error cargando pacientes', error);
    } finally {
      this.cargando = false;
    }
  }

  // 2. Al seleccionar un paciente, buscar sus turnos
  async buscarHistorial() {
    const pacienteId = this.filtroForm.value.pacienteId;
    if (!pacienteId) return;

    this.buscandoTurnos = true;
    this.pacienteSeleccionado = this.pacientes.find(p => p.id === pacienteId);
    this.turnos = [];

    try {
      // Traemos turnos con datos del especialista y estado
      const { data, error } = await this.supa.client
        .from('turnos')
        .select(`
          id,
          fecha_hora_inicio,
          comentario,
          resena:comentario, 
          especialidad:especialidades(nombre),
          especialista:usuarios!fk_turno_especialista(nombre, apellido),
          estado:estados_turno(codigo)
        `)
        .eq('paciente_id', pacienteId)
        .order('fecha_hora_inicio', { ascending: false }); // Los más recientes primero

      if (error) throw error;

      // Mapeo simple para facilitar la vista
      this.turnos = (data || []).map((t: any) => ({
        fecha: new Date(t.fecha_hora_inicio),
        hora: t.fecha_hora_inicio.split('T')[1].slice(0, 5),
        especialidad: t.especialidad?.nombre,
        especialista: `${t.especialista?.apellido}, ${t.especialista?.nombre}`,
        estado: t.estado?.codigo,
        resena: t.comentario // Usamos el comentario como reseña
      }));

    } catch (error) {
      console.error('Error buscando historial', error);
    } finally {
      this.buscandoTurnos = false;
    }
  }

  limpiar() {
    this.filtroForm.reset();
    this.pacienteSeleccionado = null;
    this.turnos = [];
  }
}