import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnoDetalleComponent } from './turno-detalle.component';

describe('TurnoDetalleComponent', () => {
  let component: TurnoDetalleComponent;
  let fixture: ComponentFixture<TurnoDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnoDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnoDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
