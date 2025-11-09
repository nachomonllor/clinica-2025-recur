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

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.encuestaForm = this.fb.group({
      comentario: ['', Validators.required],               // 1. cuadro de texto
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

  setRating(value: number): void {
    this.encuestaForm.get('calificacion')?.setValue(value);
  }

  onSubmit(): void {
    if (this.encuestaForm.valid) {
      console.log('Encuesta enviada:', this.encuestaForm.value);
      // TODO: enviar al servicio
    } else {
      this.encuestaForm.markAllAsTouched();
    }
  }
}


// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-encuesta-atencion',
//   imports: [],
//   templateUrl: './encuesta-atencion.component.html',
//   styleUrl: './encuesta-atencion.component.scss'
// })
// export class EncuestaAtencionComponent {

// }