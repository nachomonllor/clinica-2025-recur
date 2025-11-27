import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import { HistoriaClinicaConExtras } from '../../../models/historia-clinica.model';
import { DatoDinamico } from '../../../models/dato-dinamico.model';
import { DatoDinamicoPipe } from '../../../../pipes/dato-dinamico.pipe';

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
    DatoDinamicoPipe
  ],
  template: `
    <div class="hc-dialog">
      <!-- HEADER ------------------------------------------------- -->
      <div class="hc-header">
        <div>
          <div class="hc-title">Historia Clínica</div>
          <div class="hc-subtitle">{{ data.pacienteNombre }}</div>
        </div>

        <div class="hc-header-actions">
          <button
            type="button"
            class="icon-button"
            title="Descargar PDF"
            (click)="exportarPdf()">
            ⬇
          </button>
          <button
            type="button"
            class="icon-button"
            title="Cerrar"
            (click)="cerrar()">
            ✕
          </button>
        </div>
      </div>

      <!-- BODY --------------------------------------------------- -->
      <div class="hc-body" *ngIf="data.historias.length; else sinHistorias">
        <div
          class="historia-card"
          *ngFor="let historia of data.historias; let i = index"
          [class.open]="panelAbiertoIndex === i">

          <!-- CABECERA DE LA CARD (tipo acordeón) -->
          <button
            type="button"
            class="historia-header"
            (click)="toggleCard(i)">
            <div class="historia-header-left">
              <span class="pill pill-fecha">
                {{ formatearFecha(historia.created_at) }}
              </span>
              <span class="pill pill-esp">
                {{ historia.especialistaNombre }}
              </span>
            </div>

            <div class="historia-header-right">
              <span class="pill pill-id">
                Atención #{{ i + 1 }}
              </span>
              <span class="chevron" [class.open]="panelAbiertoIndex === i">⌄</span>
            </div>
          </button>

          <!-- CONTENIDO EXPANDIDO -------------------------------- -->
          <div class="historia-body" *ngIf="panelAbiertoIndex === i">
            <div class="historia-grid">
              <div class="historia-item">
                <span class="label">Fecha de atención</span>
                <span class="value">{{ historia.fechaAtencion || 'N/A' }}</span>
              </div>
              <div class="historia-item">
                <span class="label">Especialista</span>
                <span class="value">{{ historia.especialistaNombre || 'N/A' }}</span>
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
            </div>

            <div
              *ngIf="historia.datos_dinamicos && historia.datos_dinamicos.length"
              class="datos-dinamicos">
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

      <!-- ESTADO SIN HISTORIAS ---------------------------------- -->
      <ng-template #sinHistorias>
        <div class="hc-empty">
          No hay historias clínicas registradas.
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Contenedor principal del diálogo (similar a login admin) */
    .hc-dialog {
      min-width: 340px;
      max-width: 760px;
      max-height: 80vh;
      padding: 24px 24px 18px;
      box-sizing: border-box;

      background:
        radial-gradient(circle at top left, rgba(255, 214, 102, 0.16), transparent 55%),
        radial-gradient(circle at bottom right, rgba(255, 193, 7, 0.12), transparent 55%),
        #050816;
      border-radius: 24px;
      border: 1px solid rgba(255, 193, 7, 0.55);
      box-shadow: 0 26px 60px rgba(0, 0, 0, 0.9);

      color: #f9fafb;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* HEADER ---------------------------------------------------- */
    .hc-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 18px;
    }

    .hc-title {
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: .06em;
      text-transform: uppercase;
      color: #ffecb3;
    }

    .hc-subtitle {
      margin-top: 4px;
      font-size: .95rem;
      opacity: .85;
    }

    .hc-header-actions {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }

    .icon-button {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      border: 1px solid rgba(255, 193, 7, 0.7);
      background:
        radial-gradient(circle at top, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.8));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      font-size: .85rem;
      color: #ffecb3;
      transition: transform .12s ease, box-shadow .12s ease,
                  border-color .12s ease, background .12s ease;
    }

    .icon-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, .7);
      border-color: #ffe082;
    }

    .icon-button:active {
      transform: translateY(0);
      box-shadow: none;
    }

    /* BODY / scroll --------------------------------------------- */
    .hc-body {
      max-height: calc(80vh - 88px);
      padding-right: 4px;
      overflow: auto;
    }

    /* CARDS ----------------------------------------------------- */
    .historia-card {
      position: relative;
      margin-bottom: 14px;
      padding: 10px 12px 12px;
      border-radius: 20px;
      background:
        linear-gradient(135deg,
          rgba(255, 213, 79, .14),
          rgba(4, 10, 24, .9));
      border: 1px solid rgba(255, 213, 79, 0.55);
      box-shadow: 0 14px 36px rgba(0, 0, 0, .85);
      backdrop-filter: blur(12px);
    }

    .historia-card.open {
      box-shadow: 0 18px 40px rgba(0, 0, 0, .95);
    }

    .historia-header {
      width: 100%;
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 4px 0;
      color: inherit;
      cursor: pointer;
    }

    .historia-header-left,
    .historia-header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .pill {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: .72rem;
      letter-spacing: .06em;
      text-transform: uppercase;
      border: 1px solid transparent;
      white-space: nowrap;
    }

    .pill-fecha {
      background: rgba(0, 0, 0, .6);
      border-color: rgba(255, 213, 79, .7);
      color: #ffecb3;
    }

    .pill-esp {
      background: rgba(11, 15, 40, .85);
      border-color: rgba(129, 212, 250, .6);
      color: #e3f2fd;
    }

    .pill-id {
      background: rgba(0, 0, 0, .4);
      border-color: rgba(255, 213, 79, .5);
      color: #ffe082;
    }

    .chevron {
      font-size: .9rem;
      opacity: .7;
      transform: rotate(0deg);
      transition: transform .15s ease, opacity .15s ease;
    }

    .chevron.open {
      transform: rotate(180deg);
      opacity: 1;
    }

    /* CONTENIDO EXPANDIDO --------------------------------------- */
    .historia-body {
      margin-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, .06);
      padding-top: 10px;
    }

    .historia-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .historia-item {
      padding: 8px 10px;
      border-radius: 12px;
      background: rgba(0, 0, 0, .4);
      border: 1px solid rgba(255, 255, 255, .04);
    }

    .label {
      display: block;
      font-size: .7rem;
      text-transform: uppercase;
      letter-spacing: .09em;
      opacity: .7;
      margin-bottom: 3px;
    }

    .value {
      font-size: .85rem;
    }

    /* DATOS DINÁMICOS ------------------------------------------- */
    .datos-dinamicos {
      margin-top: 14px;
    }

    .datos-title {
      font-size: .75rem;
      text-transform: uppercase;
      letter-spacing: .09em;
      color: #ffecb3;
      opacity: .9;
      margin-bottom: 6px;
    }

    .datos-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .dato-chip {
      padding: 4px 8px;
      border-radius: 999px;
      font-size: .78rem;
      background: rgba(0, 0, 0, .5);
      border: 1px solid rgba(255, 213, 79, .45);
    }

    /* ESTADO VACÍO ---------------------------------------------- */
    .hc-empty {
      padding: 40px 0 16px;
      text-align: center;
      font-size: .9rem;
      opacity: .8;
    }

    /* RESPONSIVE ------------------------------------------------ */
    @media (max-width: 600px) {
      .hc-dialog {
        padding: 18px 16px 14px;
      }

      .historia-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HistoriaClinicaDialogComponent {
  // primer card abierta por default
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

  private formatearDatoDinamico(d: DatoDinamico): string {
    const v = d.valor;
    let texto: string;

    if (v === null || v === undefined) {
      texto = '-';
    } else if (typeof v === 'boolean') {
      texto = v ? 'Sí' : 'No';
    } else {
      texto = String(v);
    }

    if (d.unidad) {
      texto += ` ${d.unidad}`;
    }

    return texto;
  }

  // exportarPdf(): void {
  //   const doc = new jsPDF();
  //   const pageHeight = doc.internal.pageSize.getHeight();

  //   doc.setFontSize(16);
  //   doc.text(`Historia Clínica - ${this.data.pacienteNombre}`, 10, 15);

  //   let y = 25;

  //   const addLine = (texto: string) => {
  //     const lineas = doc.splitTextToSize(texto, 190);
  //     for (const linea of lineas) {
  //       if (y > pageHeight - 10) {
  //         doc.addPage();
  //         y = 20;
  //       }
  //       doc.text(linea, 10, y);
  //       y += 6;
  //     }
  //   };

  //   this.data.historias.forEach((h, index: number) => {
  //     addLine(`Atención #${index + 1} - ${h.fechaAtencion || 'N/A'}`);
  //     addLine(`Especialista: ${h.especialistaNombre || 'N/A'}`);
  //     addLine(`Fecha de registro: ${new Date(h.fecha_registro).toLocaleString('es-AR')}`);

  //     addLine(
  //       `Altura: ${h.altura ?? '-'} cm | ` +
  //       `Peso: ${h.peso ?? '-'} kg | ` +
  //       `Temperatura: ${h.temperatura ?? '-'} °C | ` +
  //       `Presión: ${h.presion ?? '-'}`
  //     );

  //     (h.datos_dinamicos || []).forEach((d: DatoDinamico) => {
  //       addLine(`${d.clave}: ${this.formatearDatoDinamico(d)}`);
  //     });

  //     y += 4;
  //     if (y > pageHeight - 10) {
  //       doc.addPage();
  //       y = 20;
  //     }
  //   });

  //   const nombreArchivo =
  //     `historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.pdf`;

  //   doc.save(nombreArchivo);
  // }


  exportarPdf(): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 15;
  const marginBottom = 15;
  const cardPadding = 5;
  const lineHeight = 5;
  const paragraphSpacing = 2;

  const drawHeader = () => {
    // Faja superior oscura
    doc.setFillColor(17, 24, 39); // #111827
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Historia Clínica', marginX, 13);

    // Paciente
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Paciente: ${this.data.pacienteNombre}`, marginX, 20);

    // Fecha de emisión
    const hoy = new Date().toLocaleDateString('es-AR');
    doc.setFontSize(9);
    doc.setTextColor(209, 213, 219); // gris claro
    doc.text(hoy, pageWidth - marginX, 13, { align: 'right' });

    // Línea dorada de separación
    doc.setDrawColor(251, 191, 36); // dorado
    doc.setLineWidth(0.4);
    doc.line(marginX, 24, pageWidth - marginX, 24);
  };

  drawHeader();

  const headerBottom = 28;
  let y = headerBottom + 8;

  // Caso sin historias
  if (!this.data.historias.length) {
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(12);
    doc.text(
      'No hay historias clínicas registradas para este paciente.',
      pageWidth / 2,
      pageHeight / 2,
      { align: 'center' }
    );

    const nombreArchivo =
      `historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    doc.save(nombreArchivo);
    return;
  }

  const contentWidth = pageWidth - marginX * 2;

  this.data.historias.forEach((h, index: number) => {
    const paragraphs: { lines: string[]; bold?: boolean }[] = [];
    const anchoTexto = contentWidth - cardPadding * 2;

    const addParagraph = (text: string, options?: { bold?: boolean }) => {
      const rawLines = doc.splitTextToSize(text, anchoTexto);
      paragraphs.push({ lines: rawLines, bold: options?.bold });
    };

    const fechaAt = h.fechaAtencion || 'N/A';
    addParagraph(`Atención #${index + 1} · ${fechaAt}`, { bold: true });

    addParagraph(`Especialista: ${h.especialistaNombre || 'N/A'}`);

    const fechaReg = h.fecha_registro
      ? new Date(h.fecha_registro).toLocaleString('es-AR')
      : 'N/A';
    addParagraph(`Fecha de registro: ${fechaReg}`);

    addParagraph(
      `Altura: ${h.altura ?? '-'} cm   |   ` +
      `Peso: ${h.peso ?? '-'} kg   |   ` +
      `Temp.: ${h.temperatura ?? '-'} °C   |   ` +
      `Presión: ${h.presion ?? '-'}`
    );

    const datosDinamicos = h.datos_dinamicos || [];
    if (datosDinamicos.length) {
      addParagraph('Datos dinámicos:', { bold: true });
      datosDinamicos.forEach((d: DatoDinamico) => {
        addParagraph(`• ${d.clave}: ${this.formatearDatoDinamico(d)}`);
      });
    }

    // Calcular alto de la card
    let cardHeight = cardPadding * 2;
    paragraphs.forEach((p, i) => {
      cardHeight += p.lines.length * lineHeight;
      if (i > 0) {
        cardHeight += paragraphSpacing;
      }
    });

    // Salto de página si no entra la card completa
    if (y + cardHeight > pageHeight - marginBottom) {
      doc.addPage();
      drawHeader();
      y = headerBottom + 8;
    }

    // Fondo de la card (amarillo suave) + borde
    doc.setFillColor(255, 253, 231);      // #FFFDE7
    doc.setDrawColor(251, 192, 45);       // #FBC02D
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, y, contentWidth, cardHeight, 3, 3, 'FD');

    // Banda lateral tipo acento
    doc.setFillColor(253, 230, 138);      // #FDE68A
    doc.rect(marginX, y, 2, cardHeight, 'F');

    // Texto dentro de la card
    let textY = y + cardPadding + lineHeight;
    doc.setTextColor(30, 41, 59);         // #1E293B
    doc.setFontSize(10);

    paragraphs.forEach((p, i) => {
      if (p.bold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      p.lines.forEach(line => {
        doc.text(line, marginX + cardPadding + 2, textY);
        textY += lineHeight;
      });

      if (i < paragraphs.length - 1) {
        textY += paragraphSpacing;
      }
    });

    y += cardHeight + 6; // espacio entre cards
  });

  const nombreArchivo =
    `historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.pdf`;

  doc.save(nombreArchivo);
}





  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}




