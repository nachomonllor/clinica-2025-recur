import { Especialidad } from "./especialista.model";
import { UUID } from "./interfaces";

// src/app/models/paciente.model.ts
export interface Paciente {
  id: UUID;             // <-- campo para identificarlo
  avatarUrl: string;      // <-- para la imagen en la lista

  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  obraSocial: string;
  email: string;
  password: string;
  //  manejar los archivos directamente como File:
  // imagenPerfil1: File;
  //imagenPerfil2: File;
  // Si prefieres trabajar con URLs/base64:
  imagenPerfil1: string;
  imagenPerfil2: string;
}

// // ========= Paciente =========
// export interface Paciente {
//   id: UUID;
//   nombre: string;
//   apellido: string;
//   edad: number;
//   dni: string;
//   obraSocial: string;
//   email: string;
//   avatarUrl: string;
//   password: string;
//   // Opcionales / legacy:
//   imagenPerfil1?: string | null;
//   imagenPerfil2?: string | null;
//   password?: string;               // TODO: eliminar
// }



export interface PacienteAtendido {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  avatar_url?: string;
}

export interface PacienteOption {
  id: string;
  nombre: string;
  apellido: string;
}

export interface PacienteFav {
  id: UUID;
  nombre: string;
  avatarUrl: string;
  ultimaVisita?: string;           // ISO o texto
}


export interface Paciente {
  id: string;
  nombreCompleto: string;
  dni: string;
  fechaNacimiento: string; // ISO
}

export interface DatosVitales {
  alturaCm: number;
  pesoKg: number;
  temperaturaC: number;
  presion: string; // ej: '120/80 mmHg'
}

export interface DatoAdicional {
  clave: string;                   // ej: 'fiebre'
  etiqueta?: string;               // ej: 'Fiebre'
  tipo?: 'boolean' | 'number' | 'text';
  valor: boolean | number | string;
}

export interface Consulta {
  id: string;
  fecha: string;                   // ISO
  especialidad: Especialidad;
  medico: string;
  datosVitales: DatosVitales;
  datosAdicionales: DatoAdicional[];
  notas?: string;
}
