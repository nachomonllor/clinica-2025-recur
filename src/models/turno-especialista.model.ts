import { UUID } from "./especialista.model";
import { EstadoTurno } from "./turno.model";

// src/app/models/turno-especialista.model.ts
export interface TurnoEspecialista {
  id: string | number;
  fecha: string;    // la mostrarás con un date pipe, o viene ya formateada
  hora: string;
  especialidad: string;
  paciente: string; // aquí guardas el nombre o "Nombre Apellido (ID)"
  estado: 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado';
  resena?: string;  // la reseña que deja el especialista
  encuesta?: boolean;
  historiaBusqueda?: string;  // string de búsqueda con datos de historia clínica
}

export interface TurnoEspecialistaVM {
  id: UUID;
  fechaISO: string;
  hora?: string;
  especialidad: string;
  paciente: string;
  estado: EstadoTurno;
  resenaEspecialista?: string | null;
}

