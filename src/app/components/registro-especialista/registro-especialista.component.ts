// src/app/components/registro-especialista/registro-especialista.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators,
  AbstractControl, ValidationErrors, ValidatorFn // NUEVO
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

// ===== Validadores para selección múltiple ===== // NUEVO
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
    CaptchaComponent
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
  readonly maxEspecialidades = 3; // NUEVO: límite superior configurable

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
      fechaNacimiento: this.fb.control<string | null>(null, [Validators.required, RegistroEspecialistaComponent.fechaNacimientoValidator]),
      email: this.fb.control<string | null>(null, [Validators.required, Validators.email]),
      password: this.fb.control<string | null>(null, Validators.required),

      // CAMBIO: agrega minSelected(1) y maxSelected(maxEspecialidades)
      especialidades: this.fb.control<string[] | null>([], [
        Validators.required,
        minSelected(1),                // NUEVO
        maxSelected(this.maxEspecialidades) // NUEVO
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

    await this.cargarEspecialidades(); // mantiene tu flujo
  }

  // ======= Estilo/UX iguales al Paciente =======

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

  /**
   * Carga especialidades:
   * 1) Intenta catálogo 'especialidades_catalogo' (nombre, activo) o 'especialidades' (nombre, activa).
   * 2) Si no existe/está vacío, deriva desde tabla 'especialistas' (como hacías).
   * 3) Siempre agrega 'Otro' al final.
   */
  async cargarEspecialidades(): Promise<void> {
    try {
      // 1) Catálogo 'especialidades_catalogo'
      let lista: string[] = [];
      try {
        const { data, error } = await this.supa.client
          .from('especialidades_catalogo')
          .select('nombre, activo')
          .eq('activo', true)
          .order('nombre');
        if (!error && Array.isArray(data) && data.length) {
          lista = data
            .map((r: any) => (r?.nombre ?? '').toString().trim())
            .filter(Boolean);
        }
      } catch { /* tabla puede no existir */ }

      // 1.b) Alternativa: 'especialidades'
      if (lista.length === 0) {
        try {
          const { data, error } = await this.supa.client
            .from('especialidades') //---- CAMBIO DE NOMBRE A especialidades_catalogo
            .select('nombre, activa')
            .eq('activa', true)
            .order('nombre');
          if (!error && Array.isArray(data) && data.length) {
            lista = data
              .map((r: any) => (r?.nombre ?? '').toString().trim())
              .filter(Boolean);
          }
        } catch { /* tabla puede no existir */ }
      }

      // 2) Fallback a derivar desde 'especialistas' (tu lógica original)
      if (lista.length === 0) {
        const { data, error } = await this.supa.client
          .from('especialistas')
          .select('especialidad')
          .not('especialidad', 'is', null);

        if (!error) {
          const set = new Set<string>();
          (data ?? []).forEach((item: any) => {
            if (typeof item?.especialidad === 'string') {
              set.add(item.especialidad.trim());
            }
          });
          lista = Array.from(set);
        }
      }

      // 3) Unir con base fija, ordenar y agregar "Otro"
      const todas = new Set<string>(this.especialidadesBaseFijas);
      lista.forEach(e => { if (e && !this.especialidadesBaseFijas.includes(e)) todas.add(e); });
      this.especialidadesBase = Array.from(todas).sort();
      if (!this.especialidadesBase.includes('Otro')) this.especialidadesBase.push('Otro');

    } catch (err) {
      console.error('[RegistroEspecialista] Error al cargar especialidades', err);
      this.especialidadesBase = [...this.especialidadesBaseFijas, 'Otro'];
    }
  }

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

  async upsertPerfil(profile: any) {
    const { error } = await this.supa.client
      .from('perfiles')
      .upsert(profile, { onConflict: 'id' });
    if (error) throw error;
  }

  async registrarEspecialista(form: FormGroup) {
    this.loading = true;
    try {
      // 1) signUp => sesión autenticada inmediata (en dev)
      const { data: { user }, error: signErr } = await this.supa.client.auth.signUp({
        email: form.value.email,
        password: form.value.password
      });
      if (signErr || !user) throw signErr ?? new Error('No se creó el usuario');

      const uid = user.id;

      // 2) Crear/actualizar perfil (upsert evita pk duplicada si ya existe por trigger)
      const { error: perErr } = await this.supa.client.from('perfiles').upsert({
        id: uid,
        rol: 'especialista',
        nombre: form.value.nombre ?? '',
        apellido: form.value.apellido ?? '',
        aprobado: false  // lo habilita un admin luego
      }, { onConflict: 'id' });
      if (perErr) throw perErr;

      // 3) Crear/actualizar registro de especialista
      const normalizar = (s: string) => (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const { error: espErr } = await this.supa.client.from('especialistas').upsert({
        id: uid,
        nombre: form.value.nombre ?? '',
        apellido: form.value.apellido ?? '',
        especialidad: normalizar(form.value.especialidad) // por ahora texto
      }, { onConflict: 'id' });
      if (espErr) throw espErr;

      // listo
      Swal.fire({ icon: 'success', title: 'Registro enviado', text: 'Un admin debe aprobar tu cuenta', timer: 2500, showConfirmButton: false });
    } catch (e: any) {
      console.error('[Registro especialista] ERR', e);
      Swal.fire('Error', [e.message, e.details, e.hint].filter(Boolean).join(' — '), 'error');
    } finally {
      this.loading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.registroForm.invalid || !this.captchaValido) {
      this.registroForm.markAllAsTouched();
      return;
    }

    await this.registrarEspecialista(this.registroForm); // <=== NUEVO

    const fv = this.registroForm.value;
    this.loading = true;

    try {
      // 1) Normalizar especialidades (multi + "Otro")
      const seleccion = (fv.especialidades ?? []).filter(Boolean);
      let especialidades = seleccion.filter(e => e !== 'Otro');
      if (seleccion.includes('Otro') && fv.otraEspecialidad) {
        especialidades.push(fv.otraEspecialidad.trim());
      }
      // Normaliza y deduplica
      especialidades = Array.from(new Set(especialidades.map(s => s?.trim()))).filter(Boolean) as string[];
      const primeraEspecialidad = especialidades[0] || 'Sin especialidad';

      // 2) Alta en Auth con metadata (igual patrón que Paciente)
      const { data, error }: any = await this.supa.client.auth.signUp({
        email: fv.email!,
        password: fv.password!,
        options: {
          data: {
            rol: 'especialista',
            nombre: fv.nombre,
            apellido: fv.apellido,
            dni: fv.dni,
            fecha_nacimiento: fv.fechaNacimiento,
            especialidad: primeraEspecialidad,
            especialidades: especialidades.join(',') // CSV
          }
        }
      });
      if (error) throw error;

      const userId = data.user?.id as string;
      if (!userId) throw new Error('No se pudo crear el usuario.');

      // Caso: no hay sesión inmediata (email de verificación)
      if (!data.session) {
        try {
          const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);
          const { error: especialistaError } = await this.supa.client
            .from('especialistas')
            .insert({
              id: userId,
              nombre: fv.nombre!,
              apellido: fv.apellido!,
              edad: edadCalculada,
              fecha_nacimiento: fv.fechaNacimiento!,
              dni: fv.dni!,
              especialidad: primeraEspecialidad, // principal
              email: fv.email!
              // Si más adelante agregas columna 'especialidades' (text[] o texto):
              // especialidades
            });
          if (especialistaError) {
            console.warn('[RegistroEspecialista] Insert diferido (RLS):', especialistaError);
          }
        } catch (err) {
          console.warn('[RegistroEspecialista] Error al insertar especialista sin sesión:', err);
        }

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

      // 3) Con sesión: subir avatar
      const avatarUrl = await this.supa.uploadAvatar(userId, fv.imagenPerfil!, 1);

      // 4) Calcular edad e impactar en tablas
      const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);

      const { error: perfilError } = await this.supa.client
        .from('perfiles')
        .update({
          avatar_url: avatarUrl,
          aprobado: false // especialistas requieren aprobación
        })
        .eq('id', userId);
      if (perfilError) throw perfilError;

      const { error: especialistaError } = await this.supa.client
        .from('especialistas')
        .insert({
          id: userId,
          nombre: fv.nombre!,
          apellido: fv.apellido!,
          edad: edadCalculada,
          fecha_nacimiento: fv.fechaNacimiento!,
          dni: fv.dni!,
          especialidad: primeraEspecialidad, // principal
          email: fv.email!
          // Si agregas columna 'especialidades': incluye aquí el array o CSV
        });
      if (especialistaError) throw especialistaError;

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





// // src/app/components/registro-especialista/registro-especialista.component.ts
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators,
//   AbstractControl, ValidationErrors
// } from '@angular/forms';
// import { Router } from '@angular/router';

// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule }    from '@angular/material/input';
// import { MatButtonModule }   from '@angular/material/button';
// import { MatCardModule }     from '@angular/material/card';
// import { MatSelectModule }   from '@angular/material/select';

// import Swal from 'sweetalert2';
// import { SupabaseService } from '../../../services/supabase.service';
// import { environment } from '../../../environments/environment';
// import { CaptchaComponent } from '../captcha/captcha.component';

// @Component({
//   selector: 'app-registro-especialista',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatSelectModule,
//     MatButtonModule,
//     MatCardModule,
//     CaptchaComponent
//   ],
//   templateUrl: './registro-especialista.component.html',
//   styleUrls: ['./registro-especialista.component.scss']
// })
// export class RegistroEspecialistaComponent implements OnInit {

//   // ===== UI / estado =====
//   loading = false;
//   imagenPrevia: string | null = null;

//   // ===== Captcha =====
//   captchaEnabled = environment.captchaEnabled;
//   captchaValido = !environment.captchaEnabled;

//   // ===== Fechas (mismo manejo que Paciente) =====
//   maxDateISO!: string;               // hoy (p/ <input type="date">)
//   readonly minDateISO = '1900-01-01';

//   // ===== Especialidades =====
//   especialidadesBaseFijas = [
//     'Cardiología', 'Dermatología', 'Ginecología', 'Pediatría', 'Neurología'
//   ];
//   especialidadesBase: string[] = [];

//   // ===== Form (typed) =====
//   registroForm!: FormGroup<{
//     nombre:            FormControl<string | null>;
//     apellido:          FormControl<string | null>;
//     dni:               FormControl<string | null>;
//     fechaNacimiento:   FormControl<string | null>; // 'YYYY-MM-DD'
//     email:             FormControl<string | null>;
//     password:          FormControl<string | null>;
//     especialidades:    FormControl<string[] | null>;
//     otraEspecialidad:  FormControl<string | null>;
//     imagenPerfil:      FormControl<File | null>;
//   }>;

//   constructor(
//     public fb: FormBuilder,
//     public supa: SupabaseService,
//     private router: Router
//   ) {}

//   async ngOnInit(): Promise<void> {
//     this.maxDateISO = this.toISODateLocal(new Date());

//     this.registroForm = this.fb.group({
//       nombre:           this.fb.control<string | null>(null, Validators.required),
//       apellido:         this.fb.control<string | null>(null, Validators.required),
//       dni:              this.fb.control<string | null>(null, Validators.required),
//       fechaNacimiento:  this.fb.control<string | null>(null, [Validators.required, RegistroEspecialistaComponent.fechaNacimientoValidator]),
//       email:            this.fb.control<string | null>(null, [Validators.required, Validators.email]),
//       password:         this.fb.control<string | null>(null, Validators.required),
//       especialidades:   this.fb.control<string[] | null>([], Validators.required),
//       otraEspecialidad: this.fb.control<string | null>(null),
//       imagenPerfil:     this.fb.control<File | null>(null, Validators.required),
//     });

//     // "Otro" => obliga a completar el campo libre
//     this.registroForm.get('especialidades')!.valueChanges.subscribe(vals => {
//       const ctrl = this.registroForm.get('otraEspecialidad')!;
//       if (vals?.includes('Otro')) {
//         ctrl.setValidators([Validators.required]);
//       } else {
//         ctrl.clearValidators();
//         ctrl.setValue(null);
//       }
//       ctrl.updateValueAndValidity();
//     });

//     await this.cargarEspecialidades();
//   }

//   // ======= Estilo/UX iguales al Paciente =======

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

//     let edad = nowY - y;
//     if (nowM < m || (nowM === m && nowD < d)) edad--;

//     if (edad < 0) return { futuro: true };
//     if (edad > 120) return { rango: true };

//     return null;
//   }

//   private toISODateLocal(date: Date): string {
//     const y = date.getFullYear();
//     const m = String(date.getMonth() + 1).padStart(2, '0');
//     const d = String(date.getDate()).padStart(2, '0');
//     return `${y}-${m}-${d}`;
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

//   async cargarEspecialidades(): Promise<void> {
//     try {
//       const { data, error } = await this.supa.client
//         .from('especialistas')
//         .select('especialidad')
//         .not('especialidad', 'is', null);

//       if (error) {
//         console.error('[RegistroEspecialista] Error al cargar especialidades', error);
//         this.especialidadesBase = [...this.especialidadesBaseFijas, 'Otro'];
//         return;
//       }

//       const especialidadesBD = new Set<string>();
//       (data ?? []).forEach((item: any) => {
//         if (typeof item?.especialidad === 'string') {
//           especialidadesBD.add(item.especialidad.trim());
//         }
//       });

//       const todas = new Set<string>(this.especialidadesBaseFijas);
//       especialidadesBD.forEach(e => { if (!this.especialidadesBaseFijas.includes(e)) todas.add(e); });

//       this.especialidadesBase = Array.from(todas).sort();
//       this.especialidadesBase.push('Otro');
//     } catch (err) {
//       console.error('[RegistroEspecialista] Error al cargar especialidades', err);
//       this.especialidadesBase = [...this.especialidadesBaseFijas, 'Otro'];
//     }
//   }

//   onCaptchaValid(esValido: boolean): void {
//     this.captchaValido = esValido;
//   }

//   onFileChange(ev: Event): void {
//     const input = ev.target as HTMLInputElement;
//     if (!input.files?.length) return;
//     const file = input.files[0];
//     this.registroForm.get('imagenPerfil')!.setValue(file);
//     this.registroForm.get('imagenPerfil')!.markAsDirty();

//     const reader = new FileReader();
//     reader.onload = () => this.imagenPrevia = reader.result as string;
//     reader.readAsDataURL(file);
//   }

//   private mapPgError(err: any): string {
//     const msg: string = (err?.message || '').toLowerCase();
//     const code: string | undefined = err?.code;
//     const status: number | undefined = err?.status;

//     console.log('[mapPgError] Analizando error:', { msg, code, status, fullError: err });

//     const esEmailDuplicado = (
//       code === 'signup_disabled' ||
//       code === 'email_address_not_authorized' ||
//       /user already registered/i.test(msg) ||
//       /already registered/i.test(msg) ||
//       /email.*already.*exists/i.test(msg) ||
//       /user.*already.*exists/i.test(msg) ||
//       msg.includes('already registered') ||
//       msg.includes('already exists') ||
//       (status === 422 && (msg.includes('already') || msg.includes('exists') || msg.includes('registered')))
//     );

//     if (esEmailDuplicado) {
//       return 'Este correo electrónico ya está registrado. Si ya tenés una cuenta, intentá iniciar sesión o recuperar tu contraseña.';
//     }

//     if (code === '23505') {
//       if (msg.includes('email')) return 'El correo ya está registrado en el sistema.';
//       if (msg.includes('dni'))   return 'El DNI ya existe en el sistema.';
//       return 'Registro duplicado.';
//     }

//     if (msg.includes('invalid email') || msg.includes('email not valid')) {
//       return 'El correo electrónico no es válido.';
//     }

//     if (msg.includes('password') && (msg.includes('weak') || msg.includes('at least'))) {
//       return 'La contraseña debe tener al menos 6 caracteres.';
//     }

//     if (status === 429 || msg.includes('rate limit') || msg.includes('too many')) {
//       return 'Demasiados intentos. Por favor, esperá unos minutos e intentá nuevamente.';
//     }

//     const mensajeOriginal = err?.message || String(err) || 'Ocurrió un error inesperado.';
//     console.warn('[mapPgError] Error no manejado específicamente:', mensajeOriginal);
//     return mensajeOriginal;
//   }

//   async upsertPerfil(profile: any) {
//     const { error } = await this.supa.client
//       .from('perfiles')
//       .upsert(profile, { onConflict: 'id' });
//     if (error) throw error;
//   }

//   async onSubmit(): Promise<void> {
//     if (this.registroForm.invalid || !this.captchaValido) {
//       this.registroForm.markAllAsTouched();
//       return;
//     }

//     const fv = this.registroForm.value;
//     this.loading = true;

//     try {
//       // 1) Normalizar especialidades (multi + "Otro") ANTES del signUp
//       const seleccion = (fv.especialidades ?? []).filter(Boolean);
//       let especialidades = seleccion.filter(e => e !== 'Otro');
//       if (seleccion.includes('Otro') && fv.otraEspecialidad) {
//         especialidades.push(fv.otraEspecialidad.trim());
//       }
//       especialidades = Array.from(new Set(especialidades.map(s => s?.trim()))).filter(Boolean) as string[];
//       const primeraEspecialidad = especialidades[0] || 'Sin especialidad';

//       // 2) Alta en Auth con metadata (igual patrón que Paciente)
//       const { data, error }: any = await this.supa.client.auth.signUp({
//         email: fv.email!,
//         password: fv.password!,
//         options: {
//           data: {
//             rol: 'especialista',
//             nombre: fv.nombre,
//             apellido: fv.apellido,
//             dni: fv.dni,
//             fecha_nacimiento: fv.fechaNacimiento,
//             especialidad: primeraEspecialidad,
//             especialidades: especialidades.join(',')
//           }
//         }
//       });
//       if (error) throw error;

//       const userId = data.user?.id as string;
//       if (!userId) throw new Error('No se pudo crear el usuario.');

//       // Caso: no hay sesión inmediata (email de verificación)
//       if (!data.session) {
//         try {
//           const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);
//           const { error: especialistaError } = await this.supa.client
//             .from('especialistas')
//             .insert({
//               id: userId,
//               nombre: fv.nombre!,
//               apellido: fv.apellido!,
//               edad: edadCalculada,
//               fecha_nacimiento: fv.fechaNacimiento!,
//               dni: fv.dni!,
//               especialidad: primeraEspecialidad,
//               email: fv.email!
//             });
//           if (especialistaError) {
//             console.warn('[RegistroEspecialista] Insert diferido (RLS):', especialistaError);
//           }
//         } catch (err) {
//           console.warn('[RegistroEspecialista] Error al insertar especialista sin sesión:', err);
//         }

//         await Swal.fire({
//           icon: 'info',
//           title: 'Verifica tu correo',
//           html: `
//             <p>Te enviamos un email de verificación a <strong>${fv.email}</strong>.</p>
//             <p>Confírmalo para iniciar sesión y completar tu registro (subir imagen).</p>
//             <p><strong>Importante:</strong> Un administrador debe aprobar tu cuenta antes de poder ingresar.</p>
//           `,
//           confirmButtonText: 'Entendido'
//         });
//         this.registroForm.reset();
//         this.imagenPrevia = null;
//         this.router.navigate(['/bienvenida']);
//         return;
//       }

//       // 3) Con sesión: subir avatar
//       const avatarUrl = await this.supa.uploadAvatar(userId, fv.imagenPerfil!, 1);

//       // 4) Calcular edad e impactar en tablas
//       const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);

//       const { error: perfilError } = await this.supa.client
//         .from('perfiles')
//         .update({
//           avatar_url: avatarUrl,
//           aprobado: false // especialistas requieren aprobación
//         })
//         .eq('id', userId);
//       if (perfilError) throw perfilError;

//       const { error: especialistaError } = await this.supa.client
//         .from('especialistas')
//         .insert({
//           id: userId,
//           nombre: fv.nombre!,
//           apellido: fv.apellido!,
//           edad: edadCalculada,
//           fecha_nacimiento: fv.fechaNacimiento!,
//           dni: fv.dni!,
//           especialidad: primeraEspecialidad,
//           email: fv.email!
//         });
//       if (especialistaError) throw especialistaError;

//       await Swal.fire({
//         icon: 'success',
//         title: 'Registro enviado',
//         text: 'Verificá tu email. Un administrador debe aprobar tu cuenta antes de ingresar.',
//         timer: 3500,
//         showConfirmButton: false
//       });
//       this.registroForm.reset();
//       this.imagenPrevia = null;
//       this.router.navigate(['/bienvenida']);

//     } catch (e: any) {
//       console.error('[Registro Especialista] Error completo:', {
//         error: e, message: e?.message, code: e?.code, status: e?.status, name: e?.name, stack: e?.stack
//       });
//       const mensajeError = this.mapPgError(e);
//       Swal.fire('Error', mensajeError, 'error');
//     } finally {
//       this.loading = false;
//     }
//   }
// }


