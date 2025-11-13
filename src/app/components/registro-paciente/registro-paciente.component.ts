
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import Swal from 'sweetalert2';
import { SupabaseService } from '../../../services/supabase.service';
import { environment } from '../../../environments/environment';
import { CaptchaComponent } from '../captcha/captcha.component';

@Component({
  selector: 'app-registro-paciente',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    CaptchaComponent
  ],
  templateUrl: './registro-paciente.component.html',
  styleUrls: ['./registro-paciente.component.scss']
})
export class RegistroPacienteComponent implements OnInit {
  loading = false;
  imagenPrevia1: string | null = null;
  imagenPrevia2: string | null = null;
  captchaEnabled = environment.captchaEnabled;
  captchaValido = !environment.captchaEnabled; // Si está deshabilitado, siempre válido

  // Usamos fechaNacimiento en lugar de edad
  registroPacienteForm!: FormGroup<{
    nombre: FormControl<string | null>;
    apellido: FormControl<string | null>;
    fechaNacimiento: FormControl<string | null>; // 'YYYY-MM-DD'
    dni: FormControl<string | null>;
    obraSocial: FormControl<string | null>;
    email: FormControl<string | null>;
    password: FormControl<string | null>;
    imagenPerfil1: FormControl<File | null>;
    imagenPerfil2: FormControl<File | null>;
  }>;

  // Para limitar el <input type="date">
  maxDateISO!: string;        // hoy
  readonly minDateISO = '1900-01-01';

  constructor(
    private fb: FormBuilder,
    private sb: SupabaseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.maxDateISO = this.toISODateLocal(new Date());

    this.registroPacienteForm = this.fb.group({
      nombre: this.fb.control<string | null>(null, Validators.required),
      apellido: this.fb.control<string | null>(null, Validators.required),
      fechaNacimiento: this.fb.control<string | null>(
        null,
        [Validators.required, RegistroPacienteComponent.fechaNacimientoValidator]
      ),
      dni: this.fb.control<string | null>(null, Validators.required),
      obraSocial: this.fb.control<string | null>(null, Validators.required),
      email: this.fb.control<string | null>(null, [Validators.required, Validators.email]),
      password: this.fb.control<string | null>(null, Validators.required),
      imagenPerfil1: this.fb.control<File | null>(null, Validators.required),
      imagenPerfil2: this.fb.control<File | null>(null, Validators.required),
    });
  }

  // Manejo de archivos de imagen
  onFileChange(event: Event, idx: 1 | 2): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    
    const file = input.files[0];
    const controlName = idx === 1 ? 'imagenPerfil1' : 'imagenPerfil2';
    
    this.registroPacienteForm.get(controlName)!.setValue(file);
    this.registroPacienteForm.get(controlName)!.markAsDirty();
    this.registroPacienteForm.get(controlName)!.markAsTouched();

