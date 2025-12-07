import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
  FormControl,
  FormsModule // <======= NECESARIO PARA LOS SLIDERS



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
import { MatSliderModule } from '@angular/material/slider'; // <--- NECESARIO PARA LOS SLIDERS

import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';

// Ajusta estos imports según la ubicación real de tus servicios/modelos
import { SupabaseService } from '../../../services/supabase.service';
import { HistoriaClinica } from '../../models/historia-clinica.model';
import { DatoDinamico, formatearDatoDinamico } from '../../models/dato-dinamico.model';
import { CapitalizarNombrePipe } from "../../../pipes/capitalizar-nombre.pipe";

interface PerfilCompleto {
  id: string;
  rol: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  obra_social?: string;
  fecha_nacimiento?: string;
  avatar_url?: string;
  imagen2_url?: string;
  especialidades?: string[];
}

// NUEVA INTERFAZ PARA EL MANEJO DE SLIDERS
interface DiaDisponibilidad {
  nombre: string;
  activo: boolean; // Si trabaja ese día
  inicio: number;  // Hora inicio (ej: 8)
  fin: number;     // Hora fin (ej: 17)
}

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, // <===========================  Agregado
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
    MatExpansionModule,
    MatSliderModule // <=========================== Agregado
    ,
    CapitalizarNombrePipe

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

  // NUEVA ESTRUCTURA DE DATOS PARA HORARIOS
  // Un array de arrays. El índice principal corresponde a la especialidad.
  // El array interno contiene los 6 días de la semana con su config de slider.
  disponibilidad: DiaDisponibilidad[][] = [];

  duracionTurnoMinutos = 15;

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
    }>>;
  }>;

  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  especialidades: string[] = [];

  constructor(
    private supa: SupabaseService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,

  ) { }


  /* ------------------ HORARIOS --------------------------- */

  // Convierte "08:30:00" -> 8.5
  // private timeSQLToDecimal(time: string): number {
  //   if (!time) return 0;
  //   const [h, m] = time.split(':').map(Number);
  //   return h + (m === 30 ? 0.5 : 0);
  // }

  private timeSQLToDecimal(time: string): number {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);

    let decimal = 0;
    if (m === 15) decimal = 0.25;
    if (m === 30) decimal = 0.5;
    if (m === 45) decimal = 0.75;

    return h + decimal;
  }



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

  get horariosArray(): FormArray {
    return this.formularioHorarios.get('horarios') as FormArray;
  }

  getHorarioGroup(index: number): FormGroup {
    return this.horariosArray.at(index) as FormGroup;
  }

  // ---------------- CICLO DE VIDA ----------------
  async ngOnInit(): Promise<void> {
    await this.cargarPerfil();
    if (this.esEspecialista) {
      // Cargamos especialidades primero
      await this.cargarEspecialidades();
      // AHORA SÍ: Inicializamos el form recuperando los datos guardados
      await this.inicializarFormularioHorarios();
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
    this.especialidadesInfo = [];

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

    this.perfil = {
      id: usuario.id,
      rol: usuario.perfil,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni,
      email: usuario.email,
      obra_social: usuario.obra_social ?? undefined,
      fecha_nacimiento: undefined,
      avatar_url: usuario.imagen_perfil_1 ?? undefined,
      imagen2_url: usuario.imagen_perfil_2 ?? undefined,
      especialidades: especialidades.length ? especialidades : undefined
    };
  }

  async cargarEspecialidades(): Promise<void> {
    if (!this.perfil?.especialidades) return;
    this.especialidades = this.perfil.especialidades;
  }

  // ---------------- LoGICA DE HORARIOS  CON DATOS GUARDADOS -------------------  
  // --------------------------------------------------------
  async inicializarFormularioHorarios(): Promise<void> {
    this.formularioHorarios = this.fb.group({
      horarios: this.fb.array<FormGroup>([])
    });

    this.disponibilidad = [];

    // 1. TRAER LOS HORARIOS GUARDADOS DE SUPABASE
    let horariosGuardados: any[] = [];
    if (this.perfil?.id) {
      const { data, error } = await this.supa.client
        .from('horarios_especialista')
        .select('*')
        .eq('especialista_id', this.perfil.id);

      if (!error && data) {
        horariosGuardados = data;
      }
    }

    // 2. CONSTRUIR EL FORMULARIO CRUZANDO DATOS
    this.especialidades.forEach((esp, indexEsp) => {
      // Obtenemos el ID de la especialidad actual para buscar en lo guardado
      const espInfo = this.especialidadesInfo.find(e => e.nombre === esp);
      const espId = espInfo?.id;

      const grupoHorario = this.fb.group({
        especialidad: [esp, Validators.required]
      });
      this.horariosArray.push(grupoHorario);

      const diasParaEstaEspecialidad: DiaDisponibilidad[] = this.diasSemana.map((diaNombre) => {
        const diaNumero = this.diaLabelToNumero(diaNombre);

        // BUSCAMOS SI EXISTE ESTE DÍA GUARDADO PARA ESTA ESPECIALIDAD
        const horarioGuardado = horariosGuardados.find(h =>
          h.especialidad_id === espId &&
          h.dia_semana === diaNumero
        );

        const esSabado = diaNombre === 'Sábado';

        // Si existe guardado, usamos esos valores. Si no, default.
        if (horarioGuardado) {
          return {
            nombre: diaNombre,
            activo: true, // ¡Lo marcamos como activo!
            inicio: this.timeSQLToDecimal(horarioGuardado.hora_desde),
            fin: this.timeSQLToDecimal(horarioGuardado.hora_hasta)
          };
        } else {
          // Default
          return {
            nombre: diaNombre,
            activo: false,
            inicio: 8,
            fin: esSabado ? 14 : 17
          };
        }
      });

      this.disponibilidad.push(diasParaEstaEspecialidad);
    });
  }

  // --------------------------------------------------------
  // Helper privado para formatear hacia SQL
  // --------------------------------------------------------
  // private decimalToTimeSQL(value: number): string {
  //   const hora = Math.floor(value);
  //   const minutos = (value % 1) === 0.5 ? '30' : '00';
  //   return `${hora.toString().padStart(2, '0')}:${minutos}:00`;
  // }

  private decimalToTimeSQL(value: number): string {
    const hora = Math.floor(value);
    const decimal = value % 1;
    let minutos = '00';

    if (decimal === 0.25) minutos = '15';
    else if (decimal === 0.5) minutos = '30';
    else if (decimal === 0.75) minutos = '45';

    return `${hora.toString().padStart(2, '0')}:${minutos}:00`;
  }

  // Helper para mostrar la hora linda en el slider (ej: convierte 9 en "09:00")

  // formatLabel(value: number): string {
  //   const hora = Math.floor(value);
  //   const minutos = (value % 1) === 0.5 ? '30' : '00';

  //   // padStart asegura que sea "09" en vez de "9"
  //   return `${hora.toString().padStart(2, '0')}:${minutos}`;
  // }

  formatLabel(value: number): string {
    const hora = Math.floor(value);
    const decimal = value % 1;
    let minutos = '00';

    if (decimal === 0.25) minutos = '15';
    else if (decimal === 0.5) minutos = '30';
    else if (decimal === 0.75) minutos = '45';

    return `${hora.toString().padStart(2, '0')}:${minutos}`;
  }

  private diaLabelToNumero(dia: string): number {
    const index = this.diasSemana.indexOf(dia);
    // 1 = Lunes, ..., 6 = Sábado
    return index === -1 ? 0 : index + 1;
  }

  // --------------------------------------------------------
  // 2. GUARDAR HORARIOS (Actualizado para medias horas)
  // --------------------------------------------------------
  async guardarHorarios(): Promise<void> {
    if (!this.perfil?.id) return;

    this.loading = true;
    const filas: any[] = [];
    const especialistaId = this.perfil.id;
    let algunDiaSeleccionado = false;

    this.disponibilidad.forEach((semana, indexEsp) => {
      const espInfo = this.especialidadesInfo[indexEsp];
      const especialidadId = espInfo?.id ?? null;

      semana.forEach(diaData => {
        if (diaData.activo) {
          algunDiaSeleccionado = true;
          const diaNumero = this.diaLabelToNumero(diaData.nombre);

          // Usamos el nuevo helper para convertir los decimales (8.5) 
          // en formato de hora SQL (08:30:00)
          filas.push({
            especialista_id: especialistaId,
            especialidad_id: especialidadId,
            dia_semana: diaNumero,
            hora_desde: this.decimalToTimeSQL(diaData.inicio),
            hora_hasta: this.decimalToTimeSQL(diaData.fin),
            duracion_turno_minutos: this.duracionTurnoMinutos
          });
        }
      });
    });

    // ... (El resto de la función guardarHorarios sigue igual: validaciones y llamada a Supabase) ...

    if (!algunDiaSeleccionado) {
      this.snackBar.open('Debes activar al menos un día laboral.', 'Cerrar', { duration: 3000 });
      this.loading = false;
      return;
    }

    try {
      const { error: delError } = await this.supa.client
        .from('horarios_especialista')
        .delete()
        .eq('especialista_id', especialistaId);

      if (delError) throw delError;

      if (filas.length > 0) {
        const { error: insError } = await this.supa.client
          .from('horarios_especialista')
          .insert(filas);
        if (insError) throw insError;
      }

      Swal.fire({
        icon: 'success',
        title: 'Horarios actualizados',
        text: 'Tu disponibilidad horaria se guardó correctamente.',
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

  // ---------------- HISTORIA CLÍNICA (PACIENTE) ----------------
  // (Esta sección queda igual que antes)

  async cargarHistoriaClinica(): Promise<void> {
    const { data: sessionData } = await this.supa.getSession();
    if (!sessionData?.session) return;

    const pacienteId = sessionData.session.user.id;

    try {
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
          const { data: turno } = await this.supa.client
            .from('turnos')
            .select('fecha_hora_inicio')
            .eq('id', h.turno_id)
            .single();

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

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CLÍNICA ONLINE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Historia Clínica', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

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

      doc.save(`historia_clinica.pdf`);
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

  tieneDiasActivos(dias: DiaDisponibilidad[]): boolean {
    return dias.some(d => d.activo);
  }

}

