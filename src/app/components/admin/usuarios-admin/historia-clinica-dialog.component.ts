import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatoDinamicoPipe } from "../../../../pipes/dato-dinamico.pipe";

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
    <h2 mat-dialog-title>Historia Clínica - {{ data.pacienteNombre }}</h2>
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
// export class HistoriaClinicaDialogComponent {
//   constructor(
//     @Inject(MAT_DIALOG_DATA)
//     public data: { pacienteNombre: string; historias: any[] }
//   ) {}

//   formatearFecha(fecha: string | undefined): string {
//     if (!fecha) return 'N/A';
//     return new Date(fecha).toLocaleDateString('es-AR', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   }

//   formatDato(dato: DatoDinamico): string {
//     return formatearDatoDinamico(dato);
//   }
// }

export class HistoriaClinicaDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { pacienteNombre: string; historias: any[] }
  ) {}

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}



