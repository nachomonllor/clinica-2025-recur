import { Pipe, PipeTransform } from '@angular/core';

const ESTADOS: Record<string, string> = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
  rechazado: 'Rechazado'
};

@Pipe({
  name: 'statusLabel',
  standalone: true
})
export class StatusLabelPipe implements PipeTransform {
  transform(estado?: string | null, fallback = '—'): string {
    if (!estado) { return fallback; }
    const key = estado.toLowerCase();
    return ESTADOS[key] || fallback;
  }
}
