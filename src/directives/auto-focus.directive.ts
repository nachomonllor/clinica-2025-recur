import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';

/*
Pone el cursor automáticamente dentro del campo de texto apenas carga la página.

Cuando entras a una pantalla de Login, lo normal es que quieras escribir tu email de inmediato. 
Sin esta directiva, el usuario tendría que agarrar el mouse, hacer clic en la caja de "Email" y recién ahí escribir. 
Con esta directiva, el usuario entra y ya puede escribir directamente sin hacer clic.

implements AfterViewInit: 
La directiva espera a que Angular termine de "pintar" todo el HTML (ngAfterViewInit). 
No puedes poner el cursor (focus) en un elemento que todavia no existe en la pantalla.

constructor(private readonly el: ElementRef): Obtiene una referencia directa al elemento HTML donde pusiste la directiva (en tu caso, el <input type="email">).
setTimeout(...): Aunque el tiempo sea 0 (o el que le pases por input), 
el setTimeout es un truco técnico para mover la ejecución al final de la cola de tareas del navegador. 
Esto asegura 100% que el elemento ya es visible y editable antes de intentar enfocarlo.

this.el.nativeElement.focus(...) ==> Llama a la función nativa de JavaScript .focus(), que es lo que hace que la cajita se active y el cursor empiece a parpadear.

El ="0" es el tiempo en milisegundos que espera la directiva antes de poner el cursor.

===> LA USO EN EL LOGIN PARA QUE EL CURSOR SE POSICIONE EN LA CAJA DE MAIL
*/

@Directive({
  selector: '[appAutoFocus]',
  standalone: true
})
export class AutoFocusDirective implements AfterViewInit {

  @Input('appAutoFocus') delay = 0;

  constructor(private readonly el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      try {
        this.el.nativeElement.focus({ preventScroll: false });
      } catch {
        // Ignorar errores si el elemento no admite focus
      }
    }, this.delay);
  }
}
