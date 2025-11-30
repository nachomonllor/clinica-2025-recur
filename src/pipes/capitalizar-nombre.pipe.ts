import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalizarNombre',
  standalone: true
})
export class CapitalizarNombrePipe implements PipeTransform {

  transform(value: string | undefined | null): string {
    if (!value) return '';

    return value
      // 1. Limpiamos espacios y pasamos todo a minúsculas base
      .trim()
      .toLowerCase()
      // 2. Separamos por palabras
      .split(' ')
      // 3. Transformamos cada palabra (Primera mayúscula + resto minúscula)
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      // 4. Unimos de nuevo
      .join(' ');
  }

}