// import { Component, Inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatExpansionModule } from '@angular/material/expansion';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { DatoDinamicoPipe } from "../../../../pipes/dato-dinamico.pipe";
// import jsPDF from 'jspdf';
// import { HistoriaClinicaConExtras } from '../../../models/historia-clinica.model';
// import { DatoDinamico } from '../../../models/dato-dinamico.model';

// // historia-clinica-dialog.component.ts
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
//     MatExpansionModule,
//     MatButtonModule,
//     MatIconModule,
//     DatoDinamicoPipe
//   ],
//   template: `


//     <h2 mat-dialog-title class="dialog-header">Historia Clínica - {{ data.pacienteNombre }}</h2>
 
//   <span class="spacer"></span>
//   <button mat-icon-button (click)="exportarPdf()">
//     <mat-icon>download</mat-icon>
//   </button>
//   <button mat-icon-button (click)="cerrar()">
//     <mat-icon>close</mat-icon>
//   </button>
//     <mat-dialog-content>
//       <p *ngIf="data.historias.length === 0">No hay historias clínicas registradas.</p>
      
//       <mat-accordion *ngIf="data.historias.length > 0">
//         <mat-expansion-panel *ngFor="let historia of data.historias">
//           <mat-expansion-panel-header>
//             <mat-panel-title>
//               {{ formatearFecha(historia.created_at) }} - {{ historia.especialistaNombre }}
//             </mat-panel-title>
//           </mat-expansion-panel-header>
          
