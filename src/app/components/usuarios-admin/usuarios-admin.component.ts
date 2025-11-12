import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { SupabaseService } from '../../../services/supabase.service';
import type { Rol, PerfilInsert } from '../../../models/perfil.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HistoriaClinicaDialogComponent } from './historia-clinica-dialog.component';
import * as XLSX from 'xlsx';
import { RoleLabelPipe } from '../../../pipes/role-label.pipe';
import { ElevateOnHoverDirective } from '../../../directives/elevate-on-hover.directive';
import { StatusBadgeDirective } from '../../../directives/status-badge.directive';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface UsuarioDisplay {
  id: string;
  rol: Rol;
  aprobado: boolean;
  nombre: string;
  apellido: string;
  email: string;
  dni?: string | null;
  avatar_url?: string | null;
  obra_social?: string | null;
  fecha_nacimiento?: string | null;
  created_at?: string | null;
}

interface PerfilMin {
  nombre?: string | null;
  apellido?: string | null;
}

interface TurnoSupabase {
  id: string;
  fecha_iso: string | null;
  estado: string | null;
  especialidad: string | null;
  paciente?: PerfilMin | null;
  especialista?: PerfilMin | null;
}

interface TurnoResumen {
  id: string;
  fechaTexto: string;
  estado: string;
  especialidad: string;
  contraparte: string;
}

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    RoleLabelPipe,
    ElevateOnHoverDirective,
    StatusBadgeDirective
  ],
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.scss']
})
export class UsuariosAdminComponent implements OnInit {
  usuarios: UsuarioDisplay[] = [];
  usuariosFiltrados: UsuarioDisplay[] = [];
  usuarioSeleccionado?: UsuarioDisplay;
  turnosUsuario: TurnoResumen[] = [];
  cargandoTurnos = false;
  filtroTexto = '';
  filtro = '';
  mostrarFormulario = false;
  imagenPrevia: string | null = null;
  maxDateISO!: string;
  readonly minDateISO = '1900-01-01';

  formularioUsuario!: FormGroup<{
    rol: FormControl<Rol | null>;
    nombre: FormControl<string | null>;
    apellido: FormControl<string | null>;
    fechaNacimiento: FormControl<string | null>;
    dni: FormControl<string | null>;
    obraSocial: FormControl<string | null>;
    email: FormControl<string | null>;
    password: FormControl<string | null>;
    imagenPerfil: FormControl<File | null>;
  }>;

  constructor(
    private supa: SupabaseService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.maxDateISO = this.toISODateLocal(new Date());
    this.inicializarFormulario();
    void this.cargarUsuarios();
  }

  inicializarFormulario(): void {
    this.formularioUsuario = this.fb.group({
      rol: this.fb.control<Rol | null>(null, Validators.required),
      nombre: this.fb.control<string | null>(null, Validators.required),
      apellido: this.fb.control<string | null>(null, Validators.required),
      fechaNacimiento: this.fb.control<string | null>(null, Validators.required),
      dni: this.fb.control<string | null>(null, Validators.required),
      obraSocial: this.fb.control<string | null>(null),
      email: this.fb.control<string | null>(null, [Validators.required, Validators.email]),
      password: this.fb.control<string | null>(null, [Validators.required, Validators.minLength(6)]),
      imagenPerfil: this.fb.control<File | null>(null, Validators.required),
    });

    // Obra social solo requerida para pacientes
    this.formularioUsuario.get('rol')!.valueChanges.subscribe(rol => {
      const obraSocialCtrl = this.formularioUsuario.get('obraSocial')!;
      if (rol === 'paciente') {
        obraSocialCtrl.setValidators([Validators.required]);
      } else {
        obraSocialCtrl.clearValidators();
        obraSocialCtrl.setValue(null);
      }
      obraSocialCtrl.updateValueAndValidity();
    });
  }

