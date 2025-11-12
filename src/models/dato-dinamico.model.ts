export type DatoDinamicoTipo = 'texto' | 'numero' | 'rango' | 'booleano';

export interface DatoDinamico {
  clave: string;
  valor: string | number | boolean;
  tipo?: DatoDinamicoTipo;
  unidad?: string;
}

