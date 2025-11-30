
// import { CommonModule } from '@angular/common';
// import { Component, OnInit } from '@angular/core';
// import {
//   FormBuilder,
//   FormGroup,
//   Validators,
//   FormControl,
//   ReactiveFormsModule,
//   AbstractControl,
//   ValidationErrors
// } from '@angular/forms';

// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatCardModule } from '@angular/material/card';

// import Swal from 'sweetalert2';
// import { SupabaseService } from '../../../services/supabase.service';
// import { environment } from '../../../../environments/environment';

// @Component({
//   selector: 'app-registro-paciente',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatButtonModule,
//     MatCardModule
//   ],
//   templateUrl: './registro-paciente.component.html',
//   styleUrls: ['./registro-paciente.component.scss']
// })
// export class RegistroPacienteComponent implements OnInit {
//   loading = false;

//   // Usamos fechaNacimiento en lugar de edad
//   registroPacienteForm!: FormGroup<{
//     nombre: FormControl<string | null>;
//     apellido: FormControl<string | null>;
//     fechaNacimiento: FormControl<string | null>; // 'YYYY-MM-DD'
//     dni: FormControl<string | null>;
//     obraSocial: FormControl<string | null>;
//     email: FormControl<string | null>;
//     password: FormControl<string | null>;
//   }>;

//   // Para limitar el <input type="date">
//   maxDateISO!: string;        // hoy
//   readonly minDateISO = '1900-01-01';

//   captchaEnabled = environment.captchaEnabled; // opción global para deshabilitar


//   constructor(
//     private fb: FormBuilder,
//     private sb: SupabaseService
//   ) { }

//   ngOnInit(): void {
//     this.maxDateISO = this.toISODateLocal(new Date());

//     this.registroPacienteForm = this.fb.group({
//       nombre: this.fb.control<string | null>(null, Validators.required),
//       apellido: this.fb.control<string | null>(null, Validators.required),
//       fechaNacimiento: this.fb.control<string | null>(
//         null,
//         [Validators.required, RegistroPacienteComponent.fechaNacimientoValidator]
//       ),
//       dni: this.fb.control<string | null>(null, Validators.required),
//       obraSocial: this.fb.control<string | null>(null, Validators.required),
//       email: this.fb.control<string | null>(null, [Validators.required, Validators.email]),
//       password: this.fb.control<string | null>(null, Validators.required),
//     });
//   }

//   // ---- VALIDACIONES y HELPERS ----

//   // Valida formato ISO (YYYY-MM-DD), que no sea futuro, y rango lógico (0..120)
//   static fechaNacimientoValidator(control: AbstractControl): ValidationErrors | null {
//     const v = control.value as string | null;
//     if (!v) return null; // 'required' se maneja aparte
//     if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return { formato: true };

//     const [y, m, d] = v.split('-').map(Number);
//     const today = new Date();
//     const nowY = today.getFullYear();
//     const nowM = today.getMonth() + 1;
//     const nowD = today.getDate();

//     // Edad calculada sin crear Date (evita problemas de zona horaria)
//     let edad = nowY - y;
//     if (nowM < m || (nowM === m && nowD < d)) edad--;

//     if (edad < 0) return { futuro: true };
//     if (edad > 120) return { rango: true };

//     return null;
//   }

//   private calcEdadFromISO(iso: string): number {
//     const [y, m, d] = iso.split('-').map(Number);
//     const today = new Date();
//     let edad = today.getFullYear() - y;
//     const month = today.getMonth() + 1;
//     const day = today.getDate();
//     if (month < m || (month === m && day < d)) edad--;
//     return edad;
//   }

//   private toISODateLocal(date: Date): string {
//     const y = date.getFullYear();
//     const m = String(date.getMonth() + 1).padStart(2, '0');
//     const d = String(date.getDate()).padStart(2, '0');
//     return `${y}-${m}-${d}`;
//   }

//   private mapPgError(err: any): string {
//     const msg: string = err?.message || '';
//     const code: string | undefined = err?.code;

//     // Duplicados en Postgres (unique_violation)
//     if (code === '23505') {
//       if (msg.toLowerCase().includes('email')) return 'El correo ya está registrado.';
//       if (msg.toLowerCase().includes('dni')) return 'El DNI ya existe en el sistema.';
//       return 'Registro duplicado.';
//     }

//     // Usuario ya existe en Auth
//     if (err?.status === 422 || /already registered|exists/i.test(msg)) {
//       return 'El correo ya está registrado en el sistema.';
//     }

//     return msg || 'Ocurrió un error inesperado.';
//   }

//   // ---- SUBMIT ----

//   async onSubmit(): Promise<void> {
//     if (this.registroPacienteForm.invalid) {
//       this.registroPacienteForm.markAllAsTouched();
//       return;
//     }

//     this.loading = true;
//     const supabase = this.sb.client;
//     const fv = this.registroPacienteForm.value!;

//     try {
//       // 1) Crear usuario en Auth
//       const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
//         email: fv.email!,
//         password: fv.password!,
//         options: {
//           data: { rol: 'paciente', nombre: fv.nombre, apellido: fv.apellido }
//         }
//       });
//       if (signUpError) throw signUpError;

//       const user = signUpData.user;

//       // Si tienes confirmación de email activa, no habrá session aquí (RLS bloquea insert).
//       if (!signUpData.session) {
//         Swal.fire({
//           icon: 'info',
//           title: 'Confirma tu correo',
//           text: 'Te enviamos un email. Confírmalo para iniciar sesión y completar tu registro.',
//           confirmButtonText: 'Entendido'
//         });
//         return;
//       }

//       // 2) Calcular edad desde la fecha de nacimiento
//       const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);

//       // 3) Insertar en la tabla 'pacientes' (sin guardar password)
//       const { error: insertError } = await supabase
//         .from('pacientes')
//         // .insert({
//         //   id: user!.id,
//         //   nombre: fv.nombre!,
//         //   apellido: fv.apellido!,
//         //   edad: edadCalculada,          // <-- se calcula
//         //   dni: fv.dni!,
//         //   obra_social: fv.obraSocial!,
//         //   email: fv.email!
//         //   // Si luego quieres guardar también la fecha: agrega 'fecha_nacimiento'
//         // });
//         .insert({
//           id: user!.id,
//           nombre: fv.nombre!,
//           apellido: fv.apellido!,
//           edad: edadCalculada,
//           fecha_nacimiento: fv.fechaNacimiento!, // <=== PARA LA EDAD
//           dni: fv.dni!,
//           obra_social: fv.obraSocial!,
//           email: fv.email!
//         });
//       if (insertError) throw insertError;

//       // 4) Éxito
//       Swal.fire({
//         icon: 'success',
//         title: 'Paciente registrado con éxito',
//         showConfirmButton: false,
//         timer: 2000
//       });
//       this.registroPacienteForm.reset();

//     } catch (err: any) {
//       console.error(err);
//       Swal.fire('Error', this.mapPgError(err), 'error');
//     } finally {
//       this.loading = false;
//     }
//   }


// }

// //------------------------------------------------------------------------------------------------------
