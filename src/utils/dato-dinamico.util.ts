import { HistoriaDatoDinamico } from "../app/models/historia-clinica.model";

export type DatoDinamico = HistoriaDatoDinamico;

export function formatearDatoDinamico(dato: DatoDinamico): string {
  if (!dato) return '';

  const clave = dato.clave ?? '';

  // Prioridad: texto > booleano > numérico
  if (dato.valor_texto != null && dato.valor_texto !== '') {
    return `${clave}: ${dato.valor_texto}`;
  }

  if (dato.valor_boolean != null) {
    const txt = dato.valor_boolean ? 'Sí' : 'No';
    return `${clave}: ${txt}`;
  }

  if (dato.valor_numerico != null) {
    return `${clave}: ${dato.valor_numerico}`;
  }

  // Sin valor cargado → solo la clave
  return clave;
}




// import { DatoDinamico } from "../app/models/dato-dinamico.util";

// function detectarTipo(dato: DatoDinamico): DatoDinamico['tipo'] {
//   if (dato.tipo) { return dato.tipo; }
//   if (typeof dato.valor === 'boolean') { return 'booleano'; }
//   if (typeof dato.valor === 'number') { return 'numero'; }
//   return 'texto';
// }

// export function formatearDatoDinamico(dato: DatoDinamico): string {
//   if (!dato) { return ''; }
//   const tipo = detectarTipo(dato);
//   const unidad = dato.unidad ? ` ${dato.unidad}` : '';

//   let valorFmt: string;
//   if (dato.valor === null || dato.valor === undefined || dato.valor === '') {
//     valorFmt = '—';
//   } else if (tipo === 'booleano') {
//     valorFmt = (dato.valor as boolean) ? 'Sí' : 'No';
//   } else if (tipo === 'rango' || tipo === 'numero') {
//     valorFmt = `${dato.valor}${unidad}`;
//   } else {
//     valorFmt = String(dato.valor);
//   }

//   return `${dato.clave}: ${valorFmt}`.trim();
// }

// export function valorDatoDinamicoParaFiltro(dato: DatoDinamico): string {
//   if (!dato) { return ''; }
//   const tipo = detectarTipo(dato);
//   if (dato.valor === null || dato.valor === undefined || dato.valor === '') {
//     return dato.clave ?? '';
//   }
//   if (tipo === 'booleano') {
//     return `${dato.clave} ${(dato.valor as boolean) ? 'si' : 'no'}`;
//   }
//   return `${dato.clave} ${dato.valor}`;
// }


// export { DatoDinamico };