//           <div class="historia-content">
//             <div class="historia-grid">
//               <div class="historia-item">
//                 <strong>Fecha de Atención:</strong> {{ historia.fechaAtencion }}
//               </div>
//               <div class="historia-item">
//                 <strong>Especialista:</strong> {{ historia.especialistaNombre }}
//               </div>
//               <div class="historia-item">
//                 <strong>Altura:</strong> {{ historia.altura }} cm
//               </div>
//               <div class="historia-item">
//                 <strong>Peso:</strong> {{ historia.peso }} kg
//               </div>
//               <div class="historia-item">
//                 <strong>Temperatura:</strong> {{ historia.temperatura }} °C
//               </div>
//               <div class="historia-item">
//                 <strong>Presión:</strong> {{ historia.presion }}
//               </div>
//             </div>
            
//             <div *ngIf="historia.datos_dinamicos && historia.datos_dinamicos.length > 0" class="datos-dinamicos">
//               <h4>Datos Dinámicos:</h4>
//               <ul>
//                 <li *ngFor="let dato of historia.datos_dinamicos">
               

//                     {{ dato | datoDinamico }}
//                 </li>
//               </ul>
//             </div>
//           </div>
//         </mat-expansion-panel>
//       </mat-accordion>
//     </mat-dialog-content>
//     <mat-dialog-actions align="end">
//       <button mat-button mat-dialog-close>Cerrar</button>
//     </mat-dialog-actions>
//   `,
//   styles: [`
//     .historia-content {
//       padding: 16px 0;
//     }
//     .historia-grid {
//       display: grid;
//       grid-template-columns: repeat(2, 1fr);
//       gap: 12px;
//       margin-bottom: 16px;
//     }
//     .historia-item {
//       padding: 8px;
//       background: #f5f5f5;
//       border-radius: 4px;
//     }
//     .datos-dinamicos {
//       margin-top: 16px;
//     }
//     .datos-dinamicos ul {
//       list-style: none;
//       padding: 0;
//     }
//     .datos-dinamicos li {
//       padding: 8px;
//       background: #e3f2fd;
//       margin-bottom: 8px;
//       border-radius: 4px;
//     }
//   `]
// })


