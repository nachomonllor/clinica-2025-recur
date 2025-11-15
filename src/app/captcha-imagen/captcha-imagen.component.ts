

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';

interface CaptchaConfig {
  imagenUrl: string;
  instruccion: string;     // Ej: "motorcycles"
  celdasCorrectas: number[]; // índices 0..8 de la grilla 3x3
}

@Component({
  selector: 'app-captcha-imagen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './captcha-imagen.component.html',
  styleUrls: ['./captcha-imagen.component.scss'],
})
export class CaptchaImagenComponent implements OnInit {
  @Output() captchaValido = new EventEmitter<boolean>();

  gridSize = 3;
  celdas = Array.from({ length: 9 }, (_, i) => i);

  private captchas: CaptchaConfig[] = [
    {
      imagenUrl: 'assets/captcha/motos-1.jpg',
      instruccion: 'motorcycles',
      // ejemplo: suponemos que las motos ocupan estas celdas
      celdasCorrectas: [3, 4, 6, 7],
    },
    // Podés agregar más imágenes si querés
    // {
    //   imagenUrl: 'assets/captcha/semáforos-1.jpg',
    //   instruccion: 'traffic lights',
    //   celdasCorrectas: [1, 4],
    // },
  ];

  captchaActual!: CaptchaConfig;
  seleccionadas = new Set<number>();
  verificado = false;
  esCorrecto: boolean | null = null;

  ngOnInit(): void {
    this.resetearCaptcha();
  }

  toggleCelda(indice: number): void {
    if (this.verificado) return;

    if (this.seleccionadas.has(indice)) {
      this.seleccionadas.delete(indice);
    } else {
      this.seleccionadas.add(indice);
    }
  }

  verificar(): void {
    this.verificado = true;

    const seleccion = Array.from(this.seleccionadas).sort();
    const correctas = [...this.captchaActual.celdasCorrectas].sort();

    const ok =
      seleccion.length === correctas.length &&
      seleccion.every((val, i) => val === correctas[i]);

    this.esCorrecto = ok;
    this.captchaValido.emit(ok);
  }

  recargar(): void {
    this.resetearCaptcha();
  }

  private resetearCaptcha(): void {
    this.verificado = false;
    this.esCorrecto = null;
    this.seleccionadas.clear();
    this.captchaActual =
      this.captchas[Math.floor(Math.random() * this.captchas.length)];
    this.captchaValido.emit(false);
  }

  getBackgroundPosition(indice: number): string {
    const fila = Math.floor(indice / this.gridSize);
    const col = indice % this.gridSize;

    const x = (col / (this.gridSize - 1)) * 100;
    const y = (fila / (this.gridSize - 1)) * 100;

    return `${x}% ${y}%`;
  }
}