    // Previsualización
    const reader = new FileReader();
    reader.onload = () => {
      if (idx === 1) {
        this.imagenPrevia1 = reader.result as string;
      } else {
        this.imagenPrevia2 = reader.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  onCaptchaValid(esValido: boolean): void {
    this.captchaValido = esValido;
  }

  // ---- VALIDACIONES y HELPERS ----

  // Valida formato ISO (YYYY-MM-DD), que no sea futuro, y rango lógico (0..120)
  static fechaNacimientoValidator(control: AbstractControl): ValidationErrors | null {
    const v = control.value as string | null;
    if (!v) return null; // 'required' se maneja aparte
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return { formato: true };

    const [y, m, d] = v.split('-').map(Number);
    const today = new Date();
    const nowY = today.getFullYear();
    const nowM = today.getMonth() + 1;
    const nowD = today.getDate();

    // Edad calculada sin crear Date (evita problemas de zona horaria)
    let edad = nowY - y;
    if (nowM < m || (nowM === m && nowD < d)) edad--;

    if (edad < 0) return { futuro: true };
    if (edad > 120) return { rango: true };

    return null;
  }

  private calcEdadFromISO(iso: string): number {
    const [y, m, d] = iso.split('-').map(Number);
    const today = new Date();
    let edad = today.getFullYear() - y;
    const month = today.getMonth() + 1;
    const day = today.getDate();
    if (month < m || (month === m && day < d)) edad--;
    return edad;
  }

  private toISODateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private mapPgError(err: any): string {
    const msg: string = (err?.message || '').toLowerCase();
    const code: string | undefined = err?.code;
    const status: number | undefined = err?.status;

    // Log para debugging - ver qué error exacto estamos recibiendo
    console.log('[mapPgError] Analizando error:', { msg, code, status, fullError: err });

    // Errores de Supabase Auth - Email ya registrado
    // IMPORTANTE: Solo marcar como "ya registrado" si realmente es ese el caso
    // Supabase puede devolver 422 por otras razones también
    const esEmailDuplicado = (
      code === 'signup_disabled' ||
      code === 'email_address_not_authorized' ||
      /user already registered/i.test(msg) ||
      /already registered/i.test(msg) ||
      /email.*already.*exists/i.test(msg) ||
      /user.*already.*exists/i.test(msg) ||
      msg.includes('already registered') ||
      msg.includes('already exists') ||
      (status === 422 && (msg.includes('already') || msg.includes('exists') || msg.includes('registered')))
    );

    if (esEmailDuplicado) {
      return 'Este correo electrónico ya está registrado. Si ya tenés una cuenta, intentá iniciar sesión o recuperar tu contraseña.';
    }

    // Duplicados en Postgres (unique_violation)
    if (code === '23505') {
      if (msg.includes('email')) return 'El correo ya está registrado en el sistema.';
      if (msg.includes('dni')) return 'El DNI ya existe en el sistema.';
      return 'Registro duplicado.';
    }

    // Errores de validación de email
    if (msg.includes('invalid email') || msg.includes('email not valid')) {
      return 'El correo electrónico no es válido.';
    }

    // Errores de contraseña
    if (msg.includes('password') && (msg.includes('weak') || msg.includes('at least'))) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    // Rate limit
    if (status === 429 || msg.includes('rate limit') || msg.includes('too many')) {
      return 'Demasiados intentos. Por favor, esperá unos minutos e intentá nuevamente.';
    }

    // Si llegamos aquí, mostrar el mensaje original del error para debugging
    // Esto ayuda a identificar errores que no estamos manejando correctamente
    const mensajeOriginal = err?.message || String(err) || 'Ocurrió un error inesperado.';
    console.warn('[mapPgError] Error no manejado específicamente:', mensajeOriginal);
    return mensajeOriginal;
  }

  // ---- SUBMIT ----

  async onSubmit(): Promise<void> {
    if (this.registroPacienteForm.invalid) {
      this.registroPacienteForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const supabase = this.sb.client;
    const fv = this.registroPacienteForm.value!;

    if (!fv.imagenPerfil1 || !fv.imagenPerfil2) {
      Swal.fire('Error', 'Por favor, seleccioná ambas imágenes de perfil.', 'error');
      this.loading = false;
      return;
    }

    try {
      // 1) Crear usuario en Auth con todos los datos en metadata
      // El trigger leerá estos datos y creará el perfil automáticamente
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fv.email!,
        password: fv.password!,
        options: {
          data: {
            rol: 'paciente',
            nombre: fv.nombre,
            apellido: fv.apellido,
            dni: fv.dni,
            fecha_nacimiento: fv.fechaNacimiento,
            obra_social: fv.obraSocial
          }
        }
      });
      if (signUpError) throw signUpError;

      const user = signUpData.user;
      if (!user) throw new Error('No se pudo crear el usuario.');

      // Si no hay sesión automática (confirmación de email activa)
      if (!signUpData.session) {
        // El trigger ya creó el perfil básico con los datos de metadata
        // Las imágenes y datos adicionales se completarán cuando el usuario verifique su email
        await Swal.fire({
          icon: 'info',
          title: 'Verifica tu correo',
          html: `
            <p>Te enviamos un email de verificación a <strong>${fv.email}</strong>.</p>
            <p>Confírmalo para iniciar sesión y completar tu registro (subir imágenes).</p>
          `,
          confirmButtonText: 'Entendido'
        });
        this.registroPacienteForm.reset();
        this.imagenPrevia1 = null;
        this.imagenPrevia2 = null;
        this.router.navigate(['/bienvenida']);
        return;
      }

      // Si hay sesión automática, continuar con el flujo completo

      // 2) Calcular edad desde la fecha de nacimiento
      const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);

      // 3) Subir imágenes a Supabase Storage
      const file1 = fv.imagenPerfil1!;
      const file2 = fv.imagenPerfil2!;
      
      const url1 = await this.sb.uploadAvatar(user.id, file1, 1);
      const url2 = await this.sb.uploadAvatar(user.id, file2, 2);

      // 4) Actualizar perfil en 'profiles' con las imágenes (el trigger ya creó el perfil básico)
      const { data: updateData, error: perfilError } = await supabase
        .from('profiles')
        .update({
          avatar_url: url1,
          imagen2_url: url2,
          aprobado: true // Pacientes no requieren aprobación
        })
        .eq('id', user.id)
        .select();
      
      if (perfilError) throw perfilError;

      // 5) Insertar en la tabla 'pacientes' (sin guardar password)
      const { error: insertError } = await supabase
        .from('pacientes')
        .insert({
          id: user.id,
          nombre: fv.nombre!,
          apellido: fv.apellido!,
          edad: edadCalculada,
          fecha_nacimiento: fv.fechaNacimiento!,
          dni: fv.dni!,
          obra_social: fv.obraSocial!,
          email: fv.email!
        });
      if (insertError) throw insertError;

      // 6) Éxito
      await Swal.fire({
        icon: 'success',
        title: 'Paciente registrado con éxito',
        showConfirmButton: false,
        timer: 2000
      });
      this.registroPacienteForm.reset();
      this.imagenPrevia1 = null;
      this.imagenPrevia2 = null;
      this.router.navigate(['/bienvenida']);

    } catch (err: any) {
      // Log detallado del error para debugging
      console.error('[Registro Paciente] Error completo:', {
        error: err,
        message: err?.message,
        code: err?.code,
        status: err?.status,
        name: err?.name,
        stack: err?.stack
      });
      
      const mensajeError = this.mapPgError(err);
      Swal.fire('Error', mensajeError, 'error');
    } finally {
      this.loading = false;
    }
  }


}

