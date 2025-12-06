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
  ValidatorFn ,
 
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

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';

import { NgxCaptchaModule } from 'ngx-captcha';
import { MatChipsModule } from '@angular/material/chips';
import { FabBienvenidaComponent } from '../fab-bienvenida/fab-bienvenida.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatButtonToggleModule,
    MatIconModule,
    NgxCaptchaModule,
    MatChipsModule,
    FabBienvenidaComponent,
    MatProgressSpinnerModule
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
  captchaValido = !environment.captchaEnabled; // Si está deshabilitado, es válido por defecto
  siteKey: string = '6LfbWxksAAAAABoUdgGEoUv5pvnjJ_TPcje3jb7P';

  // ===== Fechas =====
  maxDateISO!: string;             
  readonly minDateISO = '1900-01-01';

  // ===== Especialidades =====
  especialidadesBaseFijas = [
    'Cardiología', 'Dermatología', 'Ginecología', 'Pediatría', 'Neurología'
  ];
  especialidadesBase: string[] = [];
  readonly maxEspecialidades = 3;

  // ===== CONTROL INDEPENDIENTE PARA AGREGAR NUEVA ESPECIALIDAD =====
  nuevaEspecialidadCtrl = new FormControl('');

  // ===== Form (typed) =====
  registroForm!: FormGroup<{
    nombre: FormControl<string | null>;
    apellido: FormControl<string | null>;
    dni: FormControl<string | null>;
    fechaNacimiento: FormControl<string | null>;
    email: FormControl<string | null>;
    password: FormControl<string | null>;
    especialidades: FormControl<string[] | null>;
    // Eliminamos 'otraEspecialidad' de aquí porque ya no se usa en el submit
    imagenPerfil: FormControl<File | null>;
    recaptcha: FormControl<string | null>;
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
      
      imagenPerfil: this.fb.control<File | null>(null, Validators.required),
      recaptcha: this.fb.control<string | null>(null, Validators.required),
    });

    await this.cargarEspecialidades();
  }

  // ======= Validaciones fecha de nacimiento =======
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
  // Cargar catálogo de especialidades
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
      
      // Aseguramos que 'Otro' esté al final
      if (!this.especialidadesBase.includes('Otro')) this.especialidadesBase.push('Otro');

    } catch (err) {
      console.error('[RegistroEspecialista] Error al cargar especialidades', err);
      this.especialidadesBase = [...this.especialidadesBaseFijas, 'Otro'];
    }
  }

  // ======================================================
  // Lógica para AGREGAR especialidad custom
  // ======================================================
  // agregarEspecialidadCustom(): void {
  //   const valor = this.nuevaEspecialidadCtrl.value?.trim(); 
    
  //   if (!valor) return;

  //   // 1. Si ya existe en la lista base
  //   if (this.especialidadesBase.includes(valor)) {
  //     const seleccionadas = this.especialidadesSeleccionadas;
  //     // Si no está seleccionada, la seleccionamos
  //     if (!seleccionadas.includes(valor)) {
  //       // Verificamos límite antes de agregar
  //       if (seleccionadas.length < this.maxEspecialidades) {
  //            this.registroForm.get('especialidades')?.setValue([...seleccionadas, valor]);
  //       }
  //     }
  //     this.nuevaEspecialidadCtrl.setValue(''); 
  //     return;
  //   }

  //   // 2. Si es NUEVA:
  //   // A) La agregamos a la lista visual (chips) antes de 'Otro'
  //   const indexOtro = this.especialidadesBase.indexOf('Otro');
  //   if (indexOtro >= 0) {
  //       this.especialidadesBase.splice(indexOtro, 0, valor);
  //   } else {
  //       this.especialidadesBase.push(valor);
  //   }

  //   // B) La seleccionamos automáticamente en el Form
  //   const actuales = this.especialidadesSeleccionadas;
  //   if (actuales.length < this.maxEspecialidades) {
  //      this.registroForm.get('especialidades')?.setValue([...actuales, valor]);
  //   }

  //   // C) Limpiamos el input
  //   this.nuevaEspecialidadCtrl.setValue('');
  // }

  agregarEspecialidadCustom(): void {
    const valor = this.nuevaEspecialidadCtrl.value?.trim(); 
    
    // Si no escribió nada, no hacemos nada
    if (!valor) return;

    // 1. Obtenemos las seleccionadas actuales, pero FILTRANDO 'Otro' 
    // (porque 'Otro' es solo un disparador, no queremos guardarlo ni contarlo)
    let seleccionadas = this.especialidadesSeleccionadas.filter(e => e !== 'Otro');

    // 2. Verificamos el límite REAL (sin contar 'Otro')
    if (seleccionadas.length >= this.maxEspecialidades) {
      // Opcional: Mostrar alerta visual o simplemente retornar
      this.nuevaEspecialidadCtrl.setErrors({ maxSelected: true });
      return; 
    }

    // 3. Manejo de la lista VISUAL (especialidadesBase)
    // Si la especialidad no existe en la base, la agregamos visualmente
    if (!this.especialidadesBase.includes(valor)) {
        // La insertamos antes de 'Otro' para mantener el orden
        const indexOtro = this.especialidadesBase.indexOf('Otro');
        if (indexOtro >= 0) {
            this.especialidadesBase.splice(indexOtro, 0, valor);
        } else {
            this.especialidadesBase.push(valor);
        }
    }

    // 4. ACTUALIZAMOS EL FORMULARIO
    // Agregamos el nuevo valor al array limpio y actualizamos el control
    if (!seleccionadas.includes(valor)) {
      seleccionadas.push(valor);
      
      // Al hacer setValue con el array nuevo (sin 'Otro' y con el 'Nuevo'),
      // Angular automáticamente:
      // A) Deselecciona el chip "Otro" (y cierra el input).
      // B) Selecciona el chip nuevo con ✅.
      this.registroForm.get('especialidades')?.setValue(seleccionadas);
    }

    // 5. Limpiamos el input para la próxima
    this.nuevaEspecialidadCtrl.setValue('');
    this.nuevaEspecialidadCtrl.setErrors(null);
    
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
  // Mapeo de errores
  // ======================================================
  private mapPgError(err: any): string {
    const msg: string = (err?.message || '').toLowerCase();
    const code: string | undefined = err?.code;
    const status: number | undefined = err?.status;

    if (code === '23505' || msg.includes('already registered') || msg.includes('exists')) {
      return 'El correo o DNI ya está registrado en el sistema.';
    }
    
    // ... otros errores ...
    return msg || 'Ocurrió un error inesperado.';
  }

  // ======================================================
  // SUBMIT
  // ======================================================
  async onSubmit(): Promise<void> {
    if (this.registroForm.invalid || !this.captchaValido) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const fv = this.registroForm.value;
    this.loading = true;

    try {
      // 1) Normalizar especialidades
      // Tomamos el array del form y filtramos "Otro" y vacíos.
      // Las especialidades nuevas YA ESTÁN en este array gracias a agregarEspecialidadCustom()
      const seleccion = (fv.especialidades ?? []).filter(Boolean);
      const especialidades = seleccion
        .filter(e => e !== 'Otro')
        .map(e => e.trim());

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
            especialidades: especialidades // Array limpio
          }
        }
      });
      
      if (error) throw error;

      const userId = data.user?.id as string;
      if (!userId) throw new Error('No se pudo crear el usuario.');

      // 3) Insert/Upsert en usuarios
      const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);

      const { error: usuarioError } = await this.supa.client
        .from('usuarios')
        .upsert({
          id: userId,
          nombre: fv.nombre!,
          apellido: fv.apellido!,
          dni: fv.dni!,
          email: fv.email!,
          password: fv.password!,
          perfil: 'ESPECIALISTA',
          edad: edadCalculada,
          esta_aprobado: false,
          mail_verificado: !!data.session
        }, { onConflict: 'id' });

      if (usuarioError) throw usuarioError;

      // 4) Alta de especialidades + relación usuario_especialidad
      const especialidadIds: string[] = [];
      
      for (const nombre of especialidades) {
        // Lógica de buscar o crear la especialidad
        const normalizado = nombre;
        
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

      // 5) Manejo de post-registro (email verificar / subir imagen)
      if (!data.session) {
        await Swal.fire({
          icon: 'info',
          title: 'Verifica tu correo',
          text: 'Te enviamos un email. Confírmalo para poder subir tu foto.',
        });
        this.registroForm.reset();
        this.imagenPrevia = null;
        await this.supa.client.auth.signOut();
        this.router.navigate(['/bienvenida']);
        return;
      }

      // Subir imagen si hay sesión
      if (fv.imagenPerfil) {
        const avatarUrl = await this.supa.uploadAvatar(userId, fv.imagenPerfil, 1);
        await this.supa.client.from('usuarios').update({ imagen_perfil_1: avatarUrl }).eq('id', userId);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Registro enviado',
        text: 'Tu cuenta espera aprobación del administrador.',
        timer: 3500,
        showConfirmButton: false
      });

      this.registroForm.reset();
      this.imagenPrevia = null;
      await this.supa.client.auth.signOut();
      this.router.navigate(['/bienvenida']);

    } catch (e: any) {
      console.error(e);
      Swal.fire('Error', this.mapPgError(e), 'error');
    } finally {
      this.loading = false;
    }
  }
}





// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   FormBuilder,
//   FormControl,
//   FormGroup,
//   ReactiveFormsModule,
//   Validators,
//   AbstractControl,
//   ValidationErrors,
//   ValidatorFn
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

// import { MatButtonToggleModule } from '@angular/material/button-toggle';
// import { MatIconModule } from '@angular/material/icon';

// import { NgxCaptchaModule } from 'ngx-captcha';
// import { MatChipsModule } from '@angular/material/chips';
// import { FabBienvenidaComponent } from '../fab-bienvenida/fab-bienvenida.component';

// // ===== Validadores para selección múltiple =====
// function minSelected(min: number): ValidatorFn {
//   return (control: AbstractControl): ValidationErrors | null => {
//     const v = control.value as string[] | null | undefined;
//     const len = Array.isArray(v) ? v.filter(Boolean).length : 0;
//     return len >= min ? null : { minSelected: { min } };
//   };
// }
// function maxSelected(max: number): ValidatorFn {
//   return (control: AbstractControl): ValidationErrors | null => {
//     const v = control.value as string[] | null | undefined;
//     const len = Array.isArray(v) ? v.filter(Boolean).length : 0;
//     return len <= max ? null : { maxSelected: { max } };
//   };
// }

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
//     //CaptchaComponent,
//     MatButtonToggleModule, // <=========
//     MatIconModule, // <=========
//     NgxCaptchaModule,
//     MatChipsModule ,// <--- IMPORTANTE AGREGARLO AQUÍ
//     FabBienvenidaComponent
// ],
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

