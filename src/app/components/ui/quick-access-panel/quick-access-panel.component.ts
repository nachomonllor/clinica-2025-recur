import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FavButtonComponent } from '../fav-button/fav-button.component';
import { QuickItem } from '../../../../models/interfaces';

@Component({
  selector: 'app-quick-access-panel',
  standalone: true,
  imports: [CommonModule, FavButtonComponent],
  templateUrl: './quick-access-panel.component.html',
  styleUrl: './quick-access-panel.component.scss'
})
export class QuickAccessPanelComponent {
  @Input({ required: true }) items: QuickItem[] = [];

}
