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

import { NgxCaptchaModule } from 'ngx-captcha';



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
    NgxCaptchaModule
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
    recaptcha: FormControl<string | null>;   // 👈 AGREGADO
  }>;


  siteKey: string = '6LfbWxksAAAAABoUdgGEoUv5pvnjJ_TPcje3jb7P';


  // Para limitar el <input type="date">
  maxDateISO!: string;        // hoy
  readonly minDateISO = '1900-01-01';

  constructor(
    private fb: FormBuilder,
    private sb: SupabaseService,
    private router: Router,
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
      email: this.fb.control<string | null>(
        null,
        [Validators.required, Validators.email]
      ),
      password: this.fb.control<string | null>(null, Validators.required),
      imagenPerfil1: this.fb.control<File | null>(null, Validators.required),
      imagenPerfil2: this.fb.control<File | null>(null, Validators.required),

      //PARA EL CAPTCHA
      recaptcha: this.fb.control<string | null>(null, Validators.required),
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


  private async validarDniYEmailUnicos(dni: string, email: string): Promise<void> {
    const supabase = this.sb.client;

    // 1) Verificar DNI
    const { data: dniRows, error: dniError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('dni', dni)
      .limit(1);

    if (dniError) {
      console.error('[validarDniYEmailUnicos] Error al validar DNI:', dniError);
      throw new Error('No se pudo validar el DNI. Intentá nuevamente en unos minutos.');
    }

    if (dniRows && dniRows.length > 0) {
      throw new Error('El DNI ya existe en el sistema.');
    }

    // 2) Verificar Email
    const { data: emailRows, error: emailError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (emailError) {
      console.error('[validarDniYEmailUnicos] Error al validar email:', emailError);
      throw new Error('No se pudo validar el correo electrónico. Intentá nuevamente.');
    }

    if (emailRows && emailRows.length > 0) {
      throw new Error('El correo ya está registrado en el sistema.');
    }

    // Si llega hasta acá, está todo libre 👌
  }



  private mapPgError(err: any): string {
    const msg: string = (err?.message || '').toLowerCase();
    const code: string | undefined = err?.code;
    const status: number | undefined = err?.status;

    // Log para debugging - ver qué error exacto estamos recibiendo
    console.log('[mapPgError] Analizando error:', { msg, code, status, fullError: err });

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

    const mensajeOriginal = err?.message || String(err) || 'Ocurrió un error inesperado.';
    console.warn('[mapPgError] Error no manejado específicamente:', mensajeOriginal);
    return mensajeOriginal;
  }

  // ---- SUBMIT ---

  async onSubmit(): Promise<void> {
    this.loading = true;
    const supabase = this.sb.client;
    const fv = this.registroPacienteForm.value!;

    if (!fv.imagenPerfil1 || !fv.imagenPerfil2) {
      Swal.fire('Error', 'Por favor, seleccioná ambas imágenes de perfil.', 'error');
      this.loading = false;
      return;
    }

    try {
      //  ============> VALIDAR DNI Y EMAIL EN LA TABLA ANTES DE CREAR EL USUARIO EN AUTH
      await this.validarDniYEmailUnicos(fv.dni!, fv.email!);

      // 1) Crear usuario en Auth con metadata básica
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fv.email!,
        password: fv.password!,
        options: {
          data: {
            rol: 'PACIENTE',
            nombre: fv.nombre,
            apellido: fv.apellido,
            dni: fv.dni,
            fecha_nacimiento: fv.fechaNacimiento,
            obra_social: fv.obraSocial,
          }
        }
      });

      if (signUpError) throw signUpError;

      const user = signUpData.user;
      if (!user) throw new Error('No se pudo crear el usuario.');

      const userId = user.id;
      const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);

      // 2) Upsert en esquema_clinica.usuarios
      const { error: usuarioError } = await supabase
        .from('usuarios')
        .upsert({
          id: userId,
          nombre: fv.nombre!,
          apellido: fv.apellido!,
          dni: fv.dni!,
          email: fv.email!,
          password: fv.password!, // idealmente un hash
          perfil: 'PACIENTE',
          edad: edadCalculada,
          obra_social: fv.obraSocial ?? null,
          esta_aprobado: true,
          mail_verificado: !!signUpData.session
        }, { onConflict: 'id' });

      if (usuarioError) throw usuarioError;

      // 3) Resto de tu código (verificación de mail, subida de imágenes, etc.)
      if (!signUpData.session) {
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

      // Subida de imágenes...
      const file1 = fv.imagenPerfil1!;
      const file2 = fv.imagenPerfil2!;

      const url1 = await this.sb.uploadAvatar(userId, file1, 1);
      const url2 = await this.sb.uploadAvatar(userId, file2, 2);

      const { error: avatarError } = await supabase
        .from('usuarios')
        .update({
          imagen_perfil_1: url1,
          imagen_perfil_2: url2
        })
        .eq('id', userId);

      if (avatarError) throw avatarError;

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
