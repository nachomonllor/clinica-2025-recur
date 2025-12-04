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




