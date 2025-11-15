import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncuestaAtencionComponent } from './encuesta-atencion.component';

describe('EncuestaAtencionComponent', () => {
  let component: EncuestaAtencionComponent;
  let fixture: ComponentFixture<EncuestaAtencionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncuestaAtencionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncuestaAtencionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
