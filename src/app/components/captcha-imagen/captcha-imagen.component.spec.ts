import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptchaImagenComponent } from './captcha-imagen.component';

describe('CaptchaImagenComponent', () => {
  let component: CaptchaImagenComponent;
  let fixture: ComponentFixture<CaptchaImagenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaptchaImagenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaptchaImagenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
