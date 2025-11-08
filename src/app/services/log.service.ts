import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Representa un registro de ingreso al sistema.
 */
export interface LogEntry {
  /** Identificador único del log */
  id: string;
  /** Nombre o identificador del usuario que ingresó */
  user: string;
  /** Fecha y hora de ingreso en formato ISO */
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  /** URL base del endpoint de logs */
  private readonly baseUrl = '/api/logs';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los registros de ingreso al sistema.
   * @returns Observable con lista de logs
   */
  getLoginLogs(): Observable<LogEntry[]> {
    return this.http.get<LogEntry[]>(this.baseUrl);
  }

  /**
   * Obtiene registros de ingreso filtrados por rango de fechas.
   * @param from Fecha ISO de inicio
   * @param to Fecha ISO de fin
   */
  getLoginLogsByDateRange(from: string, to: string): Observable<LogEntry[]> {
    const params = { from, to };
    return this.http.get<LogEntry[]>(`${this.baseUrl}/range`, { params });
  }
}


// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class LogService {

//   constructor() { }
// }