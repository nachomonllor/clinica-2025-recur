
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-resenia',
  standalone: true,
  templateUrl: './resenia.component.html',
  styleUrls: ['./resenia.component.scss'],
  imports: [CommonModule, RouterModule, ReactiveFormsModule,

        CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReseniaComponent implements OnInit {
  id = '';
  form!: FormGroup;

  constructor(private route: ActivatedRoute, private fb: FormBuilder) {
    //  Crear el formulario EN ESTA PARTE para evitar errores de "form undefined" en el template
    this.form = this.fb.group({
      texto: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(800)]]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(pm => {
      this.id = pm.get('id') ?? '';
    });
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      await Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'La reseña debe tener entre 5 y 800 caracteres.',
        timer: 1800,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    try {
      const texto = (this.form.value.texto ?? '').trim();
      // TODO:  await this.turnosService.updateResenia(this.id, texto);

      await Swal.fire({
        icon: 'success',
        title: 'Reseña guardada',
        text: `Turno #${this.id}`,
        timer: 1600,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

      this.form.reset();
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: 'Intentá nuevamente.',
        showConfirmButton: true
      });
    }
  }
}





// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
// import { MatCardModule } from '@angular/material/card';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';

// import Swal from 'sweetalert2';

// @Component({
//   selector: 'app-resenia',
//   standalone: true,
//   templateUrl: './resenia.component.html',
//   styleUrls: ['./resenia.component.scss'],
//   imports: [
//     CommonModule, RouterModule, ReactiveFormsModule,
//     MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule
//   ]
// })
// export class ReseniaComponent {
//   id = this.route.snapshot.paramMap.get('id')!;
//   form = this.fb.group({
//     texto: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(800)]]
//   });

//   constructor(private route: ActivatedRoute, private fb: FormBuilder) {}

//   guardar() {
//     if (this.form.invalid) return;
//     // TODO: persistir reseña (turnos.update resena_especialista)
//     alert(`Reseña guardada para turno #${this.id}`);
//   }
// }


