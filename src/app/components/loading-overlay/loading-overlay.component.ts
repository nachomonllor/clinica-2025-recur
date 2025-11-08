

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MatProgressBarModule, MatProgressBar } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../services/loading.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
   imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatProgressBar],
  
  templateUrl: './loading-overlay.component.html',
  styleUrl: './loading-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingOverlayComponent {
  constructor(public loader: LoadingService) {}
}

// import { Component } from '@angular/core';
// import { LoadingService } from '../services/loading.service';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// @Component({
//   selector: 'app-loading-overlay',
//   standalone: true,
//   imports: [CommonModule, FormsModule, CommonModule, MatProgressSpinnerModule,
//           CommonModule,   MatProgressSpinnerModule
//   ],
//   templateUrl: './loading-overlay.component.html',
//   styleUrl: './loading-overlay.component.scss'
// })
// export class LoadingOverlayComponent {
  
//   constructor(public loader: LoadingService) {}

// }