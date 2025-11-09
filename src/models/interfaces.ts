// --------- Comunes ---------
export type UUID = string;
export type Rol = 'paciente' | 'especialista' | 'admin';

// --------- Turnos (CANÓNICO) ---------
export type EstadoTurno =
  | 'pendiente' | 'aceptado' | 'confirmado'
  | 'realizado' | 'rechazado' | 'cancelado';

// Aliases de compatibilidad (no usar en código nuevo):
export type TurnoEstado = EstadoTurno;
export type Estado = EstadoTurno;

export interface DatoDinamico {
  clave: string;
  valor: string;
}

export interface QuickItem {
  label: string;
  route: string;
  avatar: string;
  rol: Rol;
  tooltip?: string;
}

// --------- Admin ---------
export interface AdminCounters {
  usuarios: number;
  especialistasPendientes: number;
  turnosHoy: number;
  turnosPendientes: number;
}

// --------- Perfiles / Auth (alineado a Supabase) ---------
export interface PerfilRow {
  id: UUID;                  // PK = auth.users.id
  rol: Rol;
  aprobado: boolean | null;
  nombre: string | null;
  apellido: string | null;
  avatar_url: string | null;
  created_at: string;        // ISO
  updated_at: string | null;
}

export type PerfilInsert = {
  id: UUID;                  // requerido si onConflict: 'id'
  rol: Rol;
  aprobado?: boolean | null;
  nombre?: string | null;
  apellido?: string | null;
  dni: string | null;
  obra_social?: string | null;
  fecha_nacimiento?: string | null;
  email: string;
  avatar_url?: string | null;
  imagen2_url?: string | null;
};

export type PerfilUpdate = {
  id: UUID;
} & Partial<Omit<PerfilInsert, 'id'>>;

export interface Perfil {
  id: UUID;
  rol: Rol;
  aprobado?: boolean | null;
  email?: string | null;
}

// --------- Especialista ---------
export interface Horario {
  especialidad: string;
  dias: string[];   // ["Lunes","Miércoles"]
  horas: string[];  // ["09:00","10:00"]
}

export interface Especialista {
  id: UUID;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  // Opcionales / legacy:
  edad?: number;
  especialidad?: string | null; // si luego normalizás, lo quitás
  avatarUrl?: string | null;
  imagenPerfil?: string | null;
  horarios?: Horario[];
  aprobado?: boolean | null;
  password?: string;           // TODO: eliminar (no guardar password en modelos)
}

export interface SpecialistCounters {
  pacientes: number;               // atendidos ≥1 vez
  turnosHoy: number;
  proximosTurnos: number;
  reseniasPendientes: number;      // consultas sin reseña
}

export interface PacienteFav {
  id: UUID;
  nombre: string;
  avatarUrl: string;
  ultimaVisita?: string;           // ISO o texto
}

// --------- Paciente ---------
export interface Paciente {
  id: UUID;
  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  obraSocial: string;
  email: string;
  avatarUrl: string;
  // Opcionales / legacy:
  imagenPerfil1?: string | null;
  imagenPerfil2?: string | null;
  password?: string;               // TODO: eliminar
}

// --------- Historia Clínica ---------
export interface HistoriaClinica {
  altura: number;
  peso: number;
  temperatura: number;
  presion: string;
  resumen: string;
  datosDinamicos?: DatoDinamico[];
}

// Forma de BD
export interface TurnoRow {
  id: UUID;
  paciente_id: UUID;
  especialista_id: UUID;
  especialidad: string;
  fecha_iso: string;                  // ISO 8601
  estado: EstadoTurno;
  resena_especialista?: string | null;
  encuesta?: { estrellas?: number; comentario?: string } | null;
  ubicacion?: string | null;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Dominio (normalizado)
export interface Turno {
  id: UUID;
  pacienteId: UUID;
  especialistaId: UUID;
  especialidad: string;
  fecha: Date;                        // normalizado
  estado: EstadoTurno;
  ubicacion?: string | null;
  notas?: string | null;
  resenaEspecialista?: string | null;
  encuesta?: boolean;
  calificacion?: number;              // ej. estrellas
}

// // ViewModel de UI (tabla/listas). Mantiene compatibilidad con tu tabla actual.
// export interface TurnoVM {
//   id: UUID;
//   especialidad: string;
//   especialista: string;               // "Apellido, Nombre"
//   estado: EstadoTurno;

//   // Canónico:
//   fechaISO: string;

//   // Compatibilidad legacy (tu tabla actual):
//   fecha?: Date;                       // usado por MisTurnosPaciente
//   hora?: string;                      // "HH:mm"

//   // Extras:
//   pacienteId?: UUID;
//   especialistaId?: UUID;
//   ubicacion?: string | null;
//   notas?: string | null;
//   tieneResena?: boolean;
//   resenaEspecialista?: string | null;
//   encuesta?: boolean;
//   calificacion?: number;
// }




export interface TurnoVM {
  id: UUID;
  especialidad: string;
  especialista: string;    // "Apellido, Nombre"
  estado: EstadoTurno;

