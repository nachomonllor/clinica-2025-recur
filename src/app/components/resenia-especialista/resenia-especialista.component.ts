// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-resenia-especialista',
//   imports: [],
//   templateUrl: './resenia-especialista.component.html',
//   styleUrl: './resenia-especialista.component.scss'
// })
// export class ReseniaEspecialistaComponent {

// }


import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';


@Component({
  selector: 'app-resenia-especialista',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
   templateUrl: './resenia-especialista.component.html',
   styleUrl: './resenia-especialista.component.scss'
})
export class ReseniaEspecialistaComponent implements OnInit {
  turnoId!: number;
  form!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
  //  private turnoService: TurnoService,
    private snackBar: MatSnackBar,
    public router: Router
  ) {}

  ngOnInit(): void {
    // 1) Leer el ID de la URL
    this.turnoId = Number(this.route.snapshot.paramMap.get('id'));

    // 2) Crear el formulario
    this.form = this.fb.group({
      resena: ['', Validators.required]
    });

    // // 3) (Opcional) cargar reseña previa si existe
    // this.turnoService.getMockTurnoById(this.turnoId).subscribe(t => {
    //   if (t?.resenaEspecialista) {
    //     this.form.patchValue({ resena: t.resenaEspecialista });
    //   }
    // });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const texto = this.form.value.resena as string;

    // ACTUALIZAR el turno en Firebase con mock:
    // this.turnoService
    //   .setResenaEspecialista(this.turnoId, texto)
    //   .subscribe(() => {
    //     this.snackBar.open('Reseña guardada', 'Cerrar', { duration: 2000 });
    //     this.router.navigate(['/mis-turnos-especialista']);
    //   }
    // );
  }
}