//   siteKey: string = '6LfbWxksAAAAABoUdgGEoUv5pvnjJ_TPcje3jb7P';


//   // ===== Fechas (mismo manejo que Paciente) =====
//   maxDateISO!: string;               // hoy (p/ <input type="date">)
//   readonly minDateISO = '1900-01-01';

//   // ===== Especialidades =====
//   especialidadesBaseFijas = [
//     'Cardiología', 'Dermatología', 'Ginecología', 'Pediatría', 'Neurología'
//   ];
//   especialidadesBase: string[] = [];
//   readonly maxEspecialidades = 3;

//   // ===== Form (typed) =====
//   registroForm!: FormGroup<{
//     nombre: FormControl<string | null>;
//     apellido: FormControl<string | null>;
//     dni: FormControl<string | null>;
//     fechaNacimiento: FormControl<string | null>; // 'YYYY-MM-DD'
//     email: FormControl<string | null>;
//     password: FormControl<string | null>;
//     especialidades: FormControl<string[] | null>;
//     otraEspecialidad: FormControl<string | null>;
//     imagenPerfil: FormControl<File | null>;

//     recaptcha: FormControl<string | null>;   //  <= PARAE L CAPTCHA

//   }>;

//   get especialidadesSeleccionadas(): string[] {
//     return (this.registroForm?.get('especialidades')?.value as string[]) || [];
//   }

//   constructor(
//     public fb: FormBuilder,
//     public supa: SupabaseService,
//     private router: Router
//   ) { }

//   async ngOnInit(): Promise<void> {
//     this.maxDateISO = this.toISODateLocal(new Date());

//     this.registroForm = this.fb.group({
//       nombre: this.fb.control<string | null>(null, Validators.required),
//       apellido: this.fb.control<string | null>(null, Validators.required),
//       dni: this.fb.control<string | null>(null, Validators.required),
//       fechaNacimiento: this.fb.control<string | null>(
//         null,
//         [Validators.required, RegistroEspecialistaComponent.fechaNacimientoValidator]
//       ),
//       email: this.fb.control<string | null>(null, [Validators.required, Validators.email]),
//       password: this.fb.control<string | null>(null, Validators.required),

