// src/app/pipes/dato-dinamico.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DatoDinamico, formatearDatoDinamico } from '../app/models/dato-dinamico.model';

// formateo para la historia clinica

@Pipe({
  name: 'datoDinamico',
  standalone: true
})
export class DatoDinamicoPipe implements PipeTransform {

  transform(dato: DatoDinamico | null | undefined): string {
    if (!dato) return '';
    return formatearDatoDinamico(dato);
  }
}

