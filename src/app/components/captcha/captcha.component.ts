import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-captcha',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  template: `
    <div class="captcha-container">
      <div class="captcha-display">
        <span class="captcha-text">{{ captchaText }}</span>
        <button type="button" mat-icon-button (click)="generarCaptcha()" title="Regenerar captcha">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>
      <mat-form-field appearance="outline" class="captcha-input">
        <mat-label>Ingrese el código de seguridad</mat-label>
        <input 
          matInput 
          [(ngModel)]="respuestaUsuario" 
          (input)="validarCaptcha()"
          placeholder="Código de seguridad"
          maxlength="6"
          autocomplete="off"
        />
        <mat-error *ngIf="mostrarError">Código incorrecto</mat-error>
      </mat-form-field>
    </div>
  `,
  styles: [`
    .captcha-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 16px 0;
    }

    .captcha-display {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
      border: 2px solid #ddd;
    }

    .captcha-text {
      font-family: 'Courier New', monospace;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 4px;
      color: #333;
      user-select: none;
      flex: 1;
      text-align: center;
      padding: 8px;
      background: white;
      border-radius: 4px;
    }

    .captcha-input {
      width: 100%;
    }

    mat-icon {
      color: #666;
    }
  `]
})
export class CaptchaComponent implements OnInit {
  @Input() enabled: boolean = true;
  @Output() captchaValid = new EventEmitter<boolean>();

  captchaText: string = '';
  respuestaUsuario: string = '';
  mostrarError: boolean = false;
  esValido: boolean = false;

  ngOnInit(): void {
    if (this.enabled) {
      this.generarCaptcha();
    }
  }

  generarCaptcha(): void {
    // Genera un código alfanumérico de 5 caracteres
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres confusos (0, O, I, 1)
    let codigo = '';
    for (let i = 0; i < 5; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    this.captchaText = codigo;
    this.respuestaUsuario = '';
    this.mostrarError = false;
    this.esValido = false;
    this.captchaValid.emit(false);
  }

  validarCaptcha(): void {
    if (!this.enabled) {
      this.esValido = true;
      this.captchaValid.emit(true);
      return;
    }

    const respuesta = this.respuestaUsuario.trim().toUpperCase();
    const codigoEsperado = this.captchaText.toUpperCase();

    if (respuesta.length === 0) {
      this.mostrarError = false;
      this.esValido = false;
      this.captchaValid.emit(false);
      return;
    }

    if (respuesta === codigoEsperado) {
      this.mostrarError = false;
      this.esValido = true;
      this.captchaValid.emit(true);
    } else if (respuesta.length === codigoEsperado.length) {
      this.mostrarError = true;
      this.esValido = false;
      this.captchaValid.emit(false);
    } else {
      this.mostrarError = false;
      this.esValido = false;
      this.captchaValid.emit(false);
    }
  }

  reset(): void {
    this.generarCaptcha();
  }

  get isValid(): boolean {
    return !this.enabled || this.esValido;
  }
}

