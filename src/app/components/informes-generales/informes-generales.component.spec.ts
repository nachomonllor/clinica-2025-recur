import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformesGeneralesComponent } from './informes-generales.component';

describe('InformesGeneralesComponent', () => {
  let component: InformesGeneralesComponent;
  let fixture: ComponentFixture<InformesGeneralesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformesGeneralesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InformesGeneralesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
