import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import Chart from 'chart.js/auto';
import { Especialista, EstadoTurno, Rol, Turno, TurnoRow, UUID } from '../../../models/interfaces';

// Tipos locales mínimos (no duplican tus modelos)
export interface LoginLog {
  id: string;
  userId: UUID;
  email?: string | null;
  rol: Rol;
  atISO: string; // ISO 8601
}

type DateRange = { fromISO: string; toISO: string };

// ---------- Utilidades de fecha ----------
function toDayKey(d: Date): string {
  // YYYY-MM-DD (sin TZ)
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, days: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}
function daysBetweenInclusive(fromISO: string, toISO: string): string[] {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  const out: string[] = [];
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
    out.push(toDayKey(d));
  }
  return out;
}
function lastNDaysRange(n: number): DateRange {
  const today = new Date();
  const from = addDays(today, -(n - 1));
  return { fromISO: toDayKey(from), toISO: toDayKey(today) };
}

// ---------- Adaptadores ----------
type TurnoForStats = {
  id: UUID;
  especialidad: string;
  especialistaId: UUID;
  pacienteId: UUID;
  fechaISO: string;      // cita del turno
  createdISO?: string;   // creado (si viene de BD)
  estado: EstadoTurno;
  resenaEspecialista?: string | null;
};

function toStatsTurno(t: TurnoRow | Turno): TurnoForStats {
  if ('fecha' in t) {
    // Dominio normalizado
    const dom = t as Turno;
    return {
      id: dom.id,
      especialidad: dom.especialidad,
      especialistaId: dom.especialistaId,
      pacienteId: dom.pacienteId,
      fechaISO: dom.fecha.toISOString(),
      estado: dom.estado,
      resenaEspecialista: dom.resenaEspecialista ?? null,
    };
  }
  // Forma BD
  const row = t as TurnoRow;
  return {
    id: row.id,
    especialidad: row.especialidad,
    especialistaId: row.especialista_id,
    pacienteId: row.paciente_id,
    fechaISO: row.fecha_iso,
    createdISO: row.created_at ?? row.fecha_iso,
    estado: row.estado,
    resenaEspecialista: row.resena_especialista ?? null
  };
}

@Component({
  selector: 'app-estadisticas',
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss']
})
export class EstadisticasComponent implements AfterViewInit, OnChanges, OnDestroy {

  // Entradas
  @Input() turnos: ReadonlyArray<TurnoRow | Turno> = [];
  @Input() especialistas: ReadonlyArray<Especialista> = [];
  @Input() loginLogs: ReadonlyArray<LoginLog> = [];

  // Filtro de rango (por defecto últimos 15 días)
  range: DateRange = lastNDaysRange(15);

