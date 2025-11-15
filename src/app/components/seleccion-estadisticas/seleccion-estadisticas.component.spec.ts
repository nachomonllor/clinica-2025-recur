import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionEstadisticasComponent } from './seleccion-estadisticas.component';

describe('SeleccionEstadisticasComponent', () => {
  let component: SeleccionEstadisticasComponent;
  let fixture: ComponentFixture<SeleccionEstadisticasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeleccionEstadisticasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeleccionEstadisticasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
