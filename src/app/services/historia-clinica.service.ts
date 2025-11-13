
import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { HistoriaClinica } from '../../models/interfaces';

@Injectable({ providedIn: 'root' })
export class HistoriaClinicaService {

   obtenerPorPacienteId(pacienteId: string): Observable<HistoriaClinica[]> {

    const data: HistoriaClinica[] = [
      {
        idConsulta: '6',
        fecha: '2025-11-10',
        especialidad: 'pediatria',
        medico: 'Augusto Morelli',
        pacienteNombre: 'Maria Susana Gimenez',
        pacienteDni: '10.463.234',
        pacienteFechaNacimiento: '1946-03-15',
        altura: 1.56,
        peso: 57,
        temperatura: 35,
        presion: '120/80 mmHg',
        resumen: 'Consulta de control. Paciente estable.',
        fiebre: false,
        infartos: 0,
        datosDinamicos: [
          { clave: 'alergias', etiqueta: 'Alergias', tipo: 'texto', valor: 'Penicilina' }
        ]
      },
      {
        idConsulta: '5',
        fecha: '2025-09-22',
        especialidad: 'cardiologia',
        medico: 'Marcos Lopez',
        pacienteNombre: 'Maria Susana Gimenez',
        pacienteDni: '10.463.234',
        pacienteFechaNacimiento: '1946-03-15',
        altura: 1.56,
        peso: 58,
        temperatura: 36.6,
        presion: '130/85 mmHg',
        resumen: 'Control de presion y rutinas de caminata.',
        fiebre: false
      }
    ];

    return of(data).pipe(delay(200));
  }
  



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
