import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SupabaseService } from '../../../services/supabase.service';

interface OpcionCaptcha {
  nombre: string;
  imagen: string; // Nombre del icono o ruta de imagen
}

@Component({
  selector: 'app-captcha-propio',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './captcha-propio.component.html',
  styleUrls: ['./captcha-propio.component.scss']
})
export class CaptchaPropioComponent implements OnInit {

  @Output() captchaValido = new EventEmitter<boolean>();

  habilitado: boolean = true;
  
  // Banco de imágenes (usamos iconos de Material como imágenes)
  // Si quieres usar fotos reales: cambia el string por 'assets/img/gato.png'
  todasLasOpciones: OpcionCaptcha[] = [
    { nombre: 'Gato', imagen: 'assets/captcha/gato.jpg' },
    { nombre: 'Auto', imagen: 'assets/captcha/auto.jpg' },
    { nombre: 'Avión', imagen: 'assets/captcha/avion.jpg' },
    { nombre: 'Casa', imagen: 'assets/captcha/casa.jpg' },
    { nombre: 'Árbol', imagen: 'assets/captcha/arbol.jpg' },
    { nombre: 'Bicicleta', imagen: 'assets/captcha/bicicleta.jpg' }
  ];

  opcionesVisibles: OpcionCaptcha[] = [];
  objetivo: OpcionCaptcha | null = null;
  seleccionado: OpcionCaptcha | null = null;
  esCorrecto: boolean = false;

  constructor(private supa: SupabaseService) {}

  async ngOnInit() {
    // 1. Verificar si está habilitado en BD
    this.habilitado = await this.supa.estaHabilitadoCaptcha();

    if (!this.habilitado) {
      // Si está deshabilitado, emitimos TRUE automáticamente y no mostramos nada
      this.captchaValido.emit(true);
    } else {
      // Si está habilitado, iniciamos el juego
      this.generarJuego();
    }
  }

  generarJuego() {
    this.esCorrecto = false;
    this.seleccionado = null;
    this.captchaValido.emit(false);

    // Mezclar y tomar 4 opciones
    const mezclados = [...this.todasLasOpciones].sort(() => 0.5 - Math.random());
    this.opcionesVisibles = mezclados.slice(0, 4); // Tomamos 4

    // Elegir una como objetivo
    const indiceRandom = Math.floor(Math.random() * 4);
    this.objetivo = this.opcionesVisibles[indiceRandom];
  }

  seleccionar(opcion: OpcionCaptcha) {
    if (!this.objetivo) return;
    this.seleccionado = opcion;

    if (opcion.nombre === this.objetivo.nombre) {
      this.esCorrecto = true;
      this.captchaValido.emit(true);
    } else {
      this.esCorrecto = false;
      this.captchaValido.emit(false);
      // Opcional: Reiniciar si se equivoca para hacerlo más difícil
      // setTimeout(() => this.generarJuego(), 500); 
    }
  }
}