//------------------------------------------------------------------------------------------------------






// import { CommonModule } from '@angular/common';
// import { Component, OnInit } from '@angular/core';
// import {
//   FormBuilder,
//   FormGroup,
//   Validators,
//   FormControl,
//   ReactiveFormsModule
// } from '@angular/forms';

// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatCardModule } from '@angular/material/card';

// import Swal from 'sweetalert2';
// import { SupabaseService } from '../../../services/supabase.service';

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

//   registroPacienteForm!: FormGroup<{
//     nombre: FormControl<string | null>;
//     apellido: FormControl<string | null>;
//     edad: FormControl<number | null>;
//     dni: FormControl<string | null>;
//     obraSocial: FormControl<string | null>;
//     email: FormControl<string | null>;
//     password: FormControl<string | null>;
//   }>;

//   constructor(
//     private fb: FormBuilder,
//     private sb: SupabaseService
//   ) {}

//   ngOnInit(): void {
//     this.registroPacienteForm = this.fb.group({
//       nombre: this.fb.control<string | null>(null, Validators.required),
//       apellido: this.fb.control<string | null>(null, Validators.required),
//       edad: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
//       dni: this.fb.control<string | null>(null, Validators.required),
//       obraSocial: this.fb.control<string | null>(null, Validators.required),
//       email: this.fb.control<string | null>(null, [Validators.required, Validators.email]),
//       password: this.fb.control<string | null>(null, Validators.required),
//     });
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

//       // Si tienes confirmación de email activa, no habrá session aquí.
//       if (!signUpData.session) {
//         Swal.fire({
//           icon: 'info',
//           title: 'Confirma tu correo',
//           text: 'Te enviamos un email. Confírmalo para iniciar sesión y completar tu registro.',
//           confirmButtonText: 'Entendido'
//         });
//         // Inserción en la tabla se hace tras el primer login (por RLS).
//         return;
//       }

//       // 2) Insertar en la tabla 'pacientes'
//       const { error: insertError } = await supabase
//         .from('pacientes')
//         .insert({
//           id: user!.id,
//           nombre: fv.nombre!,
//           apellido: fv.apellido!,
//           edad: fv.edad!,
//           dni: fv.dni!,
//           obra_social: fv.obraSocial!, // <- columna snake_case en Postgres
//           email: fv.email!
//         });
//       if (insertError) throw insertError;

//       // 3) Éxito
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




//------------------------------------------------------------------------------------------------------


// // registro-paciente.component.ts
// import { CommonModule } from '@angular/common';
// import { Component, OnInit } from '@angular/core';
// import {
//   FormBuilder,
//   FormGroup,
//   Validators,
//   FormControl,
//   ReactiveFormsModule
// } from '@angular/forms';

// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatCardModule } from '@angular/material/card';

// import Swal from 'sweetalert2';
// import { SupabaseService } from '../../../services/supabase.service';

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
//   styleUrls: ['./registro-paciente.component.css']
// })
// export class RegistroPacienteComponent implements OnInit {
//   imagenPrevia1: string | null = null;
//   imagenPrevia2: string | null = null;
//   loading = false;

//   registroPacienteForm!: FormGroup<{
//     nombre: FormControl<string | null>;
//     apellido: FormControl<string | null>;
//     edad: FormControl<number | null>;
//     dni: FormControl<string | null>;
//     obraSocial: FormControl<string | null>;
//     email: FormControl<string | null>;
//     password: FormControl<string | null>;
//     imagenPerfil1: FormControl<File | null>;
//     imagenPerfil2: FormControl<File | null>;
//   }>;

//   constructor(
//     private fb: FormBuilder,
//     private sb: SupabaseService            // <— NUEVO
//   ) {}

