import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
// AGREGAMOS 'finalize' a los operadores importados
import { catchError, map, shareReplay, tap, finalize } from 'rxjs/operators';

import { LogIngresosService } from '../../../services/log-ingresos.service';
import { LogIngreso, PageToken } from '../../models/log-ingresos.model';

// 1. IMPORTAR EL SERVICIO DE LOADING
import { LoadingService } from '../../../services/loading.service';

import jsPDF from 'jspdf';
import { LoadingOverlayComponent } from "../loading-overlay/loading-overlay.component";

@Component({
  selector: 'app-log-ingresos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingOverlayComponent],
  templateUrl: './log-ingresos-admin.component.html',
  styleUrls: ['./log-ingresos-admin.component.scss'],

  // Usamos OnPush para optimizar el rendimiento - La vista solo se renderiza cuando el Observable 'vm$' emite un nuevo valor
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogIngresosAdminComponent implements OnInit {

  // Variables de configuración de paginación
  pageSize = 10;
  windowSize = 10;

  private pageIndex$ = new BehaviorSubject<number>(0);
  isAdmin = true;

  logs$!: Observable<LogIngreso[]>;

  // patron ViewModel (vm$) => Un unico Observable que combina toda la informacion que necesita la vista 
  // (items, totales, indices). 
  // Esto evita tener múltiples suscripciones async en el HTML

  vm$!: Observable<{
    items: LogIngreso[];
    pageIndex: number;
    pageCount: number;
    pages: PageToken[];
    total: number;
  }>;

  constructor(
    private logSvc: LogIngresosService,
    //  INYECTAR EL SERVICIO EN EL CONSTRUCTOR
    private loading: LoadingService 
  ) {}

  ngOnInit(): void {
    // MOSTRAR SPINNER AL INICIAR
    this.loading.show();

    // Stream principal de datos => Obtiene los logs los ordena por fecha descendente y maneja el loading-error con operadores RxJS
    this.logs$ = this.logSvc.all$().pipe(
      tap(items => console.log('[LogIngresosAdmin] logs$', items)),
      map((items: LogIngreso[]) =>
        [...items].sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        )
      ),
      catchError(err => {
        console.error('Error cargando log de ingresos', err);
        return of<LogIngreso[]>([]);
      }),
      // OCULTAR SPINNER CUANDO TERMINE (EXITO O ERROR)
      finalize(() => this.loading.hide()),
      shareReplay(1)
    );


    // Escucha cambios en los DATOS (logs$) O en la PAGINA (pageIndex$).
    // Si cualquiera cambia, recalcula el 'slice' (recorte) del array para mostrar solo los ítems de esa página."
    this.vm$ = combineLatest([this.logs$, this.pageIndex$]).pipe(
      tap(([all, idx]) =>
        console.log('[LogIngresosAdmin] vm source', { total: all.length, idx })
      ),
      map(([all, pageIdx]) => {
        const total = all.length;
        const pageCount = Math.max(1, Math.ceil(total / this.pageSize));
        const current = Math.min(Math.max(pageIdx, 0), pageCount - 1);
        const start = current * this.pageSize;
        const end = start + this.pageSize;
        const items = all.slice(start, end);

        return {
          items,
          pageIndex: current,
          pageCount,
          pages: this.buildPages(current, pageCount),
          total
        };
      }),
      tap(vm => console.log('[LogIngresosAdmin] vm', vm)),
      shareReplay(1)
    );
  }

  // =========================================================
  // CONTROLADORES DE PAGINACION
  // Métodos simples que actualizan el BehaviorSubject 'pageIndex$'. 
  // Al hacer .next(), el combineLatest de arriba se dispara automáticamente
  // =========================================================
  setPage(index: number) { this.pageIndex$.next(Math.max(0, Math.floor(index))); }
  first() { this.pageIndex$.next(0); }
  last(pageCount: number) { this.pageIndex$.next(Math.max(0, pageCount - 1)); }
  prev() { this.pageIndex$.next(Math.max(0, this.pageIndex$.value - 1)); }
  next(pageCount: number) { this.pageIndex$.next(Math.min(pageCount - 1, this.pageIndex$.value + 1)); }

  // Algoritmo para generar la botonera de paginacion. 
  // Maneja logica de ventana deslizante (mostrar '...' si hay muchas páginas)
  private buildPages(current: number, pageCount: number): PageToken[] {
    const pages: PageToken[] = [];

    if (pageCount <= this.windowSize + 2) {
      for (let p = 1; p <= pageCount; p++) pages.push(p);
      return pages;
    }

    const start = Math.floor(current / this.windowSize) * this.windowSize + 1;
    const end = Math.min(start + this.windowSize - 1, pageCount);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('…');
    }

    for (let p = start; p <= end; p++) pages.push(p);

    if (end < pageCount) {
      if (end < pageCount - 1) pages.push('…');
      pages.push(pageCount);
    }

    return pages;
  }

  trackByIndex = (i: number) => i;

  // =========================================================
  // EXPORTACIoN EXCEL
  // Generación de Excel en el cliente usando la librería 'xlsx'. 
  // Mapeamos los datos a un formato tabular limpio y descargamos el archivo con Timestamp."
  // =========================================================
  async exportarExcel(logs: LogIngreso[] | null | undefined) {
    if (!logs?.length) return;

    // Podriamos mostrar loading aqui tambien si la generación es pesada
    this.loading.show();

    try {
      const XLSX = await import('xlsx');

      const rows = logs.map(l => ({
        Usuario: l.email ?? l.usuario_id,
        'Fecha y Hora': this.formatDate(l.createdAt),
        Tipo: l.tipo
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ingresos');
      XLSX.writeFile(wb, `registro_ingresos_${this.simpleStamp()}.xlsx`);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading.hide();
    }
  }

  private simpleStamp(): string {
    const d = new Date();
    const z = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}`;
  }

  formatDate(value: Date | string | number): string {
    const d = new Date(value);
    return d.toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  }


  // =========================================================
  // Generacion avanzada de PDF con 'jsPDF' 
  // - Dibuja un Header vectorial con Logo SVG y fecha
  // - Itera los logs dibujando filas con colores alternados
  // - Calcula automaticamente cuando se acaba la hoja para crear una nueva (addPage) y redibujar el header
  // =========================================================

  exportarPDF(logs: LogIngreso[] | null | undefined): void {
    if (!logs?.length) return;

    this.loading.show(); // Feedback visual mientras genera

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const marginX = 15;
    const headerBottom = 32;
    const rowHeight = 8;

    // 1. LOGO SVG
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
        doc.text('Registro de Ingresos', pageWidth - marginX, 18, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const hoy = new Date().toLocaleDateString('es-AR');
        doc.setTextColor(209, 213, 219);
        doc.text(`Emisión: ${hoy}`, pageWidth - marginX, 24, { align: 'right' });

        doc.setDrawColor(251, 191, 36);
        doc.setLineWidth(0.4);
        doc.line(marginX, headerBottom - 1, pageWidth - marginX, headerBottom - 1);

        doc.setFillColor(229, 231, 235);
        doc.rect(marginX, headerBottom + 5, pageWidth - (marginX * 2), 8, 'F');
        
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        doc.text('USUARIO', marginX + 2, headerBottom + 10);
        doc.text('FECHA Y HORA', marginX + 90, headerBottom + 10);
        doc.text('TIPO', marginX + 140, headerBottom + 10);
      };

      drawHeader();
      let y = headerBottom + 16; 

      // Iteracion y pintado de filas
      logs.forEach((log, i) => {
        if (i % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(marginX, y - 5, pageWidth - (marginX * 2), rowHeight, 'F');
        }

        doc.setTextColor(55, 65, 81);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        const usuario = log.email ?? log.usuario_id ?? 'Desconocido';
        const fecha = this.formatDate(log.createdAt);
        const tipo = log.tipo ?? '-';

        doc.text(usuario, marginX + 2, y);
        doc.text(fecha, marginX + 90, y);
        doc.text(tipo, marginX + 140, y);

        y += rowHeight;

        // Control de Salto de Pagina
        if (y > pageHeight - 15) {
          doc.addPage();
          drawHeader();
          y = headerBottom + 16;
        }
      });

      doc.save(`registro_ingresos_${this.simpleStamp()}.pdf`);
      this.loading.hide(); // Ocultar spinner al terminar PDF
    };

    // Conversion de SVG a PNG para jsPDF (canvas intermedio)
    const img = new Image();
    img.src = svgBase64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600; canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        generarDocumento(canvas.toDataURL('image/png'));
      } else {
        generarDocumento();
        this.loading.hide();
      }
    };
    img.onerror = () => {
        generarDocumento();
        this.loading.hide();
    };
  }
}


/* ---------------------------------------------------------------------------------------------------------------- */

