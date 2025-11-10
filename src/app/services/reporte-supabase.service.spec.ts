import { TestBed } from '@angular/core/testing';

import { ReporteSupabaseService } from './reporte-supabase.service';

describe('ReporteSupabaseService', () => {
  let service: ReporteSupabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReporteSupabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
