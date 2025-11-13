import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { from, map, switchMap } from 'rxjs';
import { SupabaseService } from '../../../services/supabase.service';
import Swal from 'sweetalert2';

interface EspecialistaOption {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
}

interface PacienteOption {
  id: string;
  nombre: string;
  apellido: string;
}

@Component({
  selector: 'app-solicitar-turno',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.scss']
})
export class SolicitarTurnoComponent implements OnInit {
  formularioTurno!: FormGroup<{
    especialidad: FormControl<string | null>;
    especialista: FormControl<string | null>;
    paciente: FormControl<string | null>; // Solo para admin
    dia: FormControl<string | null>;
    hora: FormControl<string | null>;
  }>;

  especialidades: string[] = [];
  especialistas: EspecialistaOption[] = [];
  especialistasFiltrados: EspecialistaOption[] = [];
  pacientes: PacienteOption[] = [];
  diasDisponibles: string[] = [];
  horariosDisponibles: string[] = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  
  esAdmin = false;
  pacienteId: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private supa: SupabaseService,
    public router: Router,
    private snackBar: MatSnackBar
  ) { }

  async ngOnInit(): Promise<void> {
    // Verificar si es admin
    const { data: sessionData } = await this.supa.getSession();
    if (sessionData?.session) {
      const userId = sessionData.session.user.id;
      const { data: perfil } = await this.supa.obtenerPerfil(userId);
      this.esAdmin = perfil?.rol === 'admin';
      if (!this.esAdmin) {
        this.pacienteId = userId;
      }
    }

    this.inicializarFormulario();
    await this.cargarEspecialidades();
    if (this.esAdmin) {
      await this.cargarPacientes();
    }
    this.generarDiasDisponibles();
  }

  inicializarFormulario(): void {
    this.formularioTurno = this.fb.group({
      especialidad: this.fb.control<string | null>(null, Validators.required),
      especialista: this.fb.control<string | null>(null, Validators.required),
      paciente: this.fb.control<string | null>(null, this.esAdmin ? Validators.required : null),
      dia: this.fb.control<string | null>(null, Validators.required),
      hora: this.fb.control<string | null>(null, Validators.required)
    });

    // Cuando cambia la especialidad, filtrar especialistas
    const especialidadCtrl = this.formularioTurno.get('especialidad') as FormControl<string | null>;
    const especialistaCtrl = this.formularioTurno.get('especialista') as FormControl<string | null>;
    const diaCtrl = this.formularioTurno.get('dia') as FormControl<string | null>;
    const horaCtrl = this.formularioTurno.get('hora') as FormControl<string | null>;

    especialistaCtrl.disable({ emitEvent: false });
    diaCtrl.disable({ emitEvent: false });
    horaCtrl.disable({ emitEvent: false });

    especialidadCtrl.valueChanges.subscribe(esp => {
      if (esp) {
        this.especialistasFiltrados = this.especialistas.filter(e => e.especialidad === esp);
        especialistaCtrl.reset();
        especialistaCtrl.enable({ emitEvent: false });
      } else {
        this.especialistasFiltrados = [];
        especialistaCtrl.reset();
        especialistaCtrl.disable({ emitEvent: false });
        diaCtrl.reset();
        diaCtrl.disable({ emitEvent: false });
        horaCtrl.reset();
        horaCtrl.disable({ emitEvent: false });
      }
    });

    especialistaCtrl.valueChanges.subscribe(especialista => {
      if (especialista) {
        diaCtrl.enable({ emitEvent: false });
      } else {
        diaCtrl.reset();
        diaCtrl.disable({ emitEvent: false });
        horaCtrl.reset();
        horaCtrl.disable({ emitEvent: false });
      }
    });

    diaCtrl.valueChanges.subscribe(dia => {
      if (dia) {
        horaCtrl.enable({ emitEvent: false });
      } else {
        horaCtrl.reset();
        horaCtrl.disable({ emitEvent: false });
      }
    });
  }

  async cargarEspecialidades(): Promise<void> {
    // Primero obtener especialistas aprobados
    from(
      this.supa.client
        .from('profiles')
        .select('id')
        .eq('rol', 'especialista')
        .eq('aprobado', true)
    ).pipe(
      switchMap(({ data: perfilesAprobados }) => {
        const idsAprobados = (perfilesAprobados || []).map((p: any) => p.id);
        return from(
          this.supa.client
            .from('especialistas')
            .select('id, nombre, apellido, especialidad')
            .in('id', idsAprobados)
            .order('especialidad', { ascending: true })
        );
      }),
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
    ).subscribe({
      next: (data: any[]) => {
        // Obtener especialidades únicas
        const especialidadesSet = new Set<string>();
        const especialistasList: EspecialistaOption[] = [];
        
        data.forEach((e: any) => {
          especialidadesSet.add(e.especialidad);
          especialistasList.push({
            id: e.id,
            nombre: e.nombre || '',
            apellido: e.apellido || '',
            especialidad: e.especialidad
          });
        });

        this.especialidades = Array.from(especialidadesSet).sort();
        this.especialistas = especialistasList;
      },
      error: (e) => {
        console.error('[SolicitarTurno] Error al cargar especialidades', e);
        this.snackBar.open('Error al cargar especialidades', 'Cerrar', { duration: 2500 });
      }
    });
  }

  async cargarPacientes(): Promise<void> {
    from(
      this.supa.client
        .from('profiles')
        .select('id, nombre, apellido')
        .eq('rol', 'paciente')
        .order('apellido', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((p: any) => ({
          id: p.id,
          nombre: p.nombre || '',
          apellido: p.apellido || ''
        })) as PacienteOption[];
      })
    ).subscribe({
      next: (pacientes) => {
        this.pacientes = pacientes;
      },
      error: (e) => {
        console.error('[SolicitarTurno] Error al cargar pacientes', e);
        this.snackBar.open('Error al cargar pacientes', 'Cerrar', { duration: 2500 });
      }
    });
  }

  generarDiasDisponibles(): void {
    const hoy = new Date();
    const dias: string[] = [];
    const maxDias = this.esAdmin ? 30 : 15; // Admin puede ver más días

    for (let i = 1; i <= maxDias; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
      const fechaFormateada = this.formatearFecha(fecha);
      dias.push(`${fechaStr}|${fechaFormateada}`);
    }

    this.diasDisponibles = dias;
  }

  formatearFecha(fecha: Date): string {
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const diaSemana = diasSemana[fecha.getDay()];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();
    
    return `${diaSemana} ${dia} de ${mes} ${año}`;
  }

  async onSubmit(): Promise<void> {
    if (this.formularioTurno.invalid) {
      this.formularioTurno.markAllAsTouched();
      return;
    }

    this.loading = true;
    const fv = this.formularioTurno.value;

    try {
      const pacienteIdFinal = this.esAdmin ? fv.paciente! : this.pacienteId!;
      const especialistaId = fv.especialista!;
      const diaSeleccionado = fv.dia!.split('|')[0]; // YYYY-MM-DD
      const horaSeleccionada = fv.hora!;
      
      // Crear fecha ISO completa (YYYY-MM-DDTHH:mm:ss)
      const fechaISO = `${diaSeleccionado}T${horaSeleccionada}:00`;

      // Verificar que no exista otro turno en el mismo horario
      const { data: turnosExistentes } = await this.supa.client
        .from('turnos')
        .select('id')
        .eq('especialista_id', especialistaId)
        .eq('fecha_iso', fechaISO)
        .in('estado', ['pendiente', 'aceptado']);

      if (turnosExistentes && turnosExistentes.length > 0) {
        throw new Error('Ya existe un turno en ese horario. Por favor, selecciona otro.');
      }

      // Crear el turno
      const { error } = await this.supa.client
        .from('turnos')
        .insert({
          paciente_id: pacienteIdFinal,
          especialista_id: especialistaId,
          especialidad: fv.especialidad!,
          fecha_iso: fechaISO,
          estado: 'pendiente'
        });

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Turno solicitado',
        text: 'El turno ha sido solicitado exitosamente',
        timer: 2000,
        showConfirmButton: false
      });

      // Redirigir según el rol
      if (this.esAdmin) {
        this.router.navigate(['/turnos-admin']);
      } else {
        this.router.navigate(['/mis-turnos-paciente']);
      }
    } catch (err: any) {
      console.error('[SolicitarTurno] Error al crear turno', err);
      Swal.fire('Error', err.message || 'No se pudo solicitar el turno', 'error');
    } finally {
      this.loading = false;
    }
  }
}

