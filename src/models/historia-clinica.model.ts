import { DatoDinamico } from "./dato-dinamico.model";

export interface HistoriaClinica {
    id?: string;
    turno_id: string;
    paciente_id: string;
    especialista_id: string;
    altura: number;
    peso: number;
    temperatura: number;
    presion: string;
    datos_dinamicos?: DatoDinamico[];
    created_at?: string;
    updated_at?: string;
}