//       especialidades: this.fb.control<string[] | null>([], [
//         Validators.required,
//         minSelected(1),
//         maxSelected(this.maxEspecialidades)
//       ]),
//       otraEspecialidad: this.fb.control<string | null>(null),
//       imagenPerfil: this.fb.control<File | null>(null, Validators.required),

//       recaptcha: this.fb.control<string | null>(null, Validators.required),  //  <= para el CAPTCHA

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


//   // ======= Validaciones fecha de nacimiento =======

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

//   // ======================================================
//   // Cargar catálogo de especialidades (esquema_clinica.especialidades)
//   // ======================================================
//   async cargarEspecialidades(): Promise<void> {
//     try {
//       let lista: string[] = [];

//       const { data, error } = await this.supa.client
//         .from('especialidades')
//         .select('nombre')
//         .order('nombre');

//       if (!error && Array.isArray(data) && data.length) {
//         lista = data
//           .map((r: any) => (r?.nombre ?? '').toString().trim())
//           .filter(Boolean);
//       }

//       const todas = new Set<string>(this.especialidadesBaseFijas);
//       lista.forEach(e => { if (e && !this.especialidadesBaseFijas.includes(e)) todas.add(e); });
//       this.especialidadesBase = Array.from(todas).sort();
//       if (!this.especialidadesBase.includes('Otro')) this.especialidadesBase.push('Otro');

//     } catch (err) {
//       console.error('[RegistroEspecialista] Error al cargar especialidades', err);
//       this.especialidadesBase = [...this.especialidadesBaseFijas, 'Otro'];
//     }
//   }

//   // ======================================================
//   // Captcha / archivo
//   // ======================================================

//   onCaptchaValid(esValido: boolean): void {
//     console.log('El captcha es valido ' + esValido);
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

//   // ======================================================
//   // Mapeo de errores PG/Supabase a mensajes de usuario
//   // ======================================================

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
//       if (msg.includes('dni')) return 'El DNI ya existe en el sistema.';
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

//   // ============================================================================================================
//   // ====================================================== SUBMIT ====================================================== 
//   // ======================================================
//   async onSubmit(): Promise<void> {
//     if (this.registroForm.invalid || !this.captchaValido) {
//       this.registroForm.markAllAsTouched();
//       return;
//     }

//     const fv = this.registroForm.value;
//     this.loading = true;

//     try {
//       // 1) Normalizar especialidades (multi + "Otro")
//       const seleccion = (fv.especialidades ?? []).filter(Boolean);
//       let especialidades = seleccion.filter(e => e !== 'Otro');
//       if (seleccion.includes('Otro') && fv.otraEspecialidad) {
//         especialidades.push(fv.otraEspecialidad.trim());
//       }
//       especialidades = Array.from(new Set(especialidades.map(s => s?.trim()))).filter(Boolean) as string[];
//       const primeraEspecialidad = especialidades[0] || 'Sin especialidad';

//       // 2) Alta en Auth (Supabase Auth)
//       const { data, error }: any = await this.supa.client.auth.signUp({
//         email: fv.email!,
//         password: fv.password!,
//         options: {
//           data: {
//             rol: 'ESPECIALISTA',
//             nombre: fv.nombre,
//             apellido: fv.apellido,
//             dni: fv.dni,
//             fecha_nacimiento: fv.fechaNacimiento,
//             especialidad_principal: primeraEspecialidad,
//             especialidades
//           }
//         }
//       });
//       if (error) throw error;

//       const userId = data.user?.id as string;
//       if (!userId) throw new Error('No se pudo crear el usuario.');

//       // 3) Insert/Upsert en esquema_clinica.usuarios
//       const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);

//       const { error: usuarioError } = await this.supa.client
//         .from('usuarios')
//         .upsert({
//           id: userId,
//           nombre: fv.nombre!,
//           apellido: fv.apellido!,
//           dni: fv.dni!,
//           email: fv.email!,
//           password: fv.password!,          // campo "dummy" para cumplir NOT NULL
//           perfil: 'ESPECIALISTA',
//           edad: edadCalculada,
//           esta_aprobado: false,
//           mail_verificado: !!data.session
//         }, { onConflict: 'id' });

//       if (usuarioError) throw usuarioError;

//       // 4) Alta de especialidades + relación usuario_especialidad
//       const especialidadIds: string[] = [];
//       for (const nombre of especialidades) {
//         const normalizado = nombre.trim();
//         if (!normalizado) continue;

