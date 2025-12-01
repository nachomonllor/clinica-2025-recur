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
import { MatOptionModule } from '@angular/material/core';

// Pipes y Directivas
import { StatusLabelPipe } from '../../../pipes/status-label.pipe';
import { StatusBadgeDirective } from '../../../directives/status-badge.directive';
import { CapitalizarNombrePipe } from "../../../pipes/capitalizar-nombre.pipe";

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
    MatOptionModule,
    StatusLabelPipe,
    StatusBadgeDirective,
    CapitalizarNombrePipe
  ],
  templateUrl: './turnos-por-paciente.component.html',
  styleUrls: ['./turnos-por-paciente.component.scss']
})
export class TurnosPorPacienteComponent implements OnInit {

  pacientes: any[] = [];          // Lista completa de pacientes
  pacientesFiltrados: any[] = []; // Lista para el select (filtrable)
  filtroTexto: string = '';       // Texto del buscador de pacientes

  turnos: any[] = [];             // Lista de turnos que se MUESTRAN
  turnosOriginales: any[] = [];   // Lista de respaldo con TODOS los turnos (para filtrar localmente)
  
  cargando = false;
  buscandoTurnos = false;
  pacienteSeleccionado: any = null;

  filtroForm: FormGroup;

  // Imagen por defecto
  defaultAvatar = 'assets/avatars/paciente1.jpg';

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

  // 1. Cargar lista de pacientes
  async cargarPacientes() {
    this.cargando = true;
    try {
      const { data, error } = await this.supa.client
        .from('usuarios')
        .select('id, nombre, apellido, dni, imagen_perfil_1')
        .eq('perfil', 'PACIENTE')
        .order('apellido');

      if (error) throw error;
      
      this.pacientes = (data || []).filter(p => p.nombre && p.apellido && p.dni);
      
      // Inicializar la lista filtrada con todos
      this.pacientesFiltrados = this.pacientes;
      
    } catch (error) {
      console.error('Error cargando pacientes', error);
    } finally {
      this.cargando = false;
    }
  }

  // Lógica de filtrado de PACIENTES (Input dentro del Select)
  filtrarPacientes(texto: string) {
    this.filtroTexto = texto;
    if (!texto) {
      this.pacientesFiltrados = this.pacientes;
      return;
    }
    const busqueda = texto.toLowerCase();
    
    // Filtramos por Nombre, Apellido o DNI
    this.pacientesFiltrados = this.pacientes.filter(p => 
      p.nombre?.toLowerCase().includes(busqueda) || 
      p.apellido?.toLowerCase().includes(busqueda) ||
      p.dni?.toString().includes(busqueda)
    );
  }
  
  // Evita que el clic en el input de búsqueda cierre el select
  handleInputClick(event: Event) {
    event.stopPropagation();
  }

  // 2. Al seleccionar un paciente, buscar sus turnos en BD
  async buscarHistorial() {
    const pacienteId = this.filtroForm.value.pacienteId;
    if (!pacienteId) return;

    this.buscandoTurnos = true;
    // Buscamos en la lista completa para obtener los datos correctos del paciente
    this.pacienteSeleccionado = this.pacientes.find(p => p.id === pacienteId);
    
    // Reseteamos arrays
    this.turnos = [];
    this.turnosOriginales = [];

    try {
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
        .order('fecha_hora_inicio', { ascending: false });

      if (error) throw error;

      // Mapeamos los datos
      const resultados = (data || []).map((t: any) => ({
        fecha: new Date(t.fecha_hora_inicio),
        hora: t.fecha_hora_inicio.split('T')[1].slice(0, 5),
        especialidad: t.especialidad?.nombre,
        especialista: `${t.especialista?.apellido}, ${t.especialista?.nombre}`,
        estado: t.estado?.codigo,
        resena: t.comentario
      }));

      // Guardamos en ambas listas
      this.turnosOriginales = resultados; // Respaldo inmutable
      this.turnos = resultados;           // Lista visible mutable

    } catch (error) {
      console.error('Error buscando historial', error);
    } finally {
      this.buscandoTurnos = false;
    }
  }

  // 3. NUEVO: Filtrado local de TURNOS (Input a la derecha del select)
  filtrarTurnos(texto: string) {
    if (!texto) {
      this.turnos = this.turnosOriginales; // Si borran, restauramos todo
      return;
    }

    const busqueda = texto.toLowerCase();
    
    // Filtramos buscando coincidencias en reseña, especialidad o especialista
    this.turnos = this.turnosOriginales.filter(t => 
      (t.resena && t.resena.toLowerCase().includes(busqueda)) || 
      (t.especialidad && t.especialidad.toLowerCase().includes(busqueda)) ||
      (t.especialista && t.especialista.toLowerCase().includes(busqueda))
    );
  }

  limpiar() {
    this.filtroForm.reset();
    this.pacienteSeleccionado = null;
    this.turnos = [];
    this.turnosOriginales = []; // Limpiamos respaldo también
    this.filtroTexto = '';
    this.pacientesFiltrados = this.pacientes; // Restaurar lista de pacientes completa
  }

  onImgError(event: any) {
    event.target.src = this.defaultAvatar;
  }
}








// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { RouterLink } from '@angular/router';

