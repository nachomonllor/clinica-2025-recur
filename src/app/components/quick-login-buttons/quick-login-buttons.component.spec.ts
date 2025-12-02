import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickLoginButtonsComponent } from './quick-login-buttons.component';

describe('QuickLoginButtonsComponent', () => {
  let component: QuickLoginButtonsComponent;
  let fixture: ComponentFixture<QuickLoginButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickLoginButtonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickLoginButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
