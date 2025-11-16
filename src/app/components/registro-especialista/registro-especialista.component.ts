

// src/app/components/registro-especialista/registro-especialista.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators,
  AbstractControl, ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }    from '@angular/material/input';
import { MatButtonModule }   from '@angular/material/button';
import { MatCardModule }     from '@angular/material/card';
import { MatSelectModule }   from '@angular/material/select';

import Swal from 'sweetalert2';
import { SupabaseService } from '../../../services/supabase.service';
import { environment } from '../../../environments/environment';
import { CaptchaComponent } from '../captcha/captcha.component';

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

  // ===== Form (typed) =====
  registroForm!: FormGroup<{
    nombre:            FormControl<string | null>;
    apellido:          FormControl<string | null>;
    dni:               FormControl<string | null>;
    fechaNacimiento:   FormControl<string | null>; // 'YYYY-MM-DD'
    email:             FormControl<string | null>;
    password:          FormControl<string | null>;
    especialidades:    FormControl<string[] | null>;
    otraEspecialidad:  FormControl<string | null>;
    imagenPerfil:      FormControl<File | null>;
  }>;

  constructor(
    public fb: FormBuilder,
    public supa: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.maxDateISO = this.toISODateLocal(new Date());

    this.registroForm = this.fb.group({
      nombre:           this.fb.control<string | null>(null, Validators.required),
      apellido:         this.fb.control<string | null>(null, Validators.required),
      dni:              this.fb.control<string | null>(null, Validators.required),
      fechaNacimiento:  this.fb.control<string | null>(null, [Validators.required, RegistroEspecialistaComponent.fechaNacimientoValidator]),
      email:            this.fb.control<string | null>(null, [Validators.required, Validators.email]),
      password:         this.fb.control<string | null>(null, Validators.required),
      especialidades:   this.fb.control<string[] | null>([], Validators.required),
      otraEspecialidad: this.fb.control<string | null>(null),
      imagenPerfil:     this.fb.control<File | null>(null, Validators.required),
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

  async cargarEspecialidades(): Promise<void> {
    try {
      const { data, error } = await this.supa.client
        .from('especialistas')
        .select('especialidad')
        .not('especialidad', 'is', null);

      if (error) {
        console.error('[RegistroEspecialista] Error al cargar especialidades', error);
        this.especialidadesBase = [...this.especialidadesBaseFijas, 'Otro'];
        return;
      }

      const especialidadesBD = new Set<string>();
      (data ?? []).forEach((item: any) => {
        if (typeof item?.especialidad === 'string') {
          especialidadesBD.add(item.especialidad.trim());
        }
      });

      const todas = new Set<string>(this.especialidadesBaseFijas);
      especialidadesBD.forEach(e => { if (!this.especialidadesBaseFijas.includes(e)) todas.add(e); });

      this.especialidadesBase = Array.from(todas).sort();
      this.especialidadesBase.push('Otro');
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
      if (msg.includes('dni'))   return 'El DNI ya existe en el sistema.';
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
      .from('profiles')
      .upsert(profile, { onConflict: 'id' });
    if (error) throw error;
  }

  async onSubmit(): Promise<void> {
    if (this.registroForm.invalid || !this.captchaValido) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const fv = this.registroForm.value;
    this.loading = true;

    try {
      // 1) Normalizar especialidades (multi + "Otro") ANTES del signUp
      const seleccion = (fv.especialidades ?? []).filter(Boolean);
      let especialidades = seleccion.filter(e => e !== 'Otro');
      if (seleccion.includes('Otro') && fv.otraEspecialidad) {
        especialidades.push(fv.otraEspecialidad.trim());
      }
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
            especialidades: especialidades.join(',')
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
              especialidad: primeraEspecialidad,
              email: fv.email!
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
        .from('profiles')
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
          especialidad: primeraEspecialidad,
          email: fv.email!
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
//   FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators
// } from '@angular/forms';
// import { Router } from '@angular/router';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatCardModule } from '@angular/material/card';
// import { MatSelectModule } from '@angular/material/select';
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

//   // private supa = inject(SupabaseService).client; // 👈 acá queda “el cliente”

//   // Especialidades base (siempre disponibles)
//   especialidadesBaseFijas = [
//     'Cardiología', 'Dermatología', 'Ginecología', 'Pediatría', 'Neurología'
//   ];
  
//   // Lista completa de especialidades (base + las que vienen de la BD)
//   especialidadesBase: string[] = [];

//   imagenPrevia: string | null = null;
//   captchaEnabled = environment.captchaEnabled;
//   captchaValido = !environment.captchaEnabled; // Si está deshabilitado, siempre válido

//   registroForm!: FormGroup<{
//     nombre:            FormControl<string | null>;
//     apellido:          FormControl<string | null>;
//     dni:               FormControl<string | null>;
//     fechaNacimiento:   FormControl<string | null>;
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
//     this.registroForm = this.fb.group({
//       nombre:           this.fb.control<string | null>(null, Validators.required),
//       apellido:         this.fb.control<string | null>(null, Validators.required),
//       dni:              this.fb.control<string | null>(null, Validators.required),
//       fechaNacimiento:  this.fb.control<string | null>(null, Validators.required), // ← reemplaza "edad"
//       email:            this.fb.control<string | null>(null, [Validators.required, Validators.email]),
//       password:         this.fb.control<string | null>(null, Validators.required),
//       especialidades:   this.fb.control<string[] | null>([], Validators.required),
//       otraEspecialidad: this.fb.control<string | null>(null),
//       imagenPerfil:     this.fb.control<File | null>(null, Validators.required),
//     });

//     // 
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

//     // Cargar especialidades desde la BD y combinarlas con las base
//     await this.cargarEspecialidades();
//   }

//   /**
//    * Carga las especialidades desde la BD y las combina con las especialidades base.
//    * Esto asegura que las especialidades nuevas agregadas por otros especialistas
//    * aparezcan en el combo para futuros registros.
//    */
//   async cargarEspecialidades(): Promise<void> {
//     try {
//       // Obtener especialidades únicas de la BD
//       const { data, error } = await this.supa.client
//         .from('especialistas')
//         .select('especialidad')
//         .not('especialidad', 'is', null);

//       if (error) {
//         console.error('[RegistroEspecialista] Error al cargar especialidades', error);
//         // Si hay error, usar solo las especialidades base
//         this.especialidadesBase = [...this.especialidadesBaseFijas, 'Otro'];
//         return;
//       }

//       // Extraer especialidades únicas de la BD
//       const especialidadesBD = new Set<string>();
//       if (data && Array.isArray(data)) {
//         data.forEach((item: any) => {
//           if (item.especialidad && typeof item.especialidad === 'string') {
//             especialidadesBD.add(item.especialidad.trim());
//           }
//         });
//       }

//       // Combinar especialidades base con las de la BD
//       const todasLasEspecialidades = new Set<string>();
      
//       // Agregar las especialidades base
//       this.especialidadesBaseFijas.forEach(esp => todasLasEspecialidades.add(esp));
      
//       // Agregar las especialidades de la BD (que no estén ya en las base)
//       especialidadesBD.forEach(esp => {
//         if (!this.especialidadesBaseFijas.includes(esp)) {
//           todasLasEspecialidades.add(esp);
//         }
//       });

//       // Ordenar alfabéticamente y agregar "Otro" al final
//       this.especialidadesBase = Array.from(todasLasEspecialidades).sort();
//       this.especialidadesBase.push('Otro');
//     } catch (err) {
//       console.error('[RegistroEspecialista] Error al cargar especialidades', err);
//       // Si hay error, usar solo las especialidades base
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

//   private calcEdadFromISO(iso: string): number {
//     const [y, m, d] = iso.split('-').map(Number);
//     const today = new Date();
//     let edad = today.getFullYear() - y;
//     const month = today.getMonth() + 1;
//     const day = today.getDate();
//     if (month < m || (month === m && day < d)) edad--;
//     return edad;
//   }

//   private mapPgError(err: any): string {
//     const msg: string = (err?.message || '').toLowerCase();
//     const code: string | undefined = err?.code;
//     const status: number | undefined = err?.status;

//     // Log para debugging - ver qué error exacto estamos recibiendo
//     console.log('[mapPgError] Analizando error:', { msg, code, status, fullError: err });

//     // Errores de Supabase Auth - Email ya registrado
//     // IMPORTANTE: Solo marcar como "ya registrado" si realmente es ese el caso
//     // Supabase puede devolver 422 por otras razones también
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

//     // Duplicados en Postgres (unique_violation)
//     if (code === '23505') {
//       if (msg.includes('email')) return 'El correo ya está registrado en el sistema.';
//       if (msg.includes('dni')) return 'El DNI ya existe en el sistema.';
//       return 'Registro duplicado.';
//     }

//     // Errores de validación de email
//     if (msg.includes('invalid email') || msg.includes('email not valid')) {
//       return 'El correo electrónico no es válido.';
//     }

//     // Errores de contraseña
//     if (msg.includes('password') && (msg.includes('weak') || msg.includes('at least'))) {
//       return 'La contraseña debe tener al menos 6 caracteres.';
//     }

//     // Rate limit
//     if (status === 429 || msg.includes('rate limit') || msg.includes('too many')) {
//       return 'Demasiados intentos. Por favor, esperá unos minutos e intentá nuevamente.';
//     }

//     // Si llegamos aquí, mostrar el mensaje original del error para debugging
//     // Esto ayuda a identificar errores que no estamos manejando correctamente
//     const mensajeOriginal = err?.message || String(err) || 'Ocurrió un error inesperado.';
//     console.warn('[mapPgError] Error no manejado específicamente:', mensajeOriginal);
//     return mensajeOriginal;
//   }
    
//   // // DB
//   // async upsertPerfil(profile: any) {
//   //   const { error } = await this.supa.from('profiles').upsert(profile, { onConflict: 'id' });
//   //   if (error) throw error;
//   // }

//   async upsertPerfil(profile: any) {
//     const { error } = await this.supa.client
//       .from('profiles')
//       .upsert(profile, { onConflict: 'id' });
//     if (error) throw error;
//   }

//   async onSubmit(): Promise<void> {
//     if (this.registroForm.invalid) {
//       this.registroForm.markAllAsTouched();
//       return;
//     }

//     const fv = this.registroForm.value;
//     //this._toggleLoading(true);

//     try {
//       // 2) Normalizamos especialidades (multi + "Otro") ANTES del signUp para guardarlas en metadata
//       const seleccion = (fv.especialidades ?? []).filter(Boolean);
//       let especialidades = seleccion.filter(e => e !== 'Otro');
//       if (seleccion.includes('Otro') && fv.otraEspecialidad) {
//         especialidades.push(fv.otraEspecialidad.trim());
//       }
//       // deduplicar + limpiar vacíos
//       especialidades = Array.from(new Set(especialidades.map(s => s?.trim()))).filter(Boolean) as string[];
//       const primeraEspecialidad = especialidades[0] || 'Sin especialidad';

//       // 1) Alta en Auth con todos los datos en metadata (incluyendo especialidad)
//       // El trigger leerá estos datos y creará el perfil automáticamente
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
//             especialidad: primeraEspecialidad, // Guardar especialidad en metadata
//             especialidades: especialidades.join(',') // Guardar todas las especialidades como string separado por comas
//           }
//         }
//       });
//       if (error) throw error;
//       const userId = data.user.id as string;

//       // Si no hay sesión automática (confirmación de email activa)
//       if (!data.session) {
//         // Intentar insertar en especialistas usando una función con SECURITY DEFINER
//         // O guardar los datos para completarlos después de la verificación
//         try {
//           // Calcular edad desde fecha de nacimiento
//           const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);
          
//           // Intentar insertar en especialistas (puede fallar por RLS si no hay sesión)
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
          
//           // Si falla por RLS, los datos están en metadata y se completarán después
//           if (especialistaError) {
//             console.warn('[RegistroEspecialista] No se pudo insertar en especialistas (RLS), se completará después:', especialistaError);
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

//       // Si hay sesión automática, continuar con el flujo completo

//       // 3) Subir avatar al bucket avatars/<uid>/**
//       const avatarUrl = await this.supa.uploadAvatar(userId, fv.imagenPerfil!, 1);

//       // 4) Calcular edad desde fecha de nacimiento
//       const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);

//       // 5) Actualizar perfil en profiles con la imagen (el trigger ya creó el perfil básico)
//       const { data: updateData, error: perfilError } = await this.supa.client
//         .from('profiles')
//         .update({
//           avatar_url: avatarUrl,
//           aprobado: false                  // <===== requiere aprobación de Admin
//         })
//         .eq('id', userId)
//         .select();
      
//       if (perfilError) throw perfilError;

//       // 6) Insertar en tabla especialistas (una fila por cada especialidad)
//       // Como la tabla tiene especialidad como TEXT, guardamos la primera especialidad
//       // o podríamos crear múltiples registros si fuera necesario
//       const { error: especialistaError } = await this.supa.client
//         .from('especialistas')
//         .insert({
//           id: userId,
//           nombre: fv.nombre!,
//           apellido: fv.apellido!,
//           edad: edadCalculada,
//           fecha_nacimiento: fv.fechaNacimiento!,
//           dni: fv.dni!,
//           especialidad: primeraEspecialidad, // Guardamos la primera, o podríamos hacer múltiples inserts
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
//       // Log detallado del error para debugging
//       console.error('[Registro Especialista] Error completo:', {
//         error: e,
//         message: e?.message,
//         code: e?.code,
//         status: e?.status,
//         name: e?.name,
//         stack: e?.stack
//       });
      
//       const mensajeError = this.mapPgError(e);
//       Swal.fire('Error', mensajeError, 'error');
//     } finally {
//       //this._toggleLoading(false);
//     }
//   }

// }



// //-------------------------------------------------------------------------------------------
