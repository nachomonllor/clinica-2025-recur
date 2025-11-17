export type DatoDinamicoTipo = 'texto' | 'numero' | 'rango' | 'booleano';

export interface DatoDinamico {
  clave: string;
  valor: string | number | boolean;
  tipo?: DatoDinamicoTipo;
  unidad?: string;
}


// // Si ya tenes DatoDinamico, conservá tu versión.
// // Acá propongo una mínima por si la necesitas.
// export interface DatoDinamico {
//   clave: string;
//   valor: string | number | boolean;
//   tipo?: 'texto' | 'numero' | 'boolean';
//   etiqueta?: string;
//   unidad?: string;
// }