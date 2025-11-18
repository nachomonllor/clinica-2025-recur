import { Pipe, PipeTransform } from '@angular/core';

/**
 * Agrega "Dr." al nombre completo SOLO si el rol es 'especialista'.
 * Acepta un objeto con { nombre, apellido, rol } o un string (nombre completo).
 * Si recibe string y no puede conocer el rol, NO agrega prefijo (presenta tal cual).
 */
@Pipe({
  name: 'doctor',
  standalone: true,
  pure: true
})
export class DoctorPipe implements PipeTransform {

  transform(
    value: string | Partial<{ nombre: string; apellido: string; rol?: string }> | null | undefined
  ): string {
    if (value == null) return '';

    const isObj = typeof value === 'object';
    const rol = isObj ? (value as any).rol as string | undefined : undefined;

    // Construir el nombre completo
    const fullName = isObj
      ? [ (value as any).nombre, (value as any).apellido ].filter(Boolean).join(' ').trim()
      : String(value).trim();

    if (!fullName) return '';

    // Solo especialistas → prefijo
    const isEspecialista = (rol ?? '').toLowerCase() === 'especialista';
    if (!isEspecialista) return fullName;

    // Evita duplicar si ya trae Dr./Dra.
    if (/^\s*(dr\.|dra\.)\s+/i.test(fullName)) return fullName;

    return `Dr. ${fullName}`;
  }
}
