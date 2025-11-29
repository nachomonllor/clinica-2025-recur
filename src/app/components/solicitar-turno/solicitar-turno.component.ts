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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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

interface HorarioEspecialistaRow {
  id: string;
  especialista_id: string;
  especialidad_id: string | null;
  dia_semana: number; // 0=domingo ... 6=sábado
  hora_desde: string; // 'HH:MM:SS'
  hora_hasta: string; // 'HH:MM:SS'
  duracion_turno_minutos: number;
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
    MatIconModule,

    TranslateModule
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
  // horariosDisponibles: string[] = [
  //   '08:00', '09:00', '10:00', '11:00', '12:00',
  //   '14:00', '15:00', '16:00', '17:00', '18:00'
  // ];

  horariosDisponibles: string[] = []; // <============ SACO LOS HARDCODIADOS Y TOMO LOS DE LA TABLA esquema_clinica.horarios_especialista


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
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    // Form básico para que el template no reviente antes de OnInit
    this.inicializarFormularioBasico();
  }

  /// ========> PARA QUE SOLO PINTE LOS HORARIOS QUE TIENE DISPONIBLE EL ESPECIALISTA


  private async actualizarHorariosDisponiblesParaSeleccion(): Promise<void> {
    const especialidadCtrl = this.formularioTurno.get('especialidad') as FormControl<string | null>;
    const especialistaCtrl = this.formularioTurno.get('especialista') as FormControl<string | null>;
    const diaCtrl = this.formularioTurno.get('dia') as FormControl<string | null>;
    const horaCtrl = this.formularioTurno.get('hora') as FormControl<string | null>;

    const especialistaId = especialistaCtrl?.value;
    const nombreEspecialidad = especialidadCtrl?.value;
    const diaValue = diaCtrl?.value; // "YYYY-MM-DD|texto lindo"

    if (!especialistaId || !nombreEspecialidad || !diaValue) {
      this.horariosDisponibles = [];
      horaCtrl?.reset();
      horaCtrl?.disable({ emitEvent: false });
      return;
    }

    const especialidadId = this.especialidadIdPorNombre.get(nombreEspecialidad) ?? null;

    // ------- IMPORTANTE: calcular día de semana en horario local -------
    const diaSeleccionado = diaValue.split('|')[0]; // "YYYY-MM-DD"
    const [yearStr, monthStr, dayStr] = diaSeleccionado.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr); // 1..12
    const day = Number(dayStr);

    // new Date(año, mesIndex, día) usa fecha LOCAL (no UTC)
    const fechaLocal = new Date(year, month - 1, day);
    const diaSemana = fechaLocal.getDay(); // 0=domingo ... 6=sábado

    try {
      // 1) Traer horarios del especialista para ese día de semana
      const { data: horariosData, error: horariosErr } = await this.supa.client
        .from('horarios_especialista')
        .select('id, especialista_id, especialidad_id, dia_semana, hora_desde, hora_hasta, duracion_turno_minutos')
        .eq('especialista_id', especialistaId)
        .eq('dia_semana', diaSemana);

      if (horariosErr) throw horariosErr;

      const horarios = (horariosData ?? []) as HorarioEspecialistaRow[];

      // Filtrar por especialidad si corresponde
      const horariosFiltrados = horarios.filter(h => {
        if (!especialidadId) return true; // si no hay especialidad, usamos todos
        // si especialidad_id es null => aplica a todas
        return !h.especialidad_id || h.especialidad_id === especialidadId;
      });

      if (!horariosFiltrados.length) {
        this.horariosDisponibles = [];
        horaCtrl?.reset();
        horaCtrl?.disable({ emitEvent: false });
        return;
      }

      // 2) Generar slots posibles
      let slots: string[] = [];

      for (const h of horariosFiltrados) {
        const duracion = h.duracion_turno_minutos || 30;

        // hora_desde / hora_hasta vienen como "HH:MM" o "HH:MM:SS"
        const [hdH, hdM] = h.hora_desde.substring(0, 5).split(':').map(Number);
        const [hhH, hhM] = h.hora_hasta.substring(0, 5).split(':').map(Number);

        let minutosDesde = hdH * 60 + hdM;
        const minutosHasta = hhH * 60 + hhM;

        while (minutosDesde + duracion <= minutosHasta) {
          const hh = Math.floor(minutosDesde / 60).toString().padStart(2, '0');
          const mm = (minutosDesde % 60).toString().padStart(2, '0');
          slots.push(`${hh}:${mm}`);
          minutosDesde += duracion;
        }
      }

      // Quitar duplicados y ordenar
      slots = Array.from(new Set(slots)).sort();

      // 3) Filtrar los slots que ya tengan turno reservado
      const { data: turnosDia, error: turnosErr } = await this.supa.client
        .from('turnos')
        .select(`
        fecha_hora_inicio,
        estado:estados_turno!fk_turno_estado ( codigo )
      `)
        .eq('especialista_id', especialistaId)
        .gte('fecha_hora_inicio', `${diaSeleccionado}T00:00:00`)
        .lt('fecha_hora_inicio', `${diaSeleccionado}T23:59:59`);

      if (turnosErr) throw turnosErr;

      const ocupadas = new Set<string>();
      (turnosDia ?? []).forEach((t: any) => {
        const codigo = String(t.estado?.codigo ?? '').toUpperCase();
        if (codigo === 'PENDIENTE' || codigo === 'ACEPTADO') {
          const dt = new Date(t.fecha_hora_inicio);
          const hh = dt.getHours().toString().padStart(2, '0');
          const mm = dt.getMinutes().toString().padStart(2, '0');
          ocupadas.add(`${hh}:${mm}`);
        }
      });

      this.horariosDisponibles = slots.filter(h => !ocupadas.has(h));

      // Habilitar el selector de hora sólo si hay algo
      if (this.horariosDisponibles.length > 0) {
        horaCtrl?.enable({ emitEvent: false });
      } else {
        horaCtrl?.reset();
        horaCtrl?.disable({ emitEvent: false });

        this.snackBar.open(
          this.translate.instant('APPOINTMENT.NO_FREE_SLOTS'),
          this.translate.instant('COMMON.CLOSE'),
          { duration: 3000 }
        );
      }

    } catch (e) {
      console.error('[SolicitarTurno] Error al cargar horarios del especialista', e);
      this.horariosDisponibles = [];
      horaCtrl?.reset();
      horaCtrl?.disable({ emitEvent: false });

      this.snackBar.open(
        this.translate.instant('APPOINTMENT.ERROR_LOAD_SLOTS'),
        this.translate.instant('COMMON.CLOSE'),
        { duration: 3000 }
      );
    }
  }


  // =================================================================
  // ------------------------- -  Ciclo de vida ngonini
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
    //this.generarDiasDisponibles();

    this.formularioInicializado = true;
  }



  private async actualizarDiasDisponiblesParaSeleccion(): Promise<void> {
    const especialidadCtrl = this.formularioTurno.get('especialidad') as FormControl<string | null>;
    const especialistaCtrl = this.formularioTurno.get('especialista') as FormControl<string | null>;

    const especialistaId = especialistaCtrl?.value;
    const nombreEspecialidad = especialidadCtrl?.value;

    if (!especialistaId || !nombreEspecialidad) {
      this.diasDisponibles = [];
      return;
    }

    const especialidadId = this.especialidadIdPorNombre.get(nombreEspecialidad) ?? null;

    try {
      // Traemos TODOS los horarios del especialista (para cualquier día)
      const { data: horariosData, error: horariosErr } = await this.supa.client
        .from('horarios_especialista')
        .select('dia_semana, especialidad_id')
        .eq('especialista_id', especialistaId);

      if (horariosErr) throw horariosErr;

      const horarios = (horariosData ?? []) as Pick<HorarioEspecialistaRow, 'dia_semana' | 'especialidad_id'>[];

      // Qué días de la semana atiende para esta especialidad
      const diasSemanaDisponibles = new Set<number>();

      horarios.forEach(h => {
        if (!especialidadId) {
          diasSemanaDisponibles.add(h.dia_semana);
        } else if (!h.especialidad_id || h.especialidad_id === especialidadId) {
          diasSemanaDisponibles.add(h.dia_semana);
        }
      });

      const hoy = new Date();
      const maxDias = this.esAdmin ? 30 : 15;
      const dias: string[] = [];

      for (let i = 1; i <= maxDias; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);

        const dow = fecha.getDay(); // 0=domingo ... 6=sábado
        if (diasSemanaDisponibles.has(dow)) {
          // *** AQUÍ estaba el problema: antes usábamos toISOString() (UTC) ***
          const year = fecha.getFullYear();
          const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
          const day = fecha.getDate().toString().padStart(2, '0');
          const fechaStr = `${year}-${month}-${day}`; // YYYY-MM-DD en LOCAL

          const fechaFormateada = this.formatearFecha(fecha);
          dias.push(`${fechaStr}|${fechaFormateada}`);
        }
      }

      this.diasDisponibles = dias;
    } catch (e) {
      console.error('[SolicitarTurno] Error al cargar días disponibles', e);
      this.diasDisponibles = [];
    }
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

    especialistaCtrl.valueChanges.subscribe(especialista => {
      if (especialista) {
        // recalculamos días según los horarios de ese especialista
        this.actualizarDiasDisponiblesParaSeleccion();
        diaCtrl.enable({ emitEvent: false });

        this.horariosDisponibles = [];
        horaCtrl.reset();
        horaCtrl.disable({ emitEvent: false });
      } else {
        this.diasDisponibles = [];
        diaCtrl.reset();
        diaCtrl.disable({ emitEvent: false });

        this.horariosDisponibles = [];
        horaCtrl.reset();
        horaCtrl.disable({ emitEvent: false });
      }
    });


    especialidadCtrl.valueChanges.subscribe(esp => {
      if (esp) {
        this.especialistasFiltrados = this.especialistas.filter(e => e.especialidad === esp);

        if (this.especialistasFiltrados.length === 0) {
          this.snackBar.open(
            this.translate.instant('APPOINTMENT.NO_SPECIALISTS', { speciality: esp }),
            this.translate.instant('COMMON.CLOSE'),
            { duration: 3000 }
          );
        }

        this.diasDisponibles = [];
        this.horariosDisponibles = [];

        especialistaCtrl.reset();
        especialistaCtrl.enable({ emitEvent: false });
        diaCtrl.reset();
        diaCtrl.disable({ emitEvent: false });
        horaCtrl.reset();
        horaCtrl.disable({ emitEvent: false });
      } else {
        this.especialistasFiltrados = [];
        this.diasDisponibles = [];
        this.horariosDisponibles = [];

        especialistaCtrl.reset();
        especialistaCtrl.disable({ emitEvent: false });
        diaCtrl.reset();
        diaCtrl.disable({ emitEvent: false });
        horaCtrl.reset();
        horaCtrl.disable({ emitEvent: false });
      }
    });


    diaCtrl.valueChanges.subscribe(dia => {
      if (dia) {
        // Recalcular horarios según especialista + día + especialidad
        this.actualizarHorariosDisponiblesParaSeleccion();
      } else {
        this.horariosDisponibles = [];
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
      //  .eq('esta_aprobado', true)  <================================ VERIFICAR SI CARGA APROBADOS O NO APROBADOS
      // .eq('activo', true);         <================================ VERIFICAR SI CARGA APROBADOS O NO APROBADOS

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



      // this.snackBar.open(
      //   'Error al cargar especialidades o especialistas',
      //   'Cerrar',
      //   { duration: 4000 }
      // );

      this.snackBar.open(
        this.translate.instant('APPOINTMENT.ERROR_LOAD_SPECIALTIES'),
        this.translate.instant('COMMON.CLOSE'),
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

      this.snackBar.open(
        this.translate.instant('APPOINTMENT.ERROR_LOAD_PATIENTS'),
        this.translate.instant('COMMON.CLOSE'),
        { duration: 2500 }
      );


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
        throw new Error(this.translate.instant('APPOINTMENT.ERROR_MISSING_FIELDS'));
      }

      const pacienteIdFinal = this.esAdmin ? fv.paciente! : this.pacienteId!;
      if (!pacienteIdFinal) {
        throw new Error(this.translate.instant('APPOINTMENT.ERROR_PATIENT_NOT_FOUND'));
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
        throw new Error(this.translate.instant('APPOINTMENT.ERROR_SLOT_TAKEN'));
      }

      // 2) Obtener id de la especialidad elegida
      const nombreEsp = fv.especialidad;
      const especialidadId = this.especialidadIdPorNombre.get(nombreEsp);

      if (!especialidadId) {
        throw new Error(this.translate.instant('APPOINTMENT.ERROR_SPECIALITY_NOT_FOUND'));
      }

      // 3) Obtener id de estado PENDIENTE
      const { data: estadoPend, error: estadoErr } = await this.supa.client
        .from('estados_turno')
        .select('id, codigo')
        .eq('codigo', 'PENDIENTE')
        .single();

      if (estadoErr || !estadoPend) {
        throw estadoErr || new Error(this.translate.instant('APPOINTMENT.ERROR_STATUS_NOT_FOUND'));
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
        title: this.translate.instant('APPOINTMENT.SUCCESS_TITLE'),
        text: this.translate.instant('APPOINTMENT.SUCCESS_TEXT'),
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
      Swal.fire(
        this.translate.instant('COMMON.ERROR_TITLE'),
        err.message || this.translate.instant('APPOINTMENT.ERROR_SUBMIT_GENERIC'),
        'error'
      );
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


