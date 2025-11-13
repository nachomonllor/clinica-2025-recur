import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriaClinicaPaginaComponent } from './historia-clinica-pagina.component';

describe('HistoriaClinicaPaginaComponent', () => {
  let component: HistoriaClinicaPaginaComponent;
  let fixture: ComponentFixture<HistoriaClinicaPaginaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriaClinicaPaginaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriaClinicaPaginaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
