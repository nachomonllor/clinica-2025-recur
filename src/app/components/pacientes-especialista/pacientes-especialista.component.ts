
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { SupabaseService } from '../../../services/supabase.service';

import { PacienteAtendido, TurnoDetalle } from '../../models/pacientes-especialista.model';
import { CapitalizarNombrePipe } from "../../../pipes/capitalizar-nombre.pipe";
import { HistoriaClinicaDialogComponent } from '../historia-clinica-dialog/historia-clinica-dialog.component';
import { DatoDinamico, TipoDatoDinamico } from '../../models/dato-dinamico.model';

@Component({
  selector: 'app-pacientes-especialista',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CapitalizarNombrePipe
  ],
  templateUrl: './pacientes-especialista.component.html',
  styleUrls: ['./pacientes-especialista.component.scss']
})
export class PacientesEspecialistaComponent implements OnInit {
  pacientes: PacienteAtendido[] = [];
  pacientesFiltrados: PacienteAtendido[] = [];
  pacienteSeleccionado?: PacienteAtendido;
  turnosPaciente: TurnoDetalle[] = [];

  @ViewChild('verResenaDialog') verResenaDialog!: TemplateRef<unknown>;

  cargandoDetalle = false;
  filtro = '';

  //Getter auxiliar para mostrar el nombre completo en la UI de forma segura (evitando errores si es undefined)
  get nombreCompletoSeleccionado(): string {
    if (!this.pacienteSeleccionado) {
      return '';
    }
    const { nombre, apellido } = this.pacienteSeleccionado;
    return `${apellido} ${nombre}`.trim();
  }

  constructor(
    private supa: SupabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    void this.cargarPacientes();
  }

  // consulta la tabla 'historia_clinica' filtrando por mi ID de especialista.
  // Extrae un Set de IDs unicos de pacientes => para no repetir al mismo paciente
  // Y consulta la tabla usuarios para traer los datos personales (foto, nombre) solo de esos IDs
  async cargarPacientes(): Promise<void> {
    const { data: sessionData } = await this.supa.getSession();
    if (!sessionData?.session) return;

    const especialistaId = sessionData.session.user.id;

    try {
      const { data: historias, error: historiasError } = await this.supa.client
        .from('historia_clinica')
        .select('paciente_id')
        .eq('especialista_id', especialistaId);

      if (historiasError) {
        console.error('[PacientesEspecialista] Error al cargar historias', historiasError);
        return;
      }

      const pacienteIds = [...new Set((historias || []).map((h: any) => h.paciente_id))];

      if (pacienteIds.length === 0) {
        this.pacientes = [];
        this.pacientesFiltrados = [];
        this.pacienteSeleccionado = undefined;
        return;
      }

      const { data: pacientes, error: pacientesError } = await this.supa.client
        .from('usuarios')
        .select('id, nombre, apellido, dni, email, imagen_perfil_1, perfil')
        .in('id', pacienteIds)
        .eq('perfil', 'PACIENTE');

      if (pacientesError) {
        console.error('[PacientesEspecialista] Error al cargar pacientes', pacientesError);
        return;
      }

      this.pacientes = (pacientes || []).map((p: any) => ({
        id: p.id,
        nombre: p.nombre || '',
        apellido: p.apellido || '',
        dni: p.dni || '',
        email: p.email || '',
        avatar_url: p.imagen_perfil_1 || undefined
      }));

      this.aplicarFiltro(this.filtro);
    } catch (err) {
      console.error('[PacientesEspecialista] Error', err);
    }
  }

  // Filtra el array localmente en memoria. 
  // Si el paciente seleccionado deja de ser visible por el filtro
  // reseteamos la selección para evitar inconsistencias en la vista
  aplicarFiltro(valor: string): void {
    this.filtro = (valor || '').trim().toLowerCase();
    if (!this.filtro) {
      this.pacientesFiltrados = [...this.pacientes];
    } else {
      this.pacientesFiltrados = this.pacientes.filter(p => {
        const haystack = `${p.apellido} ${p.nombre} ${p.dni || ''} ${p.email || ''}`.toLowerCase();
        return haystack.includes(this.filtro);
      });
    }

    if (this.pacienteSeleccionado && !this.pacientesFiltrados.find(p => p.id === this.pacienteSeleccionado?.id)) {
      this.pacienteSeleccionado = undefined;
      this.turnosPaciente = [];
    }
  }

  trackPaciente(index: number, paciente: PacienteAtendido): string {
    return paciente.id;
  }

  async seleccionarPaciente(paciente: PacienteAtendido): Promise<void> {
    if (this.cargandoDetalle) { return; }
    this.pacienteSeleccionado = paciente;
    await this.cargarTurnosPaciente(paciente.id);
  }

