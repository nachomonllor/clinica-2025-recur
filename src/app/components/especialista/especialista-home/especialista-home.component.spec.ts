import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EspecialistaHomeComponent } from './especialista-home.component';

describe('EspecialistaHomeComponent', () => {
  let component: EspecialistaHomeComponent;
  let fixture: ComponentFixture<EspecialistaHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspecialistaHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EspecialistaHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