//         const { data: espExisting, error: espExistingError } = await this.supa.client
//           .from('especialidades')
//           .select('id')
//           .eq('nombre', normalizado)
//           .maybeSingle();

//         if (espExistingError) throw espExistingError;

//         let especialidadId = espExisting?.id as string | undefined;

//         if (!especialidadId) {
//           const { data: espInsert, error: espInsertError } = await this.supa.client
//             .from('especialidades')
//             .insert({ nombre: normalizado })
//             .select('id')
//             .single();

//           if (espInsertError) throw espInsertError;
//           especialidadId = espInsert.id as string;
//         }

//         especialidadIds.push(especialidadId);
//       }

//       if (especialidadIds.length) {
//         const rows = especialidadIds.map(id => ({
//           usuario_id: userId,
//           especialidad_id: id
//         }));

//         const { error: ueError } = await this.supa.client
//           .from('usuario_especialidad')
//           .upsert(rows, { onConflict: 'usuario_id,especialidad_id' });

//         if (ueError) throw ueError;
//       }

//       // 5) Si NO hay sesión ==============>  no intentamos subir imagen
//       if (!data.session) {
//         await Swal.fire({
//           icon: 'info',
//           title: 'Verifica tu correo',
//           html: `
//           <p>Te enviamos un email de verificación a <strong>${fv.email}</strong>.</p>
//           <p>Confírmalo para iniciar sesión y completar tu registro (subir imagen).</p>
//           <p><strong>Importante:</strong> Un administrador debe aprobar tu cuenta antes de poder ingresar.</p>
//         `,
//           confirmButtonText: 'Entendido'
//         });

//         this.registroForm.reset();
//         this.imagenPrevia = null;

//         // ==============>  CERRAR SESIÓN POR SI QUEDÓ ALGUNA (otro usuario logueado, etc.)
//         await this.supa.client.auth.signOut();

//         this.router.navigate(['/bienvenida']);
//         return;
//       }

//       // 6) Con sesión activa: subir avatar y actualizar imagen_perfil_1
//       if (fv.imagenPerfil) {
//         const avatarUrl = await this.supa.uploadAvatar(userId, fv.imagenPerfil, 1);
//         const { error: avatarError } = await this.supa.client
//           .from('usuarios')
//           .update({ imagen_perfil_1: avatarUrl })
//           .eq('id', userId);

//         if (avatarError) throw avatarError;
//       }

//       await Swal.fire({
//         icon: 'success',
//         title: 'Registro enviado',
//         text: 'Verificá tu email. Un administrador debe aprobar tu cuenta antes de ingresar.',
//         timer: 3500,
//         showConfirmButton: false
//       });

//       this.registroForm.reset();
//       this.imagenPrevia = null;

//       // ==============> IMPORTANTE: cerrar la sesión creada por signUp
//       await this.supa.client.auth.signOut();

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


//   agregarEspecialidadCustom(): void {
//     const valor = this.nuevaEspecialidadCtrl.value?.trim(); // Leer del control independiente
    
//     if (!valor) return;

//     // Verificar si ya existe en la base (para no duplicar visualmente)
//     if (this.especialidadesBase.includes(valor)) {
//       // Si ya existe, solo la seleccionamos si no lo está
//       const seleccionadas = this.especialidadesSeleccionadas;
//       if (!seleccionadas.includes(valor)) {
//         this.registroForm.get('especialidades')?.setValue([...seleccionadas, valor]);
//       }
//       this.nuevaEspecialidadCtrl.setValue(''); // Limpiar input
//       return;
//     }

//     // Si es nueva:
//     // A) La agregamos a la lista visual (chips)
//     // OJO: La insertamos antes de 'Otro' para que quede prolijo
//     const indexOtro = this.especialidadesBase.indexOf('Otro');
//     if (indexOtro >= 0) {
//         this.especialidadesBase.splice(indexOtro, 0, valor);
//     } else {
//         this.especialidadesBase.push(valor);
//     }

//     // B) La seleccionamos automáticamente en el Form
//     const actuales = this.especialidadesSeleccionadas;
//     // Chequeamos que no se pase del máximo
//     if (actuales.length < this.maxEspecialidades) {
//        this.registroForm.get('especialidades')?.setValue([...actuales, valor]);
//     }

//     // C) Limpiamos el input
//     this.nuevaEspecialidadCtrl.setValue('');
//   }



// }
