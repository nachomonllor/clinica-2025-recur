import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { slideInAnimation, fadeInAnimation } from './animations';
import { filter } from 'rxjs/operators';
import { MainNavComponent } from './components/main-nav/main-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainNavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [slideInAnimation, fadeInAnimation]
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
