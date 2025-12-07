import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { slideInAnimation, fadeInAnimation } from './animations';
import { filter } from 'rxjs/operators';
import { fadeAnimation } from './route-animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [slideInAnimation, fadeInAnimation, fadeAnimation]
})  
export class AppComponent {
  title = 'clinica-online';

  constructor(private router: Router) {
    // Aplicar animación fadeIn al cambiar de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // La animación se aplica automáticamente a través del router-outlet
    });
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }


}
