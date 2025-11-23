import { EstadoTurnoUI } from './turno.model'; // si ya tenés este type, si no lo ajusto abajo

// Si todavía no tenés EstadoTurnoUI, podés definirlo acá o en turno.model.ts
// export type EstadoTurnoUI =
//   | 'PENDIENTE'
//   | 'ACEPTADO'
//   | 'RECHAZADO'
//   | 'CANCELADO'
//   | 'FINALIZADO';

export interface TurnoEspecialista {
  id: string;

  // datos básicos
  fechaISO: string;        // fecha_hora_inicio en ISO
  fecha: string;           // dd/MM/yyyy
  hora: string;            // HH:mm

  especialidad: string;
  paciente: string;

  estado: EstadoTurnoUI | string;

  // para filtros de texto
  historiaBusqueda?: string | null;

  // reseña / comentario final si existe
  resena?: string | null;
}

