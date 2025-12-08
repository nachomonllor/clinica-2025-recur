import { Directive, HostBinding, Input } from '@angular/core';

type EstadoTurno = 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado';

/**
 * DIRECTIVA=================>> StatusBadge (Semaforo de Estados)
 * --------------------------------------------
 * Esta directiva controla la apariencia (clases CSS) de las etiquetas de estado
 * basandose en el valor del texto del estado del turno.
 * * Funcionalidad:
 * 1. Recibe el estado del turno (Input 'appStatusBadge').
 * 2. Normaliza el texto (lo pasa a minúsculas) para evitar errores.
 * 3. Usa @HostBinding para "prender" o "apagar" clases CSS automáticamente:
 * - .badge      -> Clase base (siempre activa).
 * - .badge-ok   -> Para 'realizado' (éxito).
 * - .badge-warn -> Para 'pendiente' o 'aceptado' (atención/proceso).
 * - .badge-bad  -> Para 'cancelado' o 'rechazado' (error/final negativo).
 * * Uso:
 * <span [appStatusBadge]="turno.estado">{{ turno.estado }}</span>
 */

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
