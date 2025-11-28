import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';


// Definimos una interfaz para organizar los datos de cada día
interface DiaDisponibilidad {
  nombre: string;
  activo: boolean; // Si el médico trabaja ese día o no
  inicio: number;  // Hora de inicio (ej: 9 para las 09:00)
  fin: number;     // Hora de fin (ej: 17 para las 17:00)
  minHora: number; // Límite inferior según la clínica (8:00) 
  maxHora: number; // Límite superior según la clínica (19:00 o 14:00) 
}

@Component({
  selector: 'app-mis-horarios-especialista',
  standalone: true,
  imports: [CommonModule,
    MatSliderModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule],
  templateUrl: './mis-horarios-especialista.component.html',
  styleUrl: './mis-horarios-especialista.component.scss'
})
export class MisHorariosEspecialistaComponent {
// Inicializamos la estructura para la semana
  semanaDisponibilidad: DiaDisponibilidad[] = [
    { nombre: 'Lunes',    activo: false, inicio: 9, fin: 17, minHora: 8, maxHora: 19 },
    { nombre: 'Martes',   activo: false, inicio: 9, fin: 17, minHora: 8, maxHora: 19 },
    { nombre: 'Miércoles',activo: false, inicio: 9, fin: 17, minHora: 8, maxHora: 19 },
    { nombre: 'Jueves',   activo: false, inicio: 9, fin: 17, minHora: 8, maxHora: 19 },
    { nombre: 'Viernes',  activo: false, inicio: 9, fin: 17, minHora: 8, maxHora: 19 },
    // El sábado tiene un horario diferente según la consigna 
    { nombre: 'Sábado',   activo: false, inicio: 9, fin: 13, minHora: 8, maxHora: 14 },
  ];

  constructor() { }

  // Función auxiliar para mostrar la hora bonita en el slider (ej: convierte 9 en "09:00")
  formatLabel(value: number): string {
    return value + ':00';
  }

  guardarHorarios() {
    // Aquí procesas la variable `this.semanaDisponibilidad`
    // Filtra solo los días 'activos' y toma sus valores de 'inicio' y 'fin'
    const horariosFinales = this.semanaDisponibilidad
      .filter(dia => dia.activo)
      .map(dia => {
        return {
          dia: dia.nombre,
          rango: `${this.formatLabel(dia.inicio)} - ${this.formatLabel(dia.fin)}`,
          // Opcional: guardar los números puros para la BD
          inicioNum: dia.inicio,
          finNum: dia.fin
        };
      });

    console.log('Guardando en BD:', horariosFinales);
    // Llamar a tu servicio de Firebase aquí
  }

}
