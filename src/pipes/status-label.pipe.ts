import { Pipe, PipeTransform } from '@angular/core';

const ESTADOS: Record<string, string> = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
  rechazado: 'Rechazado',
  finalizado: 'Finalizado' // <========
};

@Pipe({
  name: 'statusLabel',
  standalone: true
})
export class StatusLabelPipe implements PipeTransform {
  transform(estado?: string | null, fallback = '—'): string {
    if (!estado) { return fallback; }
    // Convertimos a minúsculas para que coincida con las claves del objeto
    const key = estado.toLowerCase();
    return ESTADOS[key] || fallback;
  }
}