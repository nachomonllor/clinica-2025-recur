import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';


/*

DIRECTIVA PARA EL DESTELLO AL POSICIONARME SOBRE CARDS QUE LA USO EN MIS TURNOS PACIENTE Y MIS TURNOS ESPECIALISTA 
LO USO EN <article > DONDE HACE NGFOR CON appElevateOnHover
*/


@Directive({
  selector: '[appElevateOnHover]',
  standalone: true
})
export class ElevateOnHoverDirective {

  @Input('appElevateOnHover') shadowClass = 'hover-elevated';

  // NUEVA CLASE: Para el destello rápido al entrar. Renombramos 'click-flash' a 'enter-flash'
  private flashClass = 'enter-flash';
  private flashTimeout: any;

  constructor(private readonly el: ElementRef<HTMLElement>, private readonly renderer: Renderer2) {}

  @HostListener('mouseenter') onEnter(): void {
    // 1. Aplicar el estado hover persistente (si existe)
    if (this.shadowClass) {
      this.renderer.addClass(this.el.nativeElement, this.shadowClass);
    }

    // 2. Aplicar el destello inicial
    // Limpiamos timeout previo por si entra/sale muy rápido
    clearTimeout(this.flashTimeout);
    this.renderer.addClass(this.el.nativeElement, this.flashClass);

    // 3. Programar que se quite el destello a los 300ms
    // Esto hace que sea solo un "flash" de entrada y luego quede el hover normal
    this.flashTimeout = setTimeout(() => {
      if (this.el && this.el.nativeElement) {
         this.renderer.removeClass(this.el.nativeElement, this.flashClass);
      }
    }, 500); // Duración del destello
  }

  @HostListener('mouseleave') onLeave(): void {
    // 1. Quitar el estado hover persistente
    if (this.shadowClass) {
      this.renderer.removeClass(this.el.nativeElement, this.shadowClass);
    }
    // 2. Asegurar que el flash se vaya inmediatamente si saca el mouse rápido
    clearTimeout(this.flashTimeout);
    this.renderer.removeClass(this.el.nativeElement, this.flashClass);
  }

}