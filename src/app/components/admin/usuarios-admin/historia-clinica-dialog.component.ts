import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatoDinamicoPipe } from "../../../../pipes/dato-dinamico.pipe";
import jsPDF from 'jspdf';
import { HistoriaClinicaConExtras } from '../../../models/historia-clinica.model';
import { DatoDinamico } from '../../../models/dato-dinamico.model';

// historia-clinica-dialog.component.ts
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
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    DatoDinamicoPipe
  ],
  template: `


    <h2 mat-dialog-title class="dialog-header">Historia Clínica - {{ data.pacienteNombre }}</h2>
 
  <span class="spacer"></span>
  <button mat-icon-button (click)="exportarPdf()">
    <mat-icon>download</mat-icon>
  </button>
  <button mat-icon-button (click)="cerrar()">
    <mat-icon>close</mat-icon>
  </button>
    <mat-dialog-content>
      <p *ngIf="data.historias.length === 0">No hay historias clínicas registradas.</p>
      
      <mat-accordion *ngIf="data.historias.length > 0">
        <mat-expansion-panel *ngFor="let historia of data.historias">
          <mat-expansion-panel-header>
            <mat-panel-title>
              {{ formatearFecha(historia.created_at) }} - {{ historia.especialistaNombre }}
            </mat-panel-title>
          </mat-expansion-panel-header>
          
          <div class="historia-content">
            <div class="historia-grid">
              <div class="historia-item">
                <strong>Fecha de Atención:</strong> {{ historia.fechaAtencion }}
              </div>
              <div class="historia-item">
                <strong>Especialista:</strong> {{ historia.especialistaNombre }}
              </div>
              <div class="historia-item">
                <strong>Altura:</strong> {{ historia.altura }} cm
              </div>
              <div class="historia-item">
                <strong>Peso:</strong> {{ historia.peso }} kg
              </div>
              <div class="historia-item">
                <strong>Temperatura:</strong> {{ historia.temperatura }} °C
              </div>
              <div class="historia-item">
                <strong>Presión:</strong> {{ historia.presion }}
              </div>
            </div>
            
            <div *ngIf="historia.datos_dinamicos && historia.datos_dinamicos.length > 0" class="datos-dinamicos">
              <h4>Datos Dinámicos:</h4>
              <ul>
                <li *ngFor="let dato of historia.datos_dinamicos">
               

                    {{ dato | datoDinamico }}
                </li>
              </ul>
            </div>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .historia-content {
      padding: 16px 0;
    }
    .historia-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .historia-item {
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    .datos-dinamicos {
      margin-top: 16px;
    }
    .datos-dinamicos ul {
      list-style: none;
      padding: 0;
    }
    .datos-dinamicos li {
      padding: 8px;
      background: #e3f2fd;
      margin-bottom: 8px;
      border-radius: 4px;
    }
  `]
})


export class HistoriaClinicaDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: HistoriaClinicaDialogData,
    private dialogRef: MatDialogRef<HistoriaClinicaDialogComponent>
  ) { }

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

  exportarPdf(): void {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(16);
    doc.text(`Historia Clínica - ${this.data.pacienteNombre}`, 10, 15);

    let y = 25;

    const addLine = (texto: string) => {
      const lineas = doc.splitTextToSize(texto, 190); // ancho de línea
      for (const linea of lineas) {
        if (y > pageHeight - 10) {
          doc.addPage();
          y = 20;
        }
        doc.text(linea, 10, y);
        y += 6;
      }
    };


    this.data.historias.forEach((h, index: number) => {

      addLine(`Atención #${index + 1} - ${h.fechaAtencion || 'N/A'}`);
      addLine(`Especialista: ${h.especialistaNombre || 'N/A'}`);
      addLine(`Fecha de registro: ${new Date(h.fecha_registro).toLocaleString('es-AR')}`);

      addLine(
        `Altura: ${h.altura ?? '-'} cm | ` +
        `Peso: ${h.peso ?? '-'} kg | ` +
        `Temperatura: ${h.temperatura ?? '-'} °C | ` +
        `Presión: ${h.presion ?? '-'}`
      );

      // Datos dinámicos
      (h.datos_dinamicos || []).forEach((d: DatoDinamico) => {
        addLine(`${d.clave}: ${this.formatearDatoDinamico(d)}`);
      });

      y += 4; // espacio extra entre atenciones
      if (y > pageHeight - 10) {
        doc.addPage();
        y = 20;
      }
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

