
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

// Animaciones
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatButtonModule, MatIconModule, 
    MatCardModule, MatTooltipModule,
  ],
  templateUrl: './bienvenida.component.html',
  styleUrls: ['./bienvenida.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('450ms ease-out', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class BienvenidaComponent {}



// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-bienvenida',
//   standalone: true,
//   imports: [],
//   templateUrl: './bienvenida.component.html',
//   styleUrl: './bienvenida.component.scss'
// })
// export class BienvenidaComponent {

// }

// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// // Angular Material
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatCardModule } from '@angular/material/card';

// @Component({
//   selector: 'app-bienvenida',
//   standalone: true,
//   imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatCardModule],
//   templateUrl: './bienvenida.component.html',
//   styleUrls: ['./bienvenida.component.scss']
// })
// export class BienvenidaComponent {}
