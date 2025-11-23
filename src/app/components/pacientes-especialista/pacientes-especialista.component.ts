import { Component, OnInit } from '@angular/core';
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
import { HistoriaClinicaDialogComponent } from '../admin/usuarios-admin/historia-clinica-dialog.component';

import { PacienteAtendido, TurnoDetalle } from '../../models/pacientes-especialista.model';

// ------------------------------------------------
// ------------------------------------------------
  

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
    MatSnackBarModule
  ],
  templateUrl: './pacientes-especialista.component.html',
  styleUrls: ['./pacientes-especialista.component.scss']
})
export class PacientesEspecialistaComponent implements OnInit {
  pacientes: PacienteAtendido[] = [];
  pacientesFiltrados: PacienteAtendido[] = [];
  pacienteSeleccionado?: PacienteAtendido;
  turnosPaciente: TurnoDetalle[] = [];
  cargandoDetalle = false;
  filtro = '';

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

  async cargarPacientes(): Promise<void> {
    const { data: sessionData } = await this.supa.getSession();
    if (!sessionData?.session) return;

    const especialistaId = sessionData.session.user.id;

    try {
      // historias_clinicas sigue siendo válida: paciente_id / especialista_id
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

      // CAMBIO: ahora usamos esquema_clinica.usuarios en vez de perfiles
      const { data: pacientes, error: pacientesError } = await this.supa.client
        .from('usuarios')
        .select('id, nombre, apellido, dni, email, imagen_perfil_1, perfil')
        .in('id', pacienteIds)
        .eq('perfil', 'PACIENTE'); // check del DDL

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
        // CAMBIO: usamos imagen_perfil_1 como avatar
        avatar_url: p.imagen_perfil_1 || undefined
      }));

      this.aplicarFiltro(this.filtro);
    } catch (err) {
      console.error('[PacientesEspecialista] Error', err);
    }
  }

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

  private async cargarTurnosPaciente(pacienteId: string): Promise<void> {
    this.cargandoDetalle = true;
    this.turnosPaciente = [];

    try {
      const { data: sessionData } = await this.supa.getSession();
      if (!sessionData?.session) return;

      const especialistaId = sessionData.session.user.id;

      // CAMBIO: usamos columnas nuevas de turnos y aprovechamos FK a especialidades / estados_turno
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
          // CAMBIO: usamos comentario como “reseña”
          resena: (t.comentario || '').trim() || undefined
        } as TurnoDetalle;
      });
    } finally {
      this.cargandoDetalle = false;
    }
  }

  mostrarResena(resena: string): void {
    this.snackBar.open(resena, 'Cerrar', { duration: 3500 });
  }

  async verHistoriaClinica(pacienteId: string, pacienteNombre: string): Promise<void> {
    try {
      const { data: sessionData } = await this.supa.getSession();
      if (!sessionData?.session) return;

      const especialistaId = sessionData.session.user.id;

      // CAMBIO: ordenamos por fecha_registro (no created_at)
      const { data: historias, error } = await this.supa.client
        .from('historia_clinica')
        .select('*')
        .eq('paciente_id', pacienteId)
        .eq('especialista_id', especialistaId)
        .order('fecha_registro', { ascending: false });

      if (error) {
        console.error('[PacientesEspecialista] Error al cargar historia clínica', error);
        return;
      }

      const historiasCompletas = await Promise.all((historias || []).map(async (h: any) => {
        // CAMBIO: usamos fecha_hora_inicio en turnos
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
          especialistaNombre: especialista ? `${especialista.nombre} ${especialista.apellido}` : 'N/A',
          fechaAtencion: turno?.fecha_hora_inicio
            ? new Date(turno.fecha_hora_inicio).toLocaleDateString('es-AR')
            : 'N/A'
        };
      }));

      this.dialog.open(HistoriaClinicaDialogComponent, {
        width: '800px',
        data: {
          pacienteNombre,
          historias: historiasCompletas
        }
      });
    } catch (err: any) {
      console.error('[PacientesEspecialista] Error al cargar historia clínica', err);
    }
  }
}
