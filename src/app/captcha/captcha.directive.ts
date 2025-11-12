// shared/captcha/captcha.directive.ts
import {
  Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output,
  Renderer2, forwardRef
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors
} from '@angular/forms';

@Directive({
  selector: '[appCaptcha]',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CaptchaDirective), multi: true },
    { provide: NG_VALIDATORS,  useExisting: forwardRef(() => CaptchaDirective), multi: true }
  ]
})
export class CaptchaDirective implements ControlValueAccessor, OnInit, OnDestroy {
  @Input('appCaptchaEnabled') enabled = true;                 // habilita/deshabilita
  @Input() size: 'compact' | 'normal' = 'normal';             // opcional
  @Output('appCaptchaSolved') solved = new EventEmitter<boolean>();

  private onChange: (val: boolean) => void = () => {};
  private onTouched: () => void = () => {};
  private subs: Array<() => void> = [];

  private questionEl!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private refreshBtn!: HTMLButtonElement;

  private answer = '';
  private value = false;
  private disabled = false;

  constructor(private host: ElementRef<HTMLElement>, private rnd: Renderer2) {}

  ngOnInit(): void { this.buildUI(); this.rebuild(); }
  ngOnDestroy(): void { this.subs.forEach(u => u()); }

  // CVA
  writeValue(val: boolean): void {
    this.value = !!val;
    if (this.inputEl) this.inputEl.value = '';
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.inputEl) this.inputEl.disabled = isDisabled || !this.enabled;
    if (this.refreshBtn) this.refreshBtn.disabled = isDisabled;
  }

  // Validator
  validate(_: AbstractControl): ValidationErrors | null {
    if (!this.enabled) return null;
    return this.value ? null : { captcha: true };
  }

  // UI + lógica
  private buildUI() {
    const wrapper = this.rnd.createElement('div');
    this.rnd.setStyle(wrapper, 'display', 'grid');
    this.rnd.setStyle(wrapper, 'gridTemplateColumns', this.size === 'compact' ? '1fr auto' : 'auto 1fr auto');
    this.rnd.setStyle(wrapper, 'gap', '0.5rem'); this.rnd.setStyle(wrapper, 'alignItems', 'center');

    this.questionEl = this.rnd.createElement('span');
    this.rnd.setAttribute(this.questionEl, 'aria-live', 'polite');
    this.rnd.appendChild(wrapper, this.questionEl);

    this.inputEl = this.rnd.createElement('input');
    this.rnd.setAttribute(this.inputEl, 'type', 'text');
    this.rnd.setAttribute(this.inputEl, 'inputmode', 'numeric');
    this.rnd.setAttribute(this.inputEl, 'aria-label', 'Respuesta del captcha');
    this.rnd.setStyle(this.inputEl, 'padding', '0.35rem 0.5rem');
    this.rnd.setStyle(this.inputEl, 'border', '1px solid #ccc');
    this.rnd.setStyle(this.inputEl, 'borderRadius', '4px');
    this.rnd.appendChild(wrapper, this.inputEl);

    this.refreshBtn = this.rnd.createElement('button');
    this.rnd.setAttribute(this.refreshBtn, 'type', 'button');
    this.rnd.setStyle(this.refreshBtn, 'padding', '0.35rem 0.5rem');
    this.rnd.appendChild(this.refreshBtn, this.rnd.createText('↻'));

    this.rnd.appendChild(wrapper, this.refreshBtn);
    this.rnd.appendChild(this.host.nativeElement, wrapper);

    // eventos
    this.subs.push(
      this.rnd.listen(this.inputEl, 'input', () => this.check()),
      this.rnd.listen(this.inputEl, 'blur', () => this.onTouched()),
      this.rnd.listen(this.refreshBtn, 'click', () => this.rebuild())
    );
  }

  private rebuild() {
    // desafío simple: suma o resta (con valores que no den negativos)
    const a = this.rand(11, 19);
    const b = this.rand(2, 9);
    const op = Math.random() < 0.5 ? '+' : '-';
    const ans = op === '+' ? a + b : a - b;

    this.answer = String(ans);
    this.rnd.setProperty(this.questionEl, 'innerText', `${a} ${op} ${b} = ?`);
    this.inputEl.value = '';
    this.value = false;
    this.propagate();
  }

  private check() {
    const ok = (this.inputEl.value || '').trim() === this.answer;
    this.value = ok;
    this.propagate();
  }

  private propagate() {
    this.onChange(this.value);
    this.solved.emit(this.value);
  }

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}


