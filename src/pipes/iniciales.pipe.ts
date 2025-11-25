import { Pipe, PipeTransform } from '@angular/core';
// Importá tu modelo si querés tipar fuerte, no es obligatorio
// import { UsuarioPerfil } from '../models/usuario.model';

@Pipe({
  name: 'iniciales',
  standalone: true,
  pure: true // default, pero lo explicitamos
})
export class InicialesPipe implements PipeTransform {

  /**
   * Permite dos formas de uso:
   *  - {{ usuario | iniciales }}            <==== PARA OBJECTOS
   *  - {{ nombre | iniciales:apellido:email }} <=== PARA STRING SUELTOS
   */
  transform(value: any, apellido?: string, email?: string): string {
    // Caso 1: viene un objeto usuario (tiene nombre/apellido/email)
    if (typeof value === 'object' && value !== null) {
      const n = (value.nombre ?? '').toString().trim();
      const a = (value.apellido ?? '').toString().trim();
      const e = (value.email ?? '').toString().trim();
      const i1 = n.charAt(0) || e.charAt(0) || 'U';
      const i2 = a.charAt(0) || '';
      return (i1 + i2).toUpperCase();
    }

    // Caso 2: viene nombre como string + (apellido?, email?)
    const n = (value ?? '').toString().trim();
    const a2 = (apellido ?? '').toString().trim();
    const e2 = (email ?? '').toString().trim();
    const i1 = n.charAt(0) || e2.charAt(0) || 'U';
    const i2 = a2.charAt(0) || '';
    return (i1 + i2).toUpperCase();
  }
}

