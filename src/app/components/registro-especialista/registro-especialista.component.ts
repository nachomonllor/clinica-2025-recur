import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';

import Swal from 'sweetalert2';
import { SupabaseService } from '../../../services/supabase.service';
import { environment } from '../../../environments/environment';
import { CaptchaComponent } from '../captcha/captcha.component';

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';


// ===== Validadores para selección múltiple =====
function minSelected(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string[] | null | undefined;
    const len = Array.isArray(v) ? v.filter(Boolean).length : 0;
    return len >= min ? null : { minSelected: { min } };
  };
}
function maxSelected(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value as string[] | null | undefined;
    const len = Array.isArray(v) ? v.filter(Boolean).length : 0;
    return len <= max ? null : { maxSelected: { max } };
  };
}

@Component({
  selector: 'app-registro-especialista',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    CaptchaComponent,
  
    // MatSelectModule,  // <- ya no hace falta si no lo usás en otro lado
   
    MatButtonToggleModule, // NUEVO
    MatIconModule,         // NUEVO
  ],
  templateUrl: './registro-especialista.component.html',
  styleUrls: ['./registro-especialista.component.scss']
})
export class RegistroEspecialistaComponent implements OnInit {

  // ===== UI / estado =====
  loading = false;
  imagenPrevia: string | null = null;

  // ===== Captcha =====
  captchaEnabled = environment.captchaEnabled;
  captchaValido = !environment.captchaEnabled;

  // ===== Fechas (mismo manejo que Paciente) =====
  maxDateISO!: string;               // hoy (p/ <input type="date">)
  readonly minDateISO = '1900-01-01';

  // ===== Especialidades =====
  especialidadesBaseFijas = [
    'Cardiología', 'Dermatología', 'Ginecología', 'Pediatría', 'Neurología'
  ];
  especialidadesBase: string[] = [];
  readonly maxEspecialidades = 3;

  // ===== Form (typed) =====
  registroForm!: FormGroup<{
    nombre: FormControl<string | null>;
    apellido: FormControl<string | null>;
    dni: FormControl<string | null>;
    fechaNacimiento: FormControl<string | null>; // 'YYYY-MM-DD'
    email: FormControl<string | null>;
    password: FormControl<string | null>;
    especialidades: FormControl<string[] | null>;
    otraEspecialidad: FormControl<string | null>;
    imagenPerfil: FormControl<File | null>;
  }>;

  get especialidadesSeleccionadas(): string[] {
    return (this.registroForm?.get('especialidades')?.value as string[]) || [];
  }


  constructor(
    public fb: FormBuilder,
    public supa: SupabaseService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    this.maxDateISO = this.toISODateLocal(new Date());

    this.registroForm = this.fb.group({
      nombre: this.fb.control<string | null>(null, Validators.required),
      apellido: this.fb.control<string | null>(null, Validators.required),
      dni: this.fb.control<string | null>(null, Validators.required),
      fechaNacimiento: this.fb.control<string | null>(
        null,
        [Validators.required, RegistroEspecialistaComponent.fechaNacimientoValidator]
      ),
      email: this.fb.control<string | null>(null, [Validators.required, Validators.email]),
      password: this.fb.control<string | null>(null, Validators.required),

      especialidades: this.fb.control<string[] | null>([], [
        Validators.required,
        minSelected(1),
        maxSelected(this.maxEspecialidades)
      ]),
      otraEspecialidad: this.fb.control<string | null>(null),
      imagenPerfil: this.fb.control<File | null>(null, Validators.required),
    });

    // "Otro" => obliga a completar el campo libre
    this.registroForm.get('especialidades')!.valueChanges.subscribe(vals => {
      const ctrl = this.registroForm.get('otraEspecialidad')!;
      if (vals?.includes('Otro')) {
        ctrl.setValidators([Validators.required]);
      } else {
        ctrl.clearValidators();
        ctrl.setValue(null);
      }
      ctrl.updateValueAndValidity();
    });

    await this.cargarEspecialidades();
  }