//   ngOnInit(): void {
//     this.registroPacienteForm = this.fb.group({
//       nombre: this.fb.control<string | null>(null, Validators.required),
//       apellido: this.fb.control<string | null>(null, Validators.required),
//       edad: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
//       dni: this.fb.control<string | null>(null, Validators.required),
//       obraSocial: this.fb.control<string | null>(null, Validators.required),
//       email: this.fb.control<string | null>(null, [Validators.required, Validators.email]),
//       password: this.fb.control<string | null>(null, Validators.required),
//       imagenPerfil1: this.fb.control<File | null>(null, Validators.required),
//       imagenPerfil2: this.fb.control<File | null>(null, Validators.required),
//     });
//   }

//   onFileChange(event: Event, idx: 1 | 2): void {
//     const input = (event.target as HTMLInputElement);
//     if (!input.files?.length) return;
//     const file = input.files[0];
//     const control = idx === 1 ? 'imagenPerfil1' : 'imagenPerfil2';
//     this.registroPacienteForm.get(control)!.setValue(file);
//     this.registroPacienteForm.get(control)!.markAsDirty();

//     const reader = new FileReader();
//     reader.onload = () => {
//       if (idx === 1) this.imagenPrevia1 = reader.result as string;
//       else this.imagenPrevia2 = reader.result as string;
//     };
//     reader.readAsDataURL(file);
//   }

//   private ext(file: File): string {
//     const parts = file.name.split('.');
//     return parts.length > 1 ? `.${parts.pop()}` : '';
//   }

//   async onSubmit(): Promise<void> {
//     if (this.registroPacienteForm.invalid) {
//       this.registroPacienteForm.markAllAsTouched();
//       return;
//     }

//     this.loading = true;
//     const supabase = this.sb.client;
//     const fv = this.registroPacienteForm.value!;

//     try {
//       // 1) Crea el usuario en Auth
//       const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
//         email: fv.email!,
//         password: fv.password!,
//         options: {
//           // Puedes guardar metadatos mínimos
//           data: { rol: 'paciente', nombre: fv.nombre, apellido: fv.apellido }
//         }
//       });
//       if (signUpError) throw signUpError;

//       const user = signUpData.user;
//       if (!user) throw new Error('No se pudo obtener el usuario recién creado.');

//       // Si tu proyecto requiere confirmación de email, no habrá session aquí.
//       if (!signUpData.session) {
//         Swal.fire({
//           icon: 'info',
//           title: 'Confirma tu correo',
//           text: 'Te enviamos un email. Confírmalo para iniciar sesión y completar tu perfil.',
//           confirmButtonText: 'Entendido'
//         });
//         // En este caso no podemos subir archivos ni escribir en la tabla por RLS.
//         // Sugerencia: al iniciar sesión luego, mostrás una pantalla "Completar perfil".
//         return;
//       }

//       // 2) Subir imágenes a Storage (bucket privado 'pacientes/userId/...')
//       const file1 = fv.imagenPerfil1!;
//       const file2 = fv.imagenPerfil2!;
//       const path1 = `${user.id}/perfil_1_${Date.now()}${this.ext(file1)}`;
//       const path2 = `${user.id}/perfil_2_${Date.now()}${this.ext(file2)}`;

//       const up1 = await supabase.storage.from('pacientes')
//         .upload(path1, file1, { upsert: true, contentType: file1.type });
//       if (up1.error) throw up1.error;

//       const up2 = await supabase.storage.from('pacientes')
//         .upload(path2, file2, { upsert: true, contentType: file2.type });
//       if (up2.error) throw up2.error;

//       // 3) Insertar el registro en la tabla 'pacientes'
//       // IMPORTANTE: no guardes password en la tabla.
//       const { error: insertError } = await supabase
//         .from('pacientes')
//         .insert({
//           id: user.id,
//           nombre: fv.nombre!,
//           apellido: fv.apellido!,
//           edad: fv.edad!,
//           dni: fv.dni!,
//           obra_social: fv.obraSocial!,
//           email: fv.email!,
//           imagen1_path: path1,
//           imagen2_path: path2
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
//       this.imagenPrevia1 = this.imagenPrevia2 = null;

//     } catch (err: any) {
//       console.error(err);
//       Swal.fire('Error', err.message || String(err), 'error');
//     } finally {
//       this.loading = false;
//     }
//   }
// }






// import { CommonModule } from '@angular/common';
// import { Component, OnInit } from '@angular/core';
// import {
//   FormBuilder,
//   FormGroup,
//   Validators,
//   FormControl,
//   ReactiveFormsModule
// } from '@angular/forms';

// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatCardModule } from '@angular/material/card';

// import Swal from 'sweetalert2';

