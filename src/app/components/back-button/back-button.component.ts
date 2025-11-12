// shared/back/back-button.component.ts
import { Component, Input, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-back',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <button type="button" (click)="back()">← {{ label }}</button>
  `
})
export class BackButtonComponent {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  @Input() label = 'Volver';

  private featureHome(): string[] {
    const tree = this.router.parseUrl(this.router.url);
    const segs = tree.root.children['primary']?.segments ?? [];
    const first = segs[0]?.path ?? '';
    const HOME: Record<string, string[]> = {
      paciente: ['/paciente'],
      especialista: ['/especialista'],
      admin: ['/admin'],
      bienvenida: ['/bienvenida'],
      login: ['/bienvenida'],
      auth: ['/bienvenida'],
      '': ['/bienvenida'],
    };
    return HOME[first] ?? ['/bienvenida'];
  }

  back() {
    // 1) state.backTo
    const state = (window.history?.state ?? {}) as { backTo?: string | string[] };
    if (state.backTo) {
      this.router.navigate(Array.isArray(state.backTo) ? state.backTo : [state.backTo]);
      return;
    }
    // 2) data.backTo
    let r = this.route;
    while (r.firstChild) r = r.firstChild;
    const dataBack = r.snapshot.data?.['backTo'] as string | string[] | undefined;
    if (dataBack) {
      this.router.navigate(Array.isArray(dataBack) ? dataBack : [dataBack]);
      return;
    }
    // 3) home del feature
    this.router.navigate(this.featureHome()).catch(() => {
      // 4) último recurso: historial
      if (window.history.length > 1) window.history.back();
    });
  }
}






// import { Component, inject, Input } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// import { Location as NgLocation } from '@angular/common';


// @Component({
//   selector: 'app-back-button',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './back-button.component.html',
//   styleUrl: './back-button.component.scss'
// })

// export class BackButtonComponent {
//   private router = inject(Router);
//   private route  = inject(ActivatedRoute);
//   private location = inject(Location);

//   private ngLocation = inject(NgLocation);


//   /** Texto del botón */
//   @Input() label = 'Volver';
//   /** Si es true, no se muestra el botón estando ya en el home del feature */
//   @Input() hideOnHome = true;

//   private featureHome(): string[] {
//     // Detectar el primer segmento de la URL actual
//     const tree = this.router.parseUrl(this.router.url);
//     const segments = tree.root.children['primary']?.segments ?? [];
//     const first = segments[0]?.path ?? '';

//     // Mapa de "home" por feature
//     const HOME: Record<string, string[]> = {
//       paciente: ['/paciente'],
//       especialista: ['/especialista'],
//       admin: ['/admin'],
//       bienvenida: ['/bienvenida'],
//       login: ['/bienvenida'],
//       auth: ['/bienvenida'],
//       '': ['/bienvenida'],
//     };
//     return HOME[first] ?? ['/bienvenida'];
//   }

//   isAtFeatureHome(): boolean {
//     const homeUrl = '/' + this.featureHome().join('/');
//     // normalizamos quitando barra final
//     const norm = (s: string) => s.replace(/\/+$/, '');
//     return norm(this.router.url) === norm(homeUrl);
//   }

//   back() {
//     // 1) Preferir estado de navegación
//     const state = (window.history?.state ?? {}) as { backTo?: string | string[] };
//     if (state.backTo) {
//       this.router.navigate(Array.isArray(state.backTo) ? state.backTo : [state.backTo]);
//       return;
//     }

//     // 2) Luego data.backTo de la ruta activa más profunda
//     let r = this.route;
//     while (r.firstChild) r = r.firstChild;
//     const dataBackTo = r.snapshot.data?.['backTo'] as string | string[] | undefined;
//     if (dataBackTo) {
//       this.router.navigate(Array.isArray(dataBackTo) ? dataBackTo : [dataBackTo]);
//       return;
//     }

//     // 3) Fallback: home del feature actual
//     if (!this.isAtFeatureHome()) {
//       this.router.navigate(this.featureHome());
//       return;
//     }

//     // 4) Último recurso: historial
//     this.ngLocation.back();

//   }

  
//   // back() {
//   //   this.ngLocation.back();
//   // }

// }
