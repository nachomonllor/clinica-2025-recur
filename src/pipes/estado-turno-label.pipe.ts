import { Pipe, PipeTransform } from '@angular/core';
import { EstadoTurnoCodigo } from '../app/models/tipos.model';

@Pipe({
  name: 'estadoTurnoLabel',
  standalone: true
})
export class EstadoTurnoLabelPipe implements PipeTransform {

  transform(value: EstadoTurnoCodigo | string | null | undefined): string {
    if (!value) return '';

    const v = value.toString().toUpperCase();

    switch (v) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'ACEPTADO':
        return 'Aceptado';
      case 'RECHAZADO':
        return 'Rechazado';
      case 'CANCELADO':
        return 'Cancelado';
      case 'FINALIZADO':
        return 'Finalizado';
      default:
        // fallback: primera mayúscula, resto minúsculas
        return v.charAt(0) + v.slice(1).toLowerCase();
    }
  }
}
