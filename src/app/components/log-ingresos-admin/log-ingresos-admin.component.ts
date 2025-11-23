// src/app/components/log-ingresos-admin/log-ingresos-admin.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { LogIngresosService } from '../../../services/log-ingresos.service';
import { LogIngreso, PageToken } from '../../models/log-ingresos.model';

@Component({
  selector: 'app-log-ingresos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './log-ingresos-admin.component.html',
  styleUrls: ['./log-ingresos-admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogIngresosAdminComponent implements OnInit {

  pageSize = 10;
  windowSize = 10;

  private pageIndex$ = new BehaviorSubject<number>(0);
  isAdmin = true;

  logs$!: Observable<LogIngreso[]>;
  vm$!: Observable<{
    items: LogIngreso[];
    pageIndex: number;
    pageCount: number;
    pages: PageToken[];
    total: number;
  }>;

  constructor(private logSvc: LogIngresosService) {}

  ngOnInit(): void {
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
      shareReplay(1)
    );

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

  setPage(index: number) { this.pageIndex$.next(Math.max(0, Math.floor(index))); }
  first() { this.pageIndex$.next(0); }
  last(pageCount: number) { this.pageIndex$.next(Math.max(0, pageCount - 1)); }
  prev() { this.pageIndex$.next(Math.max(0, this.pageIndex$.value - 1)); }
  next(pageCount: number) { this.pageIndex$.next(Math.min(pageCount - 1, this.pageIndex$.value + 1)); }

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

  async exportarExcel(logs: LogIngreso[] | null | undefined) {
    if (!logs?.length) return;

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
}



