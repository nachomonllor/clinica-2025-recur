// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-estudios',
//   standalone: true,
//   imports: [],
//   templateUrl: './estudios.component.html',
//   styleUrl: './estudios.component.scss'
// })
// export class EstudiosComponent {

// }


import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-estudios',
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule],
  templateUrl: './estudios.component.html',
  styleUrls: ['./estudios.component.scss'],
})
export class EstudiosComponent {
  archivos: { id: string; nombre: string; fechaISO: string; url: string }[] = []; // TODO
}
