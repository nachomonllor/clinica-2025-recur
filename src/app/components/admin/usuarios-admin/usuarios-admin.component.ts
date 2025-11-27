import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
  state
} from '@angular/animations';

import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import { SupabaseService } from '../../../../services/supabase.service';
import { HistoriaClinicaDialogComponent } from './historia-clinica-dialog.component';
import { AccentColor, PerfilMin, TurnoAdminResumen, TurnoAdminSupabase, UsuarioAdmin, UsuarioAdminCard } from '../../../models/admin.model';
import { Rol } from '../../../models/tipos.model';
import { UsuarioCreate } from '../../../models/usuario.model';
import { HistoriaClinicaConExtras } from '../../../models/historia-clinica.model';


@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    MatProgressSpinnerModule
  ],
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.scss'],
  animations: [
    trigger('cardInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px) scale(.98)' }),
        animate('220ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 1, transform: 'none' }))
      ]),
      transition(':leave', [
        animate('160ms ease', style({ opacity: 0, transform: 'translateY(6px) scale(.98)' }))
      ])
    ]),
    trigger('listStagger', [
      transition(':enter, * => *', [
        query(
          '.user-card',
          [
            style({ opacity: 0, transform: 'translateY(6px)' }),
            stagger(40, [
              animate(
                '200ms cubic-bezier(.2,.8,.2,1)',
                style({ opacity: 1, transform: 'none' })
              )
            ])
          ],
          { optional: true }
        )
      ])
    ]),
    trigger('statusChanged', [
      state('true', style({ filter: 'none' })),
      state('false', style({ filter: 'saturate(110%)' })),
      transition('true <=> false', animate('180ms ease'))
    ])
  ]
})
export class UsuariosAdminComponent implements OnInit {
  // Datos originales (usuarios de la BD)
  usuarios: UsuarioAdmin[] = [];

  // Estado UI (nuevo header/filters)
  search = '';
  filtroRol: 'todos' | Rol = 'todos';
  soloHabilitados = false;
  esAdmin = false;

  // Estado de selección / detalle
  usuariosFiltrados: UsuarioAdmin[] = [];
  usuarioSeleccionado?: UsuarioAdmin;
  turnosUsuario: TurnoAdminResumen[] = [];
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

  async ngOnInit(): Promise<void> {
    this.maxDateISO = this.toISODateLocal(new Date());
    this.inicializarFormulario();

    // Verificar si el usuario actual es admin
    try {
      const { data: sessionData } = await this.supa.getSession();
      if (sessionData?.session) {
        const userId = sessionData.session.user.id;
        const { data: usuario, error } = await this.supa.client
          .from('usuarios')
          .select('perfil')
          .eq('id', userId)
          .single();

        if (!error && usuario) {
          const perfil = String(usuario.perfil ?? '').toUpperCase();
          this.esAdmin = perfil === 'ADMIN';
        }
      }
    } catch (e) {
      console.error('[UsuariosAdmin] Error al verificar rol', e);
    }

    await this.cargarUsuarios();
  }

  /** ---------- Listado calculado para el grid nuevo ---------- */
  get filtered(): UsuarioAdminCard[] {
    const base = this.usuarios.map(u => this.toCardVM(u));

    const rolFiltered =
      this.filtroRol === 'todos'
        ? base
        : base.filter(u => u.rol === this.filtroRol);

    const habilitadosFiltered = this.soloHabilitados
      ? rolFiltered.filter(u => (u.rol === 'ESPECIALISTA' ? u.habilitado : true))
      : rolFiltered;

    const term = (this.search ?? '').trim().toLowerCase();
    if (!term) return habilitadosFiltered;

    return habilitadosFiltered.filter(u => this.matchesSearch(u, term));
  }

