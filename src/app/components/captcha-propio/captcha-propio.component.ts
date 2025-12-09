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

  // Evento de salida para avisarle al padre (Registro) si PASO o no la prueba el USUARIOS 
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

  /**
   * Consulta a Supabase si el sistema requiere Captcha (Configuración Global).
   * Si estA DESHABILITADO: Emite TRUE automAticamente 
   *  Si estA HABILITADO: Llama a generarJuego() para preparar las imAgenes.
   */
  async ngOnInit() {
    //Verificar si está habilitado en BD
    this.habilitado = await this.supa.estaHabilitadoCaptcha();

    if (!this.habilitado) {
      // Si estA deshabilitado ===> emitimos TRUE automAticamente y no mostramos nada
      this.captchaValido.emit(true);
    } else {
      // Si estA habilitado, iniciamos el juego
      this.generarJuego();
    }
  }

  /**
     GENERARJUEGO: Logica de aleatoriedad
     Resetea el estado (pone el captcha como invalido).
     Mezcla el array de todas las opciones usando un sort aleatorio.
     Toma las primeras 4 opciones para mostrar (slice).
     Elige al azar una de esas 4 para que sea el "Objetivo" a encontrar.
   */
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

  /**
   * SELECCIONAR: Validación de la respuesta.
   Recibe la opcion que el usuario clickeo.
   Compara el nombre de la opcion clickeada con el nombre del objetivo.
   Si coincide: Emite TRUE (el botón de registro se habilita).
   Si falla: Emite FALSE (el botón sigue deshabilitado).
   */
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