import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'; // <--- Importar Input/Output
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
// ... (Tus imports de Material siguen igual) ...
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar'; // <--- Para avisar al usuario

// Importa tu servicio y modelo
import { SupabaseService } from '../../../services/supabase.service'; 
import { TurnoUI } from '../../models/turno.model';

// SweetAlert2
import Swal from 'sweetalert2';

@Component({
  selector: 'app-encuesta-atencion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './encuesta-atencion.component.html',
  styleUrls: ['./encuesta-atencion.component.scss']
})
export class EncuestaAtencionComponent implements OnInit {
  

  @Input() turno!: TurnoUI; // <=== PARA SABER QUE TURNO ES
  @Output() encuestaCompletada = new EventEmitter<void>(); // Avisar al padre para cerrar

  encuestaForm!: FormGroup;
  starIcons = [1, 2, 3, 4, 5];
  enviando = false;

  constructor(
    private fb: FormBuilder,
    private supa: SupabaseService, // ==> INYECTAR SERVICIO DE SUPABASE
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.encuestaForm = this.fb.group({
      comentario: ['', [Validators.required, Validators.minLength(6)]],
      calificacion: [0, [Validators.required, Validators.min(1)]],
      opcion: ['', Validators.required], // Radio (Si- No)
      aspectos: this.fb.group({          // Checkboxes
        puntualidad: [false],
        amabilidad: [false],
        limpieza: [false],
        explicacion: [false]
      }),
      rango: [5, Validators.required]    // Slider
    });
  }

  setRating(value: number): void {
    this.encuestaForm.get('calificacion')?.setValue(value);
  }

  // async onSubmit(): Promise<void> {
  //   if (this.encuestaForm.invalid) {
  //     this.encuestaForm.markAllAsTouched();
  //     return;
  //   }

  //   this.enviando = true;
  //   const fv = this.encuestaForm.value;

 
  //   // Convertimos {puntualidad: true, limpieza: false} ======> Puntualidad
  //   const aspectosSeleccionados = [];
  //   if (fv.aspectos.puntualidad) aspectosSeleccionados.push('Puntualidad');
  //   if (fv.aspectos.amabilidad) aspectosSeleccionados.push('Amabilidad');
  //   if (fv.aspectos.limpieza) aspectosSeleccionados.push('Limpieza');
  //   if (fv.aspectos.explicacion) aspectosSeleccionados.push('Explicación');
    
  //   const stringCheckboxes = aspectosSeleccionados.join(', ');

  //   // PREPARAR OBJETO PARA SUPABASE
  //   const datosEncuesta = {
  //     turno_id: this.turno.id,
  //     paciente_id: this.turno.pacienteId,         //  
  //     especialista_id: this.turno.especialistaId, //  
  //     comentario: fv.comentario,
  //     estrellas: fv.calificacion,
  //     respuesta_radio: fv.opcion,                 // 'si' o 'no'
  //     respuesta_checkbox: stringCheckboxes,
  //     valor_rango: fv.rango,
  //     fecha_respuesta: new Date().toISOString()
  //   };

  //   try {
  //     //  LLAMADA A LA BASE DE DATOS
  //     const { error } = await this.supa.client
  //       .from('encuestas_atencion')
  //       .insert(datosEncuesta);

  //     if (error) throw error;

  //     //  EXITO
  //     this.snackBar.open('¡Gracias por tu opinión!', 'Cerrar', { duration: 3000 });
  //     this.encuestaCompletada.emit(); // Avisamos al padre para que cierre el modal o actualice la lista

  //   } catch (error) {
  //     console.error('Error al guardar encuesta:', error);
  //     this.snackBar.open('Error al enviar. Intenta nuevamente.', 'Cerrar');
  //   } finally {
  //     this.enviando = false;
  //   }
  // }

  async onSubmit(): Promise<void> {
    // 1. Validación inicial
    if (this.encuestaForm.invalid) {
      this.encuestaForm.markAllAsTouched();
      //AVISAR SI FALTAN DATOS
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Por favor completa todos los campos obligatorios.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    this.enviando = true;
    const fv = this.encuestaForm.value;

    // Procesar Checkboxes
    const aspectosSeleccionados = [];
    if (fv.aspectos.puntualidad) aspectosSeleccionados.push('Puntualidad');
    if (fv.aspectos.amabilidad) aspectosSeleccionados.push('Amabilidad');
    if (fv.aspectos.limpieza) aspectosSeleccionados.push('Limpieza');
    if (fv.aspectos.explicacion) aspectosSeleccionados.push('Explicación');
    
    const stringCheckboxes = aspectosSeleccionados.join(', ');

    //  Preparar objeto para BD
    const datosEncuesta = {
      turno_id: this.turno.id,
      paciente_id: this.turno.pacienteId,
      especialista_id: this.turno.especialistaId,
      comentario: fv.comentario,
      estrellas: fv.calificacion,
      respuesta_radio: fv.opcion,
      respuesta_checkbox: stringCheckboxes,
      valor_rango: fv.rango,
      fecha_respuesta: new Date().toISOString()
    };

    try {
      const { error } = await this.supa.client
        .from('encuestas_atencion')
        .insert(datosEncuesta);

      if (error) throw error;

      // EXITO CON SWAL
      await Swal.fire({
        icon: 'success',
        title: '¡Encuesta Enviada!',
        text: 'Gracias por ayudarnos a mejorar nuestros servicios.',
        confirmButtonText: 'Cerrar',
        timer: 2500,
        timerProgressBar: true
      });

      this.encuestaCompletada.emit(); 

    } catch (error) {
      console.error('Error al guardar encuesta:', error);
      
      //  ERROR CON SWAL
      Swal.fire({
        icon: 'error',
        title: 'Ups...',
        text: 'Ocurrió un error al enviar la encuesta. Intenta nuevamente.',
        confirmButtonText: 'Entendido'
      });
    } finally {
      this.enviando = false;
    }
  }


}