// export class HistoriaClinicaDialogComponent {

//   constructor(
//     @Inject(MAT_DIALOG_DATA) public data: HistoriaClinicaDialogData,
//     private dialogRef: MatDialogRef<HistoriaClinicaDialogComponent>
//   ) { }

//   cerrar(): void {
//     this.dialogRef.close();
//   }

//   private formatearDatoDinamico(d: DatoDinamico): string {
//     const v = d.valor;

//     let texto: string;

//     if (v === null || v === undefined) {
//       texto = '-';
//     } else if (typeof v === 'boolean') {
//       texto = v ? 'Sí' : 'No';
//     } else {
//       texto = String(v);
//     }

//     if (d.unidad) {
//       texto += ` ${d.unidad}`;
//     }

//     return texto;
//   }

//   exportarPdf(): void {
//     const doc = new jsPDF();
//     const pageHeight = doc.internal.pageSize.getHeight();

//     doc.setFontSize(16);
//     doc.text(`Historia Clínica - ${this.data.pacienteNombre}`, 10, 15);

//     let y = 25;

//     const addLine = (texto: string) => {
//       const lineas = doc.splitTextToSize(texto, 190); // ancho de línea
//       for (const linea of lineas) {
//         if (y > pageHeight - 10) {
//           doc.addPage();
//           y = 20;
//         }
//         doc.text(linea, 10, y);
//         y += 6;
//       }
//     };


