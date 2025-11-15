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
import { from, map, switchMap, firstValueFrom } from 'rxjs';
import { SupabaseService } from '../../../services/supabase.service';
import Swal from 'sweetalert2';
import { MatIconModule } from "@angular/material/icon";

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
    MatSnackBarModule,
    MatIconModule
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
  formularioInicializado = false;

  constructor(
    private fb: FormBuilder,
    private supa: SupabaseService,
    public router: Router,
    private snackBar: MatSnackBar
  ) {
    // Inicializar formulario básico inmediatamente
    this.inicializarFormularioBasico();
  }

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

    // Reinicializar formulario con validaciones correctas según el rol
    this.inicializarFormulario();
    await this.cargarEspecialidades();
    if (this.esAdmin) {
      await this.cargarPacientes();
    }
    this.generarDiasDisponibles();
    this.formularioInicializado = true;
  }

  inicializarFormularioBasico(): void {
    // Formulario básico para evitar errores de renderizado
    this.formularioTurno = this.fb.group({
      especialidad: this.fb.control<string | null>(null, Validators.required),
      especialista: this.fb.control<string | null>(null, Validators.required),
      paciente: this.fb.control<string | null>(null),
      dia: this.fb.control<string | null>(null, Validators.required),
      hora: this.fb.control<string | null>(null, Validators.required)
    });

    // Configurar listeners básicos para evitar errores
    this.configurarListeners();
  }

  configurarListeners(): void {
    // Cuando cambia la especialidad, filtrar especialistas
    const especialidadCtrl = this.formularioTurno.get('especialidad') as FormControl<string | null>;
    const especialistaCtrl = this.formularioTurno.get('especialista') as FormControl<string | null>;
    const diaCtrl = this.formularioTurno.get('dia') as FormControl<string | null>;
    const horaCtrl = this.formularioTurno.get('hora') as FormControl<string | null>;

    if (!especialidadCtrl || !especialistaCtrl || !diaCtrl || !horaCtrl) {
      return;
    }

    especialistaCtrl.disable({ emitEvent: false });
    diaCtrl.disable({ emitEvent: false });
    horaCtrl.disable({ emitEvent: false });

    especialidadCtrl.valueChanges.subscribe(esp => {
      if (esp) {
        // Filtrar especialistas por la especialidad seleccionada
        this.especialistasFiltrados = this.especialistas.filter(e => e.especialidad === esp);
        console.log(`[SolicitarTurno] Especialidad seleccionada: ${esp}, Especialistas encontrados: ${this.especialistasFiltrados.length}`);

        if (this.especialistasFiltrados.length === 0) {
          console.warn(`[SolicitarTurno] No hay especialistas disponibles para la especialidad: ${esp}`);
          this.snackBar.open(`No hay especialistas disponibles para ${esp}`, 'Cerrar', { duration: 3000 });
        }

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

  inicializarFormulario(): void {
    // Actualizar validaciones según el rol
    const pacienteControl = this.formularioTurno.get('paciente');
    if (pacienteControl) {
      if (this.esAdmin) {
        pacienteControl.setValidators(Validators.required);
      } else {
        pacienteControl.clearValidators();
      }
      pacienteControl.updateValueAndValidity();
    }

    // Asegurar que los controles estén en el estado correcto inicial
    const especialistaCtrl = this.formularioTurno.get('especialista') as FormControl<string | null>;
    const diaCtrl = this.formularioTurno.get('dia') as FormControl<string | null>;
    const horaCtrl = this.formularioTurno.get('hora') as FormControl<string | null>;

    if (especialistaCtrl && diaCtrl && horaCtrl) {
      especialistaCtrl.disable({ emitEvent: false });
      diaCtrl.disable({ emitEvent: false });
      horaCtrl.disable({ emitEvent: false });
    }
  }

  async cargarEspecialidades(): Promise<void> {
    try {
      // Obtener IDs de especialistas aprobados
      const { data: perfilesData, error: perfilesError } = await this.supa.client
        .from('profiles')
        .select('id')
        .eq('rol', 'especialista')
        .eq('aprobado', true);

      if (perfilesError) {
        throw perfilesError;
      }

      const idsAprobados = (perfilesData || []).map((p: any) => p.id);
      console.log('[SolicitarTurno] IDs de especialistas aprobados:', idsAprobados);
      console.log('[SolicitarTurno] Cantidad de IDs:', idsAprobados.length);

      if (idsAprobados.length === 0) {
        console.warn('[SolicitarTurno] No hay especialistas aprobados en profiles');
        this.especialidades = [];
        this.especialistas = [];
        this.especialistasFiltrados = [];
        this.snackBar.open('No hay especialistas disponibles. Un administrador debe aprobar las cuentas primero.', 'Cerrar', { duration: 4000 });
        return;
      }

      // Obtener datos de especialistas
      console.log('[SolicitarTurno] Consultando especialistas con IDs:', idsAprobados);
      const { data: especialistasData, error: especialistasError } = await this.supa.client
        .from('especialistas')
        .select('id, nombre, apellido, especialidad')
        .in('id', idsAprobados);

      console.log('[SolicitarTurno] Respuesta de especialistas:', { data: especialistasData, error: especialistasError });

      if (especialistasError) {
        console.error('[SolicitarTurno] Error al consultar especialistas:', especialistasError);
        throw especialistasError;
      }

      console.log('[SolicitarTurno] Especialistas encontrados en BD:', especialistasData?.length || 0);
      console.log('[SolicitarTurno] Datos completos:', especialistasData);

      if (!especialistasData || especialistasData.length === 0) {
        console.warn('[SolicitarTurno] No se encontraron especialistas en la tabla especialistas');
        this.especialidades = [];
        this.especialistas = [];
        this.especialistasFiltrados = [];
        this.snackBar.open('No hay especialistas disponibles', 'Cerrar', { duration: 3000 });
        return;
      }

      // Obtener especialidades únicas
      const especialidadesSet = new Set<string>();
      const especialistasList: EspecialistaOption[] = [];
      const especialistasSinEspecialidad: any[] = [];

      especialistasData.forEach((e: any) => {
        if (e.especialidad && e.especialidad.trim() !== '') {
          especialidadesSet.add(e.especialidad);
          especialistasList.push({
            id: e.id,
            nombre: e.nombre || '',
            apellido: e.apellido || '',
            especialidad: e.especialidad
          });
        } else {
          especialistasSinEspecialidad.push(e);
          console.warn(`[SolicitarTurno] Especialista ${e.nombre} ${e.apellido} (${e.id}) no tiene especialidad asignada`);
        }
      });

      if (especialistasSinEspecialidad.length > 0) {
        console.warn(`[SolicitarTurno] ${especialistasSinEspecialidad.length} especialistas sin especialidad asignada`);
      }

      this.especialidades = Array.from(especialidadesSet).sort();
      this.especialistas = especialistasList;
      this.especialistasFiltrados = []; // Inicializar vacío hasta que se seleccione una especialidad

      console.log('[SolicitarTurno] Especialidades únicas cargadas:', this.especialidades);
      console.log('[SolicitarTurno] Total especialistas con especialidad:', this.especialistas.length);

      if (this.especialidades.length === 0) {
        this.snackBar.open('Los especialistas aprobados no tienen especialidad asignada', 'Cerrar', { duration: 4000 });
      }
    } catch (e: any) {
      console.error('[SolicitarTurno] Error al cargar especialidades', e);
      this.especialidades = [];
      this.especialistas = [];
      this.especialistasFiltrados = [];
      this.snackBar.open(
        `Error al cargar especialidades: ${e.message || 'Error desconocido'}`,
        'Cerrar',
        { duration: 4000 }
      );
    }
  }

  async cargarPacientes(): Promise<void> {
    try {
      const pacientes = await firstValueFrom(
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
        )
      );

      this.pacientes = pacientes;
    } catch (e) {
      console.error('[SolicitarTurno] Error al cargar pacientes', e);
      this.snackBar.open('Error al cargar pacientes', 'Cerrar', { duration: 2500 });
    }
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


  // Porcentaje de progreso (4 pasos, 25% cada uno)
  progreso(): number {
    if (!this.formularioTurno) return 0;
    let p = 0;
    if (this.formularioTurno.get('especialidad')?.valid) p += 25;
    if (this.formularioTurno.get('especialista')?.valid) p += 25;
    if (this.formularioTurno.get('dia')?.valid) p += 25;
    if (this.formularioTurno.get('hora')?.valid) p += 25;
    return p;
  }

  // // Mapea ID ==== > "Apellido, Nombre"
  // especialistaLabel(id: string | null | undefined): string | null {
  //   if (!id) return null;
  //   const e = this.especialistas.find(x => x.id === id) || this.especialistasFiltrados.find(x => x.id === id);
  //   return e ? `${e.apellido}, ${e.nombre}` : null;
  // }

  especialistaLabel(id: string | null | undefined): string | null {
    if (!id) return null;
    const e =
      this.especialistasFiltrados?.find(x => x.id === id) ??
      this.especialistas?.find(x => x.id === id);
    return e ? `${e.apellido}, ${e.nombre}` : null;
  }

  // De "YYYY-MM-DD|Lunes 1 de Enero 2025" -> "Lunes 1 de Enero 2025"
  fechaLabel(diaValue: string | null | undefined): string | null {
    if (!diaValue) return null;
    const parts = diaValue.split('|');
    return parts.length > 1 ? parts[1] : diaValue;
  }


  // Helpers visuales para grillas
  selectDia(d: string): void {
    const ctrl = this.formularioTurno.get('dia');
    if (!ctrl?.enabled) ctrl?.enable({ emitEvent: false });
    ctrl?.setValue(d); // dispara valueChanges y habilita hora
    this.formularioTurno.get('hora')?.markAsUntouched();
  }

  isDiaSelected(d: string): boolean {
    return this.formularioTurno.get('dia')?.value === d;
  }

  selectHora(h: string): void {
    const ctrl = this.formularioTurno.get('hora');
    if (!ctrl?.enabled) ctrl?.enable({ emitEvent: false });
    ctrl?.setValue(h);
  }

  isHoraSelected(h: string): boolean {
    return this.formularioTurno.get('hora')?.value === h;
  }




}

