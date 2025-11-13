// import { ChangeDetectionStrategy, Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormControl, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatSelectModule } from '@angular/material/select';
// import { combineLatest, map, startWith, switchMap } from 'rxjs';

// import {
//   Consulta,
//   Especialidad,
//   HistoriaClinica
// } from '../../core/modelos/historia-clinica.model';
// import { HistoriaClinicaService } from '../../core/servicios/historia-clinica.service';

// @Component({
//   selector: 'app-historia-clinica-pagina',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ReactiveFormsModule,
//     MatButtonModule,
//     MatIconModule,
//     MatSelectModule
//   ],
//   templateUrl: './historia-clinica-pagina.component.html',
//   styleUrls: ['./historia-clinica-pagina.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class HistoriaClinicaPaginaComponent {
//   especialidadControl = new FormControl<'todas' | Especialidad>('todas', { nonNullable: true });

//   vm$ = combineLatest({
//     pacienteId: this.route.paramMap.pipe(map(pm => pm.get('id') ?? 'paciente-1')),
//     seleccion: this.especialidadControl.valueChanges.pipe(startWith<'todas' | Especialidad>('todas')),
//   }).pipe(
//     switchMap(({ pacienteId, seleccion }) =>
//       this.service.getPorPacienteId(pacienteId).pipe(
//         map((historia: HistoriaClinica) => {
//           const lista = [...new Set(historia.consultas.map(c => c.especialidad))] as Especialidad[];
//           const especialidades = [{ value: 'todas' as const, label: 'Todas las especialidades' },
//             ...lista.map(e => ({ value: e, label: e }))];

//           const consultas = (seleccion === 'todas')
//             ? historia.consultas
//             : historia.consultas.filter(c => c.especialidad === seleccion);

//           return {
//             historia,
//             especialidades,
//             consultas: consultas.sort((a, b) => a.fecha < b.fecha ? 1 : -1),
//             edad: this.calcularEdad(historia.paciente.fechaNacimiento)
//           };
//         })
//       )
//     )
//   );

//   constructor(
//     private route: ActivatedRoute,
//     private service: HistoriaClinicaService
//   ) {}

//   private calcularEdad(fechaIso: string): number {
//     const f = new Date(fechaIso);
//     const hoy = new Date();
//     let edad = hoy.getFullYear() - f.getFullYear();
//     const m = hoy.getMonth() - f.getMonth();
//     if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) edad--;
//     return edad;
//   }

//   trackByConsulta = (_: number, c: Consulta) => c.id;
// }

// -----------------------------------------------------------------------------------------------


import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HistoriaClinicaService } from '../../services/historia-clinica.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historia-clinica',
  standalone:true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './historia-clinica.component.html',
  styleUrls: ['./historia-clinica.component.scss']
})
export class HistoriaClinicaComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private historiaService: HistoriaClinicaService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      altura: [null, [Validators.required, Validators.min(0.5), Validators.max(2.5)]],
      peso: [null, [Validators.required, Validators.min(1)]],
      presion: ['', Validators.required],
      temperatura: [37, [Validators.required, Validators.min(30), Validators.max(45)]],
      fiebre: [false],
      infartos: [0, [Validators.min(0)]]
    });

    this.historiaService.getHistoriaClinica().subscribe((data: { [key: string]: any; }) => this.form.patchValue(data));
  }

  guardar(): void {
    if (this.form.valid) {
      this.historiaService.guardarHistoriaClinica(this.form.value).subscribe(() => {
        alert('Historia clínica guardada correctamente.');
      });
    }
  }

  verResenia(): void {
    alert('Mostrando reseña médica...');
  }

  calificarAtencion(): void {
    alert('Redirigiendo al formulario de calificación...');
  }

  completarEncuesta(): void {
    alert('Completando encuesta de satisfacción...');
  }
}






