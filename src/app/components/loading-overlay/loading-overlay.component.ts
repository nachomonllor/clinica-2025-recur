import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss']
})
export class LoadingOverlayComponent {
  // Inyectamos el servicio para usarlo en el HTML con el pipe async
  constructor(public loadingService: LoadingService) {}
}

/*
1. El Propósito (UX):

"Este componente LoadingOverlay tiene como objetivo mejorar la experiencia del usuario bloqueando la interacción 
con la interfaz mientras se realizan operaciones asíncronas (como peticiones HTTP), evitando que el usuario 
haga doble clic o modifique datos mientras espera."
2. La Magia del Async Pipe (| async):
"Lo más importante de este HTML es la directiva *ngIf combinada con el pipe async.
En lugar de suscribirme manualmente al Observable isLoading$ en el TypeScript (lo cual requeriría gestionar la desuscripción en el ngOnDestroy para evitar fugas de memoria), delegué esa responsabilidad a la vista.
El pipe | async:
Se suscribe automáticamente al Observable del servicio.
Devuelve el valor actual (true o false).
Marca el componente para detección de cambios.
Se desuscribe automáticamente cuando el componente se destruye."
3. Directiva Estructural (*ngIf):
"Usamos *ngIf en lugar de [hidden]. 
Esto significa que el overlay no existe en el DOM cuando no está cargando, 
lo que mantiene la página ligera. Solo se inserta en el árbol HTML cuando el servicio emite true."

*/





