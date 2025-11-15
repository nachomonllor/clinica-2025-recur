import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogIngresosAdminComponent } from './log-ingresos-admin.component';

describe('LogIngresosAdminComponent', () => {
  let component: LogIngresosAdminComponent;
  let fixture: ComponentFixture<LogIngresosAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogIngresosAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogIngresosAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
