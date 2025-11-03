import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarEspecialistasComponent } from './listar-especialistas.component';

describe('ListarEspecialistasComponent', () => {
  let component: ListarEspecialistasComponent;
  let fixture: ComponentFixture<ListarEspecialistasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarEspecialistasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarEspecialistasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
