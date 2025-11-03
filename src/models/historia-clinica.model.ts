import { DatoDinamico } from "./dato-dinamico.model";

export interface HistoriaClinica {
    altura: number;
    peso: number;
    temperatura: number;
    presion: string;
    resumen:string;
    datosDinamicos?: DatoDinamico[];
}