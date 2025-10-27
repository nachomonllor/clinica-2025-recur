import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SupabaseService } from '../../../services/supabase.service';

//import {  MatGridTile, MatGridList } from '@angular/material/grid-list';
import { MatGridListModule } from '@angular/material/grid-list';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-registro-paciente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule,MatGridListModule ],
  templateUrl: './registro-paciente.component.html',
  styleUrl: './registro-paciente.component.scss'
})
export class RegistroPacienteComponent implements OnInit {
  form!: FormGroup;
  imgPrev1: string | null = null;
  imgPrev2: string | null = null;
  loading = false;

  constructor(private fb: FormBuilder, private supa: SupabaseService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', Validators.required],
      obraSocial: [''],
      fechaNacimiento: [null, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      imagenPerfil1: [null, Validators.required],
      imagenPerfil2: [null, Validators.required],
    });
  }

  onFileChange(ev: Event, idx: 1|2) {
    const input = ev.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.form.get(idx === 1 ? 'imagenPerfil1' : 'imagenPerfil2')!.setValue(file);
    const r = new FileReader();
    r.onload = () => idx === 1 ? this.imgPrev1 = r.result as string : this.imgPrev2 = r.result as string;
    r.readAsDataURL(file);
  }

  async onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;

    try {
      const fv = this.form.value;

      // 1) Alta en Auth (envía email de verificación)
      const { data, error }: any = await this.supa.signUp(fv.email, fv.password);
      if (error) throw error;
      const userId = data.user.id as string;

      // 2) Subir imágenes al bucket /<uid>/**
      const url1 = await this.supa.uploadAvatar(userId, fv.imagenPerfil1, 1);
      const url2 = await this.supa.uploadAvatar(userId, fv.imagenPerfil2, 2);

      // 3) Upsert profile (rol PACIENTE por defecto; especialista lo verá Admin)
      await this.supa.upsertProfile({
        id: userId,
        rol: 'paciente',
        nombre: fv.nombre,
        apellido: fv.apellido,
        dni: fv.dni,
        obra_social: fv.obraSocial || null,
        fecha_nacimiento: fv.fechaNacimiento,  // <- FECHA DE NACIMIENTO PARA SACAR LA EDAD
        email: fv.email,
        avatar_url: url1,
        imagen2_url: url2,
        aprobado: true // paciente no requiere aprobacion - especialista si
      });

      Swal.fire('Registro exitoso', 'Verificá tu email antes de ingresar', 'success');
      this.form.reset(); this.imgPrev1 = this.imgPrev2 = null;

    } catch (e: any) {
      Swal.fire('Error', e.message || e, 'error');
    } finally {
      this.loading = false;
    }
  }
}

// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-registro-paciente',
//   standalone: true,
//   imports: [],
//   templateUrl: './registro-paciente.component.html',
//   styleUrl: './registro-paciente.component.scss'
// })
// export class RegistroPacienteComponent {

// }