// // Material
// import { MatCardModule } from '@angular/material/card';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatSelectModule } from '@angular/material/select';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatInputModule } from '@angular/material/input';
// import { MatOptionModule } from '@angular/material/core';

// // Pipes y Directivas
// import { StatusLabelPipe } from '../../../pipes/status-label.pipe';
// import { StatusBadgeDirective } from '../../../directives/status-badge.directive';
// import { CapitalizarNombrePipe } from "../../../pipes/capitalizar-nombre.pipe";

// import { SupabaseService } from '../../../services/supabase.service';

// @Component({
//   selector: 'app-turnos-por-paciente',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     RouterLink,
//     MatCardModule,
//     MatFormFieldModule,
//     MatSelectModule,
//     MatButtonModule,
//     MatIconModule,
//     MatInputModule,
//     MatProgressSpinnerModule,
//     MatOptionModule,
//     StatusLabelPipe,
//     StatusBadgeDirective,
//     CapitalizarNombrePipe
//   ],
//   templateUrl: './turnos-por-paciente.component.html',
//   styleUrls: ['./turnos-por-paciente.component.scss']
// })
// export class TurnosPorPacienteComponent implements OnInit {

//   pacientes: any[] = [];          // Lista completa original
//   pacientesFiltrados: any[] = []; // Lista que se muestra en el select
//   filtroTexto: string = '';       // Texto del buscador

//   turnos: any[] = [];
  
//   cargando = false;
//   buscandoTurnos = false;
//   pacienteSeleccionado: any = null;

//   filtroForm: FormGroup;

//   // Imagen por defecto
//   defaultAvatar = 'assets/avatars/paciente1.jpg';

//   constructor(
//     private supa: SupabaseService,
//     private fb: FormBuilder
//   ) {
//     this.filtroForm = this.fb.group({
//       pacienteId: ['', Validators.required]
//     });
//   }

//   async ngOnInit() {
//     await this.cargarPacientes();
//   }

//   // 1. Cargar lista de pacientes
//   async cargarPacientes() {
//     this.cargando = true;
//     try {
//       const { data, error } = await this.supa.client
//         .from('usuarios')
//         .select('id, nombre, apellido, dni, imagen_perfil_1')
//         .eq('perfil', 'PACIENTE')
//         .order('apellido');

//       if (error) throw error;
      
//       this.pacientes = (data || []).filter(p => p.nombre && p.apellido && p.dni);
      
//       // Inicializar la lista filtrada con todos
//       this.pacientesFiltrados = this.pacientes;
      
//     } catch (error) {
//       console.error('Error cargando pacientes', error);
//     } finally {
//       this.cargando = false;
//     }
//   }

//   // Lógica de filtrado en tiempo real
//   filtrarPacientes(texto: string) {
//     this.filtroTexto = texto;
//     if (!texto) {
//       this.pacientesFiltrados = this.pacientes;
//       return;
//     }
//     const busqueda = texto.toLowerCase();
    
//     // Filtramos por Nombre, Apellido o DNI
//     this.pacientesFiltrados = this.pacientes.filter(p => 
//       p.nombre?.toLowerCase().includes(busqueda) || 
//       p.apellido?.toLowerCase().includes(busqueda) ||
//       p.dni?.toString().includes(busqueda)
//     );
//   }
  
//   // Evita que el clic en el input cierre el select
//   handleInputClick(event: Event) {
//     event.stopPropagation();
//   }

//   // 2. Al seleccionar un paciente, buscar sus turnos
//   async buscarHistorial() {
//     const pacienteId = this.filtroForm.value.pacienteId;
//     if (!pacienteId) return;

//     this.buscandoTurnos = true;
//     // Buscamos en la lista completa para obtener los datos correctos
//     this.pacienteSeleccionado = this.pacientes.find(p => p.id === pacienteId);
//     this.turnos = [];

//     try {
//       const { data, error } = await this.supa.client
//         .from('turnos')
//         .select(`
//           id,
//           fecha_hora_inicio,
//           comentario,
//           resena:comentario, 
//           especialidad:especialidades(nombre),
//           especialista:usuarios!fk_turno_especialista(nombre, apellido),
//           estado:estados_turno(codigo)
//         `)
//         .eq('paciente_id', pacienteId)
//         .order('fecha_hora_inicio', { ascending: false });

//       if (error) throw error;

//       this.turnos = (data || []).map((t: any) => ({
//         fecha: new Date(t.fecha_hora_inicio),
//         hora: t.fecha_hora_inicio.split('T')[1].slice(0, 5),
//         especialidad: t.especialidad?.nombre,
//         especialista: `${t.especialista?.apellido}, ${t.especialista?.nombre}`,
//         estado: t.estado?.codigo,
//         resena: t.comentario
//       }));

//     } catch (error) {
//       console.error('Error buscando historial', error);
//     } finally {
//       this.buscandoTurnos = false;
//     }
//   }

//   limpiar() {
//     this.filtroForm.reset();
//     this.pacienteSeleccionado = null;
//     this.turnos = [];
//     this.filtroTexto = '';
//     this.pacientesFiltrados = this.pacientes; // Restaurar lista completa
//   }

//   onImgError(event: any) {
//     event.target.src = this.defaultAvatar;
//   }
// }





