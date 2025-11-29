// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-captcha-propio',
//   standalone: true,
//   imports: [],
//   templateUrl: './captcha-propio.component.html',
//   styleUrl: './captcha-propio.component.scss'
// })
// export class CaptchaPropioComponent {
// }


import { Component, ElementRef, EventEmitter, Output, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-captcha-propio', // <--- Selector nuevo
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatButtonModule, 
    MatIconModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './captcha-propio.component.html',
  styleUrls: ['./captcha-propio.component.scss']
})
export class CaptchaPropioComponent implements AfterViewInit {

  @Output() captchaValido = new EventEmitter<boolean>();
  @ViewChild('canvasCaptcha') canvasRef!: ElementRef<HTMLCanvasElement>;

  codigoGenerado: string = '';
  inputUsuario: string = '';
  
  private ancho = 200;
  private alto = 60;

  ngAfterViewInit(): void {
    this.generarCaptcha();
  }

  generarCaptcha() {
    this.codigoGenerado = '';
    // Sacamos caracteres confusos (I, l, 1, O, 0)
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    const longitud = 6;

    for (let i = 0; i < longitud; i++) {
      this.codigoGenerado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    this.dibujarEnCanvas();
    this.inputUsuario = '';
    this.captchaValido.emit(false);
  }

  private dibujarEnCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar y fondo
    ctx.clearRect(0, 0, this.ancho, this.alto);
    ctx.fillStyle = '#0f172a'; // Tu fondo oscuro (Slate 900)
    ctx.fillRect(0, 0, this.ancho, this.alto);

    // Configuración de texto
    ctx.font = 'bold 30px Roboto';
    ctx.textBaseline = 'middle';
    
    // Dibujar letras con rotación
    for (let i = 0; i < this.codigoGenerado.length; i++) {
      ctx.save();
      const x = 20 + i * 25; 
      const y = 30 + Math.random() * 10 - 5; 
      const angulo = Math.random() * 0.4 - 0.2; 

      ctx.translate(x, y);
      ctx.rotate(angulo);
      
      ctx.fillStyle = '#e2e8f0'; // Texto claro
      ctx.fillText(this.codigoGenerado[i], 0, 0);
      ctx.restore();
    }

    // Ruido (líneas para "seguridad")
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)'; // Cyan translúcido
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * this.ancho, Math.random() * this.alto);
      ctx.lineTo(Math.random() * this.ancho, Math.random() * this.alto);
      ctx.stroke();
    }
  }

  validar() {
    if (this.inputUsuario.toUpperCase() === this.codigoGenerado) {
      this.captchaValido.emit(true);
    } else {
      this.captchaValido.emit(false);
    }
  }
}