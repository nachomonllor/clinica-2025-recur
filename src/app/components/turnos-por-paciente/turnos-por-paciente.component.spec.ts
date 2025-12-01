import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnosPorPacienteComponent } from './turnos-por-paciente.component';

describe('TurnosPorPacienteComponent', () => {
  let component: TurnosPorPacienteComponent;
  let fixture: ComponentFixture<TurnosPorPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnosPorPacienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnosPorPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
