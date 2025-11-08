import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickAccessPanelComponent } from './quick-access-panel.component';

describe('QuickAccessPanelComponent', () => {
  let component: QuickAccessPanelComponent;
  let fixture: ComponentFixture<QuickAccessPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickAccessPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickAccessPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
