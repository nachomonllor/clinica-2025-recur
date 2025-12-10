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

// Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

// Servicios, Utils y Entorno
import Swal from 'sweetalert2';
import { SupabaseService } from '../../../services/supabase.service';
// Asegúrate de que la ruta a environment sea correcta según tu estructura
import { environment } from '../../../environments/environment'; 

// Captcha Propio
import { CaptchaPropioComponent } from '../../components/captcha-propio/captcha-propio.component';
import { FabBienvenidaComponent } from '../fab-bienvenida/fab-bienvenida.component';

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
    FabBienvenidaComponent,
    CaptchaPropioComponent
  ],
  templateUrl: './registro-paciente.component.html',
  styleUrls: ['./registro-paciente.component.scss']
})
export class RegistroPacienteComponent implements OnInit {
  
  loading = false;
  imagenPrevia1: string | null = null;
  imagenPrevia2: string | null = null;

 
  captchaHabilitado: boolean = environment.captchaEnabled; 
   // captchaHabilitado: boolean = false;

  // Variable de control para el Captcha Propio
  // Si el captcha está deshabilitado (false)  entonces inicia como resuelto (true) para permitir el submit.
  captchaPropioResuelto: boolean = !this.captchaHabilitado;

  registroPacienteForm!: FormGroup<{
    nombre: FormControl<string | null>;
    apellido: FormControl<string | null>;
    fechaNacimiento: FormControl<string | null>;
    dni: FormControl<string | null>;
    obraSocial: FormControl<string | null>;
    email: FormControl<string | null>;
    password: FormControl<string | null>;
    imagenPerfil1: FormControl<File | null>;
    imagenPerfil2: FormControl<File | null>;
  }>;

  maxDateISO!: string;
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
      password: this.fb.control<string | null>(null, [
        Validators.required, 
        Validators.minLength(6)
      ]),
      imagenPerfil1: this.fb.control<File | null>(null, Validators.required),
      imagenPerfil2: this.fb.control<File | null>(null, Validators.required),
    });
  }

  // ---------------------------------------------------------------
  // ESCUCHA DEL EVENTO DEL CAPTCHA PROPIO
  // ---------------------------------------------------------------
  onCaptchaValid(esValido: boolean): void {
    // Solo actualizamos si el captcha está habilitado.
    // Si está deshabilitado, ya es true por defecto.
    if (this.captchaHabilitado) {
      console.log('[Registro Paciente] Estado Captcha:', esValido);
      this.captchaPropioResuelto = esValido;
    }
  }

  // ---------------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------------
  async onSubmit(): Promise<void> {
    // 1. Validar formulario
    if (this.registroPacienteForm.invalid) {
      this.registroPacienteForm.markAllAsTouched();
      return;
    }

    // 2. Validar CAPTCHA PROPIO (Solo importa si es false)
    if (!this.captchaPropioResuelto) {
      Swal.fire({
        title: 'Captcha requerido',
        text: 'Por favor, completá correctamente el desafío de seguridad.',
        icon: 'warning',
        confirmButtonText: 'Ok'
      });
      return;
    }

    this.loading = true;
    const supabase = this.sb.client;
    const fv = this.registroPacienteForm.value!;

    try {
      // Validar duplicados antes de intentar registrar en Auth
      await this.validarDniYEmailUnicos(fv.dni!, fv.email!);

      // Crear usuario en Auth
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

      // Guardar datos en tabla usuarios
      const { error: usuarioError } = await supabase
        .from('usuarios')
        .upsert({
          id: userId,
          nombre: fv.nombre!,
          apellido: fv.apellido!,
          dni: fv.dni!,
          email: fv.email!,
          password: fv.password!, 
          perfil: 'PACIENTE',
          edad: edadCalculada,
          obra_social: fv.obraSocial ?? null,
          esta_aprobado: true,
          mail_verificado: !!signUpData.session
        }, { onConflict: 'id' });

      if (usuarioError) throw usuarioError;

      // Subir imágenes
      if (fv.imagenPerfil1 && fv.imagenPerfil2) {
        const url1 = await this.sb.uploadAvatar(userId, fv.imagenPerfil1, 1);
        const url2 = await this.sb.uploadAvatar(userId, fv.imagenPerfil2, 2);

        await supabase.from('usuarios').update({
          imagen_perfil_1: url1,
          imagen_perfil_2: url2
        }).eq('id', userId);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Paciente registrado',
        text: !signUpData.session ? 'Por favor verificá tu correo.' : 'Registro exitoso.',
        showConfirmButton: true
      });

      await supabase.auth.signOut();
      this.router.navigate(['/bienvenida']);

    } catch (err: any) {
      console.error('[Registro Paciente] Error:', err);
      Swal.fire('Error', this.mapPgError(err), 'error');
    } finally {
      this.loading = false;
    }
  }

  // ---------------------------------------------------------------
  // MANEJO DE ARCHIVOS
  // ---------------------------------------------------------------
  onFileChange(event: Event, idx: 1 | 2): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const controlName = idx === 1 ? 'imagenPerfil1' : 'imagenPerfil2';

    this.registroPacienteForm.get(controlName)!.setValue(file);
    this.registroPacienteForm.get(controlName)!.markAsDirty();
    this.registroPacienteForm.get(controlName)!.markAsTouched();

    const reader = new FileReader();
    reader.onload = () => {
      if (idx === 1) this.imagenPrevia1 = reader.result as string;
      else this.imagenPrevia2 = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // ---------------------------------------------------------------
  // VALIDACIONES PRIVADAS
  // ---------------------------------------------------------------
  
  static fechaNacimientoValidator(control: AbstractControl): ValidationErrors | null {
    const v = control.value as string | null;
    if (!v) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return { formato: true };

    const [y, m, d] = v.split('-').map(Number);
    const today = new Date();
    const nowY = today.getFullYear();
    const nowM = today.getMonth() + 1;
    const nowD = today.getDate();

    let edad = nowY - y;
    if (nowM < m || (nowM === m && nowD < d)) edad--;

    if (edad < 0) return { futuro: true };
    if (edad > 120) return { rango: true };

    return null;
  }

  private async validarDniYEmailUnicos(dni: string, email: string): Promise<void> {
    const supabase = this.sb.client;

    const { data: dniRows, error: dniError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('dni', dni)
      .limit(1);

    if (dniError) throw new Error('Error al validar DNI.');
    if (dniRows && dniRows.length > 0) throw new Error('El DNI ya existe en el sistema.');

    const { data: emailRows, error: emailError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (emailError) throw new Error('Error al validar email.');
    if (emailRows && emailRows.length > 0) throw new Error('El correo ya está registrado.');
  }

  private mapPgError(err: any): string {
    const msg: string = (err?.message || '').toLowerCase();
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return 'Este usuario ya está registrado.';
    }
    if (msg.includes('password') && (msg.includes('weak') || msg.includes('at least'))) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    return err?.message || 'Error desconocido';
  }

  private toISODateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
}










