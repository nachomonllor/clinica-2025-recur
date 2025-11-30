import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fav-bienvenida',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './fav-bienvenida.component.html',
  styleUrl: './fav-bienvenida.component.scss'
})
export class FavBienvenidaComponent {

}