  aplicarFiltro(valor: string, preferId?: string): void {
    this.filtroTexto = valor ?? '';
    this.filtro = this.filtroTexto.trim().toLowerCase();
    this.usuariosFiltrados = this.filtro
      ? this.usuarios.filter(u => {
          const haystack = `${u.apellido} ${u.nombre} ${u.email} ${u.rol}`.toLowerCase();
          return haystack.includes(this.filtro);
        })
      : [...this.usuarios];

    const candidato = preferId ?? this.usuarioSeleccionado?.id;
    const forzarSeleccion = !!preferId;

    if (candidato) {
      const encontrado = this.usuariosFiltrados.find(u => u.id === candidato);
      if (encontrado) {
        if (forzarSeleccion) {
          void this.seleccionarUsuario(encontrado, true);
        } else if (this.usuarioSeleccionado?.id !== encontrado.id) {
          void this.seleccionarUsuario(encontrado);
        }
        return;
      }
    }

    if (this.usuariosFiltrados.length) {
      void this.seleccionarUsuario(this.usuariosFiltrados[0], true);
    } else {
      this.usuarioSeleccionado = undefined;
      this.turnosUsuario = [];
      this.cargandoTurnos = false;
    }
  }

  trackUsuario(index: number, usuario: UsuarioDisplay): string {
    return usuario.id;
  }

  async seleccionarUsuario(usuario: UsuarioDisplay, forceReload = false): Promise<void> {
    if (!forceReload && this.usuarioSeleccionado?.id === usuario.id) {
      return;
    }

    this.usuarioSeleccionado = usuario;
    await this.cargarTurnosUsuario(usuario);
  }

  trackTurno(index: number, turno: TurnoResumen): string {
    return turno.id;
  }

  private async cargarUsuarios(): Promise<void> {
    try {
      const { data, error } = await this.supa.client
        .from('profiles')
        .select('id, rol, aprobado, nombre, apellido, email, dni, avatar_url, obra_social, fecha_nacimiento, created_at')
        .order('apellido', { ascending: true });

      if (error) {
        throw error;
      }

      const usuarios = (data || []).map((u: any) => ({
        id: u.id,
        rol: u.rol as Rol,
        aprobado: !!u.aprobado,
        nombre: u.nombre || '',
        apellido: u.apellido || '',
        email: u.email || '',
        dni: u.dni,
        avatar_url: u.avatar_url,
        obra_social: u.obra_social,
        fecha_nacimiento: u.fecha_nacimiento,
        created_at: u.created_at
      })) as UsuarioDisplay[];

      this.usuarios = usuarios;
      const preferId = this.usuarioSeleccionado?.id;
      this.aplicarFiltro(this.filtroTexto, preferId);
    } catch (e: any) {
      console.error('[UsuariosAdmin] Error al cargar usuarios', e);
      Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
    }
  }

  private async cargarTurnosUsuario(usuario: UsuarioDisplay): Promise<void> {
    this.cargandoTurnos = true;
    try {
      const turnos = await this.obtenerTurnosUsuario(usuario);
      this.turnosUsuario = turnos.map(t => {
        const fechaTexto = t.fecha_iso
          ? new Date(t.fecha_iso).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
          : 'Fecha no disponible';

        let contraparte = '';
        if (usuario.rol === 'paciente') {
          contraparte = `Especialista: ${this.nombreCompleto(t.especialista)}`;
        } else if (usuario.rol === 'especialista') {
          contraparte = `Paciente: ${this.nombreCompleto(t.paciente)}`;
        } else {
          contraparte = `Paciente: ${this.nombreCompleto(t.paciente)} · Especialista: ${this.nombreCompleto(t.especialista)}`;
        }

        return {
          id: t.id,
          fechaTexto,
          estado: (t.estado || 'pendiente').toLowerCase(),
          especialidad: t.especialidad || 'Sin especialidad',
          contraparte
        };
      });
    } catch (e) {
      console.error('[UsuariosAdmin] Error al cargar turnos del usuario', e);
      Swal.fire('Error', 'No se pudieron cargar los turnos del usuario', 'error');
      this.turnosUsuario = [];
    } finally {
      this.cargandoTurnos = false;
    }
  }

