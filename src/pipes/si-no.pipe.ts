import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'siNo',
  standalone: true
})
export class SiNoPipe implements PipeTransform {

  /**
   * Uso básico:
   *   {{ usuario.activo | siNo }}
   *
   * Uso personalizado:
   *   {{ usuario.esta_aprobado | siNo:'Aprobado':'Pendiente' }}
   */
  transform(
    valor: boolean | null | undefined,
    textoSi: string = 'Sí',
    textoNo: string = 'No'
  ): string {
    return valor ? textoSi : textoNo;
  }
}