  // Canónico:
  fechaISO: string;

  // Compatibilidad legacy:
  fecha?: Date;
  hora?: string;

  // Extras:
  pacienteId?: UUID;
  especialistaId?: UUID;
  ubicacion?: string | null;
  notas?: string | null;
  tieneResena?: boolean;
  resenaEspecialista?: string | null;
  encuesta?: boolean;
  calificacion?: number;

  // =============================
  pacienteNombre?: string;
  motivo?: string | null;
}


// VM para especialista POR SI SE NECESITA SEPARADO
export interface TurnoEspecialistaVM {
  id: UUID;
  fechaISO: string;
  hora?: string;
  especialidad: string;
  paciente: string;
  estado: EstadoTurno;
  resenaEspecialista?: string | null;
}

// src/app/models/turno-especialista.model.ts
export interface TurnoEspecialista {
    id: number;
    fecha: string;    // la mostrarás con un date pipe, o viene ya formateada
    hora: string;
    especialidad: string;
    paciente: string; // aquí guardas el nombre o “Nombre Apellido (ID)”
    estado: 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado';
    resena?: string;  // la reseña que deja el especialista
}

export interface TurnoVm {
  id: string;
  especialidad: string;
  especialista: string;
  fechaISO: string;
  estado: Estado;
  tieneResenia?: boolean;
  puedeEncuesta?: boolean;
}

export interface Counters {
  pacientes: number;
  turnosHoy: number;
  proximosTurnos: number;
  reseniasPendientes: number;
}

// /** Lo que la vista necesita, y que SÍ usamos en el HTML */
// interface TurnoVM {
//   id: string;
//   fechaISO: string;          // ISO 8601 o Date.toISOString()
//   pacienteId: string;
//   pacienteNombre: string;
//   motivo?: string | null;
// }


// export interface AdminCounters {
//     usuarios: number;
//     especialistasPendientes: number;
//     turnosHoy: number;
//     turnosPendientes: number;
// }

// export interface DatoDinamico {
//     clave: string;
//     valor: string;
// }

// // models/especialista.model.ts
// export interface Especialista {
//     id: number,
//     nombre: string;
//     apellido: string;
//     edad: number;
//     dni: string;
//     // La especialidad se maneja como un string para que se pueda elegir de un listado o agregar una nueva
//     especialidad?: string;
//     mail: string;
//     password: string;
//     imagenPerfil: string;
// }

// export interface SpecialistCounters {
//     pacientes: number;               // pacientes atendidos al menos 1 vez
//     turnosHoy: number;
//     proximosTurnos: number;
//     reseniasPendientes: number;      // cantidad de consultas sin reseña
// }

// export interface PacienteFav {
//     id: string;
//     nombre: string;
//     avatarUrl: string;
//     ultimaVisita?: string;           // ISO o texto amigable
// }

// // export interface Turno {
// //     id: string;
// //     pacienteId: string;
// //     pacienteNombre: string;
// //     fechaISO: string;                // para ordenar y formatear
// //     motivo?: string;
// // }

// export interface HistoriaClinica {
//     altura: number;
//     peso: number;
//     temperatura: number;
//     presion: string;
//     resumen: string;
//     datosDinamicos?: DatoDinamico[];
// }

// interface Horario {
//     especialidad: string;
//     dias: string[]; // Por ejemplo: ["Lunes", "Miércoles"]
//     horas: string[]; // Por ejemplo: ["09:00", "10:00"]
// }



// // src/app/models/paciente.model.ts
// export interface Paciente {
//     id: string;             // <-- campo para identificarlo
//     avatarUrl: string;      // <-- para la imagen en la lista

//     nombre: string;
//     apellido: string;
//     edad: number;
//     dni: string;
//     obraSocial: string;
//     email: string;
//     password: string;
//     //  manejar los archivos directamente como File:
//     // imagenPerfil1: File;
//     //imagenPerfil2: File;
//     // Si prefieres trabajar con URLs/base64:
//     imagenPerfil1: string;
//     imagenPerfil2: string;
// }


// // src/app/models/perfil.model.ts
// export type Rol = 'paciente' | 'especialista' | 'admin';

// export interface PerfilRow {
//     id: string;               // PK = auth.users.id
//     rol: Rol;
//     aprobado: boolean | null;
//     nombre: string | null;
//     apellido: string | null;
//     avatar_url: string | null;
//     created_at: string;       // ISO string (timestamptz)
//     updated_at: string | null;
// }

// // payload para insert/upsert
// export type PerfilInsert = {
//     id: string;               // requerido si onConflict: 'id'
//     rol: Rol;
//     aprobado?: boolean | null;
//     nombre?: string | null;
//     dni: string | null;
//     obra_social?: string | null;
//     fecha_nacimiento?: string | null;
//     email: string;
//     apellido?: string | null;
//     avatar_url?: string | null;
//     imagen2_url?: string | null;
// };

// // Para actualizar (id + campos opcionales)
// export type PerfilUpdate = {
//     id: string;
// } & Partial<Omit<PerfilInsert, 'id'>>;

// export interface QuickItem {
//     label: string;
//     route: string;
//     avatar: string;
//     rol: Rol;
//     tooltip?: string;
// }

// //type Rol = 'paciente' | 'especialista' | 'admin';

// export interface Perfil {
//     id: string;
//     rol: Rol;
//     aprobado?: boolean | null;
//     email?: string | null;
// }




// export interface Turno {
//     id: number;
//     fecha: Date;
//     hora: string;
//     especialidad: string;
//     especialista: string;
//     pacienteId?: string;
//     estado: TurnoEstado;
//     // reseña que deja el especialista
//     resenaEspecialista?: string;
//     resena: string;
//     calificacion: number;
//     // comentario / calificación del paciente (opcional, si los usas)
//     comentarioPaciente?: string;
//     calificacionPaciente?: number;
//     encuesta?: boolean;
// }


// // export interface Turno {
// //   pacienteId?: string;
// //   paciente?: string;
// //   id: number;
// //   fecha: Date;            // reemplazo string por DATE
// //   hora: string;
// //   especialidad: string;
// //   especialista: string;
// //   estado: 'pendiente' | 'realizado' | 'cancelado' | 'rechazado' | 'aceptado';
// //   resena?: string;
// //   encuesta?: boolean;
// //   calificacion?: number;
// // }


// export interface TurnoDto {
//     pacienteId: string;
//     id: number;
//     fecha: string;
//     hora: string;
//     especialidad: string;
//     especialista: string;
//     estado: TurnoEstado;     // ← ahora es el mismo union
//     resena?: string;
//     encuesta?: boolean;
//     calificacion?: number;
// }

// // turno.model.ts
// export type TurnoEstado =
//     | 'pendiente'
//     | 'realizado'
//     | 'cancelado'
//     | 'rechazado'
//     | 'aceptado';

// export type EstadoTurno = 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado';
//             type Estado = 'pendiente' | 'confirmado' | 'realizado' | 'cancelado';

// /** Estructura tal como viene de la BD (tabla 'turnos') */
// export interface TurnoRow {
//     id: string;
//     paciente_id: string;
//     especialista_id: string;
//     especialidad: string;
//     fecha_iso: string;          // ISO string
//     estado: EstadoTurno;
//     resena_especialista?: string | null;
//     encuesta?: any | null;      // { estrellas?: number, comentario?: string, ... }
//     created_at?: string;
//     updated_at?: string;
// }

// /** Estructura para la vista (lo que muestra la tabla en la USER IINTERFACE) */
// export interface TurnoVM {
//     id: string;
//     fecha: Date;                // sólo día
//     hora: string;               // 'HH:mm'
//     especialidad: string;
//     especialista: string;       // "Apellido, Nombre"
//     estado: EstadoTurno;
//     resena?: string;
//     encuesta?: boolean;         // true si tiene encuesta cargada
//     pacienteId: string;
//     calificacion?: number;      // p. ej. estrellas
// }

// /**  interfaz antigua para mocks */
// export interface TurnoMock {
//     id: number;
//     fecha: Date;
//     hora: string;
//     especialidad: string;
//     especialista: string;
//     estado: EstadoTurno;
//     resena?: string;
//     encuesta?: boolean;
//     pacienteId: string;
//     calificacion?: number;
// }


// type EstadoTurno =
//   | 'pendiente' | 'aceptado' | 'confirmado'
//   | 'realizado' | 'rechazado' | 'cancelado';

// export interface TurnoVM {
//   id: string;
//   especialidad: string;
//   especialista: string;
//   fechaISO: string;            // ISO 8601
//   estado: EstadoTurno;
//   ubicacion?: string;
//   notas?: string;
//   resena?: boolean;            // existe reseña del especialista
//   encuesta?: boolean;          // encuesta del paciente completada
// }


// interface Usuario {
//     nombre: string;
//     apellido: string;
//     email: string;
//     imagenPerfil: string;
//     // Si el usuario es Especialista, puede tener horarios asignados.
//     horarios?: Horario[];
// }










