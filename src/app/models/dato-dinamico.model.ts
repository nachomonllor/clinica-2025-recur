export type TipoDatoDinamico = 'rango' | 'numero' | 'booleano' | 'texto';

export interface DatoDinamico {
  clave: string;
  valor: number | boolean | string | null;
  tipo: TipoDatoDinamico;
  unidad?: string | null;
}

