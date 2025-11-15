import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';

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