// // import { AngularFireStorage }       from '@angular/fire/compat/storage';
// // import { createUserWithEmailAndPassword, Auth } from '@angular/fire/auth';
// import { forkJoin, firstValueFrom } from 'rxjs';
// // import { FirestoreService } from '../../services/firestore.service';

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
//   styleUrls: ['./registro-paciente.component.css']
// })
// export class RegistroPacienteComponent implements OnInit {
//   imagenPrevia1: string | null = null;
//   imagenPrevia2: string | null = null;
//   loading = false;

//   registroPacienteForm!: FormGroup<{
//     nombre: FormControl<string | null>;
//     apellido: FormControl<string | null>;
//     edad: FormControl<number | null>;
//     dni: FormControl<string | null>;
//     obraSocial: FormControl<string | null>;
//     email: FormControl<string | null>;
//     password: FormControl<string | null>;
//     imagenPerfil1: FormControl<File | null>;
//     imagenPerfil2: FormControl<File | null>;
//   }>;

//   constructor(
//     private fb: FormBuilder,
//     // private fsService: FirestoreService,
//     // private afStorage: AngularFireStorage,   // compat, zone-aware
//     // private auth: Auth                       // modular Auth
//   ) { }

//   ngOnInit(): void {
//     this.registroPacienteForm = this.fb.group({
//       nombre: this.fb.control<string | null>(null, Validators.required),
//       apellido: this.fb.control<string | null>(null, Validators.required),
//       edad: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
//       dni: this.fb.control<string | null>(null, Validators.required),
//       obraSocial: this.fb.control<string | null>(null, Validators.required),
//       email: this.fb.control<string | null>(null, [Validators.required, Validators.email]),
//       password: this.fb.control<string | null>(null, Validators.required),
//       imagenPerfil1: this.fb.control<File | null>(null, Validators.required),
//       imagenPerfil2: this.fb.control<File | null>(null, Validators.required),
//     });
//   }

//   onFileChange(event: Event, idx: 1 | 2): void {
//     const input = (event.target as HTMLInputElement);
//     if (!input.files?.length) return;
//     const file = input.files[0];
//     const control = idx === 1 ? 'imagenPerfil1' : 'imagenPerfil2';
//     this.registroPacienteForm.get(control)!.setValue(file);
//     this.registroPacienteForm.get(control)!.markAsDirty();

//     const reader = new FileReader();
//     reader.onload = () => {
//       if (idx === 1) this.imagenPrevia1 = reader.result as string;
//       else this.imagenPrevia2 = reader.result as string;
//     };
//     reader.readAsDataURL(file);
//   }


//   //- --------------------------------------

//   async onSubmit(): Promise<void> {
//     if (this.registroPacienteForm.invalid) {
//       this.registroPacienteForm.markAllAsTouched();
//       return;
//     }
//     this.loading = true;
//     const fv = this.registroPacienteForm.value!;

//     try {
//       // 1) Crea y loguea al paciente
//       await createUserWithEmailAndPassword(this.auth, fv.email!, fv.password!);

//       // 2) Prepara las subidas
//       const file1 = fv.imagenPerfil1!;
//       const file2 = fv.imagenPerfil2!;
//       const path1 = `pacientes/${Date.now()}_${file1.name}`;
//       const path2 = `pacientes/${Date.now()}_${file2.name}`;

//       const task1 = this.afStorage.upload(path1, file1);
//       const task2 = this.afStorage.upload(path2, file2);
//       const ref1 = this.afStorage.ref(path1);
//       const ref2 = this.afStorage.ref(path2);

//       // 3) Espera a que terminen las subidas
//       await firstValueFrom(task1.snapshotChanges());
//       await firstValueFrom(task2.snapshotChanges());

//       // 4) Obtiene las URLs
//       const [url1, url2] = await Promise.all([
//         firstValueFrom(ref1.getDownloadURL()),
//         firstValueFrom(ref2.getDownloadURL())
//       ]);

//       // 5) Guarda en Firestore
//       const nuevoPaciente = {
//         nombre: fv.nombre!,
//         apellido: fv.apellido!,
//         edad: fv.edad!,
//         dni: fv.dni!,
//         obraSocial: fv.obraSocial!,
//         email: fv.email!,
//         password: fv.password!,
//         imagenPerfil1: url1,
//         imagenPerfil2: url2
//       };
//       const docRef = await this.fsService.addPaciente(nuevoPaciente);
//       await this.fsService.updatePaciente(docRef.id, { id: docRef.id });

//       // 6) Éxito
//       Swal.fire({
//         icon: 'success',
//         title: 'Paciente registrado con éxito',
//         showConfirmButton: false,
//         timer: 2000
//       });
//       this.registroPacienteForm.reset();
//       this.imagenPrevia1 = this.imagenPrevia2 = null;

