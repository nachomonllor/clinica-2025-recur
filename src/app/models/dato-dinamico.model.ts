export type TipoDatoDinamico = 'rango' | 'numero' | 'booleano' | 'texto';

export interface DatoDinamico {
  clave: string;
  valor: number | boolean | string | null;
  tipo: TipoDatoDinamico;
  unidad?: string | null;
}

// // función helper ya usada en MiPerfil
// export function formatearDatoDinamico(d: DatoDinamico): string {
//   const base = `${d.clave}: ${d.valor ?? ''}`;
//   if (d.unidad) return `${base} ${d.unidad}`;
//   return base;
// }


// src/app/models/dato-dinamico.model.ts

export function formatearDatoDinamico(d: DatoDinamico): string {
  let val = d.valor;

  // Si el valor es booleano (true-false), lo convertimos a texto
  if (typeof val === 'boolean') {
    val = val ? 'SI' : 'NO';
  }
  // -------------------

  const base = `${d.clave}: ${val ?? ''}`;
  
  if (d.unidad) {
    return `${base} ${d.unidad}`;
  }
  
  return base;
}
