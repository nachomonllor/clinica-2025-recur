import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import Swal from 'sweetalert2';
import { MatIconModule } from '@angular/material/icon';

// ---------------------------------------------------------------------
// Tipos locales para el componente (ya no se importan de otros .ts)
// ---------------------------------------------------------------------
interface EspecialistaOption {
  id: string;
  nombre: string;
  apellido: string;
  // etiqueta visible en el select
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

  // nombre visible de la especialidad
  especialidades: string[] = [];

  especialistas: EspecialistaOption[] = [];
  especialistasFiltrados: EspecialistaOption[] = [];
  pacientes: PacienteOption[] = [];

  diasDisponibles: string[] = [];
  horariosDisponibles: string[] = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  esAdmin = false;
  pacienteId: string | null = null;
  loading = false;
  formularioInicializado = false;

  // Mapa nombreEspecialidad -> idEspecialidad
  private especialidadIdPorNombre = new Map<string, string>();

  constructor(
    private fb: FormBuilder,
    private supa: SupabaseService,
    public router: Router,
    private snackBar: MatSnackBar
  ) {
    // Form básico para que el template no reviente antes de OnInit
    this.inicializarFormularioBasico();
  }

  // =================================================================
  // Ciclo de vida
  // =================================================================
  async ngOnInit(): Promise<void> {
    // 1) Obtener sesión y rol del usuario desde tabla usuarios
    const { data: sessionData } = await this.supa.getSession();

    if (sessionData?.session) {
      const userId = sessionData.session.user.id;

      // Leemos el perfil desde esquema_clinica.usuarios
      const { data: usuario, error } = await this.supa.client
        .from('usuarios')
        .select('id, perfil')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[SolicitarTurno] Error al obtener usuario actual', error);
      } else if (usuario) {
        const perfil = String(usuario.perfil ?? '').toUpperCase();
        this.esAdmin = perfil === 'ADMIN';
        if (!this.esAdmin) {
          // paciente logueado solicita turno para sí mismo
          this.pacienteId = userId;
        }
      }
    }

    // 2) Ajustar validaciones según rol
    this.inicializarFormulario();

    // 3) Cargar combos
    await this.cargarEspecialidades(); // llena especialidades + especialistas
    if (this.esAdmin) {
      await this.cargarPacientes();
    }

    // 4) Generar días habilitados
    this.generarDiasDisponibles();