//     } catch (err: any) {
//       console.error(err);
//       Swal.fire('Error', err.message || err, 'error');
//     } finally {
//       this.loading = false;
//     }
//   }

// }








// import { Component } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { AuthService } from '../../../services/auth.service';

// @Component({
//   standalone: true,
//   selector: 'app-register',
//   imports: [FormsModule, CommonModule],
//   templateUrl: './registro-paciente.component.html',
//   styleUrls: ['./registro-paciente.component.scss']
// })
// export class RegistroPacienteComponent {
//   formulario = {
//     email: '',
//     contrasenia: '',
//     nombre: '',
//     apellido: '',
//     fechaNacimiento: ''
//   };

//   cargando = false;
//   mensajeDeError = '';
//   mensajeInformativo = '';

//   constructor(private enrutador: Router, private autenticacion: AuthService) {}

//   async registrarse() {
//     if (this.cargando) return;

//     this.cargando = true;
//     this.mensajeDeError = '';
//     this.mensajeInformativo = '';

//     // Validaciones rápidas en front (opcional pero útil)
//     if (!this.formulario.email?.trim()) {
//       this.mensajeDeError = 'Ingresá un correo electrónico.';
//       this.cargando = false; return;
//     }
//     if (!this.formulario.contrasenia || this.formulario.contrasenia.length < 6) {
//       this.mensajeDeError = 'La contraseña debe tener al menos 6 caracteres.';
//       this.cargando = false; return;
//     }

//     try {
//       const { data, error } = await this.autenticacion.client.auth.signUp({
//         email: this.formulario.email.trim(),
//         password: this.formulario.contrasenia,
//         options: { emailRedirectTo: window.location.origin + '/login' }
//       });
//       if (error) throw error;

//       const usuario = data.user ?? null;

//       // Si usás confirmación por email, normalmente no hay sesión todavía
//       if (!usuario) {
//         this.mensajeInformativo =
//           'Revisá tu correo para confirmar la cuenta. Luego podés iniciar sesión.';
//         await this.enrutador.navigate(['/login']);
//         return;
//       }

//       // Si hubo autologin (confirmación desactivada), pasamos a Home
//       await this.enrutador.navigate(['/home']);
//     } catch (e: any) {
//       console.error(e);
//       this.mensajeDeError = this.traducirErrorRegistro(e);
//     } finally {
//       this.cargando = false;
//     }
//   }

//   // --- Traducción de errores comunes de Supabase/Gotrue a castellano ---
//   private traducirErrorRegistro(e: any): string {
//     const msg = (e?.message || '').toLowerCase();
//     const code = (e as any)?.code?.toString().toLowerCase?.() ?? '';
//     const status = Number((e as any)?.status ?? 0);

//     // Ya registrado
//     if (
//       code.includes('user_already_exists') ||
//       msg.includes('already registered') ||
//       msg.includes('already exists') ||
//       status === 422
//     ) {
//       return 'Ese correo ya está registrado. Probá iniciar sesión o recuperar la contraseña.';
//     }

//     // Email inválido
//     if (msg.includes('invalid email') || msg.includes('email not valid')) {
//       return 'El correo no es válido.';
//     }

//     // Password corto o débil
//     if (msg.includes('at least 6') || msg.includes('password should') || msg.includes('weak password')) {
//       return 'La contraseña debe tener al menos 6 caracteres.';
//     }

//     // Rate limit / demasiadas solicitudes
//     if (msg.includes('too many') || msg.includes('rate limit') || status === 429) {
//       return 'Demasiados intentos. Intentá nuevamente en unos minutos.';
//     }

//     // Errores de red/servidor
//     if (status >= 500) {
//       return 'Servidor temporalmente no disponible. Probá más tarde.';
//     }
//     if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
//       return 'No hay conexión. Verificá tu internet e intentá de nuevo.';
//     }

//     // Fallback
//     return 'No se pudo completar el registro.';
//   }

//   // Utilidad
//   private calcularEdad(fechaIso: string): number {
//     const d = new Date(fechaIso);
//     const ahora = new Date();
//     let edad = ahora.getFullYear() - d.getFullYear();
//     const mes = ahora.getMonth() - d.getMonth();
//     if (mes < 0 || (mes === 0 && ahora.getDate() < d.getDate())) edad--;
//     return edad;
//   }
// }







// // import { CommonModule } from '@angular/common';
// // import { Component, OnInit } from '@angular/core';
// // import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// // import { MatFormFieldModule } from '@angular/material/form-field';
// // import { MatInputModule } from '@angular/material/input';
// // import { MatButtonModule } from '@angular/material/button';
// // import { MatCardModule } from '@angular/material/card';
// // import { MatGridListModule } from '@angular/material/grid-list';
// // import Swal from 'sweetalert2';
// // import { SupabaseService } from '../../../services/supabase.service';

