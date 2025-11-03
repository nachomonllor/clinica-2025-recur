import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarUsuarioLoginComponent } from './seleccionar-usuario-login.component';

describe('SeleccionarUsuarioLoginComponent', () => {
  let component: SeleccionarUsuarioLoginComponent;
  let fixture: ComponentFixture<SeleccionarUsuarioLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionarUsuarioLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeleccionarUsuarioLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