  // Canvases
  @ViewChild('chartEspecialidades') chartEspecialidadesRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDias') chartDiasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartSolicitados') chartSolicitadosRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartFinalizados') chartFinalizadosRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartIngresos') chartIngresosRef!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  // Datos preparados para exportación
  dataEspecialidades: { label: string; value: number }[] = [];
  dataDias: { day: string; total: number }[] = [];
  dataSolicitados: { medico: string; total: number }[] = [];
  dataFinalizados: { medico: string; total: number }[] = [];
  dataIngresos: { day: string; total: number }[] = [];

  ngAfterViewInit(): void {
    this.rebuildAll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.charts.length) this.rebuildAll();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  // UI -> cambiar rango
  onRangeChange(kind: 'from' | 'to', value: string) {
    this.range = { ...this.range, [kind === 'from' ? 'fromISO' : 'toISO']: value };
    this.rebuildAll();
  }

  // ---------------- Core ----------------
  private rebuildAll(): void {
    this.destroyCharts();

    const normalized = this.turnos.map(toStatsTurno);
    const { fromISO, toISO } = this.range;

    const inRangeByDate = normalized.filter(t => {
      const key = toDayKey(new Date(t.fechaISO));
      return key >= fromISO && key <= toISO;
    });
    const inRangeByCreated = normalized.filter(t => {
      const key = toDayKey(new Date(t.createdISO ?? t.fechaISO));
      return key >= fromISO && key <= toISO;
    });

    // ---- 1) Cantidad de turnos por especialidad ----
    const specCount = new Map<string, number>();
    for (const t of inRangeByDate) {
      specCount.set(t.especialidad, (specCount.get(t.especialidad) ?? 0) + 1);
    }
    const specLabels = [...specCount.keys()].sort();
    const specValues = specLabels.map(l => specCount.get(l) ?? 0);
    this.dataEspecialidades = specLabels.map((l, i) => ({ label: l, value: specValues[i] }));
    this.charts.push(this.makePie(this.chartEspecialidadesRef.nativeElement, 'Turnos por especialidad', specLabels, specValues));

    // ---- 2) Cantidad de turnos por día ----
    const dayKeys = daysBetweenInclusive(fromISO, toISO);
    const dayMap = new Map(dayKeys.map(k => [k, 0]));
    for (const t of inRangeByDate) {
      const k = toDayKey(new Date(t.fechaISO));
      dayMap.set(k, (dayMap.get(k) ?? 0) + 1);
    }
    const dayLabels = dayKeys;
    const dayValues = dayLabels.map(k => dayMap.get(k) ?? 0);
    this.dataDias = dayLabels.map((day, i) => ({ day, total: dayValues[i] }));
    this.charts.push(this.makeBar(this.chartDiasRef.nativeElement, 'Turnos por día', dayLabels, dayValues));

    // ---- 3) Cantidad de turnos solicitados por médico en un lapso ----
    // "Solicitados" -> se cuenta por fecha de creación (created_at); si no hay, se usa fecha del turno.
    const byDocRequested = new Map<UUID, number>();
    for (const t of inRangeByCreated) {
      byDocRequested.set(t.especialistaId, (byDocRequested.get(t.especialistaId) ?? 0) + 1);
    }
    const reqIdLabels = [...byDocRequested.keys()];
    const reqLabels = reqIdLabels.map(id => this.medicoNombre(id));
    const reqValues = reqIdLabels.map(id => byDocRequested.get(id) ?? 0);
    this.dataSolicitados = reqLabels.map((medico, i) => ({ medico, total: reqValues[i] }));
    this.charts.push(this.makeBar(this.chartSolicitadosRef.nativeElement, 'Turnos solicitados por médico', reqLabels, reqValues, true));

    // ---- 4) Cantidad de turnos finalizados por médico en un lapso ----
    const finalizados = inRangeByDate.filter(t => t.estado === 'realizado');
    const byDocFinalizados = new Map<UUID, number>();
    for (const t of finalizados) {
      byDocFinalizados.set(t.especialistaId, (byDocFinalizados.get(t.especialistaId) ?? 0) + 1);
    }
    const finIdLabels = [...byDocFinalizados.keys()];
    const finLabels = finIdLabels.map(id => this.medicoNombre(id));
    const finValues = finIdLabels.map(id => byDocFinalizados.get(id) ?? 0);
    this.dataFinalizados = finLabels.map((medico, i) => ({ medico, total: finValues[i] }));
    this.charts.push(this.makeBar(this.chartFinalizadosRef.nativeElement, 'Turnos finalizados por médico', finLabels, finValues, true));

    // ---- 5) Log de ingresos al sistema ----
    const inRangeLogs = this.loginLogs.filter(l => {
      const k = toDayKey(new Date(l.atISO));
      return k >= fromISO && k <= toISO;
    });
    const logsDayMap = new Map(dayKeys.map(k => [k, 0]));
    for (const l of inRangeLogs) {
      const k = toDayKey(new Date(l.atISO));
      logsDayMap.set(k, (logsDayMap.get(k) ?? 0) + 1);
    }
    const logLabels = dayKeys;
    const logValues = logLabels.map(k => logsDayMap.get(k) ?? 0);
    this.dataIngresos = logLabels.map((day, i) => ({ day, total: logValues[i] }));
    this.charts.push(this.makeLine(this.chartIngresosRef.nativeElement, 'Ingresos al sistema', logLabels, logValues));
  }

  private medicoNombre(id: UUID | undefined): string {
    const e = this.especialistas.find(x => x.id === id);
    return e ? `${e.apellido}, ${e.nombre}` : '—';
  }

  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  // --------------- Chart helpers ---------------
  private makePie(canvas: HTMLCanvasElement, title: string, labels: string[], values: number[]): Chart {
    return new Chart(canvas.getContext('2d')!, {
      type: 'pie',
      data: { labels, datasets: [{ data: values }] },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' }, title: { display: true, text: title } }
      }
    });
  }

  private makeBar(canvas: HTMLCanvasElement, title: string, labels: string[], values: number[], horizontal = false): Chart {
    return new Chart(canvas.getContext('2d')!, {
      type: 'bar',
      data: { labels, datasets: [{ data: values }] },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        plugins: { legend: { display: false }, title: { display: true, text: title } },
        scales: { x: { ticks: { autoSkip: true, maxRotation: 0 } } }
      }
    });
  }

  private makeLine(canvas: HTMLCanvasElement, title: string, labels: string[], values: number[]): Chart {
    return new Chart(canvas.getContext('2d')!, {
      type: 'line',
      data: { labels, datasets: [{ data: values, pointRadius: 3, tension: 0.3 }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, title: { display: true, text: title } }
      }
    });
  }

  // --------------- Exportaciones ---------------
  async exportToPDF() {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const canvases = [
      this.chartEspecialidadesRef?.nativeElement,
      this.chartDiasRef?.nativeElement,
      this.chartSolicitadosRef?.nativeElement,
      this.chartFinalizadosRef?.nativeElement,
      this.chartIngresosRef?.nativeElement
    ].filter(Boolean) as HTMLCanvasElement[];

    let first = true;
    for (const canvas of canvases) {
      const img = canvas.toDataURL('image/png', 1.0);
      if (!first) doc.addPage();
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const ratio = Math.min(pw / canvas.width, ph / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      doc.addImage(img, 'PNG', (pw - w) / 2, (ph - h) / 2, w, h);
      first = false;
    }
    doc.save(`estadisticas_${this.range.fromISO}_${this.range.toISO}.pdf`);
  }

  async exportToExcel() {
    const XLSX = await import('xlsx');
    const { saveAs } = await import('file-saver');

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(this.dataEspecialidades);
    XLSX.utils.book_append_sheet(wb, ws1, 'Turnos por especialidad');

    const ws2 = XLSX.utils.json_to_sheet(this.dataDias);
    XLSX.utils.book_append_sheet(wb, ws2, 'Turnos por día');

    const ws3 = XLSX.utils.json_to_sheet(this.dataSolicitados);
    XLSX.utils.book_append_sheet(wb, ws3, 'Solicitados por médico');

    const ws4 = XLSX.utils.json_to_sheet(this.dataFinalizados);
    XLSX.utils.book_append_sheet(wb, ws4, 'Finalizados por médico');

    const ws5 = XLSX.utils.json_to_sheet(this.dataIngresos);
    XLSX.utils.book_append_sheet(wb, ws5, 'Ingresos');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout]), `estadisticas_${this.range.fromISO}_${this.range.toISO}.xlsx`);
  }
}
