import { DatoDinamico } from '../models/dato-dinamico.model';

function detectarTipo(dato: DatoDinamico): DatoDinamico['tipo'] {
  if (dato.tipo) { return dato.tipo; }
  if (typeof dato.valor === 'boolean') { return 'booleano'; }
  if (typeof dato.valor === 'number') { return 'numero'; }
  return 'texto';
}

export function formatearDatoDinamico(dato: DatoDinamico): string {
  if (!dato) { return ''; }
  const tipo = detectarTipo(dato);
  const unidad = dato.unidad ? ` ${dato.unidad}` : '';

  let valorFmt: string;
  if (dato.valor === null || dato.valor === undefined || dato.valor === '') {
    valorFmt = '—';
  } else if (tipo === 'booleano') {
    valorFmt = (dato.valor as boolean) ? 'Sí' : 'No';
  } else if (tipo === 'rango' || tipo === 'numero') {
    valorFmt = `${dato.valor}${unidad}`;
  } else {
    valorFmt = String(dato.valor);
  }

  return `${dato.clave}: ${valorFmt}`.trim();
}

export function valorDatoDinamicoParaFiltro(dato: DatoDinamico): string {
  if (!dato) { return ''; }
  const tipo = detectarTipo(dato);
  if (dato.valor === null || dato.valor === undefined || dato.valor === '') {
    return dato.clave ?? '';
  }
  if (tipo === 'booleano') {
    return `${dato.clave} ${(dato.valor as boolean) ? 'si' : 'no'}`;
  }
  return `${dato.clave} ${dato.valor}`;
}

