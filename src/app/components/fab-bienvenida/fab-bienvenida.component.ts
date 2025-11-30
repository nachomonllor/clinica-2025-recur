import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fab-bienvenida',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './fab-bienvenida.component.html',
  styleUrl: './fab-bienvenida.component.scss'
})
export class FabBienvenidaComponent {

}
