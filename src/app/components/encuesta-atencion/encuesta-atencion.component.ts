import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
  encuestaForm!: FormGroup;
  starIcons = [1, 2, 3, 4, 5];

  // Inyecta el constructor de formularios (FormBuilder) para crear el grupo de controles
  constructor(private fb: FormBuilder) {}

  /*
  Se ejecuta al iniciar el componente. 
  Su función principal es inicializar el Formulario Reactivo (this.encuestaForm) con la estructura exacta que pide el TP:
  comentario: (Cuadro de texto) Validador required.
  calificacion: (Estrellas) Se inicializa en 0, pero requiere minimo 1.
  opcion: (Radio Button) Para preguntas tipo => Recomendaria?
  aspectos: (Checkboxes) Un sub-grupo (fb.group) para marcar varias opciones (puntualidad, limpieza, etc.).
  rango: (Slider) Un valor numérico (ej. del 1 al 10)
  */
  ngOnInit(): void {
    this.encuestaForm = this.fb.group({
      comentario: ['', Validators.required],              // 1. cuadro de texto
      calificacion: [0, [Validators.required, Validators.min(1)]], // 2. estrellas
      opcion: ['', Validators.required],                  // 3. radio button
      aspectos: this.fb.group({                           // 4. checkboxes
        puntualidad: [false],
        amabilidad: [false],
        limpieza: [false],
        explicacion: [false]
      }),
      rango: [5, Validators.required]                     // 5. control de rango
    });
  }

/*
  setRating(value: number):
  Esta función conecta la interfaz visual de las estrellas con el formulario 
  Como un <div> con iconos de estrellas no es un input nativo de HTML, 
  cuando el usuario hace clic en la 4ta estrella, el HTML llama a esta función con el valor 4.
  La funcion actualiza manualmente el control calificacion usando setValue(value)
*/
  setRating(value: number): void {
    this.encuestaForm.get('calificacion')?.setValue(value);
  }

 /*
  Se ejecuta cuando el usuario presiona "Enviar".
  Validación: Primero verifica this.encuestaForm.valid.
  Camino Feliz: Si es válido, captura los valores (this.encuestaForm.value). 
  ACA es donde SE LLAMARIA al servicio para guardar en Supabase, 
  aunque en este snippet solo haces un console.log.
  Si es inválido, llama a markAllAsTouched(). 
  Esto hace que todos los campos se pongan en rojo para mostrarle al usuario qué le faltó completar.
  */
  onSubmit(): void {
    if (this.encuestaForm.valid) {
      console.log('Encuesta enviada:', this.encuestaForm.value);
      // TODO: enviar al servicio
    } else {
      this.encuestaForm.markAllAsTouched();
    }
  }

}