// // @Component({
// //   selector: 'app-registro-paciente',
// //   standalone: true,
// //   imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatGridListModule],
// //   templateUrl: './registro-paciente.component.html',
// //   styleUrls: ['./registro-paciente.component.scss'] // <- corregido
// // })
// // export class RegistroPacienteComponent implements OnInit {
// //   form!: FormGroup;
// //   imgPrev1: string | null = null;
// //   imgPrev2: string | null = null;
// //   loading = false;

// //   constructor(private fb: FormBuilder, private supa: SupabaseService) {}

// //   async ngOnInit(): Promise<void> {
// //     // 1) Crear el form PRIMERO (sin await antes)
// //     this.form = this.fb.group({
// //       nombre: ['', Validators.required],
// //       apellido: ['', Validators.required],
// //       dni: ['', Validators.required],
// //       obraSocial: [''],
// //       fechaNacimiento: [null, Validators.required],
// //       email: ['', [Validators.required, Validators.email]],
// //       password: ['', [Validators.required, Validators.minLength(6)]],
// //       imagenPerfil1: [null, Validators.required],
// //       imagenPerfil2: [null, Validators.required],
// //     });

// //     // 2) (Opcional) Ping a Supabase DESPUÉS de tener el form
// //     try {
// //       const { data, error } = await this.supa.client.from('profiles').select('id').limit(1);
// //       console.log('ping supabase', { data, error });
// //     } catch (e) {
// //       console.error('ping supabase error', e);
// //     }
// //   }

// //   onFileChange(ev: Event, idx: 1 | 2) {
// //     const input = ev.target as HTMLInputElement;
// //     if (!input.files?.length) return;
// //     const file = input.files[0];

// //     const ctrlName = idx === 1 ? 'imagenPerfil1' : 'imagenPerfil2';
// //     const ctrl = this.form.get(ctrlName)!;

// //     ctrl.setValue(file);
// //     ctrl.markAsDirty();
// //     ctrl.markAsTouched();
// //     ctrl.updateValueAndValidity(); // ← asegura que Required pase

// //     const r = new FileReader();
// //     r.onload = () => idx === 1 ? this.imgPrev1 = r.result as string : this.imgPrev2 = r.result as string;
// //     r.readAsDataURL(file);
// //   }

// //   async onSubmit() {
// //     if (this.form.invalid) { this.form.markAllAsTouched(); return; }
// //     this.loading = true;

// //     try {
// //       const fv = this.form.value;

// //       // 1) Alta en Auth (envía email de verificación)
// //       const { data, error }: any = await this.supa.signUp(fv.email, fv.password);
// //       if (error) throw error;
// //       const userId = data.user.id as string;

// //       // 2) Subir imágenes al bucket
// //       const url1 = await this.supa.uploadAvatar(userId, fv.imagenPerfil1, 1);
// //       const url2 = await this.supa.uploadAvatar(userId, fv.imagenPerfil2, 2);

// //       // 3) Upsert profile
// //       await this.supa.upsertPerfil({
// //         id: userId,
// //         rol: 'paciente',
// //         nombre: fv.nombre,
// //         apellido: fv.apellido,
// //         dni: fv.dni,
// //         obra_social: fv.obraSocial || null,
// //         fecha_nacimiento: fv.fechaNacimiento,
// //         email: fv.email,
// //         avatar_url: url1,
// //         imagen2_url: url2,
// //         aprobado: true
// //       });

// //       await Swal.fire('Registro exitoso', 'Verificá tu email antes de ingresar', 'success');
// //       this.form.reset(); this.imgPrev1 = this.imgPrev2 = null;
// //     } catch (e: any) {
// //       await Swal.fire('Error', e.message || e, 'error');
// //     } finally {
// //       this.loading = false;
// //     }
// //   }
// // }






// // // import { CommonModule } from '@angular/common';
// // // import { Component, OnInit } from '@angular/core';
// // // import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// // // import { MatFormFieldModule } from '@angular/material/form-field';
// // // import { MatInputModule } from '@angular/material/input';
// // // import { MatButtonModule } from '@angular/material/button';
// // // import { MatCardModule } from '@angular/material/card';
// // // import { SupabaseService } from '../../../services/supabase.service';

// // // //import {  MatGridTile, MatGridList } from '@angular/material/grid-list';
// // // import { MatGridListModule } from '@angular/material/grid-list';
// // // import Swal from 'sweetalert2';

// // // @Component({
// // //   selector: 'app-registro-paciente',
// // //   standalone: true,
// // //   imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatGridListModule],
// // //   templateUrl: './registro-paciente.component.html',
// // //   styleUrl: './registro-paciente.component.scss'
// // // })
// // // export class RegistroPacienteComponent implements OnInit {
// // //   form!: FormGroup;
// // //   imgPrev1: string | null = null;
// // //   imgPrev2: string | null = null;
// // //   loading = false;