  // ======= Validaciones fecha de nacimiento =======

  static fechaNacimientoValidator(control: AbstractControl): ValidationErrors | null {
    const v = control.value as string | null;
    if (!v) return null; // 'required' se maneja aparte
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

  // ======================================================
  // Cargar catálogo de especialidades (esquema_clinica.especialidades)
  // ======================================================
  async cargarEspecialidades(): Promise<void> {
    try {
      let lista: string[] = [];

      const { data, error } = await this.supa.client
        .from('especialidades')
        .select('nombre')
        .order('nombre');

      if (!error && Array.isArray(data) && data.length) {
        lista = data
          .map((r: any) => (r?.nombre ?? '').toString().trim())
          .filter(Boolean);
      }

      const todas = new Set<string>(this.especialidadesBaseFijas);
      lista.forEach(e => { if (e && !this.especialidadesBaseFijas.includes(e)) todas.add(e); });
      this.especialidadesBase = Array.from(todas).sort();
      if (!this.especialidadesBase.includes('Otro')) this.especialidadesBase.push('Otro');

    } catch (err) {
      console.error('[RegistroEspecialista] Error al cargar especialidades', err);
      this.especialidadesBase = [...this.especialidadesBaseFijas, 'Otro'];
    }
  }

  // ======================================================
  // Captcha / archivo
  // ======================================================

  onCaptchaValid(esValido: boolean): void {
    this.captchaValido = esValido;
  }

  onFileChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.registroForm.get('imagenPerfil')!.setValue(file);
    this.registroForm.get('imagenPerfil')!.markAsDirty();

    const reader = new FileReader();
    reader.onload = () => this.imagenPrevia = reader.result as string;
    reader.readAsDataURL(file);
  }

  // ======================================================
  // Mapeo de errores PG/Supabase a mensajes de usuario
  // ======================================================

  private mapPgError(err: any): string {
    const msg: string = (err?.message || '').toLowerCase();
    const code: string | undefined = err?.code;
    const status: number | undefined = err?.status;

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

    if (code === '23505') {
      if (msg.includes('email')) return 'El correo ya está registrado en el sistema.';
      if (msg.includes('dni')) return 'El DNI ya existe en el sistema.';
      return 'Registro duplicado.';
    }

    if (msg.includes('invalid email') || msg.includes('email not valid')) {
      return 'El correo electrónico no es válido.';
    }

    if (msg.includes('password') && (msg.includes('weak') || msg.includes('at least'))) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (status === 429 || msg.includes('rate limit') || msg.includes('too many')) {
      return 'Demasiados intentos. Por favor, esperá unos minutos e intentá nuevamente.';
    }

    const mensajeOriginal = err?.message || String(err) || 'Ocurrió un error inesperado.';
    console.warn('[mapPgError] Error no manejado específicamente:', mensajeOriginal);
    return mensajeOriginal;
  }

