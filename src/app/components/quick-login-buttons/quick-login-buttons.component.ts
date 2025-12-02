import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface QuickLoginUser {
  email: string;
  password: string;
  nombre: string;
  avatar: string;
}

export interface QuickLoginsData {
  paciente: QuickLoginUser[];
  especialista: QuickLoginUser[];
  admin: QuickLoginUser[];
}

export type QuickLoginRoleKey = keyof QuickLoginsData;
@Component({
  selector: 'app-quick-login-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quick-login-buttons.component.html',
  styleUrls: ['./quick-login-buttons.component.scss']
})
export class QuickLoginButtonsComponent {

  @Input() quickLogins: QuickLoginsData = {
    paciente: [],
    especialista: [],
    admin: []
  };

  @Output() loginAttempt = new EventEmitter<QuickLoginUser>();

  // Definimos roles y sus etiquetas para iterar
  public roles: { key: QuickLoginRoleKey, label: string }[] = [
    { key: 'admin', label: 'Admin' },          // Admin primero o ultimo segun preferencia
    { key: 'especialista', label: 'Especialista' },
    { key: 'paciente', label: 'Paciente' }
  ];

  onFabClick(user: QuickLoginUser, event: Event) {
    event.preventDefault(); // Evita recargas raras
    event.stopPropagation();
    this.loginAttempt.emit(user);
  }
}