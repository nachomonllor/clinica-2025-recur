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
import { HistoriaClinicaDialogComponent } from './historia-clinica-dialog.component';
import { AccentColor, PerfilMin, TurnoAdminResumen, TurnoAdminSupabase, UsuarioAdmin, UsuarioAdminCard } from '../../../models/admin.model';
import { Rol } from '../../../models/tipos.model';
import { UsuarioCreate } from '../../../models/usuario.model';
import { HistoriaClinicaConExtras } from '../../../models/historia-clinica.model';
import { CapitalizarNombrePipe } from "../../../../pipes/capitalizar-nombre.pipe";
import { LoadingService } from '../../../../services/loading.service';
import { DoctorPipe } from "../../../../pipes/doctor.pipe";


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
    DoctorPipe
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

  get filtered(): UsuarioAdminCard[] {
    const base = this.usuarios.map(u => this.toCardVM(u));
    const rolFiltered = this.filtroRol === 'todos' ? base : base.filter(u => u.rol === this.filtroRol);
    const habilitadosFiltered = this.soloHabilitados ? rolFiltered.filter(u => (u.rol === 'ESPECIALISTA' ? u.habilitado : true)) : rolFiltered;
    const term = (this.search ?? '').trim().toLowerCase();
    if (!term) return habilitadosFiltered;
    return habilitadosFiltered.filter(u => this.matchesSearch(u, term));
  }

  private matchesSearch(u: UsuarioAdminCard, term: string): boolean {
    const haystack = [u.nombre, u.apellido, u.email, u.obraSocial ?? '', ...(u.especialidades ?? [])].join(' ').toLowerCase();
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
      especialidades: undefined
    };
  }

  trackById(index: number, u: UsuarioAdminCard): string { return u.id; }
  initials(u: UsuarioAdminCard): string {
    const a = (u.nombre || '').trim()[0] ?? '';
    const b = (u.apellido || '').trim()[0] ?? '';
    return (a + b).toUpperCase() || 'U';
  }
  rolChip(u: UsuarioAdminCard): string {
    switch (u.rol) { case 'ADMIN': return 'Administrador'; case 'ESPECIALISTA': return 'Especialista'; case 'PACIENTE': return 'Paciente'; default: return u.rol; }
  }
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

  // ... (Inicialización, filtros, etc.)
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

  trackUsuario(index: number, u: UsuarioAdmin): string { return u.id; }
  trackTurno(index: number, t: TurnoAdminResumen): string { return t.id; }

  async seleccionarUsuario(usuario: UsuarioAdmin, forceReload = false): Promise<void> {
    if (!forceReload && this.usuarioSeleccionado?.id === usuario.id) return;
    this.usuarioSeleccionado = usuario;
    await this.cargarTurnosUsuario(usuario);
  }

  // ... (cargarUsuarios, cargarTurnosUsuario, obtenerTurnosUsuario, helpers fecha)
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

  private async obtenerTurnosUsuario(usuario: UsuarioAdmin): Promise<TurnoAdminSupabase[]> {



    let query = this.supa.client.from('turnos').select(`id, fecha_hora_inicio, motivo, comentario, estado:estados_turno!fk_turno_estado(codigo), especialidad:especialidades!fk_turno_especialidad(nombre), paciente:usuarios!fk_turno_paciente(nombre, apellido), especialista:usuarios!fk_turno_especialista(nombre, apellido)`);
    if (usuario.rol === 'PACIENTE') query = query.eq('paciente_id', usuario.id);
    else if (usuario.rol === 'ESPECIALISTA') query = query.eq('especialista_id', usuario.id);
    else query = query.or(`paciente_id.eq.${usuario.id},especialista_id.eq.${usuario.id}`);
    const { data, error } = await query.order('fecha_hora_inicio', { ascending: false });
    if (error) throw error;
    return (data || []) as TurnoAdminSupabase[];
  }

  private nombreCompleto(p?: PerfilMin | null): string { return p ? `${p.apellido} ${p.nombre}` : 'Sin datos'; }
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

  // =========================================================================================
  //  MÉTODO PDF REPLICADO (DISEÑO IDÉNTICO AL PACIENTE)
  // =========================================================================================
  async descargarTurnosPdf(usuario: UsuarioAdmin): Promise<void> {
    const turnosParaExportar = await this.obtenerTurnosUsuario(usuario);

    if (!turnosParaExportar.length) {
      this.snackBar.open('No hay turnos para exportar.', 'Cerrar', { duration: 2500 });
      return;
    }

    this.snackBar.open('Generando PDF con historial clínico...', 'OK', { duration: 2000 });

    // PASO 1: Obtener IDs para buscar HC completa
    const idsTurnos = turnosParaExportar.map(t => t.id);

    // PASO 2: Buscar datos médicos en BD
    const { data: historiasData } = await this.supa.client
      .from('historia_clinica')
      .select(`*, historia_datos_dinamicos (*)`)
      .in('turno_id', idsTurnos);

    const historiasMap = new Map();
    if (historiasData) {
      historiasData.forEach((h: any) => historiasMap.set(h.turno_id, h));
    }

    // --- GENERACIÓN PDF (Tu código exacto adaptado) ---
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 15;
    const marginBottom = 15;
    const cardPadding = 5;
    const lineHeight = 5;
    const paragraphSpacing = 2;
    const headerBottom = 32;

    // SVG Logo (EL MISMO)
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
        // Fondo Header
        doc.setFillColor(17, 24, 39);
        doc.rect(0, 0, pageWidth, headerBottom, 'F');

        if (pngDataUrl) {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(marginX - 2, 5, 65, 22, 2, 2, 'F');
          doc.addImage(pngDataUrl, 'PNG', marginX, 6, 60, 20);
        }

        // Títulos
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Reporte de Atenciones', pageWidth - marginX, 18, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        // Título dinámico: Si estoy viendo a un Especialista, dice "Especialista: ...". Si no, "Paciente: ..."
        const rolTexto = usuario.rol === 'ESPECIALISTA' ? 'Especialista' : 'Paciente';
        doc.text(`${rolTexto}: ${usuario.nombre} ${usuario.apellido}`, pageWidth - marginX, 24, { align: 'right' });

        const hoy = new Date().toLocaleDateString('es-AR');
        doc.setTextColor(209, 213, 219);
        doc.setFontSize(8);
        doc.text(`Emisión: ${hoy}`, pageWidth - marginX, 28, { align: 'right' });

        doc.setDrawColor(251, 191, 36);
        doc.setLineWidth(0.4);
        doc.line(marginX, headerBottom - 1, pageWidth - marginX, headerBottom - 1);
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

        // 1. Cabecera (Fecha y Estado)
        const fechaStr = t.fecha_hora_inicio ? new Date(t.fecha_hora_inicio).toLocaleDateString('es-AR') : 'Sin fecha';
        const horaStr = t.fecha_hora_inicio ? new Date(t.fecha_hora_inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '';
        const estadoPrint = (t.estado?.codigo || 'SIN ESTADO').toUpperCase();
        addParagraph(`Turno #${index + 1} · ${fechaStr} ${horaStr} · (${estadoPrint})`, { bold: true });

        // 2. Datos del turno (Especialidad y Contraparte)
        const nombreEspecialidad = t.especialidad?.nombre || 'Varios';

        // Si el usuario del reporte es Especialista, la contraparte es el Paciente. Y viceversa.
        const userObj = usuario.rol === 'ESPECIALISTA' ? t.paciente : t.especialista;
        const nombreContraparte = userObj ? `${userObj.apellido}, ${userObj.nombre}` : 'Sin datos';
        const labelContraparte = usuario.rol === 'ESPECIALISTA' ? 'Paciente' : 'Especialista';

        addParagraph(`Especialidad: ${nombreEspecialidad} | ${labelContraparte}: ${nombreContraparte}`);

        // 3. DATOS CLÍNICOS (si hay)
        const hc = historiasMap.get(t.id);

        if (hc) {
          let detalles = [];
          if (hc.altura) detalles.push(`Altura: ${hc.altura} cm`);
          if (hc.peso) detalles.push(`Peso: ${hc.peso} kg`);
          if (hc.temperatura) detalles.push(`Temp: ${hc.temperatura} °C`);
          if (hc.presion) detalles.push(`Presión: ${hc.presion}`);

          if (detalles.length > 0) {
            addParagraph('Datos Biométricos: ' + detalles.join(' | '), { bold: false });
          }

          if (hc.historia_datos_dinamicos && hc.historia_datos_dinamicos.length > 0) {
            addParagraph('Datos Dinámicos:', { bold: true });
            hc.historia_datos_dinamicos.forEach((d: any) => {
              const valor = d.valor_texto || d.valor_numerico || (d.valor_boolean ? 'Sí' : 'No');
              addParagraph(`• ${d.clave}: ${valor}`);
            });
          }
        } else {
          // Si no hay HC, mostramos comentario/motivo
          if (t.comentario) addParagraph(`Reseña/Comentario: ${t.comentario}`);
          else addParagraph('Sin datos clínicos registrados.');
        }

        // CÁLCULO DE ALTURA DE TARJETA
        let cardHeight = cardPadding * 2;
        paragraphs.forEach((p, i) => {
          cardHeight += p.lines.length * lineHeight;
          if (i > 0) cardHeight += paragraphSpacing;
        });

        // NUEVA PÁGINA SI NO ENTRA
        if (y + cardHeight > pageHeight - marginBottom) {
          doc.addPage();
          drawHeader();
          y = headerBottom + 10;
        }

        // DIBUJAR TARJETA
        doc.setFillColor(248, 250, 252); // Gris muy claro
        doc.setDrawColor(59, 130, 246);  // Azul borde
        doc.setLineWidth(0.4);
        doc.roundedRect(marginX, y, contentWidth, cardHeight, 3, 3, 'FD');

        // Borde decorativo izq
        doc.setFillColor(59, 130, 246);
        doc.rect(marginX, y, 2, cardHeight, 'F');

        // IMPRIMIR TEXTO
        let textY = y + cardPadding + lineHeight;
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(10);
        paragraphs.forEach((p, i) => {
          doc.setFont('helvetica', p.bold ? 'bold' : 'normal');
          p.lines.forEach(l => {
            doc.text(l, marginX + cardPadding + 4, textY);
            textY += lineHeight;
          });
          if (i < paragraphs.length - 1) textY += paragraphSpacing;
        });

        y += cardHeight + 6;
      });

      const nombreArchivo = `Atenciones_${usuario.apellido}_${new Date().getTime()}.pdf`;
      doc.save(nombreArchivo);
    };

    // Cargar imagen y generar
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
      } else generarDocumento();
    };
    img.onerror = () => generarDocumento();
  }

  // ... (toISODateLocal, calcEdadFromISO, onFileChange, toggleAprobacion, crearUsuario, cancelarCreacion, guardarUsuario, etc.)
  private toISODateLocal(date: Date): string { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0'); return `${y}-${m}-${d}`; }
  private calcEdadFromISO(iso: string): number { const [y, m, d] = iso.split('-').map(Number); const today = new Date(); let edad = today.getFullYear() - y; const month = today.getMonth() + 1; const day = today.getDate(); if (month < m || (month === m && day < d)) edad--; return edad; }
  onFileChange(event: Event): void { const input = event.target as HTMLInputElement; if (!input.files?.length) return; const file = input.files[0]; this.formularioUsuario.get('imagenPerfil')!.setValue(file); this.formularioUsuario.get('imagenPerfil')!.markAsDirty(); const reader = new FileReader(); reader.onload = () => (this.imagenPrevia = reader.result as string); reader.readAsDataURL(file); }
  async toggleAprobacion(usuario: UsuarioAdmin): Promise<void> { if (usuario.rol !== 'ESPECIALISTA') return; const nuevoEstado = !usuario.aprobado; try { const { error } = await this.supa.client.from('usuarios').update({ esta_aprobado: nuevoEstado }).eq('id', usuario.id); if (error) throw error; usuario.aprobado = nuevoEstado; Swal.fire('Éxito', `Acceso ${nuevoEstado ? 'habilitado' : 'inhabilitado'}`, 'success'); } catch (e) { Swal.fire('Error', 'No se pudo actualizar', 'error'); } }
  crearUsuario(): void { this.mostrarFormulario = true; this.formularioUsuario.reset(); this.imagenPrevia = null; }
  cancelarCreacion(): void { this.mostrarFormulario = false; this.formularioUsuario.reset(); this.imagenPrevia = null; }




  //async guardarUsuario(): Promise<void> { /* ... */ }




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
      // Agregamos historia_datos_dinamicos (*) para que salgan en el PDF/Dialog
      let query = this.supa.client
        .from('historia_clinica')
        .select(`
            *,
            historia_datos_dinamicos (*)
        `)
        .eq('paciente_id', pacienteId)
        .order('fecha_registro', { ascending: false });

      // Si NO es admin, filtramos por especialista (por seguridad)
      if (!this.esAdmin) {
        query = query.eq('especialista_id', userId);
      }

      const { data: historias, error } = await query;

      if (error) {
        console.error('[UsuariosAdmin] Error al cargar historia clínica', error);
        return;
      }

      // 2. MAPEAR DATOS COMPLETOS (Especialidad, Especialista, Fecha)
      const historiasCompletas: HistoriaClinicaConExtras[] = await Promise.all(
        (historias || []).map(async (h: any) => {

          // Traemos Fecha y ESPECIALIDAD del turno original
          const { data: turno } = await this.supa.client
            .from('turnos')
            .select('fecha_hora_inicio, especialidades(nombre)')
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
            : ''; // Dejar vacío en lugar de N/A para que se vea más limpio

          // Formatear fecha atención
          const fechaAtencion = turno?.fecha_hora_inicio
            ? new Date(turno.fecha_hora_inicio).toLocaleDateString('es-AR')
            : '';

          // Formatear Especialidad (Solución del error de array/objeto)
          const dataEspec: any = turno?.especialidades;
          const nombreEspecialidad = dataEspec?.nombre || dataEspec?.[0]?.nombre || '';

          return {
            ...h,
            paciente: pacienteNombre,       // Importante para el título del PDF
            especialidad: nombreEspecialidad, // Importante para el badge
            especialistaNombre,
            fechaAtencion
          } as HistoriaClinicaConExtras;
        })
      );

      // 3. ABRIR EL DIÁLOGO COMPARTIDO
      // Al pasarle 'historiasCompletas' bien cargado, el botón de PDF del diálogo funcionará perfecto.
      this.dialog.open(HistoriaClinicaDialogComponent, {
        width: '800px',
        data: {
          pacienteNombre,
          historias: historiasCompletas
        },
        panelClass: 'hc-dialog-panel' // Asegúrate de tener este estilo o quítalo si no lo usas
      });

    } catch (err: any) {
      console.error('[UsuariosAdmin] Error al cargar historia clínica', err);
    }
    finally {
      this.loading.hide();
    }

  }



  // ... imports y código existente ...

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


}

