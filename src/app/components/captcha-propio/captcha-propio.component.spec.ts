import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptchaPropioComponent } from './captcha-propio.component';

describe('CaptchaPropioComponent', () => {
  let component: CaptchaPropioComponent;
  let fixture: ComponentFixture<CaptchaPropioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaptchaPropioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaptchaPropioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
