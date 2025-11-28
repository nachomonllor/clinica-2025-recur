import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisHorariosEspecialistaComponent } from './mis-horarios-especialista.component';

describe('MisHorariosEspecialistaComponent', () => {
  let component: MisHorariosEspecialistaComponent;
  let fixture: ComponentFixture<MisHorariosEspecialistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisHorariosEspecialistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisHorariosEspecialistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
