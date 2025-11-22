
// src/app/utils/dato-dinamico.util.ts
import { HistoriaDatoDinamico } from '../models/historia-clinica.model';

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

  // Sin valor cargado ==> solo la clave
  return clave;
}
