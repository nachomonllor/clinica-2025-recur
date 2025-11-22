import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EstadisticasService } from '../../../services/estadisticas.service';
import { ElevateOnHoverDirective } from '../../../directives/elevate-on-hover.directive';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ConteoEspecialidad { especialidad: string; cantidad: number; }
interface ConteoDia { fecha: string; cantidad: number; }
interface ConteoProfesional { profesional: string; solicitados: number; finalizados: number; }
interface ConteoIngresos { fecha: string; ingresos: number; }

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ElevateOnHoverDirective
  ],
  template: `
    <mat-card class="estadisticas-card" appElevateOnHover>
      <mat-card-header>
        <mat-card-title>Estadísticas de la Clínica</mat-card-title>
        <mat-card-subtitle>Visión general de turnos e ingresos recientes</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="loader" *ngIf="cargando">
          <mat-progress-spinner diameter="48" mode="indeterminate"></mat-progress-spinner>
          <p>Cargando datos...</p>
        </div>

        <div class="error" *ngIf="error && !cargando">
          <p>{{ error }}</p>
        </div>

        <ng-container *ngIf="!cargando && !error">
          <section class="acciones">
            <button mat-raised-button color="primary" (click)="descargarExcel()" [disabled]="generandoExcel">
              <mat-icon>table_view</mat-icon>
              <span *ngIf="!generandoExcel">Descargar Excel</span>
              <span *ngIf="generandoExcel">Generando...</span>
            </button>
            <button mat-raised-button color="accent" (click)="descargarPdf()" [disabled]="generandoPdf">
              <mat-icon>picture_as_pdf</mat-icon>
              <span *ngIf="!generandoPdf">Descargar PDF</span>
              <span *ngIf="generandoPdf">Generando...</span>
            </button>
          </section>

          <div *ngIf="sinDatos" class="sin-datos">
            <mat-icon>insights</mat-icon>
            <p>Todavía no hay actividad registrada para mostrar estadísticas. Volvé más tarde cuando se registren turnos o ingresos.</p>
          </div>

          <div class="charts-grid" *ngIf="!sinDatos">
            <section class="chart-card">
              <h3>Ingresos recientes por día</h3>
              <canvas #loginsChart></canvas>
            </section>
            <section class="chart-card">
              <h3>Turnos por especialidad</h3>
              <canvas #especialidadChart></canvas>
            </section>
            <section class="chart-card">
              <h3>Turnos solicitados por día</h3>
              <canvas #diaChart></canvas>
            </section>
            <section class="chart-card">
              <h3>Turnos por profesional</h3>
              <canvas #profesionalChart></canvas>
            </section>
          </div>

          <section class="resumen" *ngIf="!sinDatos">
            <div>
              <h4>Top especialidades</h4>
              <ul>
                <li *ngFor="let item of especialidadData | slice:0:5">
                  <span>{{ item.especialidad }}</span>
                  <strong>{{ item.cantidad }}</strong>
                </li>
              </ul>
            </div>
            <div>
              <h4>Profesionales con más turnos</h4>
              <ul>
                <li *ngFor="let item of profesionalData | slice:0:5">
                  <span>{{ item.profesional }}</span>
                  <strong>{{ item.finalizados }}/{{ item.solicitados }}</strong>
                </li>
              </ul>
            </div>
            <div>
              <h4>Últimos ingresos</h4>
              <ul>
                <li *ngFor="let item of loginDetalle | slice:0:5">
                  <span>{{ item.usuario }}</span>
                  <strong>{{ item.fecha }} {{ item.hora }}</strong>
                </li>
              </ul>
            </div>
          </section>
        </ng-container>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .estadisticas-card { margin: 1.5rem; }
    .acciones {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .acciones button {
      gap: .5rem;
      padding: .65rem 1.6rem;
      letter-spacing: .02em;
      text-transform: none;
      font-weight: 600;
    }
    .loader, .error, .sin-datos {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: .75rem;
      min-height: 200px;
      text-align: center;
    }
    .error mat-icon, .sin-datos mat-icon { font-size: 48px; }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .chart-card {
      position: relative;
      background: linear-gradient(160deg, rgba(23, 33, 43, 0.96), rgba(37, 51, 66, 0.7));
      border-radius: 20px;
      padding: 1.4rem 1.75rem;
      border: 1px solid rgba(144, 164, 174, 0.22);
      box-shadow: 0 24px 48px rgba(7, 12, 18, 0.32);
      overflow: hidden;
      min-height: 340px;
      display: flex;
      flex-direction: column;
      backdrop-filter: blur(12px);
    }
    .chart-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 20% 20%, rgba(41, 182, 246, 0.12), transparent 55%),
                  radial-gradient(circle at 80% 10%, rgba(255, 183, 77, 0.14), transparent 60%);
      pointer-events: none;
    }
    .chart-card h3 {
      margin-top: 0;
      margin-bottom: 1.1rem;
      font-weight: 600;
      letter-spacing: .015em;
      color: #eaf6ff;
      display: flex;
      align-items: center;
      gap: .6rem;
      position: relative;
      z-index: 1;
    }
    .chart-card canvas {
      width: 100% !important;
      max-width: 100%;
      height: 280px !important;
      min-height: 260px;
      flex: 1 1 auto;
    }
    .resumen {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .resumen h4 { margin-bottom: .75rem; }
    .resumen ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }
    .resumen li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, rgba(38, 50, 56, 0.6), rgba(12, 18, 24, 0.65));
      border: 1px solid rgba(144, 164, 174, 0.15);
      border-radius: 14px;
      padding: .7rem 1rem;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
    }
    .resumen strong { font-variant-numeric: tabular-nums; }
    @media (max-width: 600px) {
      .acciones { flex-direction: column; }
    }
  `]
})
export class EstadisticasComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('loginsChart') loginsChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('especialidadChart') especialidadChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('diaChart') diaChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('profesionalChart') profesionalChart?: ElementRef<HTMLCanvasElement>;

  cargando = false;
  generandoExcel = false;
  generandoPdf = false;
  error?: string;
  sinDatos = false;

  especialidadData: ConteoEspecialidad[] = [];
  diaData: ConteoDia[] = [];
  profesionalData: ConteoProfesional[] = [];
  loginData: ConteoIngresos[] = [];
  loginDetalle: { usuario: string; fecha: string; hora: string; email: string }[] = [];

  private charts: Chart[] = [];
  private vistaLista = false;
  private datosListos = false;
  private modoFallbackCharts = false;
  private estilosChartAplicados = false;

  private readonly palette = {
    primary: '#29b6f6',
    primaryAccent: '#0288d1',
    success: '#66bb6a',
    successAccent: '#1b5e20',
    warning: '#ffb74d',
    warningAccent: '#ef6c00',
    neutral: '#cfd8dc',
    surface: 'rgba(27, 38, 49, 0.72)',
    surfaceAlt: 'rgba(39, 54, 70, 0.64)'
  };

  constructor(private readonly stats: EstadisticasService) { }

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
    this.datosListos = true;
    this.renderizarSiCorresponde();
  }

  ngAfterViewInit(): void {
    this.vistaLista = true;
    this.renderizarSiCorresponde();
  }

  ngOnDestroy(): void {
    this.destruirCharts();
  }

  private async cargarDatos(): Promise<void> {
    this.cargando = true;
    this.error = undefined;
    this.sinDatos = false;
    this.destruirCharts();

    try {
      const [turnos, logs] = await Promise.all([
        this.stats.obtenerTurnos(),
        this.stats.obtenerLogsDeIngreso()
      ]);

      const profesionalIds = Array.from(new Set(turnos.map(t => t.especialista_id).filter(Boolean)));
      const perfilesMap = await this.stats.obtenerPerfiles(profesionalIds as string[]);

      this.procesarTurnos(turnos, perfilesMap);
      this.procesarLogs(logs);

      this.sinDatos = [
        this.especialidadData.length,
        this.diaData.length,
        this.profesionalData.length,
        this.loginData.length
      ].every(count => count === 0);

    } catch (err: any) {
      console.error('[Estadisticas] Error al cargar', err);
      this.error = err?.message || 'No se pudieron cargar las estadísticas.';
    } finally {
      this.cargando = false;
    }
  }

  private procesarTurnos(turnos: TurnoEstadistica[], perfiles: Map<string, PerfilBasico>): void {
    console.debug('[Estadisticas] turnos recibidos', turnos.length);
    const especialidadMap = new Map<string, number>();
    const diaMap = new Map<string, number>();
    const profesionalMap = new Map<string, ConteoProfesional>();

    turnos.forEach(turno => {
      const especialidad = (turno.especialidad || 'Sin especialidad').trim();
      especialidadMap.set(especialidad, (especialidadMap.get(especialidad) ?? 0) + 1);

      const fechaKey = this.obtenerDia(turno.fecha_iso || turno.created_at);
      if (fechaKey) {
        diaMap.set(fechaKey, (diaMap.get(fechaKey) ?? 0) + 1);
      }

      if (turno.especialista_id) {
        const perfil = perfiles.get(turno.especialista_id);
        const nombre = perfil ? this.formatearNombre(perfil) : 'Profesional sin nombre';
        if (!profesionalMap.has(turno.especialista_id)) {
          profesionalMap.set(turno.especialista_id, { profesional: nombre, solicitados: 0, finalizados: 0 });
        }
        const entry = profesionalMap.get(turno.especialista_id)!;
        entry.solicitados += 1;
        if (turno.estado === 'realizado') {
          entry.finalizados += 1;
        }
      }
    });

    this.especialidadData = Array.from(especialidadMap.entries())
      .map(([especialidad, cantidad]) => ({ especialidad, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    this.diaData = Array.from(diaMap.entries())
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    this.profesionalData = Array.from(profesionalMap.values())
      .sort((a, b) => b.solicitados - a.solicitados);
    console.debug('[Estadisticas] especialidadData', this.especialidadData.length);
    console.debug('[Estadisticas] diaData', this.diaData.length);
    console.debug('[Estadisticas] profesionalData', this.profesionalData.length);
  }

  private procesarLogs(logs: PerfilBasico[]): void {
    console.debug('[Estadisticas] logs recibidos', logs.length);
    const diaMap = new Map<string, number>();
    const detalle: { usuario: string; fecha: string; hora: string; email: string }[] = [];

    logs.forEach(log => {
      const timestamp = log.updated_at || log.created_at;
      if (!timestamp) { return; }
      const fecha = new Date(timestamp);
      if (Number.isNaN(fecha.getTime())) { return; }

      const diaKey = fecha.toISOString().split('T')[0];
      diaMap.set(diaKey, (diaMap.get(diaKey) ?? 0) + 1);

      detalle.push({
        usuario: this.formatearNombre(log) || (log.email ?? 'Usuario sin nombre'),
        fecha: fecha.toLocaleDateString('es-AR'),
        hora: fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        email: log.email ?? '—'
      });
    });

    this.loginData = Array.from(diaMap.entries())
      .map(([fecha, ingresos]) => ({ fecha, ingresos }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    this.loginDetalle = detalle.sort((a, b) => {
      const fechaA = `${a.fecha} ${a.hora}`;
      const fechaB = `${b.fecha} ${b.hora}`;
      return fechaB.localeCompare(fechaA);
    });
    console.debug('[Estadisticas] loginData', this.loginData.length);
    console.debug('[Estadisticas] loginDetalle', this.loginDetalle.length);

    this.renderizarSiCorresponde();
  }

  private renderizarSiCorresponde(): void {
    console.debug('[Estadisticas] renderizar? vista:', this.vistaLista, 'datos:', this.datosListos, 'sinDatos:', this.sinDatos);
    if (!this.vistaLista || !this.datosListos) {
      return;
    }
    if (this.sinDatos) {
      return;
    }
    console.debug('[Estadisticas] construyendo charts');
    this.construirCharts();
  }

  private construirCharts(): void {
    this.aplicarEstilosGlobales();

    const prep = (canvas?: ElementRef<HTMLCanvasElement>): CanvasRenderingContext2D | undefined => {
      if (!canvas) return undefined;
      const el = canvas.nativeElement;
      const parent = el.parentElement;
      if (parent) {
        const width = parent.clientWidth || 400;
        const height = parent.clientHeight || 260;
        el.width = width;
        el.height = height;
      } else {
        el.width = 400;
        el.height = 260;
      }
      return el.getContext('2d') ?? undefined;
    };

    const loginsCtx = prep(this.loginsChart);
    const especialidadCtx = prep(this.especialidadChart);
    const diaCtx = prep(this.diaChart);
    const profesionalCtx = prep(this.profesionalChart);
    console.debug('[Estadisticas] ctx availability',
      !!loginsCtx, !!especialidadCtx, !!diaCtx, !!profesionalCtx);

    if (!loginsCtx && !especialidadCtx && !diaCtx && !profesionalCtx) {
      console.debug('[Estadisticas] ctx no listos, reintento en 60ms');
      setTimeout(() => this.renderizarSiCorresponde(), 60);
      return;
    }

    if (this.modoFallbackCharts) {
      console.debug('[Estadisticas] usando fallback canvas');
      this.construirChartsFallback({ loginsCtx, especialidadCtx, diaCtx, profesionalCtx });
      if (loginsCtx) {
        const px = loginsCtx.getImageData(0, 0, 1, 1).data;
        console.debug('[Estadisticas] pixel fallback', Array.from(px));
      }
      return;
    }

    if (loginsCtx && this.loginData.length) {
      const gradient = this.crearGradientVertical(loginsCtx, this.palette.primary, 0.68, 0.08);

      this.charts.push(new Chart(loginsCtx, {
        type: 'line',
        data: {
          labels: this.loginData.map(d => this.formatearDiaCorto(d.fecha)),
          datasets: [{
            label: 'Ingresos',
            data: this.loginData.map(d => d.ingresos),
            borderColor: this.palette.primary,
            backgroundColor: gradient,
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: this.palette.primaryAccent,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            borderWidth: 3,
            clip: 12
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Ingresos al sistema',
              font: { size: 16, weight: 600 },
              color: '#E3F2FD',
              padding: { bottom: 12 }
            },
            legend: {
              position: 'bottom'
            },
            tooltip: {
              backgroundColor: 'rgba(10, 14, 18, 0.9)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              callbacks: {
                title: items => `Día ${items[0]?.label ?? ''}`,
                label: context => `${context.dataset.label}: ${context.formattedValue}`
              }
            }
          },
          layout: { padding: 12 },
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: {
              ticks: {
                maxRotation: 0
              },
              grid: { color: 'rgba(55, 71, 79, 0.25)' }
            },
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              },
              grid: { color: 'rgba(55, 71, 79, 0.18)' }
            }
          },
          animations: {
            tension: { duration: 700, easing: 'easeOutQuart', from: 0.45, to: 0.2, loop: false }
          }
        }
      }));
    }

    if (especialidadCtx && this.especialidadData.length) {
      this.charts.push(new Chart(especialidadCtx, {
        type: 'doughnut',
        data: {
          labels: this.especialidadData.map(d => d.especialidad),
          datasets: [{
            label: 'Turnos',
            data: this.especialidadData.map(d => d.cantidad),
            backgroundColor: this.generarPaleta(this.especialidadData.length),
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Turnos por especialidad',
              font: { size: 16, weight: 600 },
              color: '#E3F2FD',
              padding: { bottom: 10 }
            },
            legend: {
              position: 'bottom',
              labels: {
                padding: 16,
                boxWidth: 14
              }
            },
            tooltip: {
              callbacks: {
                label: context => {
                  const total = context.dataset.data.reduce((acc: number, val: number) => acc + Number(val), 0) || 1;
                  const valor = Number(context.parsed);
                  const porcentaje = Math.round((valor / total) * 100);
                  return `${context.label}: ${valor} (${porcentaje}%)`;
                }
              }
            }
          },
          layout: { padding: 12 },
          cutout: '58%'
        }
      }));
    }

    if (diaCtx && this.diaData.length) {
      const barGradient = this.crearGradientVertical(diaCtx, this.palette.success, 0.82, 0.18);

      this.charts.push(new Chart(diaCtx, {
        type: 'bar',
        data: {
          labels: this.diaData.map(d => this.formatearDiaCorto(d.fecha)),
          datasets: [{
            label: 'Turnos solicitados',
            data: this.diaData.map(d => d.cantidad),
            backgroundColor: barGradient,
            borderColor: this.hexToRgba(this.palette.successAccent, 0.65),
            borderWidth: 1,
            hoverBackgroundColor: this.hexToRgba(this.palette.success, 0.95),
            maxBarThickness: 46,
            borderRadius: 12
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Turnos solicitados por día',
              font: { size: 16, weight: 600 },
              color: '#E3F2FD',
              padding: { bottom: 10 }
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: items => `Día ${items[0]?.label ?? ''}`,
                label: context => `${context.dataset.label}: ${context.formattedValue}`
              }
            }
          },
          layout: { padding: 12 },
          interaction: { intersect: false, mode: 'index' },
          scales: {
            x: {
              ticks: { maxRotation: 0 },
              grid: { color: 'rgba(55, 71, 79, 0.2)' }
            },
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 },
              grid: { color: 'rgba(55, 71, 79, 0.15)' }
            }
          }
        }
      }));
    }

    if (profesionalCtx && this.profesionalData.length) {
      const labels = this.profesionalData.map(d => d.profesional);
      const solicitadosGrad = this.crearGradientVertical(profesionalCtx, this.palette.primary, 0.85, 0.22);
      const finalizadosGrad = this.crearGradientVertical(profesionalCtx, this.palette.warning, 0.88, 0.25);

      this.charts.push(new Chart(profesionalCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Solicitados',
              data: this.profesionalData.map(d => d.solicitados),
              backgroundColor: solicitadosGrad,
              borderColor: this.hexToRgba(this.palette.primaryAccent, 0.7),
              borderWidth: 1,
              maxBarThickness: 36,
              borderRadius: 10
            },
            {
              label: 'Finalizados',
              data: this.profesionalData.map(d => d.finalizados),
              backgroundColor: finalizadosGrad,
              borderColor: this.hexToRgba(this.palette.warningAccent, 0.7),
              borderWidth: 1,
              maxBarThickness: 36,
              borderRadius: 10
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Comparativa por profesional',
              font: { size: 16, weight: 600 },
              color: '#E3F2FD',
              padding: { bottom: 10 }
            },
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: context => `${context.dataset.label}: ${context.formattedValue}`
              }
            }
          },
          layout: { padding: 12 },
          interaction: { intersect: false, mode: 'index' },
          scales: {
            x: {
              ticks: { maxRotation: 0 },
              grid: { color: 'rgba(55, 71, 79, 0.18)' }
            },
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 },
              grid: { color: 'rgba(55, 71, 79, 0.12)' }
            }
          }
        }
      }));
    }
  }

  private construirChartsFallback(ctxs: {
    loginsCtx?: CanvasRenderingContext2D;
    especialidadCtx?: CanvasRenderingContext2D;
    diaCtx?: CanvasRenderingContext2D;
    profesionalCtx?: CanvasRenderingContext2D;
  }): void {
    const palette = [
      '#90caf9', '#f48fb1', '#a5d6a7', '#ffcc80', '#ce93d8',
      '#ffab91', '#80cbc4', '#e6ee9c', '#b39ddb'
    ];

    if (ctxs.loginsCtx && this.loginData.length) {
      this.dibujarLineaFallback(
        ctxs.loginsCtx,
        this.loginData.map(d => this.formatearDiaCorto(d.fecha)),
        this.loginData.map(d => d.ingresos),
        'Ingresos al sistema',
        '#64b5f6'
      );
    }

    if (ctxs.especialidadCtx && this.especialidadData.length) {
      this.dibujarPieFallback(
        ctxs.especialidadCtx,
        this.especialidadData.map(d => d.especialidad),
        this.especialidadData.map(d => d.cantidad),
        'Turnos por especialidad',
        palette
      );
    }

    if (ctxs.diaCtx && this.diaData.length) {
      this.dibujarBarrasFallback(
        ctxs.diaCtx,
        this.diaData.map(d => this.formatearDiaCorto(d.fecha)),
        this.diaData.map(d => d.cantidad),
        'Turnos solicitados por día',
        '#81c784'
      );
    }

    if (ctxs.profesionalCtx && this.profesionalData.length) {
      const labels = this.profesionalData.map(d => d.profesional);
      const solicitados = this.profesionalData.map(d => d.solicitados);
      const finalizados = this.profesionalData.map(d => d.finalizados);
      this.dibujarBarrasStackFallback(
        ctxs.profesionalCtx,
        labels,
        solicitados,
        finalizados,
        'Turnos por profesional',
        ['#90caf9', '#ffcc80']
      );
    }
  }

  private limpiarCanvas(ctx: CanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(33, 43, 54, 0.55)';
    ctx.fillRect(0, 0, width, height);
  }

  private dibujarTitulo(ctx: CanvasRenderingContext2D, titulo: string): void {
    ctx.fillStyle = '#e3f2fd';
    ctx.font = '16px "Roboto", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titulo, ctx.canvas.width / 2, 24);
  }

  private dibujarLineaFallback(
    ctx: CanvasRenderingContext2D,
    labels: string[],
    valores: number[],
    titulo: string,
    color: string
  ): void {
    this.limpiarCanvas(ctx);
    this.dibujarTitulo(ctx, titulo);

    const { width, height } = ctx.canvas;
    const padding = 50;
    const areaW = width - padding * 2;
    const areaH = height - padding * 2;
    const max = Math.max(...valores, 1);
    const stepX = valores.length > 1 ? areaW / (valores.length - 1) : areaW;

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + areaH);
    ctx.lineTo(padding + areaW, padding + areaH);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    valores.forEach((valor, idx) => {
      const x = padding + stepX * idx;
      const y = padding + areaH - (valor / max) * areaH;
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.fillStyle = color;
    valores.forEach((valor, idx) => {
      const x = padding + stepX * idx;
      const y = padding + areaH - (valor / max) * areaH;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#cfd8dc';
    ctx.font = '12px "Roboto", sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((label, idx) => {
      const x = padding + stepX * idx;
      ctx.fillText(label, x, height - 10);
    });
  }

  private dibujarBarrasFallback(
    ctx: CanvasRenderingContext2D,
    labels: string[],
    valores: number[],
    titulo: string,
    color: string
  ): void {
    this.limpiarCanvas(ctx);
    this.dibujarTitulo(ctx, titulo);

    const { width, height } = ctx.canvas;
    const padding = 50;
    const areaW = width - padding * 2;
    const areaH = height - padding * 2;
    const max = Math.max(...valores, 1);
    const barWidth = areaW / valores.length * 0.6;
    const gap = areaW / valores.length * 0.4;

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + areaH);
    ctx.lineTo(padding + areaW, padding + areaH);
    ctx.stroke();

    valores.forEach((valor, idx) => {
      const x = padding + idx * (barWidth + gap) + gap / 2;
      const h = (valor / max) * areaH;
      const y = padding + areaH - h;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, h);
    });

    ctx.fillStyle = '#cfd8dc';
    ctx.font = '12px "Roboto", sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((label, idx) => {
      const x = padding + idx * (barWidth + gap) + barWidth / 2 + gap / 2;
      ctx.fillText(label, x, height - 10);
    });
  }

  private dibujarBarrasStackFallback(
    ctx: CanvasRenderingContext2D,
    labels: string[],
    serie1: number[],
    serie2: number[],
    titulo: string,
    colores: [string, string]
  ): void {
    this.limpiarCanvas(ctx);
    this.dibujarTitulo(ctx, titulo);

    const { width, height } = ctx.canvas;
    const padding = 50;
    const areaW = width - padding * 2;
    const areaH = height - padding * 2;
    const totales = serie1.map((v, idx) => v + (serie2[idx] || 0));
    const max = Math.max(...totales, 1);
    const barWidth = areaW / labels.length * 0.6;
    const gap = areaW / labels.length * 0.4;

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + areaH);
    ctx.lineTo(padding + areaW, padding + areaH);
    ctx.stroke();

    labels.forEach((label, idx) => {
      const x = padding + idx * (barWidth + gap) + gap / 2;
      let acumulado = 0;
      [serie1[idx] || 0, serie2[idx] || 0].forEach((valor, serieIdx) => {
        const h = (valor / max) * areaH;
        const y = padding + areaH - h - acumulado;
        ctx.fillStyle = colores[serieIdx] || '#90caf9';
        ctx.fillRect(x, y, barWidth, h);
        acumulado += h;
      });
    });

    ctx.fillStyle = '#cfd8dc';
    ctx.font = '12px "Roboto", sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((label, idx) => {
      const x = padding + idx * (barWidth + gap) + barWidth / 2 + gap / 2;
      ctx.fillText(label, x, height - 10);
    });

    ctx.font = '11px "Roboto", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#90caf9';
    ctx.fillRect(width - 150, padding + 10, 10, 10);
    ctx.fillText('Solicitados', width - 130, padding + 18);
    ctx.fillStyle = '#ffcc80';
    ctx.fillRect(width - 150, padding + 30, 10, 10);
    ctx.fillText('Finalizados', width - 130, padding + 38);
  }

  private dibujarPieFallback(
    ctx: CanvasRenderingContext2D,
    labels: string[],
    valores: number[],
    titulo: string,
    colores: string[]
  ): void {
    this.limpiarCanvas(ctx);
    this.dibujarTitulo(ctx, titulo);

    const { width, height } = ctx.canvas;
    const centroX = width / 2;
    const centroY = height / 2 + 10;
    const radio = Math.min(width, height) / 2 - 20;
    const total = valores.reduce((acc, val) => acc + val, 0) || 1;

    let inicio = -Math.PI / 2;
    valores.forEach((valor, idx) => {
      const proporcion = valor / total;
      const fin = inicio + proporcion * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centroX, centroY);
      ctx.arc(centroX, centroY, radio, inicio, fin);
      ctx.closePath();
      ctx.fillStyle = colores[idx % colores.length];
      ctx.fill();
      inicio = fin;
    });

    ctx.fillStyle = '#cfd8dc';
    ctx.font = '12px "Roboto", sans-serif';
    ctx.textAlign = 'left';
    labels.forEach((label, idx) => {
      ctx.fillStyle = colores[idx % colores.length];
      ctx.fillRect(20, 50 + idx * 18, 10, 10);
      ctx.fillStyle = '#cfd8dc';
      ctx.fillText(`${label} (${valores[idx]})`, 40, 58 + idx * 18);
    });
  }

  private destruirCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }

  private aplicarEstilosGlobales(): void {
    if (this.estilosChartAplicados) { return; }
    Chart.defaults.font.family = '"Roboto", "Helvetica Neue", Arial, sans-serif';
    Chart.defaults.font.size = 13;
    Chart.defaults.color = '#ECEFF1';
    Chart.defaults.plugins.legend.labels.color = '#CFD8DC';
    Chart.defaults.plugins.legend.labels.font = { size: 13 };
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(14, 20, 27, 0.94)';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.06)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.titleFont = { size: 13, weight: 600 };
    Chart.defaults.plugins.tooltip.titleColor = '#E3F2FD';
    Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
    Chart.defaults.plugins.tooltip.bodyColor = '#ECEFF1';
    Chart.defaults.plugins.tooltip.displayColors = false;
    Chart.defaults.elements.point.radius = 4;
    Chart.defaults.elements.point.hoverRadius = 6;
    Chart.defaults.elements.bar.borderRadius = 10;
    Chart.defaults.elements.bar.borderSkipped = false;
    this.estilosChartAplicados = true;
  }

  private generarPaleta(cantidad: number): string[] {
    const base = [
      '#42a5f5', '#66bb6a', '#ff7043', '#ab47bc', '#26c6da',
      '#ffca28', '#7e57c2', '#26a69a', '#ef5350', '#29b6f6',
      '#8d6e63', '#26c6da', '#c0ca33', '#ffa726', '#d81b60'
    ];
    return Array.from({ length: cantidad }, (_, idx) => {
      const color = base[idx % base.length];
      const alpha = 0.82 - (Math.floor(idx / base.length) * 0.08);
      return this.hexToRgba(color, Math.max(alpha, 0.45));
    });
  }

  private hexToRgba(hex: string, alpha = 1): string {
    const sanitized = hex.replace('#', '');
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private crearGradientVertical(
    ctx: CanvasRenderingContext2D,
    colorHex: string,
    alphaInicio = 0.85,
    alphaFin = 0.15
  ): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, this.hexToRgba(colorHex, alphaInicio));
    gradient.addColorStop(1, this.hexToRgba(colorHex, alphaFin));
    return gradient;
  }

  descargarExcel(): void {
    if (this.sinDatos) { return; }
    this.generandoExcel = true;
    try {
      const wb = XLSX.utils.book_new();
      const fecha = new Date().toISOString().split('T')[0];

      const wsEspecialidades = XLSX.utils.json_to_sheet(this.especialidadData);
      XLSX.utils.book_append_sheet(wb, wsEspecialidades, 'Turnos por especialidad');

      const wsDias = XLSX.utils.json_to_sheet(this.diaData);
      XLSX.utils.book_append_sheet(wb, wsDias, 'Turnos por día');

      const wsProfesionales = XLSX.utils.json_to_sheet(this.profesionalData);
      XLSX.utils.book_append_sheet(wb, wsProfesionales, 'Turnos por profesional');

      const wsIngresos = XLSX.utils.json_to_sheet(this.loginDetalle);
      XLSX.utils.book_append_sheet(wb, wsIngresos, 'Ingresos recientes');

      XLSX.writeFile(wb, `estadisticas_clinica_${fecha}.xlsx`);
    } catch (err) {
      console.error('[Estadisticas] Error Excel', err);
    } finally {
      this.generandoExcel = false;
    }
  }

  descargarPdf(): void {
    if (this.sinDatos) { return; }
    this.generandoPdf = true;
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const ancho = doc.internal.pageSize.getWidth();

      doc.setFontSize(18);
      doc.text('Reporte de estadísticas - Clínica Online', ancho / 2, 18, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 14, 28);

      let offset = 36;

      autoTable(doc, {
        startY: offset,
        head: [['Especialidad', 'Turnos']],
        body: this.especialidadData.map(item => [item.especialidad, item.cantidad]),
        theme: 'grid',
        styles: { fillColor: [66, 165, 245] }
      });

      offset = (doc as any).lastAutoTable.finalY + 10;
      autoTable(doc, {
        startY: offset,
        head: [['Fecha', 'Turnos solicitados']],
        body: this.diaData.map(item => [this.formatearDiaLargo(item.fecha), item.cantidad]),
        theme: 'grid',
        styles: { fillColor: [129, 199, 132] }
      });

      offset = (doc as any).lastAutoTable.finalY + 10;
      autoTable(doc, {
        startY: offset,
        head: [['Profesional', 'Solicitados', 'Finalizados']],
        body: this.profesionalData.map(item => [item.profesional, item.solicitados, item.finalizados]),
        theme: 'grid',
        styles: { fillColor: [255, 183, 77] }
      });

      doc.addPage();
      doc.setFontSize(14);
      doc.text('Detalle de ingresos recientes', 14, 20);
      autoTable(doc, {
        startY: 26,
        head: [['Usuario', 'Fecha', 'Hora', 'Email']],
        body: this.loginDetalle.map(item => [item.usuario, item.fecha, item.hora, item.email]),
        styles: { fontSize: 10 },
        theme: 'striped'
      });

      doc.save(`estadisticas_clinica_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('[Estadisticas] Error PDF', err);
    } finally {
      this.generandoPdf = false;
    }
  }

  private obtenerDia(iso?: string | null): string | null {
    if (!iso) { return null; }
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) { return null; }
    return fecha.toISOString().split('T')[0];
  }

  private formatearNombre(perfil: PerfilBasico): string {
    const nombre = (perfil.nombre || '').trim();
    const apellido = (perfil.apellido || '').trim();
    if (!nombre && !apellido) { return perfil.email || 'Usuario sin nombre'; }
    return [apellido, nombre].filter(Boolean).join(', ');
  }

  private formatearDiaCorto(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  }

  private formatearDiaLargo(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'long' });
  }
}

