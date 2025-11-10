
// ------------------------------------


import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginLog, Turno } from '../../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ReportesSupabaseService 
{
  private sb: SupabaseClient;

  constructor() {
    this.sb = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  turnos$(desde: Date, hasta: Date) {
    // Filtramos por el campo "creado_el" (puede ser "fecha" si preferís)
    const d1 = desde.toISOString();
    const d2 = hasta.toISOString();

    const q = this.sb
      .from('turnos')
      .select('id, fecha, especialidad, especialista_id, especialista_nombre, paciente_id, estado, creado_el, finalizado_el')
      .gte('creado_el', d1)
      .lte('creado_el', d2);

    return from(q).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const rows = (data ?? []) as TurnoRow[];
        return rows.map(r => ({
          id: r.id,
          fecha: new Date(r.fecha),
          especialidad: r.especialidad,
          especialistaId: r.especialista_id,
          especialistaNombre: r.especialista_nombre,
          pacienteId: r.paciente_id,
          estado: r.estado as Turno['estado'],
          creadoEl: new Date(r.creado_el),
          finalizadoEl: r.finalizado_el ? new Date(r.finalizado_el) : null,
        } satisfies Turno));
      })
    );
  }

  loginLogs$(desde: Date, hasta: Date) {
    const d1 = desde.toISOString();
    const d2 = hasta.toISOString();

    const q = this.sb
      .from('ingresos') // nombre sugerido de tabla
      .select('user_id, email, rol, timestamp')
      .gte('timestamp', d1)
      .lte('timestamp', d2);

    return from(q).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const rows = (data ?? []) as IngresoRow[];
        return rows.map(r => ({
          userId: r.user_id,
          email: r.email,
          rol: r.rol,
          timestamp: new Date(r.timestamp),
        } satisfies LoginLog));
      })
    );

  }


  // // Agregá aquí tus métodos:
  // async fetchTurnos(desde: Date, hasta: Date): Promise<any[]> { /* ... */ }
  // async fetchIngresos(desde: Date, hasta: Date): Promise<any[]> { /* ... */ }


}




// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class ReporteSupabaseService {

//   constructor() { }
// }