  private async obtenerTurnosUsuario(usuario: UsuarioDisplay): Promise<TurnoSupabase[]> {
    let query = this.supa.client
      .from('turnos')
      .select(`
        id,
        fecha_iso,
        estado,
        especialidad,
        paciente:profiles!turnos_paciente_id_fkey (nombre, apellido),
        especialista:profiles!turnos_especialista_id_fkey (nombre, apellido)
      `);

    if (usuario.rol === 'paciente') {
      query = query.eq('paciente_id', usuario.id);
    } else if (usuario.rol === 'especialista') {
      query = query.eq('especialista_id', usuario.id);
    } else {
      query = query.or(`paciente_id.eq.${usuario.id},especialista_id.eq.${usuario.id}`);
    }

    const { data, error } = await query.order('fecha_iso', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as TurnoSupabase[];
  }

  private nombreCompleto(perfil?: PerfilMin | null): string {
    if (!perfil) {
      return 'Sin datos';
    }
    const partes = [perfil.apellido, perfil.nombre].filter(Boolean);
    return partes.length ? partes.join(' ') : 'Sin datos';
  }

  fechaLarga(fechaISO?: string | null): string {
    if (!fechaISO) {
      return 'Sin registrar';
    }
    return new Date(fechaISO).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async descargarTurnosUsuario(usuario: UsuarioDisplay): Promise<void> {
    try {
      const turnos = await this.obtenerTurnosUsuario(usuario);

      if (!turnos.length) {
        Swal.fire('Sin turnos', 'No encontramos turnos asociados a este usuario.', 'info');
        return;
      }

      const datosExcel = turnos.map(t => ({
        'Turno ID': t.id,
        'Fecha': t.fecha_iso
          ? new Date(t.fecha_iso).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
          : '',
        'Especialidad': t.especialidad || '',
        'Estado': (t.estado || '').toUpperCase(),
        'Paciente': this.nombreCompleto(t.paciente),
        'Especialista': this.nombreCompleto(t.especialista)
      }));

      const ws = XLSX.utils.json_to_sheet(datosExcel);
      ws['!cols'] = [
        { wch: 18 },
        { wch: 24 },
        { wch: 20 },
        { wch: 14 },
        { wch: 28 },
        { wch: 28 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Turnos');

      const fecha = new Date().toISOString().split('T')[0];
      const slugBase = `${usuario.apellido} ${usuario.nombre}`.trim().toLowerCase();
      const slugSeguro = slugBase
        ? slugBase
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        : usuario.id;
      const nombreArchivo = `turnos_${slugSeguro}_${fecha}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);

      Swal.fire({
        icon: 'success',
        title: 'Descarga completa',
        text: `Se descargó el archivo ${nombreArchivo}`,
        timer: 2200,
        showConfirmButton: false
      });
    } catch (e) {
      console.error('[UsuariosAdmin] Error al descargar turnos', e);
      Swal.fire('Error', 'No se pudo generar el Excel de turnos', 'error');
    }
  }

  private toISODateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private calcEdadFromISO(iso: string): number {
    const [y, m, d] = iso.split('-').map(Number);
    const today = new Date();
    let edad = today.getFullYear() - y;
    const month = today.getMonth() + 1;
    const day = today.getDate();
    if (month < m || (month === m && day < d)) edad--;
    return edad;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    
    const file = input.files[0];
    this.formularioUsuario.get('imagenPerfil')!.setValue(file);
    this.formularioUsuario.get('imagenPerfil')!.markAsDirty();

    const reader = new FileReader();
    reader.onload = () => this.imagenPrevia = reader.result as string;
    reader.readAsDataURL(file);
  }

  async toggleAprobacion(usuario: UsuarioDisplay): Promise<void> {
    if (usuario.rol !== 'especialista') {
      Swal.fire('Info', 'Solo los especialistas requieren aprobación', 'info');
      return;
    }

    const nuevoEstado = !usuario.aprobado;
    const accion = nuevoEstado ? 'habilitar' : 'inhabilitar';

    const confirmacion = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} acceso?`,
      text: `${accion.charAt(0).toUpperCase() + accion.slice(1)} el acceso de ${usuario.nombre} ${usuario.apellido}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { error } = await this.supa.client
        .from('profiles')
        .update({ aprobado: nuevoEstado })
        .eq('id', usuario.id);

      if (error) throw error;

      usuario.aprobado = nuevoEstado;
      Swal.fire('Éxito', `Acceso ${nuevoEstado ? 'habilitado' : 'inhabilitado'} correctamente`, 'success');
    } catch (e: any) {
      console.error('[UsuariosAdmin] Error al actualizar aprobación', e);
      Swal.fire('Error', e.message || 'No se pudo actualizar el estado', 'error');
    }
  }

  crearUsuario(): void {
    this.mostrarFormulario = true;
    this.formularioUsuario.reset();
    this.imagenPrevia = null;
  }

  cancelarCreacion(): void {
    this.mostrarFormulario = false;
    this.formularioUsuario.reset();
    this.imagenPrevia = null;
  }

  async guardarUsuario(): Promise<void> {
    if (this.formularioUsuario.invalid) {
      this.formularioUsuario.markAllAsTouched();
      return;
    }

    const fv = this.formularioUsuario.value!;
    const supabase = this.supa.client;

    try {
      // 1) Crear usuario en Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fv.email!,
        password: fv.password!,
        options: {
          data: { rol: fv.rol, nombre: fv.nombre, apellido: fv.apellido }
        }
      });
      if (signUpError) throw signUpError;

      const user = signUpData.user;
      if (!user) throw new Error('No se pudo crear el usuario.');

      // 2) Subir imagen
      const avatarUrl = await this.supa.uploadAvatar(user.id, fv.imagenPerfil!, 1);

      // 3) Calcular edad
      const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);

      // 4) Crear perfil en 'profiles'
      const perfilData: PerfilInsert = {
        id: user.id,
        rol: fv.rol!,
        nombre: fv.nombre!,
        apellido: fv.apellido!,
        dni: fv.dni!,
        email: fv.email!,
        fecha_nacimiento: fv.fechaNacimiento!,
        avatar_url: avatarUrl,
        aprobado: fv.rol === 'paciente' || fv.rol === 'admin' ? true : false, // Especialistas requieren aprobación
      };

      if (fv.rol === 'paciente') {
        perfilData.obra_social = fv.obraSocial!;
      }

      const { error: perfilError } = await supabase
        .from('profiles')
        .upsert(perfilData, { onConflict: 'id' });
      if (perfilError) throw perfilError;

      // 5) Si es paciente, insertar en tabla 'pacientes'
      if (fv.rol === 'paciente') {
        const { error: pacienteError } = await supabase
          .from('pacientes')
          .insert({
            id: user.id,
            nombre: fv.nombre!,
            apellido: fv.apellido!,
            edad: edadCalculada,
            fecha_nacimiento: fv.fechaNacimiento!,
            dni: fv.dni!,
            obra_social: fv.obraSocial!,
            email: fv.email!
          });
        if (pacienteError) throw pacienteError;
      }

      // 6) Si es especialista, insertar en tabla 'especialistas'
      // Nota: Para especialistas creados desde admin, necesitaríamos un campo de especialidad
      // Por ahora, si se necesita, se puede agregar después desde la UI
      if (fv.rol === 'especialista') {
        // TODO: Agregar campo de especialidad al formulario si es necesario
        // Por ahora, insertamos con una especialidad por defecto
        const { error: especialistaError } = await supabase
          .from('especialistas')
          .insert({
            id: user.id,
            nombre: fv.nombre!,
            apellido: fv.apellido!,
            edad: edadCalculada,
            fecha_nacimiento: fv.fechaNacimiento!,
            dni: fv.dni!,
            especialidad: 'General', // Valor por defecto, debería venir del formulario
            email: fv.email!
          });
        if (especialistaError) throw especialistaError;
      }

      Swal.fire({
        icon: 'success',
        title: 'Usuario creado',
        text: `Usuario ${fv.rol} creado exitosamente`,
        timer: 2000,
        showConfirmButton: false
      });

      this.cancelarCreacion();
      await this.cargarUsuarios();
    } catch (err: any) {
      console.error('[UsuariosAdmin] Error al crear usuario', err);
      Swal.fire('Error', err.message || 'No se pudo crear el usuario', 'error');
    }
  }

  getRolColor(rol: Rol): string {
    switch (rol) {
      case 'admin': return 'warn';
      case 'especialista': return 'accent';
      case 'paciente': return 'primary';
      default: return '';
    }
  }

  async verHistoriaClinica(pacienteId: string, pacienteNombre: string): Promise<void> {
    try {
      // Cargar historias clínicas del paciente
      const { data: historias, error } = await this.supa.client
        .from('historia_clinica')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false });

      if (error) {
        Swal.fire('Error', 'No se pudo cargar la historia clínica', 'error');
        return;
      }

      // Cargar información adicional
      const historiasCompletas = await Promise.all((historias || []).map(async (h: any) => {
        const { data: turno } = await this.supa.client
          .from('turnos')
          .select('fecha_iso')
          .eq('id', h.turno_id)
          .single();

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

      // Abrir diálogo con la historia clínica
      this.dialog.open(HistoriaClinicaDialogComponent, {
        width: '800px',
        data: {
          pacienteNombre,
          historias: historiasCompletas
        }
      });
    } catch (err: any) {
      console.error('[UsuariosAdmin] Error al cargar historia clínica', err);
      Swal.fire('Error', 'No se pudo cargar la historia clínica', 'error');
    }
  }

  async descargarExcel(): Promise<void> {
    try {
      // Cargar todos los usuarios con información completa
      const { data: usuarios, error } = await this.supa.client
        .from('profiles')
        .select('*')
        .order('apellido', { ascending: true });

      if (error) {
        Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
        return;
      }

      // Preparar datos para Excel
      const datosExcel = (usuarios || []).map((u: any) => ({
        'ID': u.id,
        'Nombre': u.nombre || '',
        'Apellido': u.apellido || '',
        'DNI': u.dni || '',
        'Email': u.email || '',
        'Rol': u.rol || '',
        'Aprobado': u.aprobado ? 'Sí' : 'No',
        'Obra Social': u.obra_social || '',
        'Fecha de Nacimiento': u.fecha_nacimiento || '',
        'Fecha de Creación': u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : ''
      }));

      // Crear workbook y worksheet
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 36 }, // ID
        { wch: 15 }, // Nombre
        { wch: 15 }, // Apellido
        { wch: 12 }, // DNI
        { wch: 25 }, // Email
        { wch: 12 }, // Rol
        { wch: 10 }, // Aprobado
        { wch: 15 }, // Obra Social
        { wch: 18 }, // Fecha Nacimiento
        { wch: 18 }  // Fecha Creación
      ];
      ws['!cols'] = colWidths;

      // Generar nombre de archivo con fecha
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `usuarios_${fecha}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);

      Swal.fire({
        icon: 'success',
        title: 'Excel descargado',
        text: `Se descargó el archivo ${nombreArchivo}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      console.error('[UsuariosAdmin] Error al descargar Excel', err);
      Swal.fire('Error', 'No se pudo generar el archivo Excel', 'error');
    }
  }
}

