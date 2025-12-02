import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'doctor',
  standalone: true // Recomendado si usas componentes standalone
})
export class DoctorPipe implements PipeTransform {

  transform(value: string | undefined | null): string {
    // Si el valor es nulo o vacío, devolvemos cadena vacía para evitar "Dr. null"
    if (!value) return '';
    
    // Retornamos el nombre con el prefijo
    return `Dr. ${value}`;
  }

}