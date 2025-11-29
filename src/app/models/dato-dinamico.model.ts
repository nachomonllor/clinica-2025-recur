export type TipoDatoDinamico = 'rango' | 'numero' | 'booleano' | 'texto';

export interface DatoDinamico {
  clave: string;
  valor: number | boolean | string | null;
  tipo: TipoDatoDinamico;
  unidad?: string | null;
}

// función helper ya usada en MiPerfil
export function formatearDatoDinamico(d: DatoDinamico): string {
  const base = `${d.clave}: ${d.valor ?? ''}`;
  if (d.unidad) return `${base} ${d.unidad}`;
  return base;
}

