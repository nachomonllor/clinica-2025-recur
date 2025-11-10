
import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesComponent implements OnInit {

  // Fechas por defecto (últimos 30 días)
  hoy = this.onlyDate(new Date());
  hace30 = this.addDays(this.hoy, -30);

  // form = this.fb.group({
  //   desde: this.hace30.toISOString().substring(0, 10),
  //   hasta: this.hoy.toISOString().substring(0, 10),
  // });

  form!: FormGroup;  // <- solo la declaras

  constructor(
    private fb: FormBuilder,
    private supa: SupabaseService
  ) {
    this.form = this.fb.group({
      desde: [this.hace30.toISOString().substring(0, 10)],
      hasta: [this.hoy.toISOString().substring(0, 10)],
    });
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.load());
    this.load();
  }

  // Datos
  turnos: any[] = [];
  ingresos: any[] = [];
  loading = false;

  // KPIs
  kpi = { total: 0, aceptados: 0, realizados: 0, cancelados: 0, rechazados: 0, tasaRealizacion: 0 };

  // Canvas
  @ViewChild('cvEspecialidad') cvEspecialidad!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cvDia') cvDia!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cvSolicitados') cvSolicitados!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cvFinalizados') cvFinalizados!: ElementRef<HTMLCanvasElement>;

  // Charts
  chEspecialidad?: Chart;
  chDia?: Chart;
  chSolicitados?: Chart;
  chFinalizados?: Chart;

  // //  
  // constructor(
  //   private fb: FormBuilder,
  //   private supa: SupabaseService         // inyectás TU servicio existente
  // ) {}

  // ngOnInit(): void {
  //   this.form.valueChanges.subscribe(() => this.load());
  //   this.load(); // primera carga
  // }

  // ====> Y AQUÍ VA load() (dentro de la clase)
  async load() {
    this.loading = true;
    try {
      const desde = new Date(this.form.value.desde! + 'T00:00:00');
      const hasta = new Date(this.form.value.hasta! + 'T23:59:59');

      // usamos las funciones que ya agregaste en tu SupabaseService
      [this.turnos, this.ingresos] = await Promise.all([
        this.supa.fetchTurnos(desde, hasta),
        this.supa.fetchIngresos(desde, hasta),
      ]);

      this.computeKpis();
      this.renderAllCharts();
    } catch (e) {
      console.error('Error cargando reportes', e);
    } finally {
      this.loading = false;
    }
  }

  // ====== Charts ======
  renderAllCharts() {
    this.renderPorEspecialidad();
    this.renderPorDia();
    this.renderSolicitadosPorMedico();
    this.renderFinalizadosPorMedico();
  }

  renderPorEspecialidad() {
    const map = this.countBy(this.turnos, (t: any) => t.especialidad || '—');
    const labels = Object.keys(map).sort();
    const data = labels.map(l => map[l]);

    this.chEspecialidad?.destroy();
    this.chEspecialidad = new Chart(this.cvEspecialidad.nativeElement, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Turnos', data }] },
      options: { responsive: true }
    });
  }

  renderPorDia() {
    const map = this.countBy(this.turnos, (t: any) => this.keyDia(t.fecha));
    const labels = Object.keys(map).sort();
    const data = labels.map(l => map[l]);

    this.chDia?.destroy();
    this.chDia = new Chart(this.cvDia.nativeElement, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Turnos por día', data, tension: 0.3 }] },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
  }

  renderSolicitadosPorMedico() {
    const filtrados = this.turnos.filter(t => t.estado === 'solicitado' || t.estado === 'aceptado');
    const map = this.countBy(filtrados, (t: any) => t.especialistaNombre || '—');
    const labels = Object.keys(map).sort();
    const data = labels.map(l => map[l]);

    this.chSolicitados?.destroy();
    this.chSolicitados = new Chart(this.cvSolicitados.nativeElement, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Solicitados', data }] },
      options: { responsive: true, indexAxis: 'y' }
    });
  }

  renderFinalizadosPorMedico() {
    const filtrados = this.turnos.filter(t => t.estado === 'realizado');
    const map = this.countBy(filtrados, (t: any) => t.especialistaNombre || '—');
    const labels = Object.keys(map).sort();
    const data = labels.map(l => map[l]);

    this.chFinalizados?.destroy();
    this.chFinalizados = new Chart(this.cvFinalizados.nativeElement, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Finalizados', data }] },
      options: { responsive: true, indexAxis: 'y' }
    });
  }

  // ====== Exportar CSV rápido ======
  descargarCsv() {
    const sep = ';';

    const turnosCsv = [
      ['Id', 'Fecha', 'Especialidad', 'Medico', 'Estado', 'Creado', 'Finalizado'].join(sep),
      ...this.turnos.map(t => [
        t.id, this.toLocalISO(t.fecha), t.especialidad, t.especialistaNombre, t.estado,
        this.toLocalISO(t.creadoEl), t.finalizadoEl ? this.toLocalISO(t.finalizadoEl) : ''
      ].join(sep))
    ].join('\n');

    const ingresosCsv = [
      ['Usuario', 'Rol', 'Ingreso'].join(sep),
      ...this.ingresos.map(l => [l.email, l.rol, this.toLocalISO(l.timestamp)].join(sep))
    ].join('\n');

    this.downloadText(`turnos_${this.dateStamp()}.csv`, turnosCsv);
    this.downloadText(`ingresos_${this.dateStamp()}.csv`, ingresosCsv);
  }

  // ====== Helpers ======
  private computeKpis() {
    const total = this.turnos.length;
    const count = (e: string) => this.turnos.filter(t => t.estado === e).length;
    const realizados = count('realizado');
    const aceptados = count('aceptado');
    const cancelados = count('cancelado');
    const rechazados = count('rechazado');
    const tasaRealizacion = total ? Math.round((realizados / total) * 100) : 0;
    this.kpi = { total, aceptados, realizados, cancelados, rechazados, tasaRealizacion };
  }

  private countBy(arr: any[], keyFn: (x: any) => string): Record<string, number> {
    const m: Record<string, number> = {};
    for (const it of arr) {
      const k = keyFn(it) || '—';
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  }

  private keyDia(d: Date) {
    const x = new Date(d);
    return x.toISOString().substring(0, 10);
  }

  private onlyDate(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

  private toLocalISO(d: Date): string {
    const x = new Date(d);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())} ${pad(x.getHours())}:${pad(x.getMinutes())}`;
  }

  private dateStamp(): string {
    const n = new Date();
    return `${n.getFullYear()}-${(n.getMonth() + 1).toString().padStart(2, '0')}-${n.getDate().toString().padStart(2, '0')}_${n.getHours().toString().padStart(2, '0')}${n.getMinutes().toString().padStart(2, '0')}`;
  }

  private downloadText(filename: string, text: string) {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}