  // Carga el historial de turnos EXCLUSIVO entre este especialista y este paciente
  // Realiza un Join con especialidades y 'estados_turno' para mostrar nombres legibles en la tabla
  private async cargarTurnosPaciente(pacienteId: string): Promise<void> {
    this.cargandoDetalle = true;
    this.turnosPaciente = [];

    try {
      const { data: sessionData } = await this.supa.getSession();
      if (!sessionData?.session) return;

      const especialistaId = sessionData.session.user.id;

      const { data, error } = await this.supa.client
        .from('turnos')
        .select(`
          id,
          fecha_hora_inicio,
          comentario,
          especialidades ( nombre ),
          estados_turno ( codigo )
        `)
        .eq('paciente_id', pacienteId)
        .eq('especialista_id', especialistaId)
        .order('fecha_hora_inicio', { ascending: false });

      if (error) {
        console.error('[PacientesEspecialista] Error al cargar turnos', error);
        return;
      }

      this.turnosPaciente = (data || []).map((t: any) => {
        const fecha = t.fecha_hora_inicio ? new Date(t.fecha_hora_inicio) : undefined;
        const fechaTexto = fecha
          ? fecha.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
          : 'Fecha no disponible';

        const especialidadNombre = t.especialidades?.nombre ?? 'Sin especialidad';
        const estadoCodigo = t.estados_turno?.codigo ?? 'PENDIENTE';

        return {
          id: t.id,
          especialidad: especialidadNombre,
          estado: estadoCodigo,
          fechaTexto,
          resena: (t.comentario || '').trim() || undefined
        } as TurnoDetalle;
      });
    } finally {
      this.cargandoDetalle = false;
    }
  }

  //Abre un modal TemplateRef para leer la reseña completa del turno seleccionado
  verResena(t: TurnoDetalle): void {
    if (!t.resena || t.resena.trim().length === 0) {
      this.snackBar.open('Este turno no tiene reseña disponible', 'Cerrar', { duration: 2500 });
      return;
    }

    this.dialog.open(this.verResenaDialog, {
      data: {
        turno: t,
        resena: t.resena,
        fecha: t.fechaTexto,
        especialidad: t.especialidad,
        paciente: this.nombreCompletoSeleccionado
      },
      width: '500px'
    });
  }


  mostrarResena(resena: string): void {
    this.snackBar.open(resena, 'Cerrar', { duration: 3500 });
  }


  //  Obtiene las historias clínicas 
  //  Utiliza 'Promise.all' para enriquecer cada historia en paralelo.
  //  Por cada historia => busca los detalles del Turno y procesa los Datos Dinamicos normalizando tipos: texto, numero, rango, boolean
  //  Finalmente inyecta toda esta data estructurada en el componente HistoriaClinicaDialogComponent
  async verHistoriaClinica(pacienteId: string, pacienteNombre: string): Promise<void> {
    try {

      //  Verificaciones de sesion
      const { data: sessionData } = await this.supa.getSession();
      if (!sessionData?.session) return;
      const especialistaId = sessionData.session.user.id;

      //  Buscamos historias de este paciente con este especialista
      const { data: historias, error } = await this.supa.client
        .from('historia_clinica')
        .select(`*, historia_datos_dinamicos (*)`)
        .eq('paciente_id', pacienteId)
        .eq('especialista_id', especialistaId)
        .order('fecha_registro', { ascending: false });

      if (error) {
        console.error('[PacientesEspecialista] Error al cargar historia clínica', error);
        return;
      }

      //  Mapeamos cada historia con sus datos extra (Turno + Especialista + Dinámicos)
      const historiasCompletas = await Promise.all((historias || []).map(async (h: any) => {

        // Buscar datos del turno (Fecha, Reseña/Comentario, Especialidad)
        const { data: turno } = await this.supa.client
          .from('turnos')
          .select('fecha_hora_inicio, comentario, especialidades(nombre)')
          .eq('id', h.turno_id)
          .single();

        // Buscar datos del especialista (Nombre/Apellido)
        const { data: espUser } = await this.supa.client
          .from('usuarios')
          .select('nombre, apellido')
          .eq('id', h.especialista_id)
          .single();

        //  Manejo seguro del nombre de la especialidad (Array vs Objeto)
        const rawEspec: any = turno?.especialidades;
        const nombreEspecialidad = rawEspec?.nombre || rawEspec?.[0]?.nombre || '';

        //  Procesar Datos Dinámicos (Unificar columnas en interfaz DatoDinamico)
        const datosDinamicosProcesados: DatoDinamico[] = (h.historia_datos_dinamicos || []).map((d: any) => {
          let valor: any = '';
          let tipo: TipoDatoDinamico = 'texto';
          let unidad: string | null = null;

          if (d.valor_texto !== null) {
            valor = d.valor_texto;
            tipo = 'texto';
          } else if (d.valor_numerico !== null) {
            valor = d.valor_numerico;
            // Inferimos si es rango o número simple según 'tipo_control'
            if (d.tipo_control === 'RANGO_0_100') {
              tipo = 'rango';
              unidad = '%';
            } else {
              tipo = 'numero';
              if (d.clave && d.clave.toLowerCase().includes('glucosa')) unidad = 'mg/dL';
            }
          } else if (d.valor_boolean !== null) {
            valor = d.valor_boolean;
            tipo = 'booleano';
          }

          return {
            clave: d.clave,
            valor: valor,
            tipo: tipo,
            unidad: unidad
          };
        });

        // Retornar objeto completo enriquecido
        return {
          ...h,
          paciente: pacienteNombre,
          especialidad: nombreEspecialidad,
          especialistaNombre: espUser ? `${espUser.nombre} ${espUser.apellido}` : '',
          fechaAtencion: turno?.fecha_hora_inicio
            ? new Date(turno.fecha_hora_inicio).toLocaleDateString('es-AR')
            : '',
          resena: turno?.comentario || '', // Aquí va la reseña
          datos_dinamicos: datosDinamicosProcesados
        };
      }));

      // Abrir el diálogo con la data procesada
      this.dialog.open(HistoriaClinicaDialogComponent, {
        width: '800px',
        data: {
          pacienteNombre: pacienteNombre,
          historias: historiasCompletas
        }
      });

    } catch (err: any) {
      console.error('[PacientesEspecialista] Error al cargar historia clínica', err);
    }
  }



}











