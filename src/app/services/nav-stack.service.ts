import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NavStackService {
  private history: string[] = [];

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.history.push(e.urlAfterRedirects));
  }

  private navigateTo(commands: any[] | string) {
    if (typeof commands === 'string') {
      this.router.navigateByUrl(commands);
    } else {
      this.router.navigate(commands);
    }
  }

  /** Vuelve al anterior si existe, si no va al fallback */
  goBackOr(fallback: any[] | string) {
    // descartar la URL actual
    this.history.pop();
    const prev = this.history.pop();
    if (prev) {
      this.router.navigateByUrl(prev);
    } else {
      this.navigateTo(fallback);
    }
  }

  /** Busca hacia atrás una URL que empiece con /prefix (p.ej. /especialista) */
  goBackInside(prefix: string, fallback: any[] | string) {
    this.history.pop(); // descartar la actual
    for (let i = this.history.length - 1; i >= 0; i--) {
      const url = this.history[i];
      if (url.startsWith(`/${prefix}`)) {
        this.history = this.history.slice(0, i); // recortamos el stack
        this.router.navigateByUrl(url);
        return;
      }
    }
    this.navigateTo(fallback);
  }
}


