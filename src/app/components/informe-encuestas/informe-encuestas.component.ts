import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EstadisticasService } from '../../../services/estadisticas.service';
import { EncuestaCompleta } from '../../models/estadistica.model';

@Component({
  selector: 'app-informe-encuestas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSliderModule
  ],
  templateUrl: './informe-encuestas.component.html',
  styleUrls: ['./informe-encuestas.component.scss']
})
export class InformeEncuestasComponent implements OnInit {

  cargando = false;
  error?: string;
  filtrosForm!: FormGroup;
  dataSource = new MatTableDataSource<EncuestaCompleta>([]);
  displayedColumns: string[] = [
    'especialista',
    'paciente',
    'especialidad',
    'fecha',
    'estrellas',
    'comentario',
    'radio',
    'checkbox',
    'rango'
  ];

  estadisticas = {
    total: 0,
    promedioEstrellas: 0,
    distribucionEstrellas: new Map<number, number>()
  };

  constructor(
    private fb: FormBuilder,
    private api: EstadisticasService
  ) { }

  async ngOnInit(): Promise<void> {
    this.filtrosForm = this.fb.group({
      desde: [null as Date | null],
      hasta: [null as Date | null],
      especialista: [''],
      estrellasMin: [1],
      estrellasMax: [5]
    });
    await this.cargarDatos();
  }

  aplicarFiltros(): void {
    this.cargarDatos();
  }

  private toIso(d?: Date | null): string | undefined {
    return d
      ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()
      : undefined;
  }

  private async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.error = undefined;

    const { desde, hasta, especialista } = this.filtrosForm.value;
    const isoDesde = this.toIso(desde ?? undefined);
    const isoHasta = this.toIso(hasta ?? undefined);

    try {
      let encuestas = await this.api.obtenerEncuestasCompletas({
        desde: isoDesde,
        hasta: isoHasta
      });

      // Filtrar por especialista (input texto, NO combobox)
      if (especialista && especialista.trim()) {
        const filtroEspecialista = especialista.trim().toLowerCase();
        encuestas = encuestas.filter(e => {
          const nombreCompleto = `${e.especialista_nombre || ''} ${e.especialista_apellido || ''}`.toLowerCase();
          return nombreCompleto.includes(filtroEspecialista);
        });
      }

      // Filtrar por rango de estrellas
      const { estrellasMin, estrellasMax } = this.filtrosForm.value;
      encuestas = encuestas.filter(e => {
        if (e.estrellas == null) return false;
        return e.estrellas >= estrellasMin && e.estrellas <= estrellasMax;
      });

      this.dataSource.data = encuestas;
      this.calcularEstadisticas(encuestas);
    } catch (err) {
      console.error('[InformeEncuestas] Error al cargar datos', err);
      this.error = 'No pudimos cargar los datos.';
    } finally {
      this.cargando = false;
    }
  }

  private calcularEstadisticas(encuestas: EncuestaCompleta[]): void {
    this.estadisticas.total = encuestas.length;
    const estrellasConValor = encuestas.filter(e => e.estrellas != null).map(e => e.estrellas!);
    this.estadisticas.promedioEstrellas = estrellasConValor.length > 0
      ? estrellasConValor.reduce((a, b) => a + b, 0) / estrellasConValor.length
      : 0;

    this.estadisticas.distribucionEstrellas.clear();
    estrellasConValor.forEach(e => {
      this.estadisticas.distribucionEstrellas.set(e, (this.estadisticas.distribucionEstrellas.get(e) || 0) + 1);
    });
  }

  nombreCompleto(nombre: string | null, apellido: string | null): string {
    return [nombre, apellido].filter(Boolean).join(' ') || 'N/A';
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-AR');
  }

  async descargarExcel(): Promise<void> {
    const datos = this.dataSource.data.map(e => ({
      'Especialista': this.nombreCompleto(e.especialista_nombre, e.especialista_apellido),
      'Paciente': this.nombreCompleto(e.paciente_nombre, e.paciente_apellido),
      'Especialidad': e.especialidad || 'N/A',
      'Fecha': this.formatearFecha(e.fecha_respuesta),
      'Estrellas': e.estrellas ?? 'N/A',
      'Comentario': e.comentario || 'N/A',
      'Radio': e.respuesta_radio || 'N/A',
      'Checkbox': e.respuesta_checkbox || 'N/A',
      'Rango': e.valor_rango ?? 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Encuestas');
    XLSX.writeFile(wb, `informe_encuestas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async descargarPDF(): Promise<void> {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Informe de Encuestas de Atención', 14, 22);

    doc.setFontSize(12);
    doc.text(`Total de encuestas: ${this.estadisticas.total}`, 14, 32);
    doc.text(`Promedio de estrellas: ${this.estadisticas.promedioEstrellas.toFixed(2)}`, 14, 40);

    const datos = this.dataSource.data.map(e => [
      this.nombreCompleto(e.especialista_nombre, e.especialista_apellido),
      this.nombreCompleto(e.paciente_nombre, e.paciente_apellido),
      e.especialidad || 'N/A',
      this.formatearFecha(e.fecha_respuesta),
      e.estrellas?.toString() || 'N/A',
      (e.comentario || 'N/A').substring(0, 30),
      e.respuesta_radio || 'N/A',
      e.respuesta_checkbox || 'N/A',
      e.valor_rango?.toString() || 'N/A'
    ]);

    autoTable(doc, {
      head: [['Especialista', 'Paciente', 'Especialidad', 'Fecha', 'Estrellas', 'Comentario', 'Radio', 'Checkbox', 'Rango']],
      body: datos,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [21, 101, 192] }
    });

    doc.save(`informe_encuestas_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}

