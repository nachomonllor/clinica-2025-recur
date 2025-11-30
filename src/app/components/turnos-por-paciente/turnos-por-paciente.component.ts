import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill, ApexGrid,
  ApexPlotOptions, ApexStroke, ApexTitleSubtitle, ApexTooltip, ApexXAxis, ApexYAxis,
  NgApexchartsModule
} from 'ng-apexcharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EstadisticasService } from '../../../services/estadisticas.service';
import { SupabaseService } from '../../../services/supabase.service';
import { TurnoPacienteCompleto } from '../../models/estadistica.model';
import { ChartOptions } from '../../models/estadistica.model';
import { CapitalizarNombrePipe } from "../../../pipes/capitalizar-nombre.pipe";

interface PacienteBusqueda {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
}

@Component({
  selector: 'app-turnos-por-paciente',
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
    MatProgressSpinnerModule,
    NgApexchartsModule,
    CapitalizarNombrePipe
],
  templateUrl: './turnos-por-paciente.component.html',
  styleUrls: ['./turnos-por-paciente.component.scss']
})
export class TurnosPorPacienteComponent implements OnInit {

  cargando = false;
  cargandoPacientes = false;
  error?: string;
  buscarForm!: FormGroup;

  pacientes: PacienteBusqueda[] = [];
  pacientesFiltrados: PacienteBusqueda[] = [];
  pacienteSeleccionado: PacienteBusqueda | null = null;

  turnos: TurnoPacienteCompleto[] = [];
  dataSource = new MatTableDataSource<TurnoPacienteCompleto>([]);
  displayedColumns: string[] = ['fecha', 'especialidad', 'especialista', 'estado'];

  contadores = {
    total: 0,
    pendiente: 0,
    aceptado: 0,
    realizado: 0,
    cancelado: 0,
    rechazado: 0
  };

