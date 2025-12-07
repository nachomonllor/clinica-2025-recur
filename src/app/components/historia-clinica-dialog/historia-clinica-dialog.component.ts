import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx'; // Asegúrate de tener: npm install xlsx
import { HistoriaClinicaConExtras } from '../../models/historia-clinica.model';
import { DatoDinamicoPipe } from '../../../pipes/dato-dinamico.pipe';
import { CapitalizarNombrePipe } from '../../../pipes/capitalizar-nombre.pipe';
import { formatearDatoDinamico } from '../../models/dato-dinamico.model';

export interface HistoriaClinicaDialogData {
  pacienteNombre: string;
  historias: HistoriaClinicaConExtras[];
}

@Component({
  selector: 'app-historia-clinica-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    DatoDinamicoPipe,
    CapitalizarNombrePipe,
    DatoDinamicoPipe
  ],
  templateUrl: './historia-clinica-dialog.component.html',
  styleUrl: './historia-clinica-dialog.component.scss'
})
// export class HistoriaClinicaDialogComponent {

// }

export class HistoriaClinicaDialogComponent {
  panelAbiertoIndex: number | null = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: HistoriaClinicaDialogData,
    private dialogRef: MatDialogRef<HistoriaClinicaDialogComponent>
  ) { }

  toggleCard(index: number): void {
    this.panelAbiertoIndex = this.panelAbiertoIndex === index ? null : index;
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // --- HELPER LOCAL PARA CAPITALIZAR ---
  private capitalizar(str: string | undefined | null): string {
    if (!str) return '';
    return str.trim().toLowerCase().split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

  // ========================================================================
  //  EXPORTAR A EXCEL (Con Reseña y Dinámicos)
  // ========================================================================
  // exportarExcel(): void {
  //   const filas = this.data.historias.map((h: any, i) => {
  //     // 1. Aplanamos los datos dinámicos en una sola celda
  //     let dinamicosStr = '';
  //     if (h.datos_dinamicos && h.datos_dinamicos.length) {
  //       dinamicosStr = h.datos_dinamicos.map((d: any) => {
  //         const val = d.valor_texto || d.valor_numerico || (d.valor_boolean ? 'Sí' : 'No') || d.valor;
  //         return `${d.clave}: ${val}`;
  //       }).join('; ');
  //     }

  //     return {
  //       'Nro': this.data.historias.length - i,
  //       'Fecha': h.fechaAtencion || this.formatearFecha(h.fecha_registro || h.created_at),
  //       'Especialidad': (h.especialidad || '').toUpperCase(),
  //       'Especialista': this.capitalizar(h.especialistaNombre),
  //       'Altura (cm)': h.altura ?? '-',
  //       'Peso (kg)': h.peso ?? '-',
  //       'Temperatura (°C)': h.temperatura ?? '-',
  //       'Presión': h.presion ?? '-',
  //       'Reseña': h.resena || '',  // <--- RESEÑA EN EL EXCEL
  //       'Datos Dinámicos': dinamicosStr // <--- DINÁMICOS EN EL EXCEL
  //     };
  //   });

  //   const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(filas);
  //   const wb: XLSX.WorkBook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, 'Historia Clínica');

  //   const nombreArchivo = `historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.xlsx`;
  //   XLSX.writeFile(wb, nombreArchivo);
  // }

  exportarExcel(): void {
    const filas = this.data.historias.map((h: any, i) => {

      // 1. Aplanamos los datos dinámicos en una sola celda
      let dinamicosStr = '';

      if (h.datos_dinamicos && h.datos_dinamicos.length) {
        // Usamos el helper formatearDatoDinamico =======> QUE TAMBIEN LO USAMOS PARA EL PIPE
        // Como 'd' ya viene procesado desde el componente padre con la propiedad 'valor',
        // el helper detectará si es booleano para poner "SI/NO" o agregará la unidad.
        dinamicosStr = h.datos_dinamicos
          .map((d: any) => formatearDatoDinamico(d))
          .join('; ');
      }

      // 2. Retornamos la fila para el Excel
      return {
        'Nro': this.data.historias.length - i,
        'Fecha': h.fechaAtencion || this.formatearFecha(h.fecha_registro || h.created_at),
        'Especialidad': (h.especialidad || '').toUpperCase(),
        'Especialista': this.capitalizar(h.especialistaNombre),
        'Altura (cm)': h.altura ?? '-',
        'Peso (kg)': h.peso ?? '-',
        'Temperatura (°C)': h.temperatura ?? '-',
        'Presión': h.presion ?? '-',
        'Reseña': h.resena || '',
        'Datos Dinámicos': dinamicosStr // Ahora se verá ej: "Requiere seguimiento: SI; caries: 9"
      };
    });

    // 3. Generar y descargar archivo
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(filas);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historia Clínica');

    const nombreArchivo = `historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  }

  // ========================================================================
  //  EXPORTAR A PDF (Con Reseña y Dinámicos)
  // ========================================================================
  // exportarPdf(): void {
  //   const doc = new jsPDF('p', 'mm', 'a4');
  //   const pageWidth = doc.internal.pageSize.getWidth();
  //   const pageHeight = doc.internal.pageSize.getHeight();

  //   const marginX = 15;
  //   const marginBottom = 15; // AGREGADO AQUÍ
  //   const headerBottom = 32;
  //   const cardPadding = 5;
  //   const lineHeight = 5;
  //   const paragraphSpacing = 2;

  //   const svgLogo = `
  //   <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
  //     <defs>
  //       <linearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
  //         <stop offset="0%" style="stop-color:#0099ff;stop-opacity:1" /> 
  //         <stop offset="100%" style="stop-color:#0055b3;stop-opacity:1" /> 
  //       </linearGradient>
  //     </defs>
  //     <g transform="translate(50, 50)">
  //       <path d="M 80 0 H 120 A 10 10 0 0 1 130 10 V 80 H 200 A 10 10 0 0 1 210 90 V 130 A 10 10 0 0 1 200 140 H 130 V 210 A 10 10 0 0 1 120 220 H 80 A 10 10 0 0 1 70 210 V 140 H 0 A 10 10 0 0 1 -10 130 V 90 A 10 10 0 0 1 0 80 H 70 V 10 A 10 10 0 0 1 80 0 Z" fill="url(#gradBlue)" transform="scale(0.5) translate(30,30)"/>
  //       <path d="M 60 115 L 90 145 L 150 85" stroke="white" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.5) translate(30,30)"/>
  //     </g>
  //     <g transform="translate(180, 115)">
  //       <text x="0" y="-25" font-family="Arial" font-weight="bold" font-size="28" fill="#0077cc">CLINICA</text>
  //       <text x="0" y="25" font-family="Arial" font-weight="bold" font-size="52" fill="#003366">MONLLOR</text>
  //     </g>
  //   </svg>`;

  //   const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgLogo)));

  //   const generarDocumento = (pngDataUrl?: string) => {

  //     const drawHeader = () => {
  //       doc.setFillColor(17, 24, 39); 
  //       doc.rect(0, 0, pageWidth, headerBottom, 'F');

  //       if (pngDataUrl) {
  //         doc.setFillColor(255, 255, 255);
  //         doc.roundedRect(marginX - 2, 5, 65, 22, 2, 2, 'F');
  //         doc.addImage(pngDataUrl, 'PNG', marginX, 6, 60, 20);
  //       }

  //       doc.setTextColor(255, 255, 255);
  //       doc.setFont('helvetica', 'bold');
  //       doc.setFontSize(16);
  //       doc.text('Historia Clínica', pageWidth - marginX, 18, { align: 'right' });

  //       doc.setFont('helvetica', 'normal');
  //       doc.setFontSize(10);

  //       const nombrePacienteCap = this.capitalizar(this.data.pacienteNombre);
  //       doc.text(`Paciente: ${nombrePacienteCap}`, pageWidth - marginX, 24, { align: 'right' });

  //       const hoy = new Date().toLocaleDateString('es-AR');
  //       doc.setTextColor(209, 213, 219);
  //       doc.setFontSize(8);
  //       doc.text(`Emisión: ${hoy}`, pageWidth - marginX, 28, { align: 'right' });

  //       doc.setDrawColor(251, 191, 36);
  //       doc.setLineWidth(0.4);
  //       doc.line(marginX, headerBottom - 1, pageWidth - marginX, headerBottom - 1);
  //     };

  //     drawHeader();
  //     let y = headerBottom + 8;

  //     if (!this.data.historias.length) {
  //       doc.setTextColor(55, 65, 81);
  //       doc.setFontSize(12);
  //       doc.text('No hay historias clínicas registradas.', pageWidth / 2, pageHeight / 2, { align: 'center' });
  //       doc.save(`historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  //       return;
  //     }

  //     const contentWidth = pageWidth - marginX * 2;
  //     this.data.historias.forEach((h: any, index: number) => {
  //       const paragraphs: { lines: string[]; bold?: boolean }[] = [];
  //       const anchoTexto = contentWidth - cardPadding * 2;

  //       const addParagraph = (text: string, opts?: { bold?: boolean }) => {
  //         paragraphs.push({ lines: doc.splitTextToSize(text, anchoTexto), bold: opts?.bold });
  //       };

  //       const fechaAt = h.fechaAtencion || 'N/A';
  //       const especialidad = h.especialidad ? `(${h.especialidad})` : '';
  //       addParagraph(`Atención #${this.data.historias.length - index} · ${fechaAt} ${especialidad}`, { bold: true });

  //       const especialistaCap = this.capitalizar(h.especialistaNombre || 'N/A');
  //       addParagraph(`Especialista: ${especialistaCap}`);

  //       const fechaReg = h.fecha_registro ? new Date(h.fecha_registro).toLocaleString('es-AR') : 
  //                        (h.created_at ? new Date(h.created_at).toLocaleString('es-AR') : 'N/A');

  //       addParagraph(`Fecha de registro: ${fechaReg}`);
  //       addParagraph(`Altura: ${h.altura ?? '-'} cm | Peso: ${h.peso ?? '-'} kg | Temp.: ${h.temperatura ?? '-'} °C | Presión: ${h.presion ?? '-'}`);

  //       // --- RESEÑA EN EL PDF ---
  //       if (h.resena) {
  //         addParagraph(`Reseña: ${h.resena}`);
  //       }

  //       // --- DATOS DINÁMICOS EN EL PDF ---
  //       if (h.datos_dinamicos?.length) {
  //         addParagraph('Datos dinámicos:', { bold: true });
  //         h.datos_dinamicos.forEach((d: any) => {
  //            const valor = d.valor_texto || d.valor_numerico || (d.valor_boolean ? 'Sí' : 'No') || d.valor;
  //            addParagraph(`• ${d.clave}: ${valor}`);
  //         });
  //       }

  //       let cardHeight = cardPadding * 2;
  //       paragraphs.forEach((p, i) => {
  //         cardHeight += p.lines.length * lineHeight;
  //         if (i > 0) cardHeight += paragraphSpacing;
  //       });

  //       if (y + cardHeight > pageHeight - marginBottom) {
  //         doc.addPage();
  //         drawHeader();
  //         y = headerBottom + 8;
  //       }

  //       doc.setFillColor(255, 253, 231);
  //       doc.setDrawColor(251, 192, 45);
  //       doc.setLineWidth(0.4);
  //       doc.roundedRect(marginX, y, contentWidth, cardHeight, 3, 3, 'FD');
  //       doc.setFillColor(253, 230, 138);
  //       doc.rect(marginX, y, 2, cardHeight, 'F');

  //       let textY = y + cardPadding + lineHeight;
  //       doc.setTextColor(30, 41, 59);
  //       doc.setFontSize(10);
  //       paragraphs.forEach((p, i) => {
  //         doc.setFont('helvetica', p.bold ? 'bold' : 'normal');
  //         p.lines.forEach(l => { doc.text(l, marginX + cardPadding + 2, textY); textY += lineHeight; });
  //         if (i < paragraphs.length - 1) textY += paragraphSpacing;
  //       });

  //       y += cardHeight + 6;
  //     });

  //     const nombreArchivo = `historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.pdf`;
  //     doc.save(nombreArchivo);
  //   };

  //   const img = new Image();
  //   img.src = svgBase64;
  //   img.onload = () => {
  //     const canvas = document.createElement('canvas');
  //     canvas.width = 600; canvas.height = 200;
  //     const ctx = canvas.getContext('2d');
  //     if (ctx) {
  //       ctx.drawImage(img, 0, 0);
  //       generarDocumento(canvas.toDataURL('image/png'));
  //     } else generarDocumento();
  //   };
  //   img.onerror = () => generarDocumento();
  // }

  // ========================================================================
  //  2. PDF CORREGIDO (COMPLETO)
  // ========================================================================
  exportarPdf(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Márgenes y espaciado
    const marginX = 15;
    const marginBottom = 15;
    const headerBottom = 32;
    const cardPadding = 5;
    const lineHeight = 5;
    const paragraphSpacing = 2;

    // Logo SVG (Clínica Monllor)
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

    // Función interna para generar el documento una vez cargada la imagen
    const generarDocumento = (pngDataUrl?: string) => {

      // Dibujar Cabecera (Se repite por página si es necesario)
      const drawHeader = () => {
        doc.setFillColor(17, 24, 39);
        doc.rect(0, 0, pageWidth, headerBottom, 'F');

        if (pngDataUrl) {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(marginX - 2, 5, 65, 22, 2, 2, 'F');
          doc.addImage(pngDataUrl, 'PNG', marginX, 6, 60, 20);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Historia Clínica', pageWidth - marginX, 18, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        const nombrePacienteCap = this.capitalizar(this.data.pacienteNombre);
        doc.text(`Paciente: ${nombrePacienteCap}`, pageWidth - marginX, 24, { align: 'right' });

        const hoy = new Date().toLocaleDateString('es-AR');
        doc.setTextColor(209, 213, 219);
        doc.setFontSize(8);
        doc.text(`Emisión: ${hoy}`, pageWidth - marginX, 28, { align: 'right' });

        doc.setDrawColor(251, 191, 36);
        doc.setLineWidth(0.4);
        doc.line(marginX, headerBottom - 1, pageWidth - marginX, headerBottom - 1);
      };

      // Iniciar documento
      drawHeader();
      let y = headerBottom + 8;

      if (!this.data.historias.length) {
        doc.setTextColor(55, 65, 81);
        doc.setFontSize(12);
        doc.text('No hay historias clínicas registradas.', pageWidth / 2, pageHeight / 2, { align: 'center' });
        doc.save(`historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.pdf`);
        return;
      }

      const contentWidth = pageWidth - marginX * 2;

      // Recorrer historias
      this.data.historias.forEach((h: any, index: number) => {
        const paragraphs: { lines: string[]; bold?: boolean }[] = [];
        const anchoTexto = contentWidth - cardPadding * 2;

        const addParagraph = (text: string, opts?: { bold?: boolean }) => {
          paragraphs.push({ lines: doc.splitTextToSize(text, anchoTexto), bold: opts?.bold });
        };

        // 1. Datos Fijos del Turno
        const fechaAt = h.fechaAtencion || 'N/A';
        const especialidad = h.especialidad ? `(${h.especialidad})` : '';
        addParagraph(`Atención #${this.data.historias.length - index} · ${fechaAt} ${especialidad}`, { bold: true });

        const especialistaCap = this.capitalizar(h.especialistaNombre || 'N/A');
        addParagraph(`Especialista: ${especialistaCap}`);

        const fechaReg = h.fecha_registro ? new Date(h.fecha_registro).toLocaleString('es-AR') :
          (h.created_at ? new Date(h.created_at).toLocaleString('es-AR') : 'N/A');

        addParagraph(`Fecha de registro: ${fechaReg}`);
        addParagraph(`Altura: ${h.altura ?? '-'} cm | Peso: ${h.peso ?? '-'} kg | Temp.: ${h.temperatura ?? '-'} °C | Presión: ${h.presion ?? '-'}`);

        if (h.resena) {
          addParagraph(`Reseña: ${h.resena}`);
        }

        // ============================================================
        // 2. DATOS DINÁMICOS (CORREGIDO)
        // Usamos la función helper 'formatearDatoDinamico'
        // ============================================================
        if (h.datos_dinamicos?.length) {
          addParagraph('Datos dinámicos:', { bold: true });
          h.datos_dinamicos.forEach((d: any) => {
            // Esto formatea correctamente "SI/NO", unidades, etc.
            addParagraph(`• ${formatearDatoDinamico(d)}`);
          });
        }
        // ============================================================

        // Calcular altura de la tarjeta
        let cardHeight = cardPadding * 2;
        paragraphs.forEach((p, i) => {
          cardHeight += p.lines.length * lineHeight;
          if (i > 0) cardHeight += paragraphSpacing;
        });

        // Salto de página si no entra
        if (y + cardHeight > pageHeight - marginBottom) {
          doc.addPage();
          drawHeader();
          y = headerBottom + 8;
        }

        // Dibujar fondo y borde de la tarjeta
        doc.setFillColor(255, 253, 231);
        doc.setDrawColor(251, 192, 45);
        doc.setLineWidth(0.4);
        doc.roundedRect(marginX, y, contentWidth, cardHeight, 3, 3, 'FD');
        doc.setFillColor(253, 230, 138);
        doc.rect(marginX, y, 2, cardHeight, 'F'); // Borde lateral izquierdo

        // Escribir textos
        let textY = y + cardPadding + lineHeight;
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);

        paragraphs.forEach((p, i) => {
          doc.setFont('helvetica', p.bold ? 'bold' : 'normal');
          p.lines.forEach(l => {
            doc.text(l, marginX + cardPadding + 2, textY);
            textY += lineHeight;
          });
          if (i < paragraphs.length - 1) textY += paragraphSpacing;
        });

        y += cardHeight + 6;
      });

      const nombreArchivo = `historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      doc.save(nombreArchivo);
    };

    // Carga de imagen logo
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






}




