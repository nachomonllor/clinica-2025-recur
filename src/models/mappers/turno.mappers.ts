import { TurnoRow, Turno, TurnoVM, EstadoTurno, UUID } from '../../models/interfaces';

export function rowToTurno(r: TurnoRow): Turno {
  return {
    id: r.id,
    pacienteId: r.paciente_id,
    especialistaId: r.especialista_id,
    especialidad: r.especialidad,
    fecha: new Date(r.fecha_iso),
    estado: r.estado,
    ubicacion: r.ubicacion ?? null,
    notas: r.notas ?? null,
    resenaEspecialista: r.resena_especialista ?? null,
    encuesta: !!r.encuesta,
    calificacion: Number(r.encuesta?.estrellas ?? NaN) || undefined,
  };
}

// helpers UI-only
export function formatNombre(apellido?: string | null, nombre?: string | null) {
  const ap = (apellido ?? '').trim();
  const no = (nombre ?? '').trim();
  return (ap || no) ? `${ap}, ${no}`.trim().replace(/^,\s*/, '') : '-';
}
export function horaLocal(fecha: Date) {
  const d = new Date(fecha);
  const hh = `${d.getHours()}`.padStart(2,'0');
  const mm = `${d.getMinutes()}`.padStart(2,'0');
  return `${hh}:${mm}`;
}

/** Dominio → VM plano (sin objetos anidados en la UI) */
export function turnoToVM(t: Turno, opts?: {
  pacienteNombre?: string;
  especialistaNombre?: string;
}): TurnoVM {
  const fechaISO = t.fecha.toISOString();
  return {
    id: t.id,
    especialidad: t.especialidad,
    especialista: opts?.especialistaNombre ?? '-',   // string "Apellido, Nombre"
    estado: t.estado,
    fechaISO,
    fecha: new Date(fechaISO),
    hora: horaLocal(t.fecha),
    pacienteId: t.pacienteId,
    especialistaId: t.especialistaId,
    pacienteNombre: opts?.pacienteNombre ?? '-',
    ubicacion: t.ubicacion ?? null,
    notas: t.notas ?? null,
    resenaEspecialista: t.resenaEspecialista ?? null,
    encuesta: !!t.encuesta,
    calificacion: t.calificacion
  };
}

// Reglas de negocio: ¿se puede cancelar?
export function puedeCancelar(estado: EstadoTurno): boolean {
  // coherente con tu tipo (incluye 'confirmado' como no cancelable)
  return !['aceptado','confirmado','realizado','rechazado','cancelado'].includes(estado);
}






// import { Turno, TurnoRow, TurnoVM } from "../interfaces";

// const hhmm = (iso: string): string => {
//   const d = new Date(iso);
//   const hh = String(d.getHours()).padStart(2, '0');
//   const mm = String(d.getMinutes()).padStart(2, '0');
//   return `${hh}:${mm}`;
// };

// /** Row (BD) -> Dominio (normalizado) */
// // export function rowToTurno(row: TurnoRow): Turno {
// //   return {
// //     id: row.id,
// //     pacienteId: row.paciente_id,
// //     especialistaId: row.especialista_id,
// //     especialidad: row.especialidad,
// //     fecha: new Date(row.fecha_iso),
// //     estado: row.estado,
// //     ubicacion: row.ubicacion ?? null,
// //     notas: row.notas ?? null,
// //     resenaEspecialista: row.resena_especialista ?? null,
// //     encuesta: !!row.encuesta,
// //     calificacion: row.encuesta?.estrellas ?? undefined,
// //   };
// // }

// /** Row (BD) -> ViewModel (para UI)
//  *  Pasá el nombre ya resuelto del especialista (o paciente) por deps.
//  */
// // export function rowToTurnoVM(
// //   row: TurnoRow,
// //   deps: { especialistaNombre: string; pacienteId?: string }
// // ): TurnoVM {
// //   return {
// //     id: row.id,
// //     pacienteId: deps.pacienteId ?? row.paciente_id,
// //     especialistaId: row.especialista_id,
// //     especialidad: row.especialidad,
// //     especialista: deps.especialistaNombre,
// //     estado: row.estado,
// //     // Canónico para UI:
// //     fechaISO: row.fecha_iso,
// //     // Compat con tablas viejas:
// //     fecha: new Date(row.fecha_iso),
// //     hora: hhmm(row.fecha_iso),
// //     // Extras:
// //     ubicacion: row.ubicacion ?? null,
// //     notas: row.notas ?? null,
// //     tieneResena: !!row.resena_especialista,
// //     resenaEspecialista: row.resena_especialista ?? null,
// //     encuesta: !!row.encuesta,
// //     calificacion: row.encuesta?.estrellas ?? undefined,
// //   };
// // }

// export function rowToTurno(r: TurnoRow): Turno {
//   return {
//     id: r.id,
//     pacienteId: r.paciente_id,
//     especialistaId: r.especialista_id,
//     especialidad: r.especialidad,
//     fecha: new Date(r.fecha_iso),
//     estado: r.estado,
//     ubicacion: r.ubicacion ?? null,
//     notas: r.notas ?? null,
//     resenaEspecialista: r.resena_especialista ?? null,
//     encuesta: !!r.encuesta,
//     calificacion: Number(r.encuesta?.estrellas ?? NaN) || undefined,
//   };
// }
