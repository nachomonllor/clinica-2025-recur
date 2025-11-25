import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
  FormControl
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

import { SupabaseService } from '../../../services/supabase.service';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { HistoriaClinica } from '../../models/historia-clinica.model';
import { DatoDinamico, formatearDatoDinamico } from '../../models/dato-dinamico.model';

interface PerfilCompleto {
  id: string;
  rol: string;              // ahora se llena desde usuarios.perfil
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  obra_social?: string;
  fecha_nacimiento?: string;
  avatar_url?: string;      // mapeado desde imagen_perfil_1
  imagen2_url?: string;     // mapeado desde imagen_perfil_2
  especialidades?: string[];
}

type HorasPorDia = { [dia: string]: string[] };

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatIconModule,
    MatTableModule,
    MatExpansionModule
  ],
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.scss'],
  animations: [
    trigger('pageIn', [
      transition(':enter', [
        query('.hero, .panel', [
          style({ opacity: 0, transform: 'translateY(12px) scale(.98)' }),
          stagger(
            80,
            animate(
              '420ms cubic-bezier(.2,.8,.2,1)',
              style({ opacity: 1, transform: 'translateY(0) scale(1)' })
            )
          )
        ])
      ])
    ])
  ]
})




export class MiPerfilComponent implements OnInit {
  perfil: PerfilCompleto | null = null;
  esEspecialista = false;
  esPaciente = false;
  loading = false;

  // -----------------------
  especialidadesInfo: { id: string; nombre: string }[] = [];

  // Mis horarios (por especialidad y día)
  horariosPorEspecialidad: HorasPorDia[] = [];  // índice = tarjeta (especialidad)
  diaActivoPorEspecialidad: string[] = [];      // día seleccionado en cada tarjeta
  duracionTurnoMinutos = 30;                    // o el valor que uses en turnos

  //----------------

  historiasClinicas: (HistoriaClinica & {
    especialistaNombre?: string;
    fechaAtencion?: string;
  })[] = [];

  especialistasDisponibles: { id: string; nombre: string }[] = [];
  especialistaSeleccionado: 'todos' | string = 'todos';

