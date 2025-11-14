import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { from, map, switchMap } from 'rxjs';
import { SupabaseService } from '../../../services/supabase.service';
import { HistoriaClinica } from '../../../models/historia-clinica.model';
import { DatoDinamico } from '../../../models/dato-dinamico.model';
import { formatearDatoDinamico } from '../../../utils/dato-dinamico.util';
import Swal from 'sweetalert2';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import jsPDF from 'jspdf';

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
  styleUrls: ['./mi-perfil.component.scss']
})
export class MiPerfilComponent implements OnInit {
  perfil: PerfilCompleto | null = null;
  esEspecialista = false;
  esPaciente = false;
  loading = false;
  historiasClinicas: (HistoriaClinica & { especialistaNombre?: string; fechaAtencion?: string })[] = [];
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
  horariosDisponibles = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  especialidades: string[] = [];

  constructor(
    private supa: SupabaseService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) { }

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

  async cargarPerfil(): Promise<void> {
    const { data: sessionData } = await this.supa.getSession();
    if (!sessionData?.session) {
      this.snackBar.open('No hay sesión activa', 'Cerrar', { duration: 2500 });
      return;
    }

    const userId = sessionData.session.user.id;

    // Cargar perfil base
    const { data: perfilBase, error: perfilError } = await this.supa.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (perfilError) {
      console.error('[MiPerfil] Error al cargar perfil', perfilError);
      this.snackBar.open('Error al cargar perfil', 'Cerrar', { duration: 2500 });
      return;
    }

    this.esEspecialista = perfilBase?.rol === 'especialista';
    this.esPaciente = perfilBase?.rol === 'paciente';

    // Si es especialista, cargar especialidades
    if (this.esEspecialista) {
      const { data: especialidadesData } = await this.supa.client
        .from('especialistas')
        .select('especialidad')
        .eq('id', userId);

      const especialidades = especialidadesData?.map((e: any) => e.especialidad) || [];

      this.perfil = {
        ...perfilBase,
        especialidades
      } as PerfilCompleto;
    } else {
      this.perfil = perfilBase as PerfilCompleto;
    }
  }

  async cargarEspecialidades(): Promise<void> {
    if (!this.perfil?.especialidades) return;
    this.especialidades = this.perfil.especialidades;
  }

  inicializarFormularioHorarios(): void {
    this.formularioHorarios = this.fb.group({
      horarios: this.fb.array<FormGroup>([])
    });

    // Crear un grupo de horarios por cada especialidad
    this.especialidades.forEach(esp => {
      const grupoHorario = this.fb.group({
        especialidad: [esp, Validators.required],
        dias: this.fb.control<string[]>([]),
        horas: this.fb.control<string[]>([])
      });
      this.horariosArray.push(grupoHorario);
    });
  }

  get horariosArray(): FormArray {
    return this.formularioHorarios.get('horarios') as FormArray;
  }

  getHorarioGroup(index: number): FormGroup {
    return this.horariosArray.at(index) as FormGroup;
  }

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

  async guardarHorarios(): Promise<void> {
    if (this.formularioHorarios.invalid) {
      this.formularioHorarios.markAllAsTouched();
      return;
    }

    this.loading = true;
    const horarios = this.formularioHorarios.value.horarios;

    try {
      // TODO: Guardar horarios en una tabla de horarios cuando se implemente
      // Por ahora solo mostramos un mensaje de éxito
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

  async cargarHistoriaClinica(): Promise<void> {
    const { data: sessionData } = await this.supa.getSession();
    if (!sessionData?.session) return;

    const pacienteId = sessionData.session.user.id;

    try {
      // Cargar historias clínicas
      const { data: historias, error } = await this.supa.client
        .from('historia_clinica')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MiPerfil] Error al cargar historia clínica', error);
        return;
      }

      // Cargar información adicional de turnos y especialistas
      const historiasCompletas = await Promise.all((historias || []).map(async (h: any) => {
        // Obtener fecha del turno
        const { data: turno } = await this.supa.client
          .from('turnos')
          .select('fecha_iso')
          .eq('id', h.turno_id)
          .single();

        // Obtener nombre del especialista
        const { data: especialista } = await this.supa.client
          .from('profiles')
          .select('nombre, apellido')
          .eq('id', h.especialista_id)
          .single();

        return {
          ...h,
          especialistaNombre: especialista ? `${especialista.nombre} ${especialista.apellido}` : 'N/A',
          fechaAtencion: turno?.fecha_iso ? new Date(turno.fecha_iso).toLocaleDateString('es-AR') : 'N/A'
        };
      }));

      this.historiasClinicas = historiasCompletas;
      this.actualizarEspecialistas();
    } catch (err) {
      console.error('[MiPerfil] Error al cargar historia clínica', err);
    }
  }

