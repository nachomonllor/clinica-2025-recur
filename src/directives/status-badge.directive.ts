import { Directive, HostBinding, Input } from '@angular/core';

type EstadoTurno = 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado';

@Directive({
  selector: '[appStatusBadge]',
  standalone: true
})
export class StatusBadgeDirective {

  private estadoInterno: EstadoTurno | undefined;

  @HostBinding('class.badge') baseClass = true;
  @HostBinding('class.badge-ok') ok = false;
  @HostBinding('class.badge-warn') warn = false;
  @HostBinding('class.badge-bad') bad = false;

  @Input()
  set appStatusBadge(value: string | EstadoTurno | null | undefined) {
    const normalizado = (value || '').toLowerCase() as EstadoTurno;
    this.estadoInterno = normalizado;
    this.actualizarClases();
  }

  private actualizarClases(): void {
    const estado = this.estadoInterno;
    this.ok = estado === 'realizado';
    this.warn = estado === 'pendiente' || estado === 'aceptado';
    this.bad = estado === 'cancelado' || estado === 'rechazado';
  }
}