  formularioHorarios!: FormGroup<{
    horarios: FormArray<FormGroup<{
      especialidad: FormControl<string | null>;
      dias: FormControl<string[] | null>;
      horas: FormControl<string[] | null>;
    }>>;
  }>;

  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  horariosDisponibles = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00'
  ];
  especialidades: string[] = [];

  constructor(
    private supa: SupabaseService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) { }

  // ---------------- GETTERS ----------------

  get nombreCompleto(): string {
    return this.perfil ? `${this.perfil.nombre} ${this.perfil.apellido}` : '';
  }

  get rolUpper(): string {
    return this.esEspecialista
      ? 'ESPECIALISTA'
      : this.esPaciente
        ? 'PACIENTE'
        : (this.perfil?.rol || '').toUpperCase();
  }

  get avatarIniciales(): string {
    const p = this.perfil;
    if (!p) return '';
    return (p.nombre?.[0] || '').toUpperCase() + (p.apellido?.[0] || '').toUpperCase();
  }

  // ---------------- CICLO DE VIDA ----------------

  async ngOnInit(): Promise<void> {
    await this.cargarPerfil();
    if (this.esEspecialista) {
      await this.cargarEspecialidades();
      this.inicializarFormularioHorarios();
    }
    if (this.esPaciente) {
      await this.cargarHistoriaClinica();
    }
  }

  // ---------------- PERFIL ----------------

  async cargarPerfil(): Promise<void> {
    const { data: sessionData } = await this.supa.getSession();
    if (!sessionData?.session) {
      this.snackBar.open('No hay sesión activa', 'Cerrar', { duration: 2500 });
      return;
    }

    const userId = sessionData.session.user.id;

    // AHORA usamos esquema_clinica.usuarios (no perfiles)
    const { data: usuario, error: perfilError } = await this.supa.client
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (perfilError || !usuario) {
      console.error('[MiPerfil] Error al cargar perfil', perfilError);
      this.snackBar.open('Error al cargar perfil', 'Cerrar', { duration: 2500 });
      return;
    }

    this.esEspecialista = usuario.perfil === 'ESPECIALISTA';
    this.esPaciente = usuario.perfil === 'PACIENTE';

    let especialidades: string[] = [];

    // Si es especialista, buscamos sus especialidades en usuario_especialidad + especialidades
    // if (this.esEspecialista) {
    //   const { data: espData, error: espError } = await this.supa.client
    //     .from('usuario_especialidad')
    //     .select('especialidades ( nombre )')
    //     .eq('usuario_id', userId);

    //   if (espError) {
    //     console.error('[MiPerfil] Error al cargar especialidades', espError);
    //   } else {
    //     especialidades =
    //       espData
    //         ?.map((r: any) => r.especialidades?.nombre as string | undefined)
    //         .filter((n): n is string => !!n) || [];
    //   }
    // }


    this.especialidadesInfo = [];

    // Si es especialista, buscamos sus especialidades en usuario_especialidad + especialidades
    if (this.esEspecialista) {
      const { data: espData, error: espError } = await this.supa.client
        .from('usuario_especialidad')
        .select('especialidad_id, especialidades ( nombre )')
        .eq('usuario_id', userId);

      if (espError) {
        console.error('[MiPerfil] Error al cargar especialidades', espError);
      } else {
        (espData || []).forEach((r: any) => {
          const nombre = r.especialidades?.nombre as string | undefined;
          const id = r.especialidad_id as string | undefined;

          if (nombre) {
            especialidades.push(nombre);
          }
          if (nombre && id) {
            this.especialidadesInfo.push({ id, nombre });
          }
        });
      }
    }

    // Mapeamos usuarios → PerfilCompleto (rol = perfil, avatar_url = imagen_perfil_1)
    this.perfil = {
      id: usuario.id,
      rol: usuario.perfil, // ESPECIALISTA / PACIENTE / ADMIN
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni,
      email: usuario.email,
      obra_social: usuario.obra_social ?? undefined,
      fecha_nacimiento: undefined, // el esquema nuevo tiene edad, no fecha_nacimiento
      avatar_url: usuario.imagen_perfil_1 ?? undefined,
      imagen2_url: usuario.imagen_perfil_2 ?? undefined,
      especialidades: especialidades.length ? especialidades : undefined
    };
  }

  async cargarEspecialidades(): Promise<void> {
    if (!this.perfil?.especialidades) return;
    this.especialidades = this.perfil.especialidades;
  }

  // inicializarFormularioHorarios(): void {
  //   this.formularioHorarios = this.fb.group({
  //     horarios: this.fb.array<FormGroup>([])
  //   });

  //   // Un grupo de horarios por especialidad
  //   this.especialidades.forEach((esp) => {
  //     const grupoHorario = this.fb.group({
  //       especialidad: [esp, Validators.required],
  //       dias: this.fb.control<string[]>([]),
  //       horas: this.fb.control<string[]>([])
  //     });
  //     this.horariosArray.push(grupoHorario);
  //   });
  // }


  inicializarFormularioHorarios(): void {
    this.formularioHorarios = this.fb.group({
      horarios: this.fb.array<FormGroup>([])
    });

    this.horariosPorEspecialidad = [];
    this.diaActivoPorEspecialidad = [];

    // Un grupo de horarios por especialidad (solo usamos el nombre en el card)
    this.especialidades.forEach((esp, index) => {
      const grupoHorario = this.fb.group({
        especialidad: [esp, Validators.required],
        dias: this.fb.control<string[]>([]),   // los dejamos por compatibilidad
        horas: this.fb.control<string[]>([])
      });

      this.horariosArray.push(grupoHorario);

      // Estructura de horas por día para esta especialidad
      const mapa: HorasPorDia = {};
      this.diasSemana.forEach((dia) => (mapa[dia] = []));
      this.horariosPorEspecialidad.push(mapa);

      // Día activo por defecto: Lunes
      this.diaActivoPorEspecialidad[index] = this.diasSemana[0];
    });
  }


  get horariosArray(): FormArray {
    return this.formularioHorarios.get('horarios') as FormArray;
  }

  getHorarioGroup(index: number): FormGroup {
    return this.horariosArray.at(index) as FormGroup;
  }

  /// -----------nuevos: ------------

  getDiaActivo(index: number): string {
    return this.diaActivoPorEspecialidad[index] || this.diasSemana[0];
  }

  seleccionarDia(index: number, dia: string): void {
    this.diaActivoPorEspecialidad[index] = dia;
  }

  // ¿Ese día tiene algún horario marcado (para ponerle un “estado” visual)?
  tieneHoras(index: number, dia: string): boolean {
    const mapa = this.horariosPorEspecialidad[index];
    if (!mapa) return false;
    return (mapa[dia] || []).length > 0;
  }

  // ¿La hora está activa para el día actualmente seleccionado?
  isHoraActiva(index: number, hora: string): boolean {
    const mapa = this.horariosPorEspecialidad[index];
    if (!mapa) return false;
    const dia = this.getDiaActivo(index);
    return (mapa[dia] || []).includes(hora);
  }

  // Toggle de una hora para el día activo
  toggleHora(index: number, hora: string): void {
    const mapa = this.horariosPorEspecialidad[index];
    if (!mapa) return;

    const dia = this.getDiaActivo(index);
    const actuales = mapa[dia] || [];

    if (actuales.includes(hora)) {
      mapa[dia] = actuales.filter((h) => h !== hora);
    } else {
      mapa[dia] = [...actuales, hora].sort();
    }
  }

  private diaLabelToNumero(dia: string): number {
    const index = this.diasSemana.indexOf(dia);
    // 1 = Lunes, 2 = Martes, ... (dejamos 0 = domingo sin usar)
    return index === -1 ? 0 : index + 1;
  }

  private sumarMinutosAHora(hora: string, minutos: number): string {
    const [h, m] = hora.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return `${hora}:00`;

    const total = h * 60 + m + minutos;
    const hh = Math.floor(total / 60) % 24;
    const mm = total % 60;

    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:00`;
  }

  async guardarHorarios(): Promise<void> {
    if (!this.perfil?.id) return;

    if (this.formularioHorarios.invalid) {
      this.formularioHorarios.markAllAsTouched();
      return;
    }

    const filas: any[] = [];
    const especialistaId = this.perfil.id;

    this.horariosPorEspecialidad.forEach((mapaDia, indexEsp) => {
      const espInfo = this.especialidadesInfo[indexEsp];
      const especialidadId = espInfo?.id ?? null;

      this.diasSemana.forEach((diaLabel) => {
        const horas = mapaDia[diaLabel] || [];
        const diaNumero = this.diaLabelToNumero(diaLabel);

        horas.forEach((horaStr) => {
          const horaDesde = `${horaStr}:00`; // "HH:MM:00"
          const horaHasta = this.sumarMinutosAHora(horaStr, this.duracionTurnoMinutos);

          filas.push({
            especialista_id: especialistaId,
            especialidad_id: especialidadId,
            dia_semana: diaNumero,
            hora_desde: horaDesde,
            hora_hasta: horaHasta,
            duracion_turno_minutos: this.duracionTurnoMinutos
          });
        });
      });
    });

    if (filas.length === 0) {
      this.snackBar.open('Debes seleccionar al menos un horario.', 'Cerrar', {
        duration: 2500
      });
      return;
    }

    this.loading = true;

    try {
      // Ojo con el schema: si la tabla está en esquema_clinica, usá 'esquema_clinica.horarios_especialista'
      const { error: delError } = await this.supa.client
        .from('horarios_especialista')
        .delete()
        .eq('especialista_id', especialistaId);

      if (delError) throw delError;

      const { error: insError } = await this.supa.client
        .from('horarios_especialista')
        .insert(filas);

      if (insError) throw insError;

      Swal.fire({
        icon: 'success',
        title: 'Horarios guardados',
        text: 'Los horarios han sido guardados exitosamente',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      console.error('[MiPerfil] Error al guardar horarios', err);
      Swal.fire('Error', err.message || 'No se pudieron guardar los horarios', 'error');
    } finally {
      this.loading = false;
    }
  }


  // --------------------------





  onDiaChange(event: any, index: number): void {
    const grupo = this.getHorarioGroup(index);
    const diasControl = grupo.get('dias') as FormControl<string[]>;
    const diasActuales = diasControl.value || [];

    if (event.checked) {
      diasControl.setValue([...diasActuales, event.source.value]);
    } else {
      diasControl.setValue(diasActuales.filter((d: string) => d !== event.source.value));
    }
  }

  onHoraChange(event: any, index: number): void {
    const grupo = this.getHorarioGroup(index);
    const horasControl = grupo.get('horas') as FormControl<string[]>;
    const horasActuales = horasControl.value || [];

    if (event.checked) {
      horasControl.setValue([...horasActuales, event.source.value]);
    } else {
      horasControl.setValue(horasActuales.filter((h: string) => h !== event.source.value));
    }
  }

  isDiaSelected(dia: string, index: number): boolean {
    const grupo = this.getHorarioGroup(index);
    const dias = grupo.get('dias')?.value || [];
    return dias.includes(dia);
  }

  isHoraSelected(hora: string, index: number): boolean {
    const grupo = this.getHorarioGroup(index);
    const horas = grupo.get('horas')?.value || [];
    return horas.includes(hora);
  }

  // async guardarHorarios(): Promise<void> {
  //   if (this.formularioHorarios.invalid) {
  //     this.formularioHorarios.markAllAsTouched();
  //     return;
  //   }

  //   this.loading = true;
  //   const horarios = this.formularioHorarios.value.horarios;

  //   try {
  //     // TODO: persistir en esquema_clinica.horarios_especialista cuando lo implementes
  //     Swal.fire({
  //       icon: 'success',
  //       title: 'Horarios guardados',
  //       text: 'Los horarios han sido guardados exitosamente',
  //       timer: 2000,
  //       showConfirmButton: false
  //     });
  //   } catch (err: any) {
  //     console.error('[MiPerfil] Error al guardar horarios', err);
  //     Swal.fire('Error', err.message || 'No se pudieron guardar los horarios', 'error');
  //   } finally {
  //     this.loading = false;
  //   }
  // }

  // ---------------- HISTORIA CLÍNICA (PACIENTE) ----------------

  async cargarHistoriaClinica(): Promise<void> {
    const { data: sessionData } = await this.supa.getSession();
    if (!sessionData?.session) return;

    const pacienteId = sessionData.session.user.id;

    try {
      // CAMBIO: ordenamos por fecha_registro (no created_at)
      const { data: historias, error } = await this.supa.client
        .from('historia_clinica')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('fecha_registro', { ascending: false });

      if (error) {
        console.error('[MiPerfil] Error al cargar historia clínica', error);
        return;
      }

      const historiasCompletas = await Promise.all(
        (historias || []).map(async (h: any) => {
          // CAMBIO: usamos fecha_hora_inicio en turnos (no fecha_iso)
          const { data: turno } = await this.supa.client
            .from('turnos')
            .select('fecha_hora_inicio')
            .eq('id', h.turno_id)
            .single();

          // CAMBIO: usamos usuarios en vez de perfiles para el especialista
          const { data: especialista } = await this.supa.client
            .from('usuarios')
            .select('nombre, apellido')
            .eq('id', h.especialista_id)
            .single();

          return {
            ...h,
            especialistaNombre: especialista
              ? `${especialista.nombre} ${especialista.apellido}`
              : 'N/A',
            fechaAtencion: turno?.fecha_hora_inicio
              ? new Date(turno.fecha_hora_inicio).toLocaleDateString('es-AR')
              : 'N/A'
          };
        })
      );

      this.historiasClinicas = historiasCompletas;
      this.actualizarEspecialistas();
    } catch (err) {
      console.error('[MiPerfil] Error al cargar historia clínica', err);
    }
  }

  private actualizarEspecialistas(): void {
    const mapa = new Map<string, string>();
    this.historiasClinicas.forEach((historia) => {
      if (historia.especialista_id) {
        const nombre = historia.especialistaNombre?.trim() || 'Profesional sin nombre';
        mapa.set(historia.especialista_id, nombre);
      }
    });

    this.especialistasDisponibles = Array.from(mapa.entries()).map(([id, nombre]) => ({
      id,
      nombre
    }));

    if (
      this.especialistaSeleccionado !== 'todos' &&
      !mapa.has(this.especialistaSeleccionado)
    ) {
      this.especialistaSeleccionado = 'todos';
    }
  }

  get historiasFiltradas(): (HistoriaClinica & {
    especialistaNombre?: string;
    fechaAtencion?: string;
  })[] {
    if (this.especialistaSeleccionado === 'todos') {
      return this.historiasClinicas;
    }
    return this.historiasClinicas.filter(
      (historia) => historia.especialista_id === this.especialistaSeleccionado
    );
  }

  seleccionarEspecialista(valor: string): void {
    this.especialistaSeleccionado = valor as 'todos' | string;
  }

  nombreProfesionalSeleccionado(): string | null {
    if (this.especialistaSeleccionado === 'todos') {
      return null;
    }
    return (
      this.especialistasDisponibles.find((e) => e.id === this.especialistaSeleccionado)
        ?.nombre || null
    );
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ---------------- PDF ----------------

  async descargarPDF(): Promise<void> {
    const historiasParaDescargar = this.historiasFiltradas;

    if (historiasParaDescargar.length === 0) {
      const mensaje =
        this.especialistaSeleccionado === 'todos'
          ? 'No hay historias clínicas para descargar'
          : 'No hay historias clínicas para el profesional seleccionado';
      Swal.fire('Información', mensaje, 'info');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Cabecera
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CLÍNICA ONLINE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Historia Clínica', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Datos del paciente
      if (this.perfil) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Paciente:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${this.perfil.nombre} ${this.perfil.apellido}`, 60, yPos);
        yPos += 7;

        doc.setFont('helvetica', 'bold');
        doc.text('DNI:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(this.perfil.dni || 'N/A', 60, yPos);
        yPos += 7;

        doc.setFont('helvetica', 'bold');
        doc.text('Email:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(this.perfil.email || 'N/A', 60, yPos);
        yPos += 7;
      }

      const fechaEmision = new Date().toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.setFont('helvetica', 'bold');
      doc.text(`Fecha de emisión: ${fechaEmision}`, pageWidth - 20, yPos, {
        align: 'right'
      });
      yPos += 15;

      doc.setLineWidth(0.5);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      // Historiales
      historiasParaDescargar.forEach((historia, index) => {
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Atención ${index + 1}`, 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha: ${historia.fechaAtencion || 'N/A'}`, 20, yPos);
        yPos += 6;
        doc.text(`Especialista: ${historia.especialistaNombre || 'N/A'}`, 20, yPos);
        yPos += 8;

        // Datos fijos
        doc.setFont('helvetica', 'bold');
        doc.text('Datos de la consulta:', 20, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Altura: ${historia.altura} cm`, 25, yPos);
        doc.text(`Peso: ${historia.peso} kg`, 100, yPos);
        yPos += 6;
        doc.text(`Temperatura: ${historia.temperatura} °C`, 25, yPos);
        doc.text(`Presión: ${historia.presion}`, 100, yPos);
        yPos += 8;

        // Datos dinámicos
        if ((historia as any).datos_dinamicos && (historia as any).datos_dinamicos.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Datos adicionales:', 20, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          (historia as any).datos_dinamicos.forEach((dato: DatoDinamico) => {
            doc.text(formatearDatoDinamico(dato), 25, yPos);
            yPos += 6;
          });
          yPos += 5;
        }

        if (index < historiasParaDescargar.length - 1) {
          doc.setLineWidth(0.3);
          doc.line(20, yPos, pageWidth - 20, yPos);
          yPos += 10;
        }
      });

      const nombrePaciente = this.perfil
        ? `${this.perfil.apellido}_${this.perfil.nombre}`.replace(/\s+/g, '_')
        : 'historia_clinica';
      const fecha = new Date().toISOString().split('T')[0];
      let nombreArchivo = `historia_clinica_${nombrePaciente}_${fecha}.pdf`;

      if (this.especialistaSeleccionado !== 'todos') {
        const profesional = this.especialistasDisponibles.find(
          (e) => e.id === this.especialistaSeleccionado
        );
        const slugProfesional = profesional
          ? profesional.nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
          : 'profesional';
        nombreArchivo = `historia_clinica_${nombrePaciente}_${slugProfesional}_${fecha}.pdf`;
      }

      doc.save(nombreArchivo);

      Swal.fire({
        icon: 'success',
        title: 'PDF descargado',
        text: `Se descargó el archivo ${nombreArchivo}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      console.error('[MiPerfil] Error al generar PDF', err);
      Swal.fire('Error', 'No se pudo generar el archivo PDF', 'error');
    }
  }

  formatDatoDinamico(dato: DatoDinamico): string {
    return formatearDatoDinamico(dato);
  }

  calcularEdad(fecha?: string): string {
    if (!fecha) return '—';
    const birth = new Date(fecha);
    if (Number.isNaN(birth.getTime())) return '—';
    const diff = Date.now() - birth.getTime();
    const age = Math.max(0, new Date(diff).getUTCFullYear() - 1970);
    return `${age} años`;
  }

  scrollToHistoria(): void {
    const el = document.getElementById('historiaClinica');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}