  chartSeries: ApexAxisChartSeries = [{ name: 'Turnos', data: [] }];
  chartOptions: Partial<ChartOptions> = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false },
      foreColor: '#EAF2FF'
    },
    plotOptions: {
      bar: {
        columnWidth: '60%',
        borderRadius: 8,
        dataLabels: { position: 'top' }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: any) => (typeof val === 'number' ? val.toString() : `${val}`),
      offsetY: -18,
      style: { fontSize: '12px', fontWeight: '700', colors: ['#FFFFFF'] }
    },
    xaxis: {
      categories: [],
      title: { text: 'Estados' }
    },
    yaxis: {
      title: { text: 'Cantidad' },
      min: 0,
      forceNiceScale: true
    },
    colors: ['#1565C0'],
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shadeIntensity: 0.35,
        gradientToColors: ['#FF8F00'],
        opacityFrom: 0.9,
        opacityTo: 0.35,
        stops: [0, 100]
      }
    },
    stroke: { show: false },
    grid: { borderColor: 'rgba(255,255,255,.12)' },
    tooltip: { theme: 'dark' },
    title: { text: '' }
  };

  constructor(
    private fb: FormBuilder,
    private api: EstadisticasService,
    private supa: SupabaseService
  ) { }

  async ngOnInit(): Promise<void> {
    this.buscarForm = this.fb.group({
      paciente: ['']
    });

    this.buscarForm.get('paciente')?.valueChanges.subscribe(val => {
      this.filtrarPacientes(val || '');
    });

    await this.cargarPacientes();
  }

  private async cargarPacientes(): Promise<void> {
    this.cargandoPacientes = true;
    try {
      const { data, error } = await this.supa.client
        .from('usuarios')
        .select('id, nombre, apellido, email')
        .eq('perfil', 'PACIENTE')
        .order('apellido', { ascending: true });

      if (error) throw error;

      this.pacientes = (data ?? []).map((u: any) => ({
        id: u.id,
        nombre: u.nombre || '',
        apellido: u.apellido || '',
        email: u.email || ''
      }));

      this.pacientesFiltrados = [...this.pacientes];
    } catch (err) {
      console.error('[TurnosPorPaciente] Error al cargar pacientes', err);
      this.error = 'Error al cargar pacientes';
    } finally {
      this.cargandoPacientes = false;
    }
  }

  filtrarPacientes(texto: string): void {
    const filtro = texto.trim().toLowerCase();
    if (!filtro) {
      this.pacientesFiltrados = [...this.pacientes];
      return;
    }

    this.pacientesFiltrados = this.pacientes.filter(p => {
      const haystack = `${p.apellido} ${p.nombre} ${p.email}`.toLowerCase();
      return haystack.includes(filtro);
    });
  }

  async seleccionarPaciente(paciente: PacienteBusqueda): Promise<void> {
    this.pacienteSeleccionado = paciente;
    this.cargando = true;
    this.error = undefined;

    try {
      const turnos = await this.api.obtenerTurnosPorPaciente(paciente.id);
      this.turnos = turnos;
      this.dataSource.data = turnos;
      this.calcularContadores();
      this.actualizarGrafico();
    } catch (err) {
      console.error('[TurnosPorPaciente] Error al cargar turnos', err);
      this.error = 'Error al cargar turnos del paciente';
    } finally {
      this.cargando = false;
    }
  }

  private calcularContadores(): void {
    this.contadores = {
      total: this.turnos.length,
      pendiente: 0,
      aceptado: 0,
      realizado: 0,
      cancelado: 0,
      rechazado: 0
    };

    this.turnos.forEach(t => {
      const estado = (t.estado || '').toUpperCase();
      if (estado === 'PENDIENTE') this.contadores.pendiente++;
      else if (estado === 'ACEPTADO') this.contadores.aceptado++;
      else if (estado === 'FINALIZADO' || estado === 'REALIZADO') this.contadores.realizado++;
      else if (estado === 'CANCELADO') this.contadores.cancelado++;
      else if (estado === 'RECHAZADO') this.contadores.rechazado++;
    });
  }

  private actualizarGrafico(): void {
    const categorias = ['Pendiente', 'Aceptado', 'Realizado', 'Cancelado', 'Rechazado'];
    const valores = [
      this.contadores.pendiente,
      this.contadores.aceptado,
      this.contadores.realizado,
      this.contadores.cancelado,
      this.contadores.rechazado
    ];

    this.chartSeries = [{ name: 'Turnos', data: valores }];
    this.chartOptions = {
      ...this.chartOptions,
      xaxis: {
        ...(this.chartOptions.xaxis ?? {}),
        categories: categorias
      }
    };
  }

  nombreCompleto(nombre: string | null, apellido: string | null): string {
    return [nombre, apellido].filter(Boolean).join(' ') || 'N/A';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async descargarExcel(): Promise<void> {
    if (!this.pacienteSeleccionado || this.turnos.length === 0) return;

    const datos = this.turnos.map(t => ({
      'Fecha': this.formatearFecha(t.fecha_hora_inicio),
      'Especialidad': t.especialidad,
      'Especialista': this.nombreCompleto(t.especialista_nombre, t.especialista_apellido),
      'Estado': t.estado,
      'Motivo': t.motivo || 'N/A',
      'Comentario': t.comentario || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Turnos');
    XLSX.writeFile(wb, `turnos_${this.pacienteSeleccionado.apellido}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async descargarPDF(): Promise<void> {
    if (!this.pacienteSeleccionado || this.turnos.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Turnos por Paciente', 14, 22);

    doc.setFontSize(12);
    doc.text(`Paciente: ${this.nombreCompleto(this.pacienteSeleccionado.nombre, this.pacienteSeleccionado.apellido)}`, 14, 32);
    doc.text(`Total de turnos: ${this.contadores.total}`, 14, 40);

    const datos = this.turnos.map(t => [
      this.formatearFecha(t.fecha_hora_inicio),
      t.especialidad,
      this.nombreCompleto(t.especialista_nombre, t.especialista_apellido),
      t.estado,
      (t.motivo || 'N/A').substring(0, 30)
    ]);

    autoTable(doc, {
      head: [['Fecha', 'Especialidad', 'Especialista', 'Estado', 'Motivo']],
      body: datos,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [21, 101, 192] }
    });

    doc.save(`turnos_${this.pacienteSeleccionado.apellido}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}

