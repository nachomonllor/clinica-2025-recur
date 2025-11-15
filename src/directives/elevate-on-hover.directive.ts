import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appElevateOnHover]',
  standalone: true
})
export class ElevateOnHoverDirective {

  @Input('appElevateOnHover') shadowClass = 'hover-elevated';

  constructor(private readonly el: ElementRef<HTMLElement>, private readonly renderer: Renderer2) {}

  @HostListener('mouseenter') onEnter(): void {
    if (!this.shadowClass) { return; }
    this.renderer.addClass(this.el.nativeElement, this.shadowClass);
  }

  @HostListener('mouseleave') onLeave(): void {
    if (!this.shadowClass) { return; }
    this.renderer.removeClass(this.el.nativeElement, this.shadowClass);
  }
}
