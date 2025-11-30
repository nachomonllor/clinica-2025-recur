import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavBienvenidaComponent } from './fav-bienvenida.component';

describe('FavBienvenidaComponent', () => {
  let component: FavBienvenidaComponent;
  let fixture: ComponentFixture<FavBienvenidaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavBienvenidaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FavBienvenidaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