  // ======================================================
  // SUBMIT - esquema nuevo: auth + esquema_clinica.usuarios + especialidades
  // ======================================================
  async onSubmit(): Promise<void> {
    if (this.registroForm.invalid || !this.captchaValido) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const fv = this.registroForm.value;
    this.loading = true;

    try {
      // 1) Normalizar especialidades (multi + "Otro")
      const seleccion = (fv.especialidades ?? []).filter(Boolean);
      let especialidades = seleccion.filter(e => e !== 'Otro');
      if (seleccion.includes('Otro') && fv.otraEspecialidad) {
        especialidades.push(fv.otraEspecialidad.trim());
      }
      especialidades = Array.from(new Set(especialidades.map(s => s?.trim()))).filter(Boolean) as string[];
      const primeraEspecialidad = especialidades[0] || 'Sin especialidad';

      // 2) Alta en Auth (Supabase Auth)
      const { data, error }: any = await this.supa.client.auth.signUp({
        email: fv.email!,
        password: fv.password!,
        options: {
          data: {
            rol: 'ESPECIALISTA',
            nombre: fv.nombre,
            apellido: fv.apellido,
            dni: fv.dni,
            fecha_nacimiento: fv.fechaNacimiento,
            especialidad_principal: primeraEspecialidad,
            especialidades
          }
        }
      });
      if (error) throw error;

      const userId = data.user?.id as string;
      if (!userId) throw new Error('No se pudo crear el usuario.');

      // 3) Insert/Upsert en esquema_clinica.usuarios
      const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);

      const { error: usuarioError } = await this.supa.client
        .from('usuarios')
        .upsert({
          id: userId,
          nombre: fv.nombre!,
          apellido: fv.apellido!,
          dni: fv.dni!,
          email: fv.email!,
          password: fv.password!,          // campo "dummy" para cumplir NOT NULL
          perfil: 'ESPECIALISTA',
          edad: edadCalculada,
          esta_aprobado: false,
          mail_verificado: !!data.session
        }, { onConflict: 'id' });

      if (usuarioError) throw usuarioError;

      // 4) Alta de especialidades + relación usuario_especialidad
      const especialidadIds: string[] = [];
      for (const nombre of especialidades) {
        const normalizado = nombre.trim();
        if (!normalizado) continue;

        // buscar especialidad por nombre
        const { data: espExisting, error: espExistingError } = await this.supa.client
          .from('especialidades')
          .select('id')
          .eq('nombre', normalizado)
          .maybeSingle();

        if (espExistingError) throw espExistingError;

        let especialidadId = espExisting?.id as string | undefined;

        if (!especialidadId) {
          const { data: espInsert, error: espInsertError } = await this.supa.client
            .from('especialidades')
            .insert({ nombre: normalizado })
            .select('id')
            .single();

          if (espInsertError) throw espInsertError;
          especialidadId = espInsert.id as string;
        }

        especialidadIds.push(especialidadId);
      }

      if (especialidadIds.length) {
        const rows = especialidadIds.map(id => ({
          usuario_id: userId,
          especialidad_id: id
        }));

        const { error: ueError } = await this.supa.client
          .from('usuario_especialidad')
          .upsert(rows, { onConflict: 'usuario_id,especialidad_id' });

        if (ueError) throw ueError;
      }

      // 5) Si NO hay sesión (email de verificación obligatorio) -> no intentamos subir imagen
      if (!data.session) {
        await Swal.fire({
          icon: 'info',
          title: 'Verifica tu correo',
          html: `
            <p>Te enviamos un email de verificación a <strong>${fv.email}</strong>.</p>
            <p>Confírmalo para iniciar sesión y completar tu registro (subir imagen).</p>
            <p><strong>Importante:</strong> Un administrador debe aprobar tu cuenta antes de poder ingresar.</p>
          `,
          confirmButtonText: 'Entendido'
        });
        this.registroForm.reset();
        this.imagenPrevia = null;
        this.router.navigate(['/bienvenida']);
        return;
      }

      // 6) Con sesión activa: subir avatar y actualizar imagen_perfil_1
      if (fv.imagenPerfil) {
        const avatarUrl = await this.supa.uploadAvatar(userId, fv.imagenPerfil, 1);
        const { error: avatarError } = await this.supa.client
          .from('usuarios')
          .update({ imagen_perfil_1: avatarUrl })
          .eq('id', userId);

        if (avatarError) throw avatarError;
      }

      await Swal.fire({
        icon: 'success',
        title: 'Registro enviado',
        text: 'Verificá tu email. Un administrador debe aprobar tu cuenta antes de ingresar.',
        timer: 3500,
        showConfirmButton: false
      });
      this.registroForm.reset();
      this.imagenPrevia = null;
      this.router.navigate(['/bienvenida']);

    } catch (e: any) {
      console.error('[Registro Especialista] Error completo:', {
        error: e, message: e?.message, code: e?.code, status: e?.status, name: e?.name, stack: e?.stack
      });
      const mensajeError = this.mapPgError(e);
      Swal.fire('Error', mensajeError, 'error');
    } finally {
      this.loading = false;
    }
  }
}