// // //   constructor(private fb: FormBuilder, private supa: SupabaseService) { }

// // //   // const { data, error } = await this.supa.client.from('profiles').select('id').limit(1);
// // //   // console.log('ping supabase', { data, error });

// // //   // registro-paciente.component.ts
// // //   async ngOnInit(): Promise<void> {
// // //     try {
// // //       const { data, error } = await this.supa.client
// // //         .from('profiles')
// // //         .select('id')
// // //         .limit(1);

// // //       console.log('ping supabase', { data, error });
// // //     } catch (e) {
// // //       console.error('ping supabase error', e);
// // //     }

// // //     this.form = this.fb.group({
// // //       nombre: ['', Validators.required],
// // //       apellido: ['', Validators.required],
// // //       dni: ['', Validators.required],
// // //       obraSocial: [''],
// // //       fechaNacimiento: [null, Validators.required],
// // //       email: ['', [Validators.required, Validators.email]],
// // //       password: ['', Validators.required],
// // //       imagenPerfil1: [null, Validators.required],
// // //       imagenPerfil2: [null, Validators.required],
// // //     });
// // //   }

// // //   onFileChange(ev: Event, idx: 1 | 2) {
// // //     const input = ev.target as HTMLInputElement;
// // //     if (!input.files?.length) return;
// // //     const file = input.files[0];
// // //     this.form.get(idx === 1 ? 'imagenPerfil1' : 'imagenPerfil2')!.setValue(file);
// // //     const r = new FileReader();
// // //     r.onload = () => idx === 1 ? this.imgPrev1 = r.result as string : this.imgPrev2 = r.result as string;
// // //     r.readAsDataURL(file);
// // //   }

// // //   async onSubmit() {
// // //     if (this.form.invalid) { this.form.markAllAsTouched(); return; }
// // //     this.loading = true;

// // //     try {
// // //       const fv = this.form.value;

// // //       // 1) Alta en Auth (envía email de verificación)
// // //       const { data, error }: any = await this.supa.signUp(fv.email, fv.password);
// // //       if (error) throw error;
// // //       const userId = data.user.id as string;

// // //       // 2) Subir imágenes al bucket /<uid>/**
// // //       const url1 = await this.supa.uploadAvatar(userId, fv.imagenPerfil1, 1);
// // //       const url2 = await this.supa.uploadAvatar(userId, fv.imagenPerfil2, 2);

// // //       // 3) Upsert profile (rol PACIENTE por defecto; especialista lo verá Admin)
// // //       await this.supa.upsertPerfil({
// // //         id: userId,
// // //         rol: 'paciente',
// // //         nombre: fv.nombre,
// // //         apellido: fv.apellido,
// // //         dni: fv.dni,
// // //         obra_social: fv.obraSocial || null,
// // //         fecha_nacimiento: fv.fechaNacimiento,  // <- FECHA DE NACIMIENTO PARA SACAR LA EDAD
// // //         email: fv.email,
// // //         avatar_url: url1,
// // //         imagen2_url: url2,
// // //         aprobado: true // paciente no requiere aprobacion - especialista si
// // //       });

// // //       Swal.fire('Registro exitoso', 'Verificá tu email antes de ingresar', 'success');
// // //       this.form.reset(); this.imgPrev1 = this.imgPrev2 = null;

// // //     } catch (e: any) {
// // //       Swal.fire('Error', e.message || e, 'error');
// // //     } finally {
// // //       this.loading = false;
// // //     }
// // //   }
// // // }





// // // // import { Component } from '@angular/core';

// // // // @Component({
// // // //   selector: 'app-registro-paciente',
// // // //   standalone: true,
// // // //   imports: [],
// // // //   templateUrl: './registro-paciente.component.html',
// // // //   styleUrl: './registro-paciente.component.scss'
// // // // })
// // // // export class RegistroPacienteComponent {

// // // // }


// // // // ngOnInit(): void {
// // // //   const { data, error } = await this.supa.client.from('profiles').select('id').limit(1);
// // // //   console.log('ping supabase', { data, error });
// // // //   this.form = this.fb.group({
// // // //     nombre: ['', Validators.required],
// // // //     apellido: ['', Validators.required],
// // // //     dni: ['', Validators.required],
// // // //     obraSocial: [''],
// // // //     fechaNacimiento: [null, Validators.required],
// // // //     email: ['', [Validators.required, Validators.email]],
// // // //     password: ['', Validators.required],
// // // //     imagenPerfil1: [null, Validators.required],
// // // //     imagenPerfil2: [null, Validators.required],
// // // //   });
// // // // }
