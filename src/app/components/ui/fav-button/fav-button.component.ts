import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-fav-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './fav-button.component.html',
  styleUrl: './fav-button.component.scss'
})
export class FavButtonComponent {
  @Input() label = '';
  @Input() route = '/';
  @Input() avatar = '';       // path a imagen circular
  @Input() tooltip = '';      // opcional
}
