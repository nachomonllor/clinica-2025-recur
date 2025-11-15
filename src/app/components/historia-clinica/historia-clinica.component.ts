import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import Swal from 'sweetalert2';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HistoriaClinica } from '../../../models/historia-clinica.model';

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Material
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatSlideToggleModule
  ],
  templateUrl: './historia-clinica.component.html',
  styleUrl: './historia-clinica.component.css'
})

export class HistoriaClinicaComponent implements OnInit {
  historiaForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.historiaForm = this.fb.group({
      // Datos fijos
      altura: [null, [Validators.required, Validators.min(0)]],
      peso: [null, [Validators.required, Validators.min(0)]],
      temperatura: [null, [Validators.required, Validators.min(0)]],
      presion: ['', Validators.required],
      // Datos dinámicos existentes (clave/valor)
      datosDinamicos: this.fb.array([]),
      // Nuevos datos dinámicos con controles específicos:
      nuevosDatos: this.fb.group({
        // Control de rango: valor inicial 50, rango de 0 a 100.
        rango: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
        // Cuadro de texto numérico.
        valorNumerico: [null, Validators.required],
        // Switch: checkbox, donde true = "Sí", false = "No".
        switchSiNo: [false, Validators.required]
      })
    });
  }

  ngOnInit() {
    // this.historiaForm = this.fb.group({
    //   nuevosDatos: this.fb.group({
    //     switchSiNo: [false]        // <— aquí inicializas el switch
    //   }),
    //   datosDinamicos: this.fb.array([])
    // });
  }

  // Getter para el FormArray de datos dinámicos (los pares clave/valor)
  get datosDinamicos(): FormArray {
    return this.historiaForm.get('datosDinamicos') as FormArray;
  }

  addDatoDinamico(): void {
    if (this.datosDinamicos.length < 3) {
      const datoGroup = this.fb.group({
        clave: ['', Validators.required],
        valor: ['', Validators.required]
      });
      this.datosDinamicos.push(datoGroup);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Límite alcanzado',
        text: 'Solo se permiten hasta 3 datos dinámicos.',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  // Elimina un dato dinámico en el índice indicado
  removeDatoDinamico(index: number): void {
    this.datosDinamicos.removeAt(index);
  }


  onSubmit(): void {
    if (this.historiaForm.valid) {
      const historia: HistoriaClinica = this.historiaForm.value;
      console.log('Historia clínica enviada:', historia);  // :contentReference[oaicite:0]{index=0}

      // **SweetAlert2** de éxito
      Swal.fire({
        icon: 'success',
        title: 'Historia clinica guardada!',
        text: 'La historia clínica se guardó correctamente.',
        confirmButtonText: 'Aceptar'
      });

      // Aquí podés seguir con la lógica de envío al backend...

    } else {
      this.historiaForm.markAllAsTouched();

      // SweetAlert2 de error (opcional)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, completá todos los campos obligatorios.',
        confirmButtonText: 'Entendido'
      });
    }
  }
}



// export class HistoriaClinicaComponent implements OnInit {
//   historiaForm: FormGroup;

//   constructor(private fb: FormBuilder) {
//     this.historiaForm = this.fb.group({
//       altura: [null, [Validators.required, Validators.min(0)]],
//       peso: [null, [Validators.required, Validators.min(0)]],
//       temperatura: [null, [Validators.required, Validators.min(0)]],
//       presion: ['', Validators.required],
//       datosDinamicos: this.fb.array([]) // Inicialmente sin datos dinámicos.
//     });
//   }

//   ngOnInit(): void {}

//   // Getter para simplificar el acceso al FormArray de datos dinámicos.
//   get datosDinamicos(): FormArray {
//     return this.historiaForm.get('datosDinamicos') as FormArray;
//   }

//   // Agrega un nuevo grupo para un dato dinámico, si aún no se alcanzó el máximo.
//   addDatoDinamico(): void {
//     if (this.datosDinamicos.length < 3) {
//       const datoGroup = this.fb.group({
//         clave: ['', Validators.required],
//         valor: ['', Validators.required]
//       });
//       this.datosDinamicos.push(datoGroup);
//     } else {
//       alert('Solo se permiten hasta 3 datos dinámicos.');
//     }
//   }

//   // Elimina el dato dinámico en la posición indicada.
//   removeDatoDinamico(index: number): void {
//     this.datosDinamicos.removeAt(index);
//   }

//   // Envía la historia clínica.
//   onSubmit(): void {
//     if (this.historiaForm.valid) {
//       const historia: HistoriaClinica = this.historiaForm.value;
//       console.log('Historia clínica enviada:', historia);
//       // Aquí integras el envío al backend (por ejemplo, con Firebase o una API REST).
//     } else {
//       this.historiaForm.markAllAsTouched();
//     }
//   }
// }

