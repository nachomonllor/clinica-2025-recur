
import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';

import { SupabaseService } from '../../../services/supabase.service';
import { TurnosService } from '../../../services/turnos.service';
import { TurnoVM } from '../../models/turno.model'; // Tu modelo

// Pipes y Directivas
import { StatusLabelPipe } from '../../../pipes/status-label.pipe';
import { StatusBadgeDirective } from '../../../directives/status-badge.directive';
import { ElevateOnHoverDirective } from '../../../directives/elevate-on-hover.directive';
import { CapitalizarNombrePipe } from "../../../pipes/capitalizar-nombre.pipe";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-mis-turnos-paciente',
  standalone: true,
  templateUrl: './mis-turnos-paciente.component.html',
  styleUrls: ['./mis-turnos-paciente.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatSliderModule,
    MatRadioModule,
    MatCheckboxModule,
    StatusLabelPipe,
    StatusBadgeDirective,
    ElevateOnHoverDirective,
    CapitalizarNombrePipe
  ]
})
export class MisTurnosPacienteComponent implements OnInit {

  // ... (Tus variables de tabla, columnas, etc. quedan igual) ...
  dataSource = new MatTableDataSource<TurnoVM>([]);
  pacienteNombre: string = 'Paciente';
  pacienteId: string | null = null;

  @ViewChild('cancelDialog') cancelDialog!: TemplateRef<unknown>;
  @ViewChild('calificarDialog') calificarDialog!: TemplateRef<unknown>; // Usaremos este para la encuesta
  @ViewChild('verResenaDialog') verResenaDialog!: TemplateRef<unknown>;

  constructor(
    private turnoService: TurnosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    public supa: SupabaseService
  ) { }

  // DEFENSA: "En el inicio del ciclo de vida (ngOnInit), realizamos dos acciones asíncronas clave:
  //  Nos suscribimos al observable del usuario para obtener su identidad (ID y Nombre).
  //  Nos suscribimos al servicio de turnos para traer la data, y configuramos un 'FilterPredicate' 
  //  personalizado para poder buscar por varios campos a la vez (especialidad, especialista, etc)."
  ngOnInit(): void {
    // 1. Obtener Usuario
    this.supa.usuario$.subscribe(usuario => {
      if (usuario) {
        this.pacienteNombre = `${usuario.nombre} ${usuario.apellido}`;
        this.pacienteId = usuario.id;
      }
    });

    // 2. Cargar Turnos
    this.turnoService.getTurnosPacienteVM$().subscribe({
      next: (ts: TurnoVM[]) => {
        this.dataSource.data = ts;
        // Filtro
        this.dataSource.filterPredicate = (t, f) => {
          const haystack = `${t.especialidad || ''} ${t.especialista || ''} ${t.estado || ''} ${t.historiaBusqueda || ''} ${t.resena || ''}`.toLowerCase();
          return haystack.includes(f);
        };
      },
      error: (e) => console.error(e)
    });
  }

  // Esta funcion captura el input del usuario, 
  // limpia los espacios y normaliza el texto a minusculas para ejecutar el filtrado en tiempo real sobre la tabla
  applyFilter(value: string): void {
    this.dataSource.filter = (value || '').trim().toLowerCase();
  }

  // Getter retorna los datos visibles actualmente en la tabla
  // respetando si hay un filtro aplicado o no. Para las exportaciones
  get turnos(): TurnoVM[] {
    const ds = this.dataSource as MatTableDataSource<TurnoVM>;
    return (ds.filteredData && ds.filteredData.length ? ds.filteredData : ds.data) || [];
  }

  // ==========================================================
  //(Regla de Negocio)
  // Regla de negocio para la cancelacion: 
  // Un paciente solo puede cancelar si el turno no estaen un estado final (Realizado, Rechazado, etc.)
  //  y si aún no tiene una reseña medica cargada
  puedeCancelar(t: TurnoVM): boolean {
    //  Si ya tiene reseña, está cerrado.
    if (t.resena && t.resena.trim().length > 0) return false;

    const estado = (t.estado || '').toUpperCase();

    //  Estados que impiden cancelar
    const estadosBloqueantes = [
      'FINALIZADO', 
      'CANCELADO', 
      'RECHAZADO', 
      'REALIZADO', 
      'ACEPTADO' //
    ];

    if (estadosBloqueantes.includes(estado)) return false;

    return true; 
  }
 
  // Verifica simplemente si existe una reseña cargada para habilitar el boton de ver detall
  puedeVerResena(t: TurnoVM): boolean {
    return !!(t.resena && t.resena.trim().length > 0);
  }

  /**
   * REGLA DEL BOTON ENCUESTA:
   *  Turno FINALIZADO
   * Tiene Reseña del especialista
   * NO tiene encuesta completada todavía
   
  Regla  para habilitar la Encuesta de Satisfacción. 
  El turno debe estar FINALIZADO, 
  debe tener una reseña del médico, 
  y verificamos que el campo 'encuesta' sea falso para evitar duplicados.
   */
  puedeCompletarEncuesta(t: TurnoVM): boolean {
    const estado = (t.estado || '').toUpperCase();
    const esFinalizado = estado === 'FINALIZADO'; // Segun  enum EstadoTurnoCodigo
    
    // Validamos que tenga reseña
    const tieneResena = this.puedeVerResena(t);
    
    // Validamos que NO tenga encuesta (TurnoVM tiene la prop encuesta?: boolean | any)
    const noTieneEncuesta = !t.encuesta;

    return esFinalizado && tieneResena && noTieneEncuesta;
  }

  /**
   * FUNCION PRINCIPAL: COMPLETAR ENCUESTA
   * Cumple con: Texto, Estrellas, Radio, Checkbox, Rango
   */
  completarEncuesta(t: TurnoVM): void {
    // Definimos el formulario con los 5 controles requeridos
    const encuestaForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(6)]], // 1. Cuadro de texto
      estrellas: [5, [Validators.required]],                            // 2. Estrellas
      recomendaria: ['si', Validators.required],                         // 3. Radio Button
      puntualidad: [false],                                              // 4. Checkbox (grupo)
      amabilidad: [false],
      limpieza: [false],
      rango: [8, [Validators.required]]                                  // 5. Rango (Slider)
    });

    // Reutilizamos 'calificarDialog' que tiene el diseño completo
    const ref = this.dialog.open(this.calificarDialog, {
      data: { turno: t, form: encuestaForm },
      width: '600px'
    });

    ref.afterClosed().subscribe(async result => {
      if (result && encuestaForm.valid) {
        const fv = encuestaForm.value;
        
        // Procesamos los checkboxes a un string legible
        const checks = [];
        if (fv.puntualidad) checks.push('Puntualidad');
        if (fv.amabilidad) checks.push('Amabilidad');
        if (fv.limpieza) checks.push('Limpieza');
        const respuestaCheckbox = checks.join(', ');

        try {
          //  Guardar en tabla 'encuestas_atencion'
          const { error } = await this.supa.client
            .from('encuestas_atencion')
            .insert({
              turno_id: t.id,
              paciente_id: this.pacienteId,
              especialista_id: t.especialistaId, // Asegúrate de tener este ID en el VM
              comentario: fv.comentario,
              estrellas: fv.estrellas,
              respuesta_radio: fv.recomendaria,
              respuesta_checkbox: respuestaCheckbox,
              valor_rango: fv.rango
            });

          if (error) throw error;

          // Actualizar UI inmediatamente
          t.encuesta = true; 
          t.calificacion = fv.estrellas;

          // Actualizar flag en tabla turnos (Opcional pero recomendado para consistencia)
          await this.supa.client.from('turnos')
             .update({ calificacion: fv.estrellas }) 
             .eq('id', t.id);

          this.snackBar.open('¡Encuesta enviada correctamente!', 'Cerrar', { duration: 3000 });

          await Swal.fire({
            icon: 'success',
            title: '¡Encuesta Enviada!',
            text: 'Gracias por tu opinión.',
            confirmButtonText: 'Cerrar',
            timer: 2500,
            timerProgressBar: true
          });

        } catch (err: any) {
          console.error('Error encuesta:', err);
          this.snackBar.open('Error al enviar encuesta', 'Cerrar');
        }
      }
    });
  }


  // Alias para mantener compatibilidad si el HTML llama a 'calificarAtencion'
  calificarAtencion(t: TurnoVM): void {
    this.completarEncuesta(t);
  }


  // Manejo de cancelaciOn lOgica. 
  // Primero valida la regla de negocio. 
  // Despues abre un dialog solicitando el motivo obligatorio. 
  // Si confirma, llama al servicio y actualiza el estado del objeto en memoria para reflejar 'CANCELADO' instantaneamente
  cancelarTurno(t: TurnoVM): void {
    //  Validar antes de abrir nada
    if (!this.puedeCancelar(t)) {
      this.snackBar.open('Este turno ya no puede cancelarse.', 'Cerrar', {
        duration: 2500
      });
      return;
    }

    // Preparar formulario
    const comentarioForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(10)]]
    });

    // Abrir diálogo
    const ref = this.dialog.open(this.cancelDialog, {
      data: { turno: t, form: comentarioForm },
      width: '500px'
    });

    // Procesar resultado al cerrar
    ref.afterClosed().subscribe(result => {
      // Si el usuario cerro sin confirmar (result es false-undefined)
      if (!result) return;

      // Validación de seguridad adicional
      if (comentarioForm.invalid) {
        this.snackBar.open(
          'Debes ingresar un motivo de al menos 10 caracteres.',
          'Cerrar',
          { duration: 2500 }
        );
        return;
      }

      const comentario = comentarioForm.value.comentario ?? '';

      // Llamar al servicio
      this.turnoService.cancelarTurno(t.id, comentario).subscribe({
        next: () => {
          // IMPORTANTE: Actualizar el estado local en MAYUSCULAS
          // para que coincida con tus tipos y la BD.
          t.estado = 'CANCELADO'; 

          // Refrescar la tabla para que Angular detecte el cambio en las filas
          this.dataSource.data = [...this.dataSource.data];
          
          this.snackBar.open('Turno cancelado exitosamente.', 'Cerrar', { duration: 3000 });
        },
        error: (e: any) => {
          console.error(e);
          this.snackBar.open(
            `Error al cancelar: ${e?.message || 'Ocurrió un error inesperado'}`,
            'Cerrar',
            { duration: 3000 }
          );
        }
      });
    });
  }


  /* --------------------------------- */

  // ==========================================================
  // LÓGICA DE VALIDACIÓN (Reglas de Negocio PDF)
  // ==========================================================

  // puedeCancelar(t: TurnoVM): boolean {
  //   if (t.resena && t.resena.trim().length > 0) return false;
  //   const estado = (t.estado || '').toUpperCase();
  //   const estadosBloqueantes = ['FINALIZADO', 'CANCELADO', 'RECHAZADO', 'REALIZADO'];
  //   if (estadosBloqueantes.includes(estado)) return false;
    
  //   // Validación de fecha (solo futuros)
  //   if (!t.fecha || !t.hora) return false;
  //   const ahora = new Date();
  //   const [hhStr, mmStr] = t.hora.split(':');
  //   const fechaTurno = new Date(t.fecha);
  //   fechaTurno.setHours(Number(hhStr), Number(mmStr), 0, 0);
    
  //   return fechaTurno.getTime() > ahora.getTime();
  // }

  // puedeVerResena(t: TurnoVM): boolean {
  //   return !!(t.resena && t.resena.trim().length > 0);
  // }

  /**
   * REGLA SPRINT 2 + SPRINT 6:
   * Visible si el especialista marcó el turno como realizado y dejó reseña.
   */
  // puedeCompletarEncuesta(t: TurnoVM): boolean {
  //   const estado = (t.estado || '').toUpperCase();
  //   const esFinalizado = estado === 'FINALIZADO' || estado === 'REALIZADO';
  //   const tieneResena = this.puedeVerResena(t);
  //   const noTieneEncuesta = !t.encuesta; // Importante: que no la haya hecho ya

  //   return esFinalizado && tieneResena && noTieneEncuesta;
  // }

  // Si necesitas la función "calificarAtencion" por compatibilidad con algún botón viejo,
  // la podemos mapear a la encuesta, ya que la encuesta INCLUYE la calificación.
  puedeCalificar(t: TurnoVM): boolean {
    return this.puedeCompletarEncuesta(t);
  }

  

  // verResena(t: TurnoVM): void {
  //   if (!this.puedeVerResena(t)) return;
  //   this.dialog.open(this.verResenaDialog, {
  //     data: { turno: t, resena: t.resena },
  //     width: '500px'
  //   });
  // }

  // Abre un modal simple de solo lectura inyectando los datos de la reseña en el componente de diálogo
  verResena(t: TurnoVM): void {
    if (!this.puedeVerResena(t)) return;
    this.dialog.open(this.verResenaDialog, {
      data: { turno: t, resena: t.resena },
      width: '500px'
    });
  }

  // EFUNCION PARA LA ENCUESTA
  // logica alternativa para abrir la encuesta para no hacerlo en un componente por separado, uso el template calificarDialog
  abrirEncuesta(t: TurnoVM): void {
    const encuestaForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(6)]], // MINLEN
      estrellas: [5, [Validators.required]],
      recomendaria: ['si', Validators.required],
      puntualidad: [false],
      amabilidad: [false],
      limpieza: [false],
      rango: [8, [Validators.required]]
    });

    const ref = this.dialog.open(this.calificarDialog, {
      data: { turno: t, form: encuestaForm },
      width: '600px'
    });

    ref.afterClosed().subscribe(async result => {
      if (result && encuestaForm.valid) {
        const fv = encuestaForm.value;
        const checks = [];
        if (fv.puntualidad) checks.push('Puntualidad');
        if (fv.amabilidad) checks.push('Amabilidad');
        if (fv.limpieza) checks.push('Limpieza');
        const respuestaCheckbox = checks.join(', ');

        try {
          //  Insertar en tabla encuestas
          const { error } = await this.supa.client
            .from('encuestas_atencion')
            .insert({
              turno_id: t.id,
              paciente_id: this.pacienteId,
              especialista_id: t.especialistaId, // <--- Usamos el ID del VM
              comentario: fv.comentario,
              estrellas: fv.estrellas,
              respuesta_radio: fv.recomendaria,
              respuesta_checkbox: respuestaCheckbox,
              valor_rango: fv.rango
            });

          if (error) throw error;

          //  ACTUALIZACIÓN VISUAL INMEDIATA
          // Marcamos que ya tiene encuesta para que el *ngIf oculte el botón
          t.encuesta = true; 
          t.calificacion = fv.estrellas; // Para mostrar las estrellitas en la tarjeta

          // 3. (Opcional) Guardar flag redundante en turnos si lo usas
          await this.supa.client.from('turnos')
             .update({ calificacion: fv.estrellas }) 
             .eq('id', t.id);

          this.snackBar.open('¡Encuesta enviada correctamente!', 'Cerrar', { duration: 3000 });

        } catch (err: any) {
          console.error(err);
          this.snackBar.open('Error al enviar encuesta', 'Cerrar');
        }
      }
    });
  }

 //  Genera un reporte rapido en Excel usando la libreria XLSX.
 //  Toma los turnos filtrados actuales, mapea las columnas a un formato legible y descarga el archivo con timestamp
  exportarHistoriaClinicaExcel(): void {
    const turnos = this.turnos;  // respeta el filtro actual

    if (!turnos.length) {
      this.snackBar.open('No hay turnos para exportar.', 'Cerrar', {
        duration: 2500
      });
      return;
    }

    const filas = turnos.map((t, idx) => ({
      Nro: idx + 1,
      Fecha: t.fecha ? t.fecha.toLocaleDateString('es-AR') : '',
      Hora: t.hora ?? '',
      Estado: t.estado ?? '',
      Especialidad: t.especialidad ?? '',
      Profesional: t.especialista ?? '',
      Calificación: t.calificacion ?? '',
      'Reseña del especialista': t.resena ?? '',
      'Historia clínica (texto)': (t as any).historiaClinica || t.historiaBusqueda || ''
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(filas);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historia Clínica');

    const ahora = new Date();
    const fechaArchivo = `${ahora.getFullYear()}${(ahora.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${ahora.getDate().toString().padStart(2, '0')}_${ahora
        .getHours()
        .toString()
        .padStart(2, '0')}${ahora.getMinutes().toString().padStart(2, '0')}`;

    const fileName = `historia_clinica_${fechaArchivo}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // =========================================================================
  //  EXPORTAR PDF COMPLETO (CON DATOS DE SUPABASE)
  // =========================================================================
  async exportarPdf() {
    const turnosParaExportar = this.turnos;

    if (!turnosParaExportar.length) {
      this.snackBar.open('No hay turnos para exportar.', 'Cerrar', { duration: 2500 });
      return;
    }

    this.snackBar.open('Generando PDF con historial clínico...', 'OK', { duration: 2000 });

    // PASO 1: Obtener los IDs para buscar la historia clínica real
    const idsTurnos = turnosParaExportar.map(t => t.id);

    // PASO 2: Buscar datos médicos en la base de datos
    const { data: historiasData } = await this.supa.client
      .from('historia_clinica')
      .select(`
         *,
         historia_datos_dinamicos (*)
       `)
      .in('turno_id', idsTurnos);

    // Mapear resultado para acceso rápido por ID de turno
    const historiasMap = new Map();
    if (historiasData) {
      historiasData.forEach((h: any) => historiasMap.set(h.turno_id, h));
    }

    // --- INICIO GENERACIÓN PDF ---
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginX = 15;
    const marginBottom = 15;
    const cardPadding = 5;
    const lineHeight = 5;
    const paragraphSpacing = 2;
    const headerBottom = 32;

    // SVG Logo
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
        doc.text('Mis Turnos / Historial Clínico', pageWidth - marginX, 18, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        // Usamos la variable cargada en ngOnInit
        doc.text(`Paciente: ${this.pacienteNombre}`, pageWidth - marginX, 24, { align: 'right' });

        const hoy = new Date().toLocaleDateString('es-AR');
        doc.setTextColor(209, 213, 219);
        doc.setFontSize(8);
        doc.text(`Emisión: ${hoy}`, pageWidth - marginX, 28, { align: 'right' });

        // Línea dorada
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
        const fechaStr = t.fecha ? t.fecha.toLocaleDateString('es-AR') : 'Sin fecha';
        // Validación de seguridad para estado
        const estadoPrint = t.estado ? t.estado.toUpperCase() : 'SIN ESTADO';
        addParagraph(`Turno #${index + 1} · ${fechaStr} · ${t.hora} hs · (${estadoPrint})`, { bold: true });

        // 2. Profesional
        addParagraph(`Especialidad: ${t.especialidad} | Especialista: ${t.especialista}`);

        // 3. DATOS CLÍNICOS (Recuperados de Supabase)
        const hc = historiasMap.get(t.id);

        if (hc) {
          // Datos Fijos
          let detalles = [];
          if (hc.altura) detalles.push(`Altura: ${hc.altura} cm`);
          if (hc.peso) detalles.push(`Peso: ${hc.peso} kg`);
          if (hc.temperatura) detalles.push(`Temp: ${hc.temperatura} °C`);
          if (hc.presion) detalles.push(`Presión: ${hc.presion}`);

          if (detalles.length > 0) {
            addParagraph('Datos Biométricos: ' + detalles.join(' | '), { bold: false });
          }

          // Datos Dinámicos
          if (hc.historia_datos_dinamicos && hc.historia_datos_dinamicos.length > 0) {
            addParagraph('Datos Dinámicos:', { bold: true });
            hc.historia_datos_dinamicos.forEach((d: any) => {
              const valor = d.valor_texto || d.valor_numerico || (d.valor_boolean ? 'Sí' : 'No');
              addParagraph(`• ${d.clave}: ${valor}`);
            });
          }
        } else {
          // Si no hay HC estructurada, mostramos el motivo/busqueda si existe
          if (t.historiaBusqueda) {
            addParagraph(`Detalle/Motivo: ${t.historiaBusqueda}`);
          } else {
            addParagraph('Sin datos clínicos registrados.');
          }
        }

        // 4. Reseña
        if (t.resena) {
          addParagraph(`Reseña especialista: ${t.resena}`);
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

      const nombreArchivo = `historia_clinica_${this.pacienteNombre.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
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



}





