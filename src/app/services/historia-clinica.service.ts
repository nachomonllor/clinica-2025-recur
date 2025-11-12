
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HistoriaClinica } from '../../models/interfaces';

@Injectable({ providedIn: 'root' })
export class HistoriaClinicaService {
  private historia: HistoriaClinica = {
      altura: 1.78,
      peso: 60,
      presion: '120/80',
      temperatura: 37,
      fiebre: true,
      infartos: 10,
      resumen: ''
  };

  getHistoriaClinica(): Observable<HistoriaClinica> {
    return of(this.historia);
  }

  guardarHistoriaClinica(data: HistoriaClinica): Observable<HistoriaClinica> {
    console.log('Guardando historia clínica...', data);
    this.historia = data;
    return of(data);
  }
}
