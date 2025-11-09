import { Turno, TurnoRow, TurnoVM } from "../interfaces";

const hhmm = (iso: string): string => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

/** Row (BD) -> Dominio (normalizado) */
export function rowToTurno(row: TurnoRow): Turno {
  return {
    id: row.id,
    pacienteId: row.paciente_id,
    especialistaId: row.especialista_id,
    especialidad: row.especialidad,
    fecha: new Date(row.fecha_iso),
    estado: row.estado,
    ubicacion: row.ubicacion ?? null,
    notas: row.notas ?? null,
    resenaEspecialista: row.resena_especialista ?? null,
    encuesta: !!row.encuesta,
    calificacion: row.encuesta?.estrellas ?? undefined,
  };
}

/** Row (BD) -> ViewModel (para UI)
 *  Pasá el nombre ya resuelto del especialista (o paciente) por deps.
 */
export function rowToTurnoVM(
  row: TurnoRow,
  deps: { especialistaNombre: string; pacienteId?: string }
): TurnoVM {
  return {
    id: row.id,
    pacienteId: deps.pacienteId ?? row.paciente_id,
    especialistaId: row.especialista_id,
    especialidad: row.especialidad,
    especialista: deps.especialistaNombre,
    estado: row.estado,
    // Canónico para UI:
    fechaISO: row.fecha_iso,
    // Compat con tablas viejas:
    fecha: new Date(row.fecha_iso),
    hora: hhmm(row.fecha_iso),
    // Extras:
    ubicacion: row.ubicacion ?? null,
    notas: row.notas ?? null,
    tieneResena: !!row.resena_especialista,
    resenaEspecialista: row.resena_especialista ?? null,
    encuesta: !!row.encuesta,
    calificacion: row.encuesta?.estrellas ?? undefined,
  };
}
