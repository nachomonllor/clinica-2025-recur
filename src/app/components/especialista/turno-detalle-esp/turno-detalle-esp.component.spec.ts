import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnoDetalleEspComponent } from './turno-detalle-esp.component';

describe('TurnoDetalleEspComponent', () => {
  let component: TurnoDetalleEspComponent;
  let fixture: ComponentFixture<TurnoDetalleEspComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnoDetalleEspComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnoDetalleEspComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
