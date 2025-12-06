import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriaClinicaDialogComponent } from './historia-clinica-dialog.component';

describe('HistoriaClinicaDialogComponent', () => {
  let component: HistoriaClinicaDialogComponent;
  let fixture: ComponentFixture<HistoriaClinicaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriaClinicaDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriaClinicaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
