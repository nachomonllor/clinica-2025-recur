// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-turno-detalle',
//   standalone: true,
//   imports: [],
//   templateUrl: './turno-detalle.component.html',
//   styleUrl: './turno-detalle.component.scss'
// })
// export class TurnoDetalleComponent {

// }

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BehaviorSubject, map } from 'rxjs';
import { EstadoTurno, TurnoVM } from '../../../../models/interfaces';

@Component({
  selector: 'app-turno-detalle',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatSnackBarModule, MatDialogModule
  ],
  templateUrl: './turno-detalle.component.html',
  styleUrls: ['./turno-detalle.component.scss']
})
export class TurnoDetalleComponent {
  // Estado de la UI
  loading = true;
  error: string | null = null;

  // El turno actual (BehaviorSubject para template reactivo sin services)
  turno$ = new BehaviorSubject<TurnoVM | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Obtener :id y datos (si se pasaron por history.state)
    const id = this.route.snapshot.paramMap.get('id')!;
    const stateTurno = (this.router.getCurrentNavigation()?.extras.state as any)?.turno as TurnoVM | undefined;

    if (stateTurno && stateTurno.id === id) {
      this.turno$.next(stateTurno);
      this.loading = false;
    } else {
      // Fallback: carga demo (para que compile/veas UI). Reemplazá por tu servicio real.
      // TODO: inyectar TurnosService y traer desde Supabase: getTurnoPacienteById$(id)
      this.cargarDemo(id);
    }
  }

  /** DEMO de carga local (eliminá esto al cablear servicio real) */
  private cargarDemo(id: string) {
    // Simula fetch
    setTimeout(() => {
      const demo: TurnoVM = {
        id,
        especialidad: 'Clínica médica',
        especialista: 'Dra. Ana Gómez',
        fechaISO: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // mañana
        estado: 'confirmado',
        ubicacion: 'Consultorio 3 • Sede Central',
        notas: 'Traer estudios previos.',
        //resenaEspecialista: false,
        encuesta: false
      };
      this.turno$.next(demo);
      this.loading = false;
    }, 300);
  }

  /** ¿Se puede cancelar? (no realizado/rechazado/cancelado y fecha futura) */
  puedeCancelar(t: TurnoVM): boolean {
    if (!t) return false as any;
    if (['realizado', 'rechazado', 'cancelado'].includes(t.estado)) return false;
    const cuando = Date.parse(t.fechaISO);
    if (Number.isNaN(cuando)) return false;
    return cuando > Date.now();
  }

  /** Acción: cancelar (con confirmación). Reemplazá cuerpo por servicio real */
  cancelar(t: TurnoVM) {
    if (!this.puedeCancelar(t)) return;

    // Confirmación mínima (podés reemplazar con MatDialog si querés UI nativa)
    const ok = confirm(`¿Cancelar el turno #${t.id}?`);
    if (!ok) return;

    // TODO: llamar servicio real: turnosService.cancelarTurno(t.id)
    // Simulamos éxito:
    const actualizado = { ...t, estado: 'cancelado' as EstadoTurno };
    this.turno$.next(actualizado);
    this.snack.open(`Turno ${t.id} cancelado`, 'Cerrar', { duration: 2000 });
  }

  verResena(t: TurnoVM) {
    // Ajustá la ruta a tu app (si tenés /paciente/turno/:id/resena o /resenia/:id)
    this.router.navigate(['/paciente/turno', t.id, 'resena']);
  }

  completarEncuesta(t: TurnoVM) {
    // Ajustá a tu ruta real, por ejemplo /paciente/encuesta/:id
    this.router.navigate(['/paciente/encuestas'], { queryParams: { turnoId: t.id } });
  }

  volver() {
    this.router.navigate(['/paciente/turnos']);
  }
}