// import { Component, OnInit } from '@angular/core';
// import { FormGroup, FormBuilder, Validators, FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { MatToolbarModule } from '@angular/material/toolbar';
// import { MatButtonModule } from '@angular/material/button';
// import { MatCardModule } from '@angular/material/card';
// import { MatIconModule } from '@angular/material/icon';
// import { MatInputModule } from '@angular/material/input';
// import { MatTableModule } from '@angular/material/table';

// import Swal from 'sweetalert2';
// import { MatSlideToggleModule } from '@angular/material/slide-toggle';
// import { HistoriaClinica } from '../../../models/interfaces';

// @Component({
//   selector: 'app-historia-clinica',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     // Material
//     MatToolbarModule,
//     MatCardModule,
//     MatButtonModule,
//     MatIconModule,
//     MatInputModule,
//     MatTableModule,
//     MatSlideToggleModule
//   ],
//   templateUrl: './historia-clinica.component.html',
//   styleUrl: './historia-clinica.component.css'
// })

// export class HistoriaClinicaComponent implements OnInit {
//   historiaForm: FormGroup;

//   constructor(private fb: FormBuilder) {
//     this.historiaForm = this.fb.group({
//       // Datos fijos
//       altura: [null, [Validators.required, Validators.min(0)]],
//       peso: [null, [Validators.required, Validators.min(0)]],
//       temperatura: [null, [Validators.required, Validators.min(0)]],
//       presion: ['', Validators.required],
//       // Datos dinámicos existentes (clave/valor)
//       datosDinamicos: this.fb.array([]),
//       // Nuevos datos dinámicos con controles específicos:
//       nuevosDatos: this.fb.group({
//         // Control de rango: valor inicial 50, rango de 0 a 100.
//         rango: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
//         // Cuadro de texto numérico.
//         valorNumerico: [null, Validators.required],
//         // Switch: checkbox, donde true = "Sí", false = "No".
//         switchSiNo: [false, Validators.required]
//       })
//     });
//   }

//   ngOnInit() {
//     // this.historiaForm = this.fb.group({
//     //   nuevosDatos: this.fb.group({
//     //     switchSiNo: [false]        // <— aquí inicializas el switch
//     //   }),
//     //   datosDinamicos: this.fb.array([])
//     // });
//   }

//   // Getter para el FormArray de datos dinámicos (los pares clave/valor)
//   get datosDinamicos(): FormArray {
//     return this.historiaForm.get('datosDinamicos') as FormArray;
//   }

//   addDatoDinamico(): void {
//     if (this.datosDinamicos.length < 3) {
//       const datoGroup = this.fb.group({
//         clave: ['', Validators.required],
//         valor: ['', Validators.required]
//       });
//       this.datosDinamicos.push(datoGroup);
//     } else {
//       Swal.fire({
//         icon: 'warning',
//         title: 'Límite alcanzado',
//         text: 'Solo se permiten hasta 3 datos dinámicos.',
//         confirmButtonText: 'Aceptar'
//       });
//     }
//   }

//   // Elimina un dato dinámico en el índice indicado
//   removeDatoDinamico(index: number): void {
//     this.datosDinamicos.removeAt(index);
//   }


//   onSubmit(): void {
//     if (this.historiaForm.valid) {
//       const historia: HistoriaClinica = this.historiaForm.value;
//       console.log('Historia clínica enviada:', historia);  // :contentReference[oaicite:0]{index=0}

//       // **SweetAlert2** de éxito
//       Swal.fire({
//         icon: 'success',
//         title: 'Historia clinica guardada!',
//         text: 'La historia clínica se guardó correctamente.',
//         confirmButtonText: 'Aceptar'
//       });

//       // Aquí podés seguir con la lógica de envío al backend...

//     } else {
//       this.historiaForm.markAllAsTouched();

//       // SweetAlert2 de error (opcional)
//       Swal.fire({
//         icon: 'error',
//         title: 'Error',
//         text: 'Por favor, completá todos los campos obligatorios.',
//         confirmButtonText: 'Entendido'
//       });
//     }
//   }
// }