  private matchesSearch(u: UsuarioAdminCard, term: string): boolean {
    const haystack = [
      u.nombre,
      u.apellido,
      u.email,
      u.obraSocial ?? '',
      ...(u.especialidades ?? [])
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(term);
  }

  private toCardVM(u: UsuarioAdmin): UsuarioAdminCard {
    return {
      id: u.id,
      rol: u.rol,
      habilitado: u.rol === 'ESPECIALISTA' ? !!u.aprobado : true,
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      email: u.email || '',
      dni: u.dni ?? undefined,
      avatarUrl: u.avatar_url ?? undefined,
      obraSocial: u.obra_social ?? undefined,
      edad: typeof u.edad === 'number' ? u.edad : undefined,
      color: this.pickColor(u.id),
      especialidades: undefined // se podría rellenar con usuario_especialidad si querés
    };
  }

  trackById(index: number, u: UsuarioAdminCard): string {
    return u.id;
  }

  initials(u: UsuarioAdminCard): string {
    const a = (u.nombre || '').trim()[0] ?? '';
    const b = (u.apellido || '').trim()[0] ?? '';
    return (a + b).toUpperCase() || 'U';
  }

  rolChip(u: UsuarioAdminCard): string {
    switch (u.rol) {
      case 'ADMIN':
        return 'Administrador';
      case 'ESPECIALISTA':
        return 'Especialista';
      case 'PACIENTE':
        return 'Paciente';
      default:
        return u.rol;
    }
  }

  private pickColor(id: string): AccentColor {
    const colors: AccentColor[] = ['purple', 'teal', 'blue', 'pink'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    return colors[Math.abs(hash) % colors.length];
  }

  /** ---------- Acciones del grid nuevo ---------- */
  async verHistoria(u: UsuarioAdminCard): Promise<void> {
    await this.verHistoriaClinica(u.id, `${u.nombre} ${u.apellido}`.trim());
  }

  async descargarTurnos(u: UsuarioAdminCard): Promise<void> {
    const origen = this.usuarios.find(x => x.id === u.id);
    if (!origen) return;
    await this.descargarTurnosUsuario(origen);
  }

  async toggleHabilitado(u: UsuarioAdminCard): Promise<void> {
    if (u.rol !== 'ESPECIALISTA') return;
    const origen = this.usuarios.find(x => x.id === u.id);
    if (!origen) return;
    await this.toggleAprobacion(origen);
  }

  /** ---------- Lógica original / compat ---------- */
  inicializarFormulario(): void {
    this.formularioUsuario = this.fb.group({
      rol: this.fb.control<Rol | null>(null, Validators.required),
      nombre: this.fb.control<string | null>(null, Validators.required),
      apellido: this.fb.control<string | null>(null, Validators.required),
      fechaNacimiento: this.fb.control<string | null>(null, Validators.required),
      dni: this.fb.control<string | null>(null, Validators.required),
      obraSocial: this.fb.control<string | null>(null),
      email: this.fb.control<string | null>(null, [
        Validators.required,
        Validators.email
      ]),
      password: this.fb.control<string | null>(null, [
        Validators.required,
        Validators.minLength(6)
      ]),
      imagenPerfil: this.fb.control<File | null>(null, Validators.required)
    });

    this.formularioUsuario
      .get('rol')!
      .valueChanges.subscribe(rol => {
        const obraSocialCtrl = this.formularioUsuario.get('obraSocial')!;
        if (rol === 'PACIENTE') {
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

  trackUsuario(index: number, usuario: UsuarioAdmin): string {
    return usuario.id;
  }

  async seleccionarUsuario(
    usuario: UsuarioAdmin,
    forceReload = false
  ): Promise<void> {
    if (!forceReload && this.usuarioSeleccionado?.id === usuario.id) return;
    this.usuarioSeleccionado = usuario;
    await this.cargarTurnosUsuario(usuario);
  }

  trackTurno(index: number, turno: TurnoAdminResumen): string {
    return turno.id;
  }

  /** ---------- Carga de usuarios (esquema_clinica.usuarios) ---------- */
  private async cargarUsuarios(): Promise<void> {
    try {
      const { data, error } = await this.supa.client
        .from('usuarios')
        .select(
          'id, perfil, esta_aprobado, nombre, apellido, email, dni, obra_social, imagen_perfil_1, edad, fecha_registro, activo'
        )
        .order('apellido', { ascending: true });

      if (error) throw error;

      const usuarios = (data || []).map(
        (u: any): UsuarioAdmin => ({
          id: u.id,
          rol: u.perfil as Rol,
          aprobado: !!u.esta_aprobado,
          nombre: u.nombre || '',
          apellido: u.apellido || '',
          email: u.email || '',
          dni: u.dni ?? null,
          avatar_url: u.imagen_perfil_1 ?? null,
          obra_social: u.obra_social ?? null,
          edad: typeof u.edad === 'number' ? u.edad : null,
          fecha_registro: u.fecha_registro ?? null,
          activo: u.activo ?? true
        })
      );

      this.usuarios = usuarios;

      const preferId = this.usuarioSeleccionado?.id;
      this.aplicarFiltro(this.filtroTexto, preferId);
    } catch (e: any) {
      console.error('[UsuariosAdmin] Error al cargar usuarios', e);
      Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
    }
  }

  /** ---------- Turnos de un usuario (tabla turnos nueva) ---------- */
  private async cargarTurnosUsuario(usuario: UsuarioAdmin): Promise<void> {
    this.cargandoTurnos = true;
    try {
      const turnos = await this.obtenerTurnosUsuario(usuario);
      this.turnosUsuario = turnos.map(t => {
        const fechaTexto = t.fecha_hora_inicio
          ? new Date(t.fecha_hora_inicio).toLocaleString('es-AR', {
            dateStyle: 'medium',
            timeStyle: 'short'
          })
          : 'Fecha no disponible';

        let contraparte = '';
        if (usuario.rol === 'PACIENTE') {
          contraparte = `Especialista: ${this.nombreCompleto(t.especialista)}`;
        } else if (usuario.rol === 'ESPECIALISTA') {
          contraparte = `Paciente: ${this.nombreCompleto(t.paciente)}`;
        } else {
          contraparte = `Paciente: ${this.nombreCompleto(
            t.paciente
          )} · Especialista: ${this.nombreCompleto(t.especialista)}`;
        }

        const estadoCodigo = (t.estado?.codigo ?? 'PENDIENTE').toString();
        return {
          id: t.id,
          fechaTexto,
          estado: estadoCodigo.toLowerCase(), // para mostrar / filtrar
          especialidad: t.especialidad?.nombre || 'Sin especialidad',
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

  private async obtenerTurnosUsuario(
    usuario: UsuarioAdmin
  ): Promise<TurnoAdminSupabase[]> {
    let query = this.supa.client
      .from('turnos')
      .select(
        `
        id,
        fecha_hora_inicio,
        motivo,
        comentario,
        estado:estados_turno!fk_turno_estado ( codigo ),
        especialidad:especialidades!fk_turno_especialidad ( nombre ),
        paciente:usuarios!fk_turno_paciente ( nombre, apellido ),
        especialista:usuarios!fk_turno_especialista ( nombre, apellido )
      `
      );

    if (usuario.rol === 'PACIENTE') {
      query = query.eq('paciente_id', usuario.id);
    } else if (usuario.rol === 'ESPECIALISTA') {
      query = query.eq('especialista_id', usuario.id);
    } else {
      query = query.or(
        `paciente_id.eq.${usuario.id},especialista_id.eq.${usuario.id}`
      );
    }

    const { data, error } = await query.order('fecha_hora_inicio', {
      ascending: false
    });
    if (error) throw error;
    return (data || []) as TurnoAdminSupabase[];
  }

  private nombreCompleto(perfil?: PerfilMin | null): string {
    if (!perfil) return 'Sin datos';
    const partes = [perfil.apellido, perfil.nombre].filter(Boolean);
    return partes.length ? partes.join(' ') : 'Sin datos';
  }

  fechaLarga(fechaISO?: string | null): string {
    if (!fechaISO) return 'Sin registrar';
    return new Date(fechaISO).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async descargarTurnosUsuario(usuario: UsuarioAdmin): Promise<void> {
    try {
      const turnos = await this.obtenerTurnosUsuario(usuario);
      if (!turnos.length) {
        Swal.fire(
          'Sin turnos',
          'No encontramos turnos asociados a este usuario.',
          'info'
        );
        return;
      }
      const datosExcel = turnos.map(t => ({
        'Turno ID': t.id,
        Fecha: t.fecha_hora_inicio
          ? new Date(t.fecha_hora_inicio).toLocaleString('es-AR', {
            dateStyle: 'medium',
            timeStyle: 'short'
          })
          : '',
        Especialidad: t.especialidad?.nombre || '',
        Estado: (t.estado?.codigo || '').toUpperCase(),
        Paciente: this.nombreCompleto(t.paciente),
        Especialista: this.nombreCompleto(t.especialista)
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
      const slugBase = `${usuario.apellido} ${usuario.nombre}`
        .trim()
        .toLowerCase();
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
    reader.onload = () => (this.imagenPrevia = reader.result as string);
    reader.readAsDataURL(file);
  }

  async toggleAprobacion(usuario: UsuarioAdmin): Promise<void> {
    if (usuario.rol !== 'ESPECIALISTA') {
      Swal.fire('Info', 'Solo los especialistas requieren aprobación', 'info');
      return;
    }
    const nuevoEstado = !usuario.aprobado;
    const accion = nuevoEstado ? 'habilitar' : 'inhabilitar';
    const confirmacion = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} acceso?`,
      text: `${accion.charAt(0).toUpperCase() + accion.slice(1)} el acceso de ${usuario.nombre
        } ${usuario.apellido}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    });
    if (!confirmacion.isConfirmed) return;

    try {
      const { error } = await this.supa.client
        .from('usuarios')
        .update({ esta_aprobado: nuevoEstado })
        .eq('id', usuario.id);
      if (error) throw error;
      usuario.aprobado = nuevoEstado;
      Swal.fire(
        'Éxito',
        `Acceso ${nuevoEstado ? 'habilitado' : 'inhabilitado'} correctamente`,
        'success'
      );
    } catch (e: any) {
      console.error('[UsuariosAdmin] Error al actualizar aprobación', e);
      Swal.fire(
        'Error',
        e.message || 'No se pudo actualizar el estado',
        'error'
      );
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

    const fv = this.formularioUsuario.getRawValue();
    const supabase = this.supa.client;

    try {
      // 1) Crear usuario en Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fv.email!,
        password: fv.password!,
        options: {
          data: {
            rol: fv.rol,
            nombre: fv.nombre,
            apellido: fv.apellido,
            dni: fv.dni,
            obra_social: fv.obraSocial ?? null,
            fecha_nacimiento: fv.fechaNacimiento ?? null
          }
        }
      });

      if (signUpError) throw signUpError;
      const user = signUpData.user;
      if (!user) throw new Error('No se pudo crear el usuario en Auth.');

      // 2) Subir avatar (si hay)
      let avatarUrl: string | null = null;
      if (fv.imagenPerfil) {
        avatarUrl = await this.supa.uploadAvatar(user.id, fv.imagenPerfil, 1);
      }

      // 3) Edad calculada desde fechaNacimiento (opcional)
      const edadCalculada = fv.fechaNacimiento
        ? this.calcEdadFromISO(fv.fechaNacimiento)
        : null;

      // 4) Insertar fila en esquema_clinica.usuarios
      const nuevoUsuario: UsuarioCreate = {
        id: user.id,
        nombre: fv.nombre!,
        apellido: fv.apellido!,
        dni: fv.dni!,
        email: fv.email!,
        password: 'auth_managed',
        perfil: fv.rol!,
        edad: edadCalculada,
        obra_social: fv.rol === 'PACIENTE' ? fv.obraSocial ?? null : null,
        imagen_perfil_1: avatarUrl,
        imagen_perfil_2: null,
        esta_aprobado: fv.rol === 'ESPECIALISTA' ? false : true,
        mail_verificado: false,
        activo: true,
        idioma_preferido: 'es'
      };

      const { error: usuarioError } = await this.supa.upsertUsuario(nuevoUsuario);
      if (usuarioError) throw usuarioError;

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
      Swal.fire(
        'Error',
        err.message || 'No se pudo crear el usuario',
        'error'
      );
    }
  }

  getRolColor(rol: Rol): string {
    switch (rol) {
      case 'ADMIN':
        return 'warn';
      case 'ESPECIALISTA':
        return 'accent';
      case 'PACIENTE':
        return 'primary';
      default:
        return '';
    }
  }


  // async verHistoriaClinica(pacienteId: string, pacienteNombre: string): Promise<void> {
  //   try {
  //     const { data: sessionData } = await this.supa.getSession();
  //     if (!sessionData?.session) return;

  //     const especialistaId = sessionData.session.user.id;

  //     const { data: historias, error } = await this.supa.client
  //       .from('historia_clinica')
  //       .select('*')
  //       .eq('paciente_id', pacienteId)
  //       .eq('especialista_id', especialistaId)
  //       .order('fecha_registro', { ascending: false });

  //     if (error) {
  //       console.error('[PacientesEspecialista] Error al cargar historia clínica', error);
  //       return;
  //     }

  //     const historiasCompletas: HistoriaClinicaConExtras[] = await Promise.all(
  //       (historias || []).map(async (h: any) => {
  //         const { data: turno } = await this.supa.client
  //           .from('turnos')
  //           .select('fecha_hora_inicio')
  //           .eq('id', h.turno_id)
  //           .single();

  //         const { data: especialista } = await this.supa.client
  //           .from('usuarios')
  //           .select('nombre, apellido')
  //           .eq('id', h.especialista_id)
  //           .single();

  //         const especialistaNombre =
  //           especialista ? `${especialista.nombre} ${especialista.apellido}` : 'N/A';

  //         const fechaAtencion = turno?.fecha_hora_inicio
  //           ? new Date(turno.fecha_hora_inicio).toLocaleDateString('es-AR')
  //           : 'N/A';

  //         return {
  //           ...h,
  //           especialistaNombre,
  //           fechaAtencion
  //         } as HistoriaClinicaConExtras;
  //       })
  //     );

  //     this.dialog.open(HistoriaClinicaDialogComponent, {
  //       width: '800px',
  //       data: {
  //         pacienteNombre,
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

      const userId = sessionData.session.user.id;

      // Base: todas las historias del paciente
      let query = this.supa.client
        .from('historia_clinica')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('fecha_registro', { ascending: false });

      // Si NO es admin (ej. si reusás esta función para un especialista),
      // filtrás por el especialista logueado:
      if (!this.esAdmin) {
        query = query.eq('especialista_id', userId);
      }

      const { data: historias, error } = await query;

      if (error) {
        console.error('[UsuariosAdmin] Error al cargar historia clínica', error);
        return;
      }

      const historiasCompletas: HistoriaClinicaConExtras[] = await Promise.all(
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

          const especialistaNombre =
            especialista ? `${especialista.nombre} ${especialista.apellido}` : 'N/A';

          const fechaAtencion = turno?.fecha_hora_inicio
            ? new Date(turno.fecha_hora_inicio).toLocaleDateString('es-AR')
            : 'N/A';

          return {
            ...h,
            especialistaNombre,
            fechaAtencion
          } as HistoriaClinicaConExtras;
        })
      );

      // this.dialog.open(HistoriaClinicaDialogComponent, {
      //   width: '800px',
      //   data: {
      //     pacienteNombre,
      //     historias: historiasCompletas
      //   }
      // });


      this.dialog.open(HistoriaClinicaDialogComponent, {
        data: { pacienteNombre, historias },
        panelClass: 'hc-dialog-panel'
      });





    } catch (err: any) {
      console.error('[UsuariosAdmin] Error al cargar historia clínica', err);
    }
  }


  /** ---------- Descargar Excel de usuarios ---------- */
  async descargarExcel(): Promise<void> {
    try {
      const { data: usuarios, error } = await this.supa.client
        .from('usuarios')
        .select('*')
        .order('apellido', { ascending: true });

      if (error) {
        Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
        return;
      }

      const datosExcel = (usuarios || []).map((u: any) => ({
        ID: u.id,
        Nombre: u.nombre || '',
        Apellido: u.apellido || '',
        DNI: u.dni || '',
        Email: u.email || '',
        Rol: u.perfil || '',
        Aprobado: u.esta_aprobado ? 'Sí' : 'No',
        'Obra Social': u.obra_social || '',
        Edad: u.edad ?? '',
        'Fecha de Registro': u.fecha_registro
          ? new Date(u.fecha_registro).toLocaleDateString('es-AR')
          : ''
      }));

      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

      ws['!cols'] = [
        { wch: 36 }, // ID
        { wch: 15 }, // Nombre
        { wch: 15 }, // Apellido
        { wch: 12 }, // DNI
        { wch: 25 }, // Email
        { wch: 12 }, // Rol
        { wch: 10 }, // Aprobado
        { wch: 15 }, // Obra Social
        { wch: 8 },  // Edad
        { wch: 18 }  // Fecha Registro
      ];

      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `usuarios_${fecha}.xlsx`;

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



