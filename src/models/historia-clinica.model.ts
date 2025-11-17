import { DatoDinamico } from "./dato-dinamico.model";

// export interface HistoriaClinica {
//     id?: string;
//     turno_id: string;
//     paciente_id: string;
//     especialista_id: string;
//     altura: number;
//     peso: number;
//     temperatura: number;
//     presion: string;
//     datos_dinamicos?: DatoDinamico[];
//     created_at?: string;
//     updated_at?: string;
// }

// ========= Historia Clinica (unica) =========
export interface HistoriaClinica {
    id?: string;
    turno_id: string;
    paciente_id: string;
    especialista_id: string;

    datos_dinamicos?: DatoDinamico[];
    created_at?: string;
    updated_at?: string;

    // Requeridos (tu definición)
    altura: number;
    peso: number;
    temperatura: number;
    presion: string;
    resumen: string;

    // Opcionales (tuyos)
    fiebre?: boolean;
    infartos?: number;
    datosDinamicos?: DatoDinamico[];

    // Opcionales extra para UI (encabezado, filtros, etc.)
    idConsulta?: string;      // ej: "6"
    fecha?: string;           // ISO ej: "2025-11-10"
    especialidad?: string;    // ej: "pediatria"
    medico?: string;          // ej: "Augusto Morelli"
    // Si queres mostrar datos de paciente sin otro tipo:
    pacienteNombre?: string;
    pacienteDni?: string;
    pacienteFechaNacimiento?: string; // ISO
}
