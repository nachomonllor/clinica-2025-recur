import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BackButtonComponent } from "./components/back-button/back-button.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BackButtonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'clinica-online';
}
