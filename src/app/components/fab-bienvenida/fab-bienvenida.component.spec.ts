import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabBienvenidaComponent } from './fab-bienvenida.component';

describe('FabBienvenidaComponent', () => {
  let component: FabBienvenidaComponent;
  let fixture: ComponentFixture<FabBienvenidaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FabBienvenidaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FabBienvenidaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
