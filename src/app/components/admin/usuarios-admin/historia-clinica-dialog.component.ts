import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx'; // Asegúrate de tener: npm install xlsx
import { HistoriaClinicaConExtras } from '../../../models/historia-clinica.model';
import { DatoDinamicoPipe } from '../../../../pipes/dato-dinamico.pipe';
import { CapitalizarNombrePipe } from '../../../../pipes/capitalizar-nombre.pipe';

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
    CapitalizarNombrePipe
  ],
  template: `
    <div class="hc-dialog">
      <!-- HEADER -->
      <div class="hc-header">
        <div>
          <div class="hc-title">Historia Clínica</div>
          <!-- Título con Pipe -->
          <div class="hc-subtitle">{{ data.pacienteNombre | capitalizarNombre }}</div>
        </div>

        <div class="hc-header-actions">
          <!-- Botón EXCEL -->
          <button type="button" class="icon-button excel" title="Descargar Excel" (click)="exportarExcel()">
            📊
          </button>
          
          <!-- Botón PDF -->
          <button type="button" class="icon-button" title="Descargar PDF" (click)="exportarPdf()">
            ⬇
          </button>
          
          <!-- Botón Cerrar -->
          <button type="button" class="icon-button" title="Cerrar" (click)="cerrar()">
            ✕
          </button>
        </div>
      </div>

      <!-- BODY -->
      <div class="hc-body" *ngIf="data.historias.length; else sinHistorias">
        <div class="historia-card" *ngFor="let historia of data.historias; let i = index" [class.open]="panelAbiertoIndex === i">

          <!-- CABECERA CARD -->
          <button type="button" class="historia-header" (click)="toggleCard(i)">
            <div class="historia-header-left">
              <!-- Badge Especialidad (Protegido con $any) -->
              <span class="pill pill-esp" *ngIf="$any(historia).especialidad">
                {{ $any(historia).especialidad | uppercase }}
              </span>
              
              <!-- Badge Fecha -->
              <span class="pill pill-fecha">
                {{ formatearFecha(historia.fecha_registro || historia.created_at) }}
              </span>
              
              <!-- Badge Especialista -->
              <span class="pill pill-esp">
                {{ historia.especialistaNombre | capitalizarNombre }}
              </span>
            </div>

            <div class="historia-header-right">
              <span class="pill pill-id">Atención #{{ data.historias.length - i }}</span>
              <span class="chevron" [class.open]="panelAbiertoIndex === i">⌄</span>
            </div>
          </button>

          <!-- DETALLE EXPANDIDO -->
          <div class="historia-body" *ngIf="panelAbiertoIndex === i">
            <div class="historia-grid">
              <div class="historia-item">
                <span class="label">Fecha de atención</span>
                <span class="value">{{ historia.fechaAtencion || 'N/A' }}</span>
              </div>
              <div class="historia-item">
                <span class="label">Especialista</span>
                <span class="value">{{ historia.especialistaNombre | capitalizarNombre }}</span>
              </div>
              <div class="historia-item">
                <span class="label">Altura</span>
                <span class="value">{{ historia.altura ?? '-' }} cm</span>
              </div>
              <div class="historia-item">
                <span class="label">Peso</span>
                <span class="value">{{ historia.peso ?? '-' }} kg</span>
              </div>
              <div class="historia-item">
                <span class="label">Temperatura</span>
                <span class="value">{{ historia.temperatura ?? '-' }} °C</span>
              </div>
              <div class="historia-item">
                <span class="label">Presión</span>
                <span class="value">{{ historia.presion ?? '-' }}</span>
              </div>
              
              <!-- MOSTRAR RESEÑA EN PANTALLA -->
              <div class="historia-item full-width" *ngIf="$any(historia).resena">
                <span class="label">Reseña / Comentario</span>
                <span class="value text-wrap">{{ $any(historia).resena }}</span>
              </div>
            </div>

            <!-- MOSTRAR DATOS DINÁMICOS EN PANTALLA -->
            <div *ngIf="historia.datos_dinamicos && historia.datos_dinamicos.length" class="datos-dinamicos">
              <div class="datos-title">Datos dinámicos</div>
              <div class="datos-chips">
                <span class="dato-chip" *ngFor="let dato of historia.datos_dinamicos">
                  {{ dato | datoDinamico }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #sinHistorias>
        <div class="hc-empty">No hay historias clínicas registradas.</div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .hc-dialog {
      min-width: 340px; max-width: 800px; max-height: 80vh;
      padding: 24px 24px 18px; box-sizing: border-box;
      background: radial-gradient(circle at top left, rgba(255, 214, 102, 0.16), transparent 55%),
                  radial-gradient(circle at bottom right, rgba(255, 193, 7, 0.12), transparent 55%), #050816;
      border-radius: 24px; border: 1px solid rgba(255, 193, 7, 0.55);
      box-shadow: 0 26px 60px rgba(0, 0, 0, 0.9);
      color: #f9fafb; font-family: system-ui, sans-serif;
    }
    .hc-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 18px; }
    .hc-title { font-size: 1.1rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #ffecb3; }
    .hc-subtitle { margin-top: 4px; font-size: .95rem; opacity: .85; }
    .hc-header-actions { margin-left: auto; display: flex; gap: 8px; }
    .icon-button {
      width: 32px; height: 32px; border-radius: 999px; border: 1px solid rgba(255, 193, 7, 0.7);
      background: radial-gradient(circle at top, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.8));
      display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
      padding: 0; font-size: .85rem; color: #ffecb3; transition: all .12s ease;
    }
    .icon-button.excel { border-color: #22c55e; color: #4ade80; }
    .icon-button:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0, 0, 0, .7); border-color: #ffe082; }
    .hc-body { max-height: calc(80vh - 88px); padding-right: 4px; overflow: auto; }
    .historia-card {
      position: relative; margin-bottom: 14px; padding: 10px 12px 12px; border-radius: 20px;
      background: linear-gradient(135deg, rgba(255, 213, 79, .14), rgba(4, 10, 24, .9));
      border: 1px solid rgba(255, 213, 79, 0.55); box-shadow: 0 14px 36px rgba(0, 0, 0, .85);
    }
    .historia-card.open { box-shadow: 0 18px 40px rgba(0, 0, 0, .95); }
    .historia-header {
      width: 100%; background: transparent; border: none; display: flex; align-items: center;
      justify-content: space-between; gap: 12px; padding: 4px 0; color: inherit; cursor: pointer;
    }
    .historia-header-left, .historia-header-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .pill {
      padding: 4px 10px; border-radius: 999px; font-size: .72rem; letter-spacing: .06em;
      text-transform: uppercase; border: 1px solid transparent; white-space: nowrap;
    }
    .pill-fecha { background: rgba(0, 0, 0, .6); border-color: rgba(255, 213, 79, .7); color: #ffecb3; }
    .pill-esp { background: rgba(11, 15, 40, .85); border-color: rgba(129, 212, 250, .6); color: #e3f2fd; }
    .pill-id { background: rgba(0, 0, 0, .4); border-color: rgba(255, 213, 79, .5); color: #ffe082; }
    .chevron { font-size: .9rem; opacity: .7; transition: transform .15s ease; }
    .chevron.open { transform: rotate(180deg); opacity: 1; }
    .historia-body { margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, .06); padding-top: 10px; }
    .historia-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .historia-item { padding: 8px 10px; border-radius: 12px; background: rgba(0, 0, 0, .4); border: 1px solid rgba(255, 255, 255, .04); }
    .historia-item.full-width { grid-column: 1 / -1; }
    .text-wrap { white-space: pre-wrap; }
    .label { display: block; font-size: .7rem; text-transform: uppercase; letter-spacing: .09em; opacity: .7; margin-bottom: 3px; }
    .value { font-size: .85rem; }
    .datos-dinamicos { margin-top: 14px; }
    .datos-title { font-size: .75rem; text-transform: uppercase; letter-spacing: .09em; color: #ffecb3; opacity: .9; margin-bottom: 6px; }
    .datos-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .dato-chip { padding: 4px 8px; border-radius: 999px; font-size: .78rem; background: rgba(0, 0, 0, .5); border: 1px solid rgba(255, 213, 79, .45); }
    .hc-empty { padding: 40px 0 16px; text-align: center; font-size: .9rem; opacity: .8; }
    @media (max-width: 600px) { .historia-grid { grid-template-columns: 1fr; } }
  `]
})
export class HistoriaClinicaDialogComponent {
  panelAbiertoIndex: number | null = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: HistoriaClinicaDialogData,
    private dialogRef: MatDialogRef<HistoriaClinicaDialogComponent>
  ) {}

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
  exportarExcel(): void {
    const filas = this.data.historias.map((h: any, i) => {
      // 1. Aplanamos los datos dinámicos en una sola celda
      let dinamicosStr = '';
      if (h.datos_dinamicos && h.datos_dinamicos.length) {
        dinamicosStr = h.datos_dinamicos.map((d: any) => {
          const val = d.valor_texto || d.valor_numerico || (d.valor_boolean ? 'Sí' : 'No') || d.valor;
          return `${d.clave}: ${val}`;
        }).join('; ');
      }

      return {
        'Nro': this.data.historias.length - i,
        'Fecha': h.fechaAtencion || this.formatearFecha(h.fecha_registro || h.created_at),
        'Especialidad': (h.especialidad || '').toUpperCase(),
        'Especialista': this.capitalizar(h.especialistaNombre),
        'Altura (cm)': h.altura ?? '-',
        'Peso (kg)': h.peso ?? '-',
        'Temperatura (°C)': h.temperatura ?? '-',
        'Presión': h.presion ?? '-',
        'Reseña': h.resena || '',  // <--- RESEÑA EN EL EXCEL
        'Datos Dinámicos': dinamicosStr // <--- DINÁMICOS EN EL EXCEL
      };
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(filas);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historia Clínica');

    const nombreArchivo = `historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  }

  // ========================================================================
  //  EXPORTAR A PDF (Con Reseña y Dinámicos)
  // ========================================================================
  exportarPdf(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const marginX = 15;
    const marginBottom = 15; // AGREGADO AQUÍ
    const headerBottom = 32;
    const cardPadding = 5;
    const lineHeight = 5;
    const paragraphSpacing = 2;

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
      this.data.historias.forEach((h: any, index: number) => {
        const paragraphs: { lines: string[]; bold?: boolean }[] = [];
        const anchoTexto = contentWidth - cardPadding * 2;

        const addParagraph = (text: string, opts?: { bold?: boolean }) => {
          paragraphs.push({ lines: doc.splitTextToSize(text, anchoTexto), bold: opts?.bold });
        };

        const fechaAt = h.fechaAtencion || 'N/A';
        const especialidad = h.especialidad ? `(${h.especialidad})` : '';
        addParagraph(`Atención #${this.data.historias.length - index} · ${fechaAt} ${especialidad}`, { bold: true });
        
        const especialistaCap = this.capitalizar(h.especialistaNombre || 'N/A');
        addParagraph(`Especialista: ${especialistaCap}`);
        
        const fechaReg = h.fecha_registro ? new Date(h.fecha_registro).toLocaleString('es-AR') : 
                         (h.created_at ? new Date(h.created_at).toLocaleString('es-AR') : 'N/A');
        
        addParagraph(`Fecha de registro: ${fechaReg}`);
        addParagraph(`Altura: ${h.altura ?? '-'} cm | Peso: ${h.peso ?? '-'} kg | Temp.: ${h.temperatura ?? '-'} °C | Presión: ${h.presion ?? '-'}`);

        // --- RESEÑA EN EL PDF ---
        if (h.resena) {
          addParagraph(`Reseña: ${h.resena}`);
        }

        // --- DATOS DINÁMICOS EN EL PDF ---
        if (h.datos_dinamicos?.length) {
          addParagraph('Datos dinámicos:', { bold: true });
          h.datos_dinamicos.forEach((d: any) => {
             const valor = d.valor_texto || d.valor_numerico || (d.valor_boolean ? 'Sí' : 'No') || d.valor;
             addParagraph(`• ${d.clave}: ${valor}`);
          });
        }

        let cardHeight = cardPadding * 2;
        paragraphs.forEach((p, i) => {
          cardHeight += p.lines.length * lineHeight;
          if (i > 0) cardHeight += paragraphSpacing;
        });

        if (y + cardHeight > pageHeight - marginBottom) {
          doc.addPage();
          drawHeader();
          y = headerBottom + 8;
        }

        doc.setFillColor(255, 253, 231);
        doc.setDrawColor(251, 192, 45);
        doc.setLineWidth(0.4);
        doc.roundedRect(marginX, y, contentWidth, cardHeight, 3, 3, 'FD');
        doc.setFillColor(253, 230, 138);
        doc.rect(marginX, y, 2, cardHeight, 'F');

        let textY = y + cardPadding + lineHeight;
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        paragraphs.forEach((p, i) => {
          doc.setFont('helvetica', p.bold ? 'bold' : 'normal');
          p.lines.forEach(l => { doc.text(l, marginX + cardPadding + 2, textY); textY += lineHeight; });
          if (i < paragraphs.length - 1) textY += paragraphSpacing;
        });

        y += cardHeight + 6;
      });

      const nombreArchivo = `historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      doc.save(nombreArchivo);
    };

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







// import { Component, Inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import jsPDF from 'jspdf';
// import { HistoriaClinicaConExtras } from '../../../models/historia-clinica.model';
// import { DatoDinamico } from '../../../models/dato-dinamico.model';
// import { DatoDinamicoPipe } from '../../../../pipes/dato-dinamico.pipe';
// import { CapitalizarNombrePipe } from "../../../../pipes/capitalizar-nombre.pipe";

// export interface HistoriaClinicaDialogData {
//   pacienteNombre: string;
//   historias: HistoriaClinicaConExtras[];
// }

// @Component({
//   selector: 'app-historia-clinica-dialog',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatDialogModule,
//     DatoDinamicoPipe,
//     CapitalizarNombrePipe
// ],
//   template: `
//     <div class="hc-dialog">
//       <!-- HEADER -->
//       <div class="hc-header">
//         <div>
//           <div class="hc-title">Historia Clínica</div>
//           <div class="hc-subtitle">{{ data.pacienteNombre  | capitalizarNombre }}</div>
//         </div>

//         <div class="hc-header-actions">
//           <button
//             type="button"
//             class="icon-button"
//             title="Descargar PDF"
//             (click)="exportarPdf()">
//             ⬇
//           </button>
//           <button
//             type="button"
//             class="icon-button"
//             title="Cerrar"
//             (click)="cerrar()">
//             ✕
//           </button>
//         </div>
//       </div>

//       <!-- BODY -->
//       <div class="hc-body" *ngIf="data.historias.length; else sinHistorias">
//         <div
//           class="historia-card"
//           *ngFor="let historia of data.historias; let i = index"
//           [class.open]="panelAbiertoIndex === i">

//           <!-- CABECERA DE LA CARD -->
//           <button
//             type="button"
//             class="historia-header"
//             (click)="toggleCard(i)">
            
//             <div class="historia-header-left">
//               <!-- 1. BADGE ESPECIALIDAD (CORREGIDO CON $any) -->
//               <!-- Usamos $any() para evitar que TS se queje si la propiedad no está en la interfaz -->
//               <span class="pill pill-esp" *ngIf="$any(historia).especialidad">
//                 {{ $any(historia).especialidad | uppercase }}
//               </span>

//               <!-- 2. BADGE FECHA -->
//               <span class="pill pill-fecha">
//                 {{ formatearFecha(historia.fecha_registro || historia.created_at) }}
//               </span>
              
//               <!-- 3. BADGE ESPECIALISTA -->
//               <span class="pill pill-esp">
//                 {{ historia.especialistaNombre | capitalizarNombre }}
//               </span>
//             </div>

//             <div class="historia-header-right">
//               <span class="pill pill-id">
//                 Atención #{{ data.historias.length - i }}
//               </span>
//               <span class="chevron" [class.open]="panelAbiertoIndex === i">⌄</span>
//             </div>
//           </button>

//           <!-- CONTENIDO EXPANDIDO -->
//           <div class="historia-body" *ngIf="panelAbiertoIndex === i">
//             <div class="historia-grid">
//               <div class="historia-item">
//                 <span class="label">Fecha de atención</span>
//                 <span class="value">{{ historia.fechaAtencion || 'N/A' }}</span>
//               </div>
//               <div class="historia-item">
//                 <span class="label">Especialista</span>
//                 <span class="value">{{ (historia.especialistaNombre | capitalizarNombre)   || 'N/A' }}</span>
//               </div>
//               <div class="historia-item">
//                 <span class="label">Altura</span>
//                 <span class="value">{{ historia.altura ?? '-' }} cm</span>
//               </div>
//               <div class="historia-item">
//                 <span class="label">Peso</span>
//                 <span class="value">{{ historia.peso ?? '-' }} kg</span>
//               </div>
//               <div class="historia-item">
//                 <span class="label">Temperatura</span>
//                 <span class="value">{{ historia.temperatura ?? '-' }} °C</span>
//               </div>
//               <div class="historia-item">
//                 <span class="label">Presión</span>
//                 <span class="value">{{ historia.presion ?? '-' }}</span>
//               </div>
//             </div>

//             <div
//               *ngIf="historia.datos_dinamicos && historia.datos_dinamicos.length"
//               class="datos-dinamicos">
//               <div class="datos-title">Datos dinámicos</div>
//               <div class="datos-chips">
//                 <span class="dato-chip" *ngFor="let dato of historia.datos_dinamicos">
//                   {{ dato | datoDinamico }}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <!-- SIN HISTORIAS -->
//       <ng-template #sinHistorias>
//         <div class="hc-empty">
//           No hay historias clínicas registradas.
//         </div>
//       </ng-template>
//     </div>
//   `,
//   styles: [`
//     :host { display: block; }
//     .hc-dialog {
//       min-width: 340px; max-width: 800px; max-height: 80vh;
//       padding: 24px 24px 18px; box-sizing: border-box;
//       background: radial-gradient(circle at top left, rgba(255, 214, 102, 0.16), transparent 55%),
//                   radial-gradient(circle at bottom right, rgba(255, 193, 7, 0.12), transparent 55%),
//                   #050816;
//       border-radius: 24px; border: 1px solid rgba(255, 193, 7, 0.55);
//       box-shadow: 0 26px 60px rgba(0, 0, 0, 0.9);
//       color: #f9fafb; font-family: system-ui, sans-serif;
//     }
//     .hc-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 18px; }
//     .hc-title { font-size: 1.1rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #ffecb3; }
//     .hc-subtitle { margin-top: 4px; font-size: .95rem; opacity: .85; }
//     .hc-header-actions { margin-left: auto; display: flex; gap: 8px; }
//     .icon-button {
//       width: 32px; height: 32px; border-radius: 999px; border: 1px solid rgba(255, 193, 7, 0.7);
//       background: radial-gradient(circle at top, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.8));
//       display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
//       padding: 0; font-size: .85rem; color: #ffecb3; transition: all .12s ease;
//     }
//     .icon-button:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0, 0, 0, .7); border-color: #ffe082; }
//     .hc-body { max-height: calc(80vh - 88px); padding-right: 4px; overflow: auto; }
//     .historia-card {
//       position: relative; margin-bottom: 14px; padding: 10px 12px 12px; border-radius: 20px;
//       background: linear-gradient(135deg, rgba(255, 213, 79, .14), rgba(4, 10, 24, .9));
//       border: 1px solid rgba(255, 213, 79, 0.55); box-shadow: 0 14px 36px rgba(0, 0, 0, .85);
//     }
//     .historia-card.open { box-shadow: 0 18px 40px rgba(0, 0, 0, .95); }
//     .historia-header {
//       width: 100%; background: transparent; border: none; display: flex; align-items: center;
//       justify-content: space-between; gap: 12px; padding: 4px 0; color: inherit; cursor: pointer;
//     }
//     .historia-header-left, .historia-header-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
//     .pill {
//       padding: 4px 10px; border-radius: 999px; font-size: .72rem; letter-spacing: .06em;
//       text-transform: uppercase; border: 1px solid transparent; white-space: nowrap;
//     }
//     .pill-fecha { background: rgba(0, 0, 0, .6); border-color: rgba(255, 213, 79, .7); color: #ffecb3; }
//     .pill-esp { background: rgba(11, 15, 40, .85); border-color: rgba(129, 212, 250, .6); color: #e3f2fd; }
//     .pill-id { background: rgba(0, 0, 0, .4); border-color: rgba(255, 213, 79, .5); color: #ffe082; }
//     .chevron { font-size: .9rem; opacity: .7; transition: transform .15s ease; }
//     .chevron.open { transform: rotate(180deg); opacity: 1; }
//     .historia-body { margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, .06); padding-top: 10px; }
//     .historia-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
//     .historia-item { padding: 8px 10px; border-radius: 12px; background: rgba(0, 0, 0, .4); border: 1px solid rgba(255, 255, 255, .04); }
//     .label { display: block; font-size: .7rem; text-transform: uppercase; letter-spacing: .09em; opacity: .7; margin-bottom: 3px; }
//     .value { font-size: .85rem; }
//     .datos-dinamicos { margin-top: 14px; }
//     .datos-title { font-size: .75rem; text-transform: uppercase; letter-spacing: .09em; color: #ffecb3; opacity: .9; margin-bottom: 6px; }
//     .datos-chips { display: flex; flex-wrap: wrap; gap: 6px; }
//     .dato-chip { padding: 4px 8px; border-radius: 999px; font-size: .78rem; background: rgba(0, 0, 0, .5); border: 1px solid rgba(255, 213, 79, .45); }
//     .hc-empty { padding: 40px 0 16px; text-align: center; font-size: .9rem; opacity: .8; }
//     @media (max-width: 600px) { .historia-grid { grid-template-columns: 1fr; } }
//   `]
// })
// export class HistoriaClinicaDialogComponent {
//   panelAbiertoIndex: number | null = 0;

//   constructor(
//     @Inject(MAT_DIALOG_DATA) public data: HistoriaClinicaDialogData,
//     private dialogRef: MatDialogRef<HistoriaClinicaDialogComponent>
//   ) {}

//   toggleCard(index: number): void {
//     this.panelAbiertoIndex = this.panelAbiertoIndex === index ? null : index;
//   }

//   cerrar(): void {
//     this.dialogRef.close();
//   }

//   formatearFecha(fecha: string | undefined): string {
//     if (!fecha) return 'N/A';
//     return new Date(fecha).toLocaleDateString('es-AR', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   }

//   // ========================================================================
//   //  EXPORTAR A PDF (LOGO SVG + CONTENIDO)
//   // ========================================================================
//   exportarPdf(): void {
//     const doc = new jsPDF('p', 'mm', 'a4');
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();
    
//     const marginX = 15;
//     const marginBottom = 15;
//     const cardPadding = 5;
//     const lineHeight = 5;
//     const paragraphSpacing = 2;
//     const headerBottom = 32;

//     // --- HELPER LOCAL PARA CAPITALIZAR ---
//     const capitalizar = (str: string | undefined | null): string => {
//       if (!str) return '';
//       return str.trim().toLowerCase().split(' ')
//         .map(p => p.charAt(0).toUpperCase() + p.slice(1))
//         .join(' ');
//     };

//     const svgLogo = `
//     <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
//       <defs>
//         <linearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
//           <stop offset="0%" style="stop-color:#0099ff;stop-opacity:1" /> 
//           <stop offset="100%" style="stop-color:#0055b3;stop-opacity:1" /> 
//         </linearGradient>
//       </defs>
//       <g transform="translate(50, 50)">
//         <path d="M 80 0 H 120 A 10 10 0 0 1 130 10 V 80 H 200 A 10 10 0 0 1 210 90 V 130 A 10 10 0 0 1 200 140 H 130 V 210 A 10 10 0 0 1 120 220 H 80 A 10 10 0 0 1 70 210 V 140 H 0 A 10 10 0 0 1 -10 130 V 90 A 10 10 0 0 1 0 80 H 70 V 10 A 10 10 0 0 1 80 0 Z" fill="url(#gradBlue)" transform="scale(0.5) translate(30,30)"/>
//         <path d="M 60 115 L 90 145 L 150 85" stroke="white" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.5) translate(30,30)"/>
//       </g>
//       <g transform="translate(180, 115)">
//         <text x="0" y="-25" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="500" font-size="28" fill="#0077cc" letter-spacing="2px">CLINICA</text>
//         <text x="0" y="25" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="52" fill="#003366">MONLLOR</text>
//       </g>
//     </svg>`;

//     const svgBase64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgLogo)));

//     const generarDocumento = (pngDataUrl?: string) => {
      
//       const drawHeader = () => {
//         doc.setFillColor(17, 24, 39); 
//         doc.rect(0, 0, pageWidth, headerBottom, 'F');

//         if (pngDataUrl) {
//           doc.setFillColor(255, 255, 255);
//           doc.roundedRect(marginX - 2, 5, 65, 22, 2, 2, 'F');
//           doc.addImage(pngDataUrl, 'PNG', marginX, 6, 60, 20);
//         }

//         doc.setTextColor(255, 255, 255);
//         doc.setFont('helvetica', 'bold');
//         doc.setFontSize(16);
//         doc.text('Historia Clínica', pageWidth - marginX, 18, { align: 'right' });

//         doc.setFont('helvetica', 'normal');
//         doc.setFontSize(10);
        
//         // --- 1. APLICAMOS LA CAPITALIZACIÓN AL PACIENTE ---
//         const nombrePacienteCap = capitalizar(this.data.pacienteNombre);
//         doc.text(`Paciente: ${nombrePacienteCap}`, pageWidth - marginX, 24, { align: 'right' });
        
//         const hoy = new Date().toLocaleDateString('es-AR');
//         doc.setTextColor(209, 213, 219);
//         doc.setFontSize(8);
//         doc.text(`Emisión: ${hoy}`, pageWidth - marginX, 28, { align: 'right' });

//         doc.setDrawColor(251, 191, 36);
//         doc.setLineWidth(0.4);
//         doc.line(marginX, headerBottom - 1, pageWidth - marginX, headerBottom - 1);
//       };

//       drawHeader();
//       let y = headerBottom + 8;

//       if (!this.data.historias.length) {
//         doc.setTextColor(55, 65, 81);
//         doc.setFontSize(12);
//         doc.text('No hay historias clínicas registradas.', pageWidth / 2, pageHeight / 2, { align: 'center' });
//         doc.save(`historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.pdf`);
//         return;
//       }

//       const contentWidth = pageWidth - marginX * 2;
//       this.data.historias.forEach((h: any, index: number) => {
//         const paragraphs: { lines: string[]; bold?: boolean }[] = [];
//         const anchoTexto = contentWidth - cardPadding * 2;

//         const addParagraph = (text: string, opts?: { bold?: boolean }) => {
//           paragraphs.push({ lines: doc.splitTextToSize(text, anchoTexto), bold: opts?.bold });
//         };

//         const fechaAt = h.fechaAtencion || 'N/A';
//         const especialidad = h.especialidad ? `(${h.especialidad})` : '';
//         addParagraph(`Atención #${this.data.historias.length - index} · ${fechaAt} ${especialidad}`, { bold: true });
        
//         // --- 2. APLICAMOS LA CAPITALIZACIÓN AL ESPECIALISTA ---
//         const especialistaCap = capitalizar(h.especialistaNombre || 'N/A');
//         addParagraph(`Especialista: ${especialistaCap}`);
        
//         const fechaReg = h.fecha_registro ? new Date(h.fecha_registro).toLocaleString('es-AR') : 
//                          (h.created_at ? new Date(h.created_at).toLocaleString('es-AR') : 'N/A');
        
//         addParagraph(`Fecha de registro: ${fechaReg}`);
//         addParagraph(`Altura: ${h.altura ?? '-'} cm | Peso: ${h.peso ?? '-'} kg | Temp.: ${h.temperatura ?? '-'} °C | Presión: ${h.presion ?? '-'}`);

//         if (h.datos_dinamicos?.length) {
//           addParagraph('Datos dinámicos:', { bold: true });
//           h.datos_dinamicos.forEach((d: any) => {
//              const valor = d.valor_texto || d.valor_numerico || (d.valor_boolean ? 'Sí' : 'No') || d.valor;
//              addParagraph(`• ${d.clave}: ${valor}`);
//           });
//         }

//         let cardHeight = cardPadding * 2;
//         paragraphs.forEach((p, i) => {
//           cardHeight += p.lines.length * lineHeight;
//           if (i > 0) cardHeight += paragraphSpacing;
//         });

//         if (y + cardHeight > pageHeight - marginBottom) {
//           doc.addPage();
//           drawHeader();
//           y = headerBottom + 8;
//         }

//         doc.setFillColor(255, 253, 231);
//         doc.setDrawColor(251, 192, 45);
//         doc.setLineWidth(0.4);
//         doc.roundedRect(marginX, y, contentWidth, cardHeight, 3, 3, 'FD');
//         doc.setFillColor(253, 230, 138);
//         doc.rect(marginX, y, 2, cardHeight, 'F');

//         let textY = y + cardPadding + lineHeight;
//         doc.setTextColor(30, 41, 59);
//         doc.setFontSize(10);
//         paragraphs.forEach((p, i) => {
//           doc.setFont('helvetica', p.bold ? 'bold' : 'normal');
//           p.lines.forEach(l => { doc.text(l, marginX + cardPadding + 2, textY); textY += lineHeight; });
//           if (i < paragraphs.length - 1) textY += paragraphSpacing;
//         });

//         y += cardHeight + 6;
//       });

//       const nombreArchivo = `historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.pdf`;
//       doc.save(nombreArchivo);
//     };

//     const img = new Image();
//     img.src = svgBase64;
//     img.onload = () => {
//       const canvas = document.createElement('canvas');
//       canvas.width = 600; canvas.height = 200;
//       const ctx = canvas.getContext('2d');
//       if (ctx) {
//         ctx.drawImage(img, 0, 0);
//         generarDocumento(canvas.toDataURL('image/png'));
//       } else generarDocumento();
//     };
//     img.onerror = () => generarDocumento();
//   }


// }


// //-----------------------------------------------------------------------
