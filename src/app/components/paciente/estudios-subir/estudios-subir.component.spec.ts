import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstudiosSubirComponent } from './estudios-subir.component';

describe('EstudiosSubirComponent', () => {
  let component: EstudiosSubirComponent;
  let fixture: ComponentFixture<EstudiosSubirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstudiosSubirComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstudiosSubirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