  private actualizarEspecialistas(): void {
    const mapa = new Map<string, string>();
    this.historiasClinicas.forEach(historia => {
      if (historia.especialista_id) {
        const nombre = historia.especialistaNombre?.trim() || 'Profesional sin nombre';
        mapa.set(historia.especialista_id, nombre);
      }
    });

    this.especialistasDisponibles = Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre }));

    if (this.especialistaSeleccionado !== 'todos' && !mapa.has(this.especialistaSeleccionado)) {
      this.especialistaSeleccionado = 'todos';
    }
  }

  get historiasFiltradas(): (HistoriaClinica & { especialistaNombre?: string; fechaAtencion?: string })[] {
    if (this.especialistaSeleccionado === 'todos') {
      return this.historiasClinicas;
    }
    return this.historiasClinicas.filter(historia => historia.especialista_id === this.especialistaSeleccionado);
  }

  seleccionarEspecialista(valor: string): void {
    this.especialistaSeleccionado = valor as 'todos' | string;
  }

  nombreProfesionalSeleccionado(): string | null {
    if (this.especialistaSeleccionado === 'todos') {
      return null;
    }
    return (
      this.especialistasDisponibles.find(e => e.id === this.especialistaSeleccionado)?.nombre ||
      null
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

  async descargarPDF(): Promise<void> {
    const historiasParaDescargar = this.historiasFiltradas;

    if (historiasParaDescargar.length === 0) {
      const mensaje = this.especialistaSeleccionado === 'todos'
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

      // Logo y título (simulado con texto)
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CLÍNICA ONLINE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Historia Clínica', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Información del paciente
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

      // Fecha de emisión
      const fechaEmision = new Date().toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.setFont('helvetica', 'bold');
      doc.text(`Fecha de emisión: ${fechaEmision}`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 15;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      // Historiales clínicos
      historiasParaDescargar.forEach((historia, index) => {
        // Verificar si necesitamos una nueva página
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
        if (historia.datos_dinamicos && historia.datos_dinamicos.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Datos adicionales:', 20, yPos);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          historia.datos_dinamicos.forEach((dato: DatoDinamico) => {
            doc.text(formatearDatoDinamico(dato), 25, yPos);
            yPos += 6;
          });
          yPos += 5;
        }

        // Línea separadora entre historiales
        if (index < historiasParaDescargar.length - 1) {
          doc.setLineWidth(0.3);
          doc.line(20, yPos, pageWidth - 20, yPos);
          yPos += 10;
        }
      });

      // Generar nombre de archivo
      const nombrePaciente = this.perfil
        ? `${this.perfil.apellido}_${this.perfil.nombre}`.replace(/\s+/g, '_')
        : 'historia_clinica';
      const fecha = new Date().toISOString().split('T')[0];
      let nombreArchivo = `historia_clinica_${nombrePaciente}_${fecha}.pdf`;

      if (this.especialistaSeleccionado !== 'todos') {
        const profesional = this.especialistasDisponibles.find(e => e.id === this.especialistaSeleccionado);
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

      // Descargar PDF
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


  // Devuelve "N años" (o "—" si no hay fecha)
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