    this.formularioInicializado = true;
  }

  // =================================================================
  // Inicialización y listeners del formulario
  // =================================================================
  inicializarFormularioBasico(): void {
    this.formularioTurno = this.fb.group({
      especialidad: this.fb.control<string | null>(null, Validators.required),
      especialista: this.fb.control<string | null>(null, Validators.required),
      paciente: this.fb.control<string | null>(null),
      dia: this.fb.control<string | null>(null, Validators.required),
      hora: this.fb.control<string | null>(null, Validators.required)
    });

    this.configurarListeners();
  }

  configurarListeners(): void {
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

    // Cuando cambia la especialidad, filtramos especialistas
    especialidadCtrl.valueChanges.subscribe(esp => {
      if (esp) {
        this.especialistasFiltrados = this.especialistas.filter(e => e.especialidad === esp);

        if (this.especialistasFiltrados.length === 0) {
          this.snackBar.open(`No hay especialistas disponibles para ${esp}`, 'Cerrar', { duration: 3000 });
        }

        especialistaCtrl.reset();
        especialistaCtrl.enable({ emitEvent: false });
        diaCtrl.reset();
        diaCtrl.disable({ emitEvent: false });
        horaCtrl.reset();
        horaCtrl.disable({ emitEvent: false });
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

    // Al elegir especialista se habilita día
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

    // Al elegir día se habilita hora
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
    const pacienteControl = this.formularioTurno.get('paciente');
    if (pacienteControl) {
      if (this.esAdmin) {
        pacienteControl.setValidators(Validators.required);
      } else {
        pacienteControl.clearValidators();
      }
      pacienteControl.updateValueAndValidity();
    }

    const especialistaCtrl = this.formularioTurno.get('especialista') as FormControl<string | null>;
    const diaCtrl = this.formularioTurno.get('dia') as FormControl<string | null>;
    const horaCtrl = this.formularioTurno.get('hora') as FormControl<string | null>;

    if (especialistaCtrl && diaCtrl && horaCtrl) {
      especialistaCtrl.disable({ emitEvent: false });
      diaCtrl.disable({ emitEvent: false });
      horaCtrl.disable({ emitEvent: false });
    }
  }

  // =================================================================
  // Carga de datos (adaptado al esquema_clinica)
  // =================================================================
  async cargarEspecialidades(): Promise<void> {
    try {
      // 1) Especialidades canónicas
      const { data: espData, error: espErr } = await this.supa.client
        .from('especialidades')
        .select('id, nombre')
        .order('nombre', { ascending: true });

      if (espErr) throw espErr;

      const especialidades = (espData ?? []) as Array<{ id: string; nombre: string }>;

      this.especialidadIdPorNombre.clear();
      this.especialidades = especialidades.map(e => {
        const nombre = String(e.nombre ?? '');
        this.especialidadIdPorNombre.set(nombre, e.id);
        return nombre;
      });

      // 2) Usuarios especialistas aprobados
      const { data: usuariosData, error: usuariosErr } = await this.supa.client
        .from('usuarios')
        .select('id, nombre, apellido, perfil, esta_aprobado, activo')
        .eq('perfil', 'ESPECIALISTA')
        .eq('esta_aprobado', true)
        .eq('activo', true);

      if (usuariosErr) throw usuariosErr;
      const usuarios = (usuariosData ?? []) as any[];

      // 3) Relación usuario_especialidad
      const { data: relsData, error: relsErr } = await this.supa.client
        .from('usuario_especialidad')
        .select('usuario_id, especialidad_id');

      if (relsErr) throw relsErr;
      const rels = (relsData ?? []) as Array<{ usuario_id: string; especialidad_id: string }>;

      const usuariosMap = new Map<string, any>();
      usuarios.forEach(u => usuariosMap.set(u.id, u));

      const espNombrePorId = new Map<string, string>();
      especialidades.forEach(e => espNombrePorId.set(e.id, String(e.nombre ?? '')));

      const options: EspecialistaOption[] = [];
      for (const rel of rels) {
        const usr = usuariosMap.get(rel.usuario_id);
        const espNombre = espNombrePorId.get(rel.especialidad_id);
        if (!usr || !espNombre) continue;

        options.push({
          id: usr.id,
          nombre: usr.nombre ?? '',
          apellido: usr.apellido ?? '',
          especialidad: espNombre
        });
      }

      this.especialistas = options;
      this.especialistasFiltrados = [];
    } catch (e: any) {
      console.error('[SolicitarTurno] Error al cargar especialidades/especialistas', e);
      this.especialidades = [];
      this.especialistas = [];
      this.especialistasFiltrados = [];
      this.snackBar.open(
        'Error al cargar especialidades o especialistas',
        'Cerrar',
        { duration: 4000 }
      );
    }
  }

  async cargarPacientes(): Promise<void> {
    try {
      const { data, error } = await this.supa.client
        .from('usuarios')
        .select('id, nombre, apellido, perfil, activo')
        .eq('perfil', 'PACIENTE')
        .eq('activo', true)
        .order('apellido', { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as any[];
      this.pacientes = rows.map(
        (p): PacienteOption => ({
          id: p.id,
          nombre: p.nombre ?? '',
          apellido: p.apellido ?? ''
        })
      );
    } catch (e: any) {
      console.error('[SolicitarTurno] Error al cargar pacientes', e);
      this.snackBar.open('Error al cargar pacientes', 'Cerrar', { duration: 2500 });
      this.pacientes = [];
    }
  }

  // =================================================================
  // Fechas / horarios
  // =================================================================
  generarDiasDisponibles(): void {
    const hoy = new Date();
    const dias: string[] = [];
    const maxDias = this.esAdmin ? 30 : 15; // Admin ve más días

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
    const diasSemana = [
      'Domingo', 'Lunes', 'Martes', 'Miércoles',
      'Jueves', 'Viernes', 'Sábado'
    ];
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const diaSemana = diasSemana[fecha.getDay()];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();

    return `${diaSemana} ${dia} de ${mes} ${año}`;
  }

  // =================================================================
  // Submit (creación de turno en esquema normalizado)
  // =================================================================
  async onSubmit(): Promise<void> {
    if (this.formularioTurno.invalid) {
      this.formularioTurno.markAllAsTouched();
      return;
    }

    this.loading = true;
    const fv = this.formularioTurno.value;

    try {
      if (!fv.especialidad || !fv.especialista || !fv.dia || !fv.hora) {
        throw new Error('Faltan datos obligatorios del turno.');
      }

      const pacienteIdFinal = this.esAdmin ? fv.paciente! : this.pacienteId!;
      if (!pacienteIdFinal) {
        throw new Error('No se pudo determinar el paciente.');
      }

      const especialistaId = fv.especialista!;
      const diaSeleccionado = fv.dia.split('|')[0];  // YYYY-MM-DD
      const horaSeleccionada = fv.hora;              // HH:mm

      // Fecha/hora inicio y fin (ej. 30 minutos)
      const fechaInicio = new Date(`${diaSeleccionado}T${horaSeleccionada}:00`);
      const fechaFin = new Date(fechaInicio.getTime() + 30 * 60 * 1000);

      const fechaInicioIso = fechaInicio.toISOString();
      const fechaFinIso = fechaFin.toISOString();

      // 1) Verificar choque de horario con estados PENDIENTE/ACEPTADO
      const { data: turnosExistentes, error: turnosErr } = await this.supa.client
        .from('turnos')
        .select(`
          id,
          fecha_hora_inicio,
          estado:estados_turno!fk_turno_estado ( codigo )
        `)
        .eq('especialista_id', especialistaId)
        .eq('fecha_hora_inicio', fechaInicioIso);

      if (turnosErr) throw turnosErr;

      const hayChoque = (turnosExistentes ?? []).some((t: any) => {
        const codigo = String(t.estado?.codigo ?? '').toUpperCase();
        return codigo === 'PENDIENTE' || codigo === 'ACEPTADO';
      });

      if (hayChoque) {
        throw new Error('Ya existe un turno en ese horario. Por favor, seleccioná otro.');
      }

      // 2) Obtener id de la especialidad elegida
      const nombreEsp = fv.especialidad;
      const especialidadId = this.especialidadIdPorNombre.get(nombreEsp);
      if (!especialidadId) {
        throw new Error('No se encontró la especialidad seleccionada.');
      }

      // 3) Obtener id de estado PENDIENTE
      const { data: estadoPend, error: estadoErr } = await this.supa.client
        .from('estados_turno')
        .select('id, codigo')
        .eq('codigo', 'PENDIENTE')
        .single();

      if (estadoErr || !estadoPend) {
        throw estadoErr || new Error('No se encontró el estado PENDIENTE.');
      }

      // 4) Insertar turno
      const { error: insertErr } = await this.supa.client
        .from('turnos')
        .insert({
          paciente_id: pacienteIdFinal,
          especialista_id: especialistaId,
          especialidad_id: especialidadId,
          estado_turno_id: estadoPend.id,
          fecha_hora_inicio: fechaInicioIso,
          fecha_hora_fin: fechaFinIso,
          motivo: null
        });

      if (insertErr) throw insertErr;

      Swal.fire({
        icon: 'success',
        title: 'Turno solicitado',
        text: 'El turno ha sido solicitado exitosamente',
        timer: 2000,
        showConfirmButton: false
      });

      // Redirigir según rol
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

  // =================================================================
  // Helpers de UI
  // =================================================================
  progreso(): number {
    if (!this.formularioTurno) return 0;
    let p = 0;
    if (this.formularioTurno.get('especialidad')?.valid) p += 25;
    if (this.formularioTurno.get('especialista')?.valid) p += 25;
    if (this.formularioTurno.get('dia')?.valid) p += 25;
    if (this.formularioTurno.get('hora')?.valid) p += 25;
    return p;
  }

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

  selectDia(d: string): void {
    const ctrl = this.formularioTurno.get('dia');
    if (!ctrl?.enabled) ctrl?.enable({ emitEvent: false });
    ctrl?.setValue(d);
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




// import { CommonModule } from '@angular/common';
// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
// import { MatCardModule } from '@angular/material/card';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatSelectModule } from '@angular/material/select';
// import { MatButtonModule } from '@angular/material/button';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { Router, RouterModule } from '@angular/router';
// import { from, map, firstValueFrom } from 'rxjs';
// import { SupabaseService } from '../../../services/supabase.service';
// import Swal from 'sweetalert2';
// import { MatIconModule } from "@angular/material/icon";

// @Component({
//   selector: 'app-solicitar-turno',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterModule,
//     MatCardModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatSelectModule,
//     MatButtonModule,
//     MatSnackBarModule,
//     MatIconModule
//   ],
//   templateUrl: './solicitar-turno.component.html',
//   styleUrls: ['./solicitar-turno.component.scss']
// })
// export class SolicitarTurnoComponent implements OnInit {
//   formularioTurno!: FormGroup<{
//     especialidad: FormControl<string | null>;
//     especialista: FormControl<string | null>;
//     paciente: FormControl<string | null>; // Solo para admin
//     dia: FormControl<string | null>;
//     hora: FormControl<string | null>;
//   }>;

//   especialidades: string[] = [];
//   especialistas: EspecialistaOption[] = [];
//   especialistasFiltrados: EspecialistaOption[] = [];
//   pacientes: PacienteOption[] = [];
//   diasDisponibles: string[] = [];
//   horariosDisponibles: string[] = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

//   esAdmin = false;
//   pacienteId: string | null = null;
//   loading = false;
//   formularioInicializado = false;

//   constructor(
//     private fb: FormBuilder,
//     private supa: SupabaseService,
//     public router: Router,
//     private snackBar: MatSnackBar
//   ) {
//     // Inicializar formulario básico inmediatamente
//     this.inicializarFormularioBasico();
//   }

//   async ngOnInit(): Promise<void> {
//     // Verificar si es admin
//     const { data: sessionData } = await this.supa.getSession();
//     if (sessionData?.session) {
//       const userId = sessionData.session.user.id;
//       const { data: perfil } = await this.supa.obtenerPerfil(userId);
//       this.esAdmin = perfil?.rol === 'admin';
//       if (!this.esAdmin) {
//         this.pacienteId = userId;
//       }
//     }

//     // Reinicializar formulario con validaciones correctas según el rol
//     this.inicializarFormulario();
//     await this.cargarEspecialidades();
//     if (this.esAdmin) {
//       await this.cargarPacientes();
//     }
//     this.generarDiasDisponibles();
//     this.formularioInicializado = true;
//   }



//   inicializarFormularioBasico(): void {
//     // Formulario básico para evitar errores de renderizado
//     this.formularioTurno = this.fb.group({
//       especialidad: this.fb.control<string | null>(null, Validators.required),
//       especialista: this.fb.control<string | null>(null, Validators.required),
//       paciente: this.fb.control<string | null>(null),
//       dia: this.fb.control<string | null>(null, Validators.required),
//       hora: this.fb.control<string | null>(null, Validators.required)
//     });

//     // Configurar listeners básicos para evitar errores
//     this.configurarListeners();
//   }

//   configurarListeners(): void {
//     // Cuando cambia la especialidad, filtrar especialistas
//     const especialidadCtrl = this.formularioTurno.get('especialidad') as FormControl<string | null>;
//     const especialistaCtrl = this.formularioTurno.get('especialista') as FormControl<string | null>;
//     const diaCtrl = this.formularioTurno.get('dia') as FormControl<string | null>;
//     const horaCtrl = this.formularioTurno.get('hora') as FormControl<string | null>;

//     if (!especialidadCtrl || !especialistaCtrl || !diaCtrl || !horaCtrl) {
//       return;
//     }

//     especialistaCtrl.disable({ emitEvent: false });
//     diaCtrl.disable({ emitEvent: false });
//     horaCtrl.disable({ emitEvent: false });

//     especialidadCtrl.valueChanges.subscribe(esp => {
//       if (esp) {
//         // Filtrar especialistas por la especialidad seleccionada
//         this.especialistasFiltrados = this.especialistas.filter(e => e.especialidad === esp);
//         console.log(`[SolicitarTurno] Especialidad seleccionada: ${esp}, Especialistas encontrados: ${this.especialistasFiltrados.length}`);

//         if (this.especialistasFiltrados.length === 0) {
//           console.warn(`[SolicitarTurno] No hay especialistas disponibles para la especialidad: ${esp}`);
//           this.snackBar.open(`No hay especialistas disponibles para ${esp}`, 'Cerrar', { duration: 3000 });
//         }

//         especialistaCtrl.reset();
//         especialistaCtrl.enable({ emitEvent: false });
//       } else {
//         this.especialistasFiltrados = [];
//         especialistaCtrl.reset();
//         especialistaCtrl.disable({ emitEvent: false });
//         diaCtrl.reset();
//         diaCtrl.disable({ emitEvent: false });
//         horaCtrl.reset();
//         horaCtrl.disable({ emitEvent: false });
//       }
//     });

//     especialistaCtrl.valueChanges.subscribe(especialista => {
//       if (especialista) {
//         diaCtrl.enable({ emitEvent: false });
//       } else {
//         diaCtrl.reset();
//         diaCtrl.disable({ emitEvent: false });
//         horaCtrl.reset();
//         horaCtrl.disable({ emitEvent: false });
//       }
//     });

//     diaCtrl.valueChanges.subscribe(dia => {
//       if (dia) {
//         horaCtrl.enable({ emitEvent: false });
//       } else {
//         horaCtrl.reset();
//         horaCtrl.disable({ emitEvent: false });
//       }
//     });
//   }

//   inicializarFormulario(): void {
//     // Actualizar validaciones según el rol
//     const pacienteControl = this.formularioTurno.get('paciente');
//     if (pacienteControl) {
//       if (this.esAdmin) {
//         pacienteControl.setValidators(Validators.required);
//       } else {
//         pacienteControl.clearValidators();
//       }
//       pacienteControl.updateValueAndValidity();
//     }

//     // Asegurar que los controles estén en el estado correcto inicial
//     const especialistaCtrl = this.formularioTurno.get('especialista') as FormControl<string | null>;
//     const diaCtrl = this.formularioTurno.get('dia') as FormControl<string | null>;
//     const horaCtrl = this.formularioTurno.get('hora') as FormControl<string | null>;

//     if (especialistaCtrl && diaCtrl && horaCtrl) {
//       especialistaCtrl.disable({ emitEvent: false });
//       diaCtrl.disable({ emitEvent: false });
//       horaCtrl.disable({ emitEvent: false });
//     }
//   }

//   async cargarEspecialidades(): Promise<void> {
//     try {
//       // 1) Catálogo canónico de especialidades
//       const { data: cat, error: catErr } = await this.supa.client
//         .from('especialidades_catalogo')
//         .select('id, nombre')
//         .order('nombre', { ascending: true });

//       if (catErr) throw catErr;

//       // Si el catálogo está vacío, fallback: tomar "distinct" de turnos.especialidad
//       if (!cat || cat.length === 0) {
//         const { data: t } = await this.supa.client
//           .from('turnos')
//           .select('especialidad')
//           .not('especialidad', 'is', null);

//         const unicas = Array.from(new Set((t ?? []).map(x => String(x.especialidad)))).sort();
//         this.especialidades = unicas;
//       } else {
//         this.especialidades = cat.map(x => String(x.nombre));
//       }

//       // 2) Traer especialistas (sin depender de que id==perfil_id)
//       // Ajustá esta parte según tu esquema real:
//       // - Si "especialistas" tiene columna perfil_id => usá .in('perfil_id', idsAprobados)
//       // - Si "especialistas" comparte el mismo id que "perfiles" => usá .in('id', idsAprobados)
//       // Para destrabar ya, traemos todos y después si querés re-filtrás por "aprobado".
//       const { data: especs, error: especErr } = await this.supa.client
//         .from('especialistas')
//         .select('id, perfil_id, nombre, apellido, especialidad, especialidad_id');

//       if (especErr) throw especErr;

//       // Mapear especialistas asegurando que e.especialidad sea un string “visible”
//       const nombrePorId = new Map<string, string>();
//       (cat ?? []).forEach(x => nombrePorId.set(x.id, x.nombre));

//       this.especialistas = (especs ?? []).map(e => ({
//         id: e.id,
//         nombre: e.nombre || '',
//         apellido: e.apellido || '',
//         // Si existe especialidad en texto úsala; si no, resolvés por especialidad_id contra el catálogo
//         especialidad: e.especialidad
//           ?? (e.especialidad_id ? (nombrePorId.get(e.especialidad_id) ?? '') : '')
//       }));

//       // Limpio el filtrado dependiente de la selección
//       this.especialistasFiltrados = [];
//     } catch (e: any) {
//       console.error('[SolicitarTurno] Error al cargar especialidades', e);
//       this.especialidades = [];
//       this.especialistas = [];
//       this.especialistasFiltrados = [];
//       this.snackBar.open(
//         `Error al cargar especialidades: ${e.message ?? 'Error desconocido'}`,
//         'Cerrar',
//         { duration: 4000 }
//       );
//     }
//   }

//   async cargarPacientes(): Promise<void> {
//     try {
//       const pacientes = await firstValueFrom(
//         from(
//           this.supa.client
//             .from('perfiles')
//             .select('id, nombre, apellido')
//             .eq('rol', 'paciente')
//             .order('apellido', { ascending: true })
//         ).pipe(
//           map(({ data, error }) => {
//             if (error) throw error;
//             return (data || []).map((p: any) => ({
//               id: p.id,
//               nombre: p.nombre || '',
//               apellido: p.apellido || ''
//             })) as PacienteOption[];
//           })
//         )
//       );

//       this.pacientes = pacientes;
//     } catch (e) {
//       console.error('[SolicitarTurno] Error al cargar pacientes', e);
//       this.snackBar.open('Error al cargar pacientes', 'Cerrar', { duration: 2500 });
//     }
//   }

//   generarDiasDisponibles(): void {
//     const hoy = new Date();
//     const dias: string[] = [];
//     const maxDias = this.esAdmin ? 30 : 15; // Admin puede ver más días

//     for (let i = 1; i <= maxDias; i++) {
//       const fecha = new Date(hoy);
//       fecha.setDate(hoy.getDate() + i);
//       const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
//       const fechaFormateada = this.formatearFecha(fecha);
//       dias.push(`${fechaStr}|${fechaFormateada}`);
//     }

//     this.diasDisponibles = dias;
//   }

//   formatearFecha(fecha: Date): string {
//     const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
//     const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
//       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

//     const diaSemana = diasSemana[fecha.getDay()];
//     const dia = fecha.getDate();
//     const mes = meses[fecha.getMonth()];
//     const año = fecha.getFullYear();

//     return `${diaSemana} ${dia} de ${mes} ${año}`;
//   }

//   async onSubmit(): Promise<void> {
//     if (this.formularioTurno.invalid) {
//       this.formularioTurno.markAllAsTouched();
//       return;
//     }

//     this.loading = true;
//     const fv = this.formularioTurno.value;

//     try {
//       const pacienteIdFinal = this.esAdmin ? fv.paciente! : this.pacienteId!;
//       const especialistaId = fv.especialista!;
//       const diaSeleccionado = fv.dia!.split('|')[0]; // YYYY-MM-DD
//       const horaSeleccionada = fv.hora!;

//       // Crear fecha ISO completa (YYYY-MM-DDTHH:mm:ss)
//       const fechaISO = `${diaSeleccionado}T${horaSeleccionada}:00`;

//       // Verificar que no exista otro turno en el mismo horario
//       const { data: turnosExistentes } = await this.supa.client
//         .from('turnos')
//         .select('id')
//         .eq('especialista_id', especialistaId)
//         .eq('fecha_iso', fechaISO)
//         .in('estado', ['pendiente', 'aceptado']);

//       if (turnosExistentes && turnosExistentes.length > 0) {
//         throw new Error('Ya existe un turno en ese horario. Por favor, selecciona otro.');
//       }

//       // Crear el turno
//       const { error } = await this.supa.client
//         .from('turnos')
//         .insert({
//           paciente_id: pacienteIdFinal,
//           especialista_id: especialistaId,
//           especialidad: fv.especialidad!,
//           fecha_iso: fechaISO,
//           estado: 'pendiente'
//         });

//       if (error) throw error;

//       Swal.fire({
//         icon: 'success',
//         title: 'Turno solicitado',
//         text: 'El turno ha sido solicitado exitosamente',
//         timer: 2000,
//         showConfirmButton: false
//       });

//       // Redirigir según el rol
//       if (this.esAdmin) {
//         this.router.navigate(['/turnos-admin']);
//       } else {
//         this.router.navigate(['/mis-turnos-paciente']);
//       }
//     } catch (err: any) {
//       console.error('[SolicitarTurno] Error al crear turno', err);
//       Swal.fire('Error', err.message || 'No se pudo solicitar el turno', 'error');
//     } finally {
//       this.loading = false;
//     }
//   }


//   // Porcentaje de progreso (4 pasos, 25% cada uno)
//   progreso(): number {
//     if (!this.formularioTurno) return 0;
//     let p = 0;
//     if (this.formularioTurno.get('especialidad')?.valid) p += 25;
//     if (this.formularioTurno.get('especialista')?.valid) p += 25;
//     if (this.formularioTurno.get('dia')?.valid) p += 25;
//     if (this.formularioTurno.get('hora')?.valid) p += 25;
//     return p;
//   }

//   // // Mapea ID ==== > "Apellido, Nombre"
//   // especialistaLabel(id: string | null | undefined): string | null {
//   //   if (!id) return null;
//   //   const e = this.especialistas.find(x => x.id === id) || this.especialistasFiltrados.find(x => x.id === id);
//   //   return e ? `${e.apellido}, ${e.nombre}` : null;
//   // }

//   especialistaLabel(id: string | null | undefined): string | null {
//     if (!id) return null;
//     const e =
//       this.especialistasFiltrados?.find(x => x.id === id) ??
//       this.especialistas?.find(x => x.id === id);
//     return e ? `${e.apellido}, ${e.nombre}` : null;
//   }

//   // De "YYYY-MM-DD|Lunes 1 de Enero 2025" -> "Lunes 1 de Enero 2025"
//   fechaLabel(diaValue: string | null | undefined): string | null {
//     if (!diaValue) return null;
//     const parts = diaValue.split('|');
//     return parts.length > 1 ? parts[1] : diaValue;
//   }


//   // Helpers visuales para grillas
//   selectDia(d: string): void {
//     const ctrl = this.formularioTurno.get('dia');
//     if (!ctrl?.enabled) ctrl?.enable({ emitEvent: false });
//     ctrl?.setValue(d); // dispara valueChanges y habilita hora
//     this.formularioTurno.get('hora')?.markAsUntouched();
//   }

//   isDiaSelected(d: string): boolean {
//     return this.formularioTurno.get('dia')?.value === d;
//   }

//   selectHora(h: string): void {
//     const ctrl = this.formularioTurno.get('hora');
//     if (!ctrl?.enabled) ctrl?.enable({ emitEvent: false });
//     ctrl?.setValue(h);
//   }

//   isHoraSelected(h: string): boolean {
//     return this.formularioTurno.get('hora')?.value === h;
//   }


// }

