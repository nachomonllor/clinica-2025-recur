// import { Component, ChangeDetectionStrategy } from '@angular/core';
// import { NgIf } from '@angular/common';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// @Component({
//   selector: 'app-loading-overlay',
//   standalone: true,
//   imports: [NgIf, MatProgressBarModule, MatProgressSpinnerModule],
//   template: `
//     <ng-container *ngIf="loader.isLoading$">
//       <div class="overlay" role="alert" aria-live="polite" aria-busy="true">
//         <mat-progress-bar mode="indeterminate"></mat-progress-bar>
//         <div class="center">
//           <mat-progress-spinner mode="indeterminate" diameter="56"></mat-progress-spinner>
//           <span class="label">Cargando…</span>
//         </div>
//       </div>
//     </ng-container>
//     `,
//   styles: [`
//     .overlay {
//       position: fixed; inset: 0; z-index: 9999;
//       background: rgba(8, 16, 24, .35);
//       backdrop-filter: blur(2px);
//       display: grid; align-content: start;
//     }
//     .center {
//       place-self: center; display: grid; justify-items: center; gap: 12px;
//       padding: 16px 20px; border-radius: 10px;
//       background: rgba(15, 34, 53, .9); color: #eaf2fb;
//       box-shadow: 0 6px 18px rgba(0,0,0,.35);
//     }
//     .label { font-weight: 500; letter-spacing: .2px; }
//     `],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class LoadingOverlayComponent {
//   constructor(public loader: LoadingService) {}
// }

