import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReseniaEspecialistaComponent } from './resenia-especialista.component';

describe('ReseniaEspecialistaComponent', () => {
  let component: ReseniaEspecialistaComponent;
  let fixture: ComponentFixture<ReseniaEspecialistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReseniaEspecialistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReseniaEspecialistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
