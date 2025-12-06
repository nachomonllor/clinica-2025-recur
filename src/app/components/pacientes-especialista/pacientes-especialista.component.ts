
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

  // async verHistoriaClinica(pacienteId: string, pacienteNombre: string): Promise<void> {
  //   try {
  //     const { data: sessionData } = await this.supa.getSession();
  //     if (!sessionData?.session) return;

  //     const especialistaId = sessionData.session.user.id;

  //     // Buscamos historias + datos dinámicos
  //     const { data: historias, error } = await this.supa.client
  //       .from('historia_clinica')
  //       .select(`
  //           *,
  //           historia_datos_dinamicos (*)
  //       `)
  //       .eq('paciente_id', pacienteId)
  //       .eq('especialista_id', especialistaId)
  //       .order('fecha_registro', { ascending: false });

  //     if (error) {
  //       console.error('[PacientesEspecialista] Error al cargar historia clínica', error);
  //       return;
  //     }

  //     // Mapeamos datos extra
  //     const historiasCompletas = await Promise.all((historias || []).map(async (h: any) => {
  //       // CAMBIO: Agregamos 'comentario' al select para obtener la reseña
  //       const { data: turno } = await this.supa.client
  //         .from('turnos')
  //         .select('fecha_hora_inicio, comentario, especialidades(nombre)')
  //         .eq('id', h.turno_id)
  //         .single();

  //       const { data: especialista } = await this.supa.client
  //         .from('usuarios')
  //         .select('nombre, apellido')
  //         .eq('id', h.especialista_id)
  //         .single();

  //       const dataEspec: any = turno?.especialidades;
  //       const nombreEspecialidad = dataEspec?.nombre || dataEspec?.[0]?.nombre || '';

  //       return {
  //         ...h,
  //         paciente: pacienteNombre,
  //         especialidad: nombreEspecialidad,
  //         especialistaNombre: especialista ? `${especialista.nombre} ${especialista.apellido}` : '',
  //         fechaAtencion: turno?.fecha_hora_inicio
  //           ? new Date(turno.fecha_hora_inicio).toLocaleDateString('es-AR')
  //           : '',
  //         //  Mapeamos el comentario del turno a la propiedad 'resena'
  //         resena: turno?.comentario || ''
  //       };
  //     }));

  //     this.dialog.open(HistoriaClinicaDialogComponent, {
  //       width: '800px',
  //       data: {
  //         pacienteNombre: pacienteNombre,
  //         historias: historiasCompletas
  //       }
  //     });

  //   } catch (err: any) {
  //     console.error('[PacientesEspecialista] Error al cargar historia clínica', err);
  //   }
  // }



  async verHistoriaClinica(pacienteId: string, pacienteNombre: string): Promise<void> {
    try {
      const { data: sessionData } = await this.supa.getSession();
      if (!sessionData?.session) return;

      const especialistaId = sessionData.session.user.id;

      // 1. Buscamos historias + datos dinámicos (Esto estaba bien)
      const { data: historias, error } = await this.supa.client
        .from('historia_clinica')
        .select(`
            *,
            historia_datos_dinamicos (*)
        `)
        .eq('paciente_id', pacienteId)
        .eq('especialista_id', especialistaId)
        .order('fecha_registro', { ascending: false });

      if (error) {
        console.error('[PacientesEspecialista] Error al cargar historia clínica', error);
        return;
      }

      //  Mapeamos datos extra Y PROCESAMOS LOS DINÁMICOS
      const historiasCompletas = await Promise.all((historias || []).map(async (h: any) => {
        
        // --- LOGICA TURNOS-ESPECIALISTA ---
        const { data: turno } = await this.supa.client
          .from('turnos')
          .select('fecha_hora_inicio, comentario, especialidades(nombre)')
          .eq('id', h.turno_id)
          .single();

        const { data: especialista } = await this.supa.client
          .from('usuarios')
          .select('nombre, apellido')
          .eq('id', h.especialista_id)
          .single();

        const dataEspec: any = turno?.especialidades;
        const nombreEspecialidad = dataEspec?.nombre || dataEspec?.[0]?.nombre || '';

        // --- CORRECCIÓN CLAVE: PROCESAR DATOS DINÁMICOS ---
        // Convertimos las columnas separadas de la BD en un solo 'valor' legible
        const datosDinamicosProcesados = (h.historia_datos_dinamicos || []).map((d: any) => {
          let valorFormateado = '';

          if (d.valor_texto) {
            valorFormateado = d.valor_texto;
          } else if (d.valor_numerico !== null && d.valor_numerico !== undefined) {
            // Si es rango o número, lo convertimos a string. 
            // Podés agregarle la unidad si quisieras (ej: "50 %")
            valorFormateado = d.valor_numerico.toString();
            // Opcional: Si querés ser más específico con rangos:
            if (d.tipo_control === 'RANGO_0_100') valorFormateado += ' %';
          } else if (d.valor_boolean !== null && d.valor_boolean !== undefined) {
            // Si es booleano (Switch), mostramos Sí/No
            valorFormateado = d.valor_boolean ? 'Sí' : 'No';
          }

          return {
            clave: d.clave,
            valor: valorFormateado // <================== para el PDF Y DIALOG
          };
        });

        return {
          ...h,
          paciente: pacienteNombre,
          especialidad: nombreEspecialidad,
          especialistaNombre: especialista ? `${especialista.nombre} ${especialista.apellido}` : '',
          fechaAtencion: turno?.fecha_hora_inicio
            ? new Date(turno.fecha_hora_inicio).toLocaleDateString('es-AR')
            : '',
          resena: turno?.comentario || '',
          
          // Sobrescribimos la propiedad con la version procesada
          datos_dinamicos: datosDinamicosProcesados 
        };
      }));

      // Abrimos el diálogo con los datos ya "limpios"
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











