import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarUsuarioRegistroComponent } from './seleccionar-usuario-registro.component';

describe('SeleccionarUsuarioRegistroComponent', () => {
  let component: SeleccionarUsuarioRegistroComponent;
  let fixture: ComponentFixture<SeleccionarUsuarioRegistroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionarUsuarioRegistroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeleccionarUsuarioRegistroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
