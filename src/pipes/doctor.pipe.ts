import { Pipe, PipeTransform } from '@angular/core';

type PersonLike = {
  nombre?: string | null;
  apellido?: string | null;
  rol?: string | null; // 'especialista' | 'paciente' | 'admin' | ...
};

@Pipe({
  name: 'doctor',
  standalone: true,
  pure: true
})
export class DoctorPipe implements PipeTransform {

  /**
   * value: puede ser objeto {nombre, apellido, rol} o un string con el nombre completo
   * genero: 'm' → Dr., 'f' → Dra., undefined → Dr. (default)
   * soloSiEspecialista: true por defecto; si es false, aplica el prefijo siempre
   */
  transform(
    value: PersonLike | string | null | undefined,
    genero: 'm' | 'f' | null = null,
    soloSiEspecialista: boolean = true
  ): string {
    if (value == null) return '';

    const prefix = genero === 'f' ? 'Dra.' : 'Dr.';

    if (typeof value === 'object') {
      const rol = (value.rol ?? '').toLowerCase();
      const nombre = (value.nombre ?? '').trim();
      const apellido = (value.apellido ?? '').trim();
      const full = `${nombre} ${apellido}`.trim();

      if (!full) return ''; // si no hay nombre no forzamos "Dr. " suelto
      if (soloSiEspecialista && rol !== 'especialista') return full;

      return this.addPrefix(full, prefix);
    }

    // value es string (nombre completo)
    const full = (value ?? '').toString().trim();
    if (!full) return '';
    return this.addPrefix(full, prefix);
  }

  private addPrefix(name: string, prefix: string): string {
    // Evita duplicar: si ya empieza con Dr/Dra (con o sin punto), no agrega.
    if (/^\s*(dr\.?|dra\.?)\s+/i.test(name)) return name;
    return `${prefix} ${name}`.trim();
  }
}