//     this.data.historias.forEach((h, index: number) => {

//       addLine(`Atención #${index + 1} - ${h.fechaAtencion || 'N/A'}`);
//       addLine(`Especialista: ${h.especialistaNombre || 'N/A'}`);
//       addLine(`Fecha de registro: ${new Date(h.fecha_registro).toLocaleString('es-AR')}`);

//       addLine(
//         `Altura: ${h.altura ?? '-'} cm | ` +
//         `Peso: ${h.peso ?? '-'} kg | ` +
//         `Temperatura: ${h.temperatura ?? '-'} °C | ` +
//         `Presión: ${h.presion ?? '-'}`
//       );

//       // Datos dinámicos
//       (h.datos_dinamicos || []).forEach((d: DatoDinamico) => {
//         addLine(`${d.clave}: ${this.formatearDatoDinamico(d)}`);
//       });

//       y += 4; // espacio extra entre atenciones
//       if (y > pageHeight - 10) {
//         doc.addPage();
//         y = 20;
//       }
//     });

//     const nombreArchivo =
//       `historia_clinica_${this.data.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.pdf`;

//     doc.save(nombreArchivo);
//   }

//   formatearFecha(fecha: string | undefined): string {
//     if (!fecha) return 'N/A';
//     return new Date(fecha).toLocaleDateString('es-AR', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   }
// }

