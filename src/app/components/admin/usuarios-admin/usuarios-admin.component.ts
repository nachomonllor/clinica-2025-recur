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
// IMPORTAR MATSNACKBAR Y JSPDF
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import jsPDF from 'jspdf';

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
import { AccentColor, PerfilMin, TurnoAdminResumen, TurnoAdminSupabase, UsuarioAdmin, UsuarioAdminCard } from '../../../models/admin.model';
import { Rol } from '../../../models/tipos.model';
import { UsuarioCreate } from '../../../models/usuario.model';
import { HistoriaClinicaConExtras } from '../../../models/historia-clinica.model';
import { CapitalizarNombrePipe } from "../../../../pipes/capitalizar-nombre.pipe";
import { LoadingService } from '../../../../services/loading.service';
import { DoctorPipe } from "../../../../pipes/doctor.pipe";
import { HistoriaClinicaDialogComponent } from '../../historia-clinica-dialog/historia-clinica-dialog.component';
import { DatoDinamico, TipoDatoDinamico } from '../../../models/dato-dinamico.model';

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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CapitalizarNombrePipe,
    DoctorPipe,
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
  usuarios: UsuarioAdmin[] = [];

  search = '';
  filtroRol: 'todos' | Rol = 'todos';
  soloHabilitados = false;
  esAdmin = false;

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
    private dialog: MatDialog,
    private snackBar: MatSnackBar,

    private loading: LoadingService
  ) { }

  /*
  Verifica la sesión actual con Supabase para saber si el usuario logueado es "ADMIN" (para habilitar botones de gestión), 
  inicializa el formulario de creación y llama a cargar la lista de usuarios.
  */

  async ngOnInit(): Promise<void> {
    this.maxDateISO = this.toISODateLocal(new Date());
    this.inicializarFormulario();

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

  /*
  Es un getter ==> GETTER LO DEL FILTRO: se ejecuta automaticamente cuando cambias los filtros. 
    Devuelve la lista de tarjetas de usuario (UsuarioAdminCard) filtrada por:
    Rol (Paciente, Especialista, Todos).
    Estado (Solo habilitados).
    Texto del buscador (nombre, dni, etc.).
  */

  get filtered(): UsuarioAdminCard[] {
    const base = this.usuarios.map(u => this.toCardVM(u));
    const rolFiltered = this.filtroRol === 'todos' ? base : base.filter(u => u.rol === this.filtroRol);
    const habilitadosFiltered = this.soloHabilitados ? rolFiltered.filter(u => (u.rol === 'ESPECIALISTA' ? u.habilitado : true)) : rolFiltered;
    const term = (this.search ?? '').trim().toLowerCase();
    if (!term) return habilitadosFiltered;
    return habilitadosFiltered.filter(u => this.matchesSearch(u, term));
  }

  /*
  UTILITARIA PARA EL GETTER ANTERIOR. 
  Comprueba si un usuario especifico coincide con el texto que el usuario escribio en el buscador.
  */
  private matchesSearch(u: UsuarioAdminCard, term: string): boolean {
    const haystack = [u.nombre, u.apellido, u.email, u.obraSocial ?? '', ...(u.especialidades ?? [])].join(' ').toLowerCase();
    return haystack.includes(term);
  }

  // Transforma los datos crudos que vienen de la base de datos
  private toCardVM(u: UsuarioAdmin): UsuarioAdminCard {
    return {
      id: u.id,
      rol: u.rol,
      habilitado: u.rol === 'ESPECIALISTA' ? !!u.aprobado : true,   // <=== !!u.aprobado ==> uso la doble negacion para asegurarme de que la variable final sea true o false cuando viene booleano o undefined
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      email: u.email || '',
      dni: u.dni ?? undefined,
      avatarUrl: u.avatar_url ?? undefined,
      obraSocial: u.obra_social ?? undefined,
      edad: typeof u.edad === 'number' ? u.edad : undefined,
      color: this.pickColor(u.id),  // <==== SELECCIONA EL COLOR DEL USUARIO EN BASE A SU ID
      especialidades: undefined
    };
  }

  trackById(index: number, u: UsuarioAdminCard): string { return u.id; }


  /*
  Toma el nombre y apellido y devuelve las iniciales 
  (ej: "Juan Perez" ====> "JP") para mostrar cuando no hay foto de perfil.
  */
  initials(u: UsuarioAdminCard): string {
    const a = (u.nombre || '').trim()[0] ?? '';
    const b = (u.apellido || '').trim()[0] ?? '';
    return (a + b).toUpperCase() || 'U';
  }

  /*
  Traduce el codigo del rol (ej: 'ADMIN') a un texto mas facil dee ntender ('Administrador').
  */
  rolChip(u: UsuarioAdminCard): string {
    switch (u.rol) { case 'ADMIN': return 'Administrador'; case 'ESPECIALISTA': return 'Especialista'; case 'PACIENTE': return 'Paciente'; default: return u.rol; }
  }

  /*
  Genera un color consistente (purple, teal, etc.) basado en el ID del usuario. 
  Sirve para que la tarjeta de "Juan" siempre tenga el mismo color.
  */
  private pickColor(id: string): AccentColor {
    const colors: AccentColor[] = ['purple', 'teal', 'blue', 'pink'];
    let hash = 0; for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    return colors[Math.abs(hash) % colors.length];
  }

  async verHistoria(u: UsuarioAdminCard): Promise<void> {
    await this.verHistoriaClinica(u.id, `${u.nombre} ${u.apellido}`.trim());
  }

  async descargarTurnos(u: UsuarioAdminCard): Promise<void> {
    const origen = this.usuarios.find(x => x.id === u.id);
    if (!origen) return;
    await this.descargarTurnosUsuario(origen);
  }

  // HELPER PARA EL BOTÓN PDF EN EL HTML
  async descargarPdf(u: UsuarioAdminCard): Promise<void> {
    const origen = this.usuarios.find(x => x.id === u.id);
    if (!origen) return;
    await this.descargarTurnosPdf(origen);
  }

  async toggleHabilitado(u: UsuarioAdminCard): Promise<void> {
    if (u.rol !== 'ESPECIALISTA') return;
    const origen = this.usuarios.find(x => x.id === u.id);
    if (!origen) return;
    await this.toggleAprobacion(origen);
  }


  /*
  Crea el FormGroup (formulario reactivo) para crear nuevos usuarios. 
 ACA SE DEFINIEN LAS VALIDACIONES (MAIL VALIDO, CONTRASEÑA MINIMA, ETC) 
 y una lógica especial: si el rol es "PACIENTE" ====> hace obligatorio el campo "Obra Social"
  */
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
      imagenPerfil: this.fb.control<File | null>(null, Validators.required)
    });
    this.formularioUsuario.get('rol')!.valueChanges.subscribe(rol => {
      const obraSocialCtrl = this.formularioUsuario.get('obraSocial')!;
      if (rol === 'PACIENTE') obraSocialCtrl.setValidators([Validators.required]);
      else { obraSocialCtrl.clearValidators(); obraSocialCtrl.setValue(null); }
      obraSocialCtrl.updateValueAndValidity();
    });
  }

  /* 
  Se usa para filtrar la lista interna usuariosFiltrados (usada quizás en otra vista o móvil). 
  Actualiza la variable filtro y busca coincidencias parciales.
  */
  aplicarFiltro(valor: string, preferId?: string): void {
    this.filtroTexto = valor ?? '';
    this.filtro = this.filtroTexto.trim().toLowerCase();
    this.usuariosFiltrados = this.filtro
      ? this.usuarios.filter(u => `${u.apellido} ${u.nombre} ${u.email} ${u.rol}`.toLowerCase().includes(this.filtro))
      : [...this.usuarios];
    const candidato = preferId ?? this.usuarioSeleccionado?.id;
    if (candidato) {
      const encontrado = this.usuariosFiltrados.find(u => u.id === candidato);
      if (encontrado) void this.seleccionarUsuario(encontrado, !!preferId);
    } else if (this.usuariosFiltrados.length) {
      void this.seleccionarUsuario(this.usuariosFiltrados[0], true);
    } else {
      this.usuarioSeleccionado = undefined;
      this.turnosUsuario = [];
      this.cargandoTurnos = false;
    }
  }

  //trackById - trackUsuario - trackTurno====> 
  // SON Optimizaciones para *ngFor en Angular. 
  // Evitan que se renderice toda la lista de nuevo si solo cambia un elemento.
  trackUsuario(index: number, u: UsuarioAdmin): string { return u.id; }
  trackTurno(index: number, t: TurnoAdminResumen): string { return t.id; }

  async seleccionarUsuario(usuario: UsuarioAdmin, forceReload = false): Promise<void> {
    if (!forceReload && this.usuarioSeleccionado?.id === usuario.id) return;
    this.usuarioSeleccionado = usuario;
    await this.cargarTurnosUsuario(usuario);
  }


  /*
    Hace la consulta SELECT a la tabla usuarios de Supabase, 
    trayendo todos los datos necesarios y los guarda en el array this.usuarios. 
    Usa un spinner de carga (loading).

   Con el MAP: RESUELVE EL problema DE que la base de datos (Supabase) a veces  devuelve nombres feos, nulos, o formatos que al Frontend no le gustan.
    id:                     u.id,                    // Pasa igual
    rol:                    u.perfil,                // CAMBIO DE NOMBRE: 'perfil' ahora es 'rol'
    aprobado:               !!u.esta_aprobado,       // LIMPIEZA: Convierte null/undefined a true/false
    nombre:                 u.nombre || '',          // PROTECCION: Si es null, pone string vacío
    apellido:               u.apellido || '',        // PROTECCION
    avatar_url:             u.imagen_perfil_1,       // CAMBIO DE NOMBRE: De 'imagen_perfil_1' a 'avatar_url'
  */

  private async cargarUsuarios(): Promise<void> {
    this.loading.show();
    try {
      const { data, error } = await this.supa.client.from('usuarios').select('id, perfil, esta_aprobado, nombre, apellido, email, dni, obra_social, imagen_perfil_1, edad, fecha_registro, activo').order('apellido', { ascending: true });
      if (error) throw error;
      this.usuarios = (data || []).map((u: any) => ({
        id: u.id, rol: u.perfil, aprobado: !!u.esta_aprobado, nombre: u.nombre || '', apellido: u.apellido || '', email: u.email || '',
        dni: u.dni, avatar_url: u.imagen_perfil_1, obra_social: u.obra_social, edad: u.edad, fecha_registro: u.fecha_registro, activo: u.activo
      }));
      this.aplicarFiltro(this.filtroTexto, this.usuarioSeleccionado?.id);
    } catch (e) { console.error(e); }
    finally {
      this.loading.hide();
    }
  }


  /*
  Se dispara al seleccionar un usuario. 
  Llama a obtenerTurnosUsuario y formata los datos para mostrarlos en la lista lateral o modal.
  */
  private async cargarTurnosUsuario(usuario: UsuarioAdmin): Promise<void> {

    this.loading.show();
    this.cargandoTurnos = true;
    try {
      const turnos = await this.obtenerTurnosUsuario(usuario);
      this.turnosUsuario = turnos.map(t => ({
        id: t.id,
        fechaTexto: t.fecha_hora_inicio ? new Date(t.fecha_hora_inicio).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Fecha no disponible',
        estado: (t.estado?.codigo ?? 'PENDIENTE').toString().toLowerCase(),
        especialidad: t.especialidad?.nombre || 'Sin especialidad',
        contraparte: usuario.rol === 'PACIENTE' ? `Especialista: ${this.nombreCompleto(t.especialista)}` : `Paciente: ${this.nombreCompleto(t.paciente)}`
      }));
    } catch (e) { this.turnosUsuario = []; }
    finally {
      this.cargandoTurnos = false;
      this.loading.hide();
    }
  }

  /*
  obtenerTurnosUsuario(usuario): Es la consulta "fuerte". 
  Hace un SELECT a la tabla turnos con varios JOINs (paciente, especialista, especialidad, estado). 
  FILTRA FIJANDOSE SI EL USUARIO ES PACIENTE, BUSCA LOS TURNOS COMO PACIENTEE, SI ES MEDICO COMO MEDICO
  */
  private async obtenerTurnosUsuario(usuario: UsuarioAdmin): Promise<TurnoAdminSupabase[]> {
    let query = this.supa.client.from('turnos').select(`id, fecha_hora_inicio, motivo, comentario, estado:estados_turno!fk_turno_estado(codigo), especialidad:especialidades!fk_turno_especialidad(nombre), paciente:usuarios!fk_turno_paciente(nombre, apellido), especialista:usuarios!fk_turno_especialista(nombre, apellido)`);
    if (usuario.rol === 'PACIENTE') query = query.eq('paciente_id', usuario.id);
    else if (usuario.rol === 'ESPECIALISTA') query = query.eq('especialista_id', usuario.id);
    else query = query.or(`paciente_id.eq.${usuario.id},especialista_id.eq.${usuario.id}`);
    const { data, error } = await query.order('fecha_hora_inicio', { ascending: false });
    if (error) throw error;
    return (data || []) as TurnoAdminSupabase[];
  }

  // Concatena apellido y nombre
  private nombreCompleto(p?: PerfilMin | null): string { return p ? `${p.apellido} ${p.nombre}` : 'Sin datos'; }
 
  // Formatea una fecha ISO a texto legible (ej: "8 de diciembre de 2025").
  fechaLarga(iso?: string | null): string { return iso ? new Date(iso).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Sin registrar'; }


  async descargarTurnosUsuario(usuario: UsuarioAdmin): Promise<void> {

    this.loading.show();

    try {
      const turnos = await this.obtenerTurnosUsuario(usuario);
      if (!turnos.length) { Swal.fire('Sin turnos', 'No encontramos turnos asociados.', 'info'); return; }
      const datosExcel = turnos.map(t => ({ 'Turno ID': t.id, Fecha: t.fecha_hora_inicio ? new Date(t.fecha_hora_inicio).toLocaleString() : '', Especialidad: t.especialidad?.nombre || '', Estado: (t.estado?.codigo || '').toUpperCase(), Paciente: this.nombreCompleto(t.paciente), Especialista: this.nombreCompleto(t.especialista) }));
      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Turnos');
      XLSX.writeFile(wb, `turnos_${usuario.apellido}_${Date.now()}.xlsx`);
      Swal.fire({ icon: 'success', title: 'Descarga completa', timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire('Error', 'No se pudo generar Excel', 'error');
    }
    finally {
      this.loading.hide();
    }
  }


  async descargarTurnosPdf(usuario: UsuarioAdmin): Promise<void> {
    const turnosParaExportar = await this.obtenerTurnosUsuario(usuario);

    if (!turnosParaExportar.length) {
      this.snackBar.open('No hay turnos para exportar.', 'Cerrar', { duration: 2500 });
      return;
    }

    this.snackBar.open('Generando PDF con historial clínico...', 'OK', { duration: 2000 });

    // PASO 1: Obtener IDs
    const idsTurnos = turnosParaExportar.map(t => t.id);

    // PASO 2: Buscar datos médicos
    const { data: historiasData } = await this.supa.client
      .from('historia_clinica')
      .select(`*, historia_datos_dinamicos (*)`)
      .in('turno_id', idsTurnos);

    const historiasMap = new Map();
    if (historiasData) {
      historiasData.forEach((h: any) => historiasMap.set(h.turno_id, h));
    }

    // --- GENERACIÓN PDF ---
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 15;
    const marginBottom = 15;
    const cardPadding = 5;
    const lineHeight = 5;
    const paragraphSpacing = 2;
    const headerBottom = 32;

    // const svgLogo = `... TU SVG ACÁ ...`; // Mantené tu variable svgLogo tal cual la tenés

    const svgLogo = `
      <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0099ff;stop-opacity:1" /> 
            <stop offset="100%" style="stop-color:#0055b3;stop-opacity:1" /> 
          </linearGradient>
        </defs>
        <g transform="translate(50, 50)">
          <path d="M 80 0 H 120 A 10 10 0 0 1 130 10 V 80 H 200 A 10 10 0 0 1 210 90 V 130 A 10 10 0 0 1 200 140 H 130 V 210 A 10 10 0 0 1 120 220 H 80 A 10 10 0 0 1 70 210 V 140 H 0 A 10 10 0 0 1 -10 130 V 90 A 10 10 0 0 1 0 80 H 70 V 10 A 10 10 0 0 1 80 0 Z" fill="url(#gradBlue)" transform="scale(0.5) translate(30,30)"/>
          <path d="M 60 115 L 90 145 L 150 85" stroke="white" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.5) translate(30,30)"/>
        </g>
        <g transform="translate(180, 115)">
          <text x="0" y="-25" font-family="Arial" font-weight="bold" font-size="28" fill="#0077cc">CLINICA</text>
          <text x="0" y="25" font-family="Arial" font-weight="bold" font-size="52" fill="#003366">MONLLOR</text>
        </g>
      </svg>`;


    const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgLogo)));

    const generarDocumento = (pngDataUrl?: string) => {

      const drawHeader = () => {

        // Mantené tu lógica de header acá (rect, addImage, text, etc)
        doc.setFillColor(17, 24, 39);
        doc.rect(0, 0, pageWidth, headerBottom, 'F');
        if (pngDataUrl) {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(marginX - 2, 5, 65, 22, 2, 2, 'F');
          doc.addImage(pngDataUrl, 'PNG', marginX, 6, 60, 20);
        }
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text('Reporte de Atenciones', pageWidth - marginX, 18, { align: 'right' });
        doc.setFontSize(10);
        doc.text(`Usuario: ${usuario.nombre} ${usuario.apellido}`, pageWidth - marginX, 24, { align: 'right' });
      };

      drawHeader();
      let y = headerBottom + 10;
      const contentWidth = pageWidth - (marginX * 2);

      turnosParaExportar.forEach((t, index) => {
        const paragraphs: { lines: string[]; bold?: boolean }[] = [];
        const anchoTexto = contentWidth - cardPadding * 2;

        const addParagraph = (text: string, opts?: { bold?: boolean }) => {
          paragraphs.push({ lines: doc.splitTextToSize(text, anchoTexto), bold: opts?.bold });
        };

        // CABECERA DEL TURNO 
        const fechaStr = t.fecha_hora_inicio ? new Date(t.fecha_hora_inicio).toLocaleDateString('es-AR') : 'Sin fecha';
        addParagraph(`Turno #${index + 1} · ${fechaStr} · (${(t.estado?.codigo || '').toUpperCase()})`, { bold: true });
        addParagraph(`Especialidad: ${t.especialidad?.nombre || ''} | Profesional: ${this.nombreCompleto(t.especialista)}`);

        //  DATOS CLINICOS
        const hc = historiasMap.get(t.id);

        if (hc) {
          // Datos Fijos (IGUAL)
          let detalles = [];
          if (hc.altura) detalles.push(`Altura: ${hc.altura} cm`);
          if (hc.peso) detalles.push(`Peso: ${hc.peso} kg`);
          if (hc.temperatura) detalles.push(`Temp: ${hc.temperatura} °C`);
          if (hc.presion) detalles.push(`Presión: ${hc.presion}`);
          if (detalles.length > 0) addParagraph('Datos Biométricos: ' + detalles.join(' | '));

          // ============================================================
          // CORRECCIÓN DE DATOS DINÁMICOS 
          // ============================================================
          if (hc.historia_datos_dinamicos && hc.historia_datos_dinamicos.length > 0) {
            addParagraph('Datos Dinámicos:', { bold: true });

            hc.historia_datos_dinamicos.forEach((d: any) => {
              let valorPrint = '';

              // Verificación explícita de tipos (NO usar || encadenados)
              if (d.valor_texto !== null && d.valor_texto !== undefined && d.valor_texto !== '') {
                valorPrint = d.valor_texto;
              }
              else if (d.valor_numerico !== null && d.valor_numerico !== undefined) {
                valorPrint = d.valor_numerico.toString();
                // Agregamos unidades visuales
                if (d.tipo_control === 'RANGO_0_100') valorPrint += ' %';
                if (d.clave && d.clave.toLowerCase().includes('glucosa')) valorPrint += ' mg/dL';
              }
              else if (d.valor_boolean !== null && d.valor_boolean !== undefined) {
                // Forzamos SI / NO
                valorPrint = d.valor_boolean ? 'SI' : 'NO';
              } else {
                valorPrint = '-'; // Valor por defecto si todo es null
              }

              addParagraph(`• ${d.clave}: ${valorPrint}`);
            });
          }
          // ============================================================
        } else {
          if (t.comentario) addParagraph(`Reseña: ${t.comentario}`);
        }

        // ... (CÁLCULO DE ESPACIO Y DIBUJO IGUAL QUE ANTES) ...
        let cardHeight = cardPadding * 2;
        paragraphs.forEach((p, i) => {
          cardHeight += p.lines.length * lineHeight;
          if (i > 0) cardHeight += paragraphSpacing;
        });

        if (y + cardHeight > pageHeight - marginBottom) {
          doc.addPage();
          drawHeader();
          y = headerBottom + 10;
        }

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.4);
        doc.roundedRect(marginX, y, contentWidth, cardHeight, 3, 3, 'FD');

        let textY = y + cardPadding + lineHeight;
        doc.setTextColor(51, 65, 85);
        paragraphs.forEach((p, i) => {
          doc.setFont('helvetica', p.bold ? 'bold' : 'normal');
          p.lines.forEach(l => { doc.text(l, marginX + cardPadding + 2, textY); textY += lineHeight; });
          if (i < paragraphs.length - 1) textY += paragraphSpacing;
        });

        y += cardHeight + 6;
      });

      const nombreArchivo = `Reporte_${usuario.apellido}_${new Date().getTime()}.pdf`;
      doc.save(nombreArchivo);
    };

    // ... (CARGA DE IMAGEN IGUAL) ...
    const img = new Image();
    img.src = svgBase64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600; canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        generarDocumento(canvas.toDataURL('image/png'));
      } else generarDocumento();
    };
    img.onerror = () => generarDocumento();
  }



  private toISODateLocal(date: Date): string { const y = date.getFullYear(); 
    const m = String(date.getMonth() + 1).padStart(2, '0'); 
    const d = String(date.getDate()).padStart(2, '0'); 
    return `${y}-${m}-${d}`;
  }
  private calcEdadFromISO(iso: string): number 
  { 
    const [y, m, d] = iso.split('-').map(Number);
     const today = new Date(); let edad = today.getFullYear() - y; 
     const month = today.getMonth() + 1; 
     const day = today.getDate(); 
     if (month < m || (month === m && day < d)) edad--; return edad; 
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



  /*
    alternar aprobacion:
    Cambia el campo esta_aprobado (true - false) en la base de datos ==> UPDATE
    Sirve para que el Admin habilite o deshabilite especialistas 
  */
  async toggleAprobacion(usuario: UsuarioAdmin): Promise<void> { 
    if (usuario.rol !== 'ESPECIALISTA') return;
     const nuevoEstado = !usuario.aprobado; 
     try { const { error } = await this.supa.client.from('usuarios').update({ esta_aprobado: nuevoEstado }).eq('id', usuario.id);
      if (error) throw error; usuario.aprobado = nuevoEstado; 
      Swal.fire('Éxito', `Acceso ${nuevoEstado ? 'habilitado' : 'inhabilitado'}`, 'success'); 
    } catch (e) 
    { Swal.fire('Error', 'No se pudo actualizar', 'error'); }
   }
   
  crearUsuario(): void { this.mostrarFormulario = true; this.formularioUsuario.reset(); this.imagenPrevia = null; }

  cancelarCreacion(): void { this.mostrarFormulario = false; this.formularioUsuario.reset(); this.imagenPrevia = null; }

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


  async verHistoriaClinica(pacienteId: string, pacienteNombre: string): Promise<void> {

    this.loading.show();

    try {
      const { data: sessionData } = await this.supa.getSession();
      if (!sessionData?.session) return;

      const userId = sessionData.session.user.id;

      // 1. OBTENER HISTORIAS + DATOS DINÁMICOS
      let query = this.supa.client
        .from('historia_clinica')
        .select(`
            *,
            historia_datos_dinamicos (*)
        `)
        .eq('paciente_id', pacienteId)
        .order('fecha_registro', { ascending: false });

      // Si NO es admin, filtramos por especialista (por seguridad, aunque este componente es de admin)
      if (!this.esAdmin) {
        query = query.eq('especialista_id', userId);
      }

      const { data: historias, error } = await query;

      if (error) {
        console.error('[UsuariosAdmin] Error al cargar historia clínica', error);
        return;
      }

      // 2. MAPEAR DATOS COMPLETOS (Especialidad, Especialista, Fecha, DINÁMICOS)
      const historiasCompletas: HistoriaClinicaConExtras[] = await Promise.all(
        (historias || []).map(async (h: any) => {

          // Traemos Fecha, Comentario y ESPECIALIDAD del turno original
          const { data: turno } = await this.supa.client
            .from('turnos')
            .select('fecha_hora_inicio, comentario, especialidades(nombre)')
            .eq('id', h.turno_id)
            .single();

          // Traemos datos del Especialista
          const { data: especialista } = await this.supa.client
            .from('usuarios')
            .select('nombre, apellido')
            .eq('id', h.especialista_id)
            .single();

          // Formatear nombre especialista
          const especialistaNombre = especialista
            ? `${especialista.nombre} ${especialista.apellido}`
            : '';

          // Formatear fecha atención
          const fechaAtencion = turno?.fecha_hora_inicio
            ? new Date(turno.fecha_hora_inicio).toLocaleDateString('es-AR')
            : '';

          // Formatear Especialidad (Solución del error de array/objeto)
          const rawEspec: any = turno?.especialidades;
          const nombreEspecialidad = rawEspec?.nombre || rawEspec?.[0]?.nombre || '';

          // --- CORRECCIÓN AQUÍ: PROCESAR DATOS DINÁMICOS ---
          const datosDinamicosProcesados: DatoDinamico[] = (h.historia_datos_dinamicos || []).map((d: any) => {
            let valor: any = '';
            let tipo: TipoDatoDinamico = 'texto';
            let unidad: string | null = null;

            if (d.valor_texto !== null) {
              valor = d.valor_texto;
              tipo = 'texto';
            } else if (d.valor_numerico !== null) {
              valor = d.valor_numerico;
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

          return {
            ...h,
            paciente: pacienteNombre,
            especialidad: nombreEspecialidad,
            especialistaNombre,
            fechaAtencion,
            resena: turno?.comentario || '', // Mapeamos el comentario del turno a la propiedad 'resena'
            datos_dinamicos: datosDinamicosProcesados // <--- ¡AQUÍ ESTÁ LA MAGIA!
          } as HistoriaClinicaConExtras;
        })
      );

      // 3. ABRIR EL DIÁLOGO COMPARTIDO
      this.dialog.open(HistoriaClinicaDialogComponent, {
        width: '800px',
        data: {
          pacienteNombre,
          historias: historiasCompletas
        },
        panelClass: 'hc-dialog-panel'
      });

    } catch (err: any) {
      console.error('[UsuariosAdmin] Error al cargar historia clínica', err);
    }
    finally {
      this.loading.hide();
    }
  }


  async hacerAdmin(u: UsuarioAdminCard): Promise<void> {
    if (!this.esAdmin) return;

    // 1. Confirmación con SweetAlert
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de convertir a ${u.nombre} ${u.apellido} en ADMINISTRADOR. Tendrá acceso total al sistema.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, hacer Admin',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    this.loading.show();

    try {
      // 2. Actualizar en Base de Datos (campo 'perfil' a 'ADMIN')
      const { error } = await this.supa.client
        .from('usuarios')
        .update({ perfil: 'ADMIN' })
        .eq('id', u.id);

      if (error) throw error;

      Swal.fire({
        title: '¡Actualizado!',
        text: `El usuario ahora es Administrador.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      // 3. Recargar la lista para reflejar el cambio (la tarjeta desaparecerá o cambiará de color según tus filtros)
      await this.cargarUsuarios();

    } catch (e: any) {
      console.error(e);
      Swal.fire('Error', 'No se pudo actualizar el rol del usuario.', 'error');
    } finally {
      this.loading.hide();
    }
  }


  // ====================================================================
  //  DESCARGA EXCEL DE TODOS LOS USUARIOS (REQUERIMIENTO ADMIN)
  // ====================================================================
  async descargarExcel(): Promise<void> {

    if (!this.usuarios || this.usuarios.length === 0) {
      Swal.fire('Atención', 'No hay usuarios para exportar.', 'warning');
      return;
    }

    this.loading.show();

    try {
      // 1. CLONAR Y ORDENAR POR ROL
      // Usamos [...this.usuarios] para crear una copia y no desordenar la vista actual.
      // localeCompare ordena alfabéticamente: ADMIN -> ESPECIALISTA -> PACIENTE

      // const usuariosOrdenados = [...this.usuarios].sort((a, b) => {
      //   return a.rol.localeCompare(b.rol);
      // });

      const usuariosOrdenados = [...this.usuarios].sort((a, b) => {
        return a.email.localeCompare(b.email);
      });

      // ===> HELPER PARA CAPITALIZAR (Igual que en el PDF) <===
      const toTitleCase = (str: string) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
      };

      // 2. Mapear los datos YA ORDENADOS
      const dataParaExcel = usuariosOrdenados.map(u => ({
        Rol: u.rol,
        Apellido: toTitleCase(u.apellido), // <============
        Nombre: toTitleCase(u.nombre),     // <============
        DNI: u.dni,
        Edad: u.edad,
        Email: u.email,
        'Obra Social': u.obra_social || 'N/A',
        'Estado': u.rol === 'ESPECIALISTA' ? (u.aprobado ? 'Habilitado' : 'Pendiente') : 'Activo',
        'Fecha Registro': u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString('es-AR') : ''
      }));

      // 3. Crear hoja y libro (Igual que antes)
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataParaExcel);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

      // 4. Guardar
      const fecha = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Usuarios_Clinica_${fecha}.xlsx`);

      Swal.fire({
        icon: 'success',
        title: 'Exportación completada',
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al exportar Excel:', error);
      Swal.fire('Error', 'Hubo un problema al generar el archivo Excel.', 'error');
    } finally {
      this.loading.hide();
    }

  }

  // ====================================================================
  //  DESCARGA PDF DE TODOS LOS USUARIOS (ESTILO TABLA CON LOGO)
  // ====================================================================
  async descargarUsuariosPdf(): Promise<void> {

    // 1. Validar que existan datos
    if (!this.usuarios || this.usuarios.length === 0) {
      this.snackBar.open('No hay usuarios para exportar.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading.show();
    this.snackBar.open('Generando PDF de usuarios...', 'Espere', { duration: 2000 });

    try {
      // 2. ORDENAR POR ROL (Admin -> Especialista -> Paciente)
      const usuariosOrdenados = [...this.usuarios].sort((a, b) => a.rol.localeCompare(b.rol));

      // 3. FUNCIÓN HELPER PARA CAPITALIZAR (Title Case)
      // Convierte "JUAN CARLOS" -> "Juan Carlos"
      const toTitleCase = (str: string | null | undefined) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
      };

      // 4. CONFIGURACIÓN PDF Y LOGO
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 10;
      const headerBottom = 32;

      // Logo SVG (El mismo de la Clínica)
      const svgLogo = `
        <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#0099ff;stop-opacity:1" /> 
              <stop offset="100%" style="stop-color:#0055b3;stop-opacity:1" /> 
            </linearGradient>
          </defs>
          <g transform="translate(50, 50)">
            <path d="M 80 0 H 120 A 10 10 0 0 1 130 10 V 80 H 200 A 10 10 0 0 1 210 90 V 130 A 10 10 0 0 1 200 140 H 130 V 210 A 10 10 0 0 1 120 220 H 80 A 10 10 0 0 1 70 210 V 140 H 0 A 10 10 0 0 1 -10 130 V 90 A 10 10 0 0 1 0 80 H 70 V 10 A 10 10 0 0 1 80 0 Z" fill="url(#gradBlue)" transform="scale(0.5) translate(30,30)"/>
            <path d="M 60 115 L 90 145 L 150 85" stroke="white" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.5) translate(30,30)"/>
          </g>
          <g transform="translate(180, 115)">
            <text x="0" y="-25" font-family="Arial" font-weight="bold" font-size="28" fill="#0077cc">CLINICA</text>
            <text x="0" y="25" font-family="Arial" font-weight="bold" font-size="52" fill="#003366">MONLLOR</text>
          </g>
        </svg>`;
      const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgLogo)));

      // 5. FUNCIÓN PRINCIPAL DE DIBUJO
      const generarDocumento = (pngDataUrl?: string) => {

        // --- DIBUJAR CABECERA DE PÁGINA ---
        const drawPageHeader = () => {
          // Fondo oscuro superior
          doc.setFillColor(17, 24, 39);
          doc.rect(0, 0, pageWidth, headerBottom, 'F');

          // Logo
          if (pngDataUrl) {
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(marginX - 2, 5, 65, 22, 2, 2, 'F');
            doc.addImage(pngDataUrl, 'PNG', marginX, 6, 60, 20);
          }

          // Títulos
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16);
          doc.text('Listado de Usuarios', pageWidth - marginX, 18, { align: 'right' });

          // Subtítulos
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(209, 213, 219); // Gris claro
          const hoy = new Date().toLocaleDateString('es-AR');
          doc.text(`Fecha: ${hoy}`, pageWidth - marginX, 26, { align: 'right' });
          doc.text(`Total: ${usuariosOrdenados.length} registros`, pageWidth - marginX, 30, { align: 'right' });
        };

        // --- DEFINICIÓN DE COLUMNAS ---
        // x: posición horizontal, w: ancho reservado
        const cols = [
          { header: 'ROL', x: 10 },
          { header: 'APELLIDO Y NOMBRE', x: 40 },
          { header: 'DNI', x: 100 },
          { header: 'EDAD', x: 125 },
          { header: 'EMAIL', x: 140 },
          { header: 'ESTADO', x: 190 }
        ];

        let y = headerBottom + 10;

        // --- DIBUJAR CABECERA DE TABLA ---
        const drawTableHead = () => {
          doc.setFillColor(59, 130, 246); // Azul institucional
          doc.rect(marginX, y, pageWidth - (marginX * 2), 8, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);

          cols.forEach(col => {
            doc.text(col.header, col.x, y + 5);
          });
          y += 8;
        };

        // INICIO DEL DIBUJO
        drawPageHeader();
        drawTableHead();

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        // ITERACIÓN DE USUARIOS
        usuariosOrdenados.forEach((u, index) => {
          // Salto de página si se acaba el espacio
          if (y > pageHeight - 15) {
            doc.addPage();
            drawPageHeader();
            y = headerBottom + 10;
            drawTableHead();
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
          }

          // Fondo alternado (Efecto Cebra)
          if (index % 2 === 1) {
            doc.setFillColor(243, 244, 246); // Gris muy suave
            doc.rect(marginX, y, pageWidth - (marginX * 2), 8, 'F');
          }

          doc.setTextColor(51, 65, 85); // Texto gris oscuro

          // 1. Rol (Cortado si es largo)
          doc.setFont('helvetica', 'bold');
          doc.text(u.rol.substring(0, 12), cols[0].x, y + 5);

          // 2. Apellido y Nombre (Capitalizado)
          doc.setFont('helvetica', 'normal');
          const apellidoCap = toTitleCase(u.apellido);
          const nombreCap = toTitleCase(u.nombre);
          const nombreCompleto = `${apellidoCap}, ${nombreCap}`;

          // Truncar si es muy largo para que no pise el DNI
          const nombreFit = nombreCompleto.length > 28 ? nombreCompleto.substring(0, 28) + '...' : nombreCompleto;
          doc.text(nombreFit, cols[1].x, y + 5);

          // 3. DNI
          doc.text(u.dni || '-', cols[2].x, y + 5);

          // 4. Edad
          doc.text(u.edad ? u.edad.toString() : '-', cols[3].x, y + 5);

          // 5. Email (Truncar)
          const email = u.email || '';
          const emailFit = email.length > 25 ? email.substring(0, 25) + '...' : email;
          doc.text(emailFit, cols[4].x, y + 5);

          // 6. Estado (Coloreado)
          let estado = 'OK';
          if (u.rol === 'ESPECIALISTA') estado = u.aprobado ? 'Hab.' : 'Pend.';

          if (estado === 'Pend.') doc.setTextColor(220, 38, 38); // Rojo
          else if (estado === 'Hab.' || estado === 'OK') doc.setTextColor(22, 163, 74); // Verde

          doc.text(estado, cols[5].x, y + 5);

          // Línea divisoria fina
          doc.setDrawColor(229, 231, 235);
          doc.line(marginX, y + 8, pageWidth - marginX, y + 8);

          y += 8; // Avanzar renglón
        });

        // GUARDAR ARCHIVO
        const nombreArchivo = `Usuarios_Sistema_${new Date().getTime()}.pdf`;
        doc.save(nombreArchivo);
      };

      // 6. CARGAR IMAGEN -> EJECUTAR DIBUJO
      const img = new Image();
      img.src = svgBase64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          generarDocumento(canvas.toDataURL('image/png'));
        } else {
          generarDocumento();
        }
        this.loading.hide(); // Ocultar spinner
      };

      img.onerror = () => {
        generarDocumento(); // Generar sin logo si falla
        this.loading.hide();
      };

    } catch (e) {
      console.error('Error al generar PDF', e);
      this.snackBar.open('Error al generar el PDF.', 'Cerrar');
      this.loading.hide();
    }
  }


}




