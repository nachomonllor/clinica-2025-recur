
// src/app/components/registro-especialista/registro-especialista.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators
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

  // private supa = inject(SupabaseService).client; // 👈 acá queda “el cliente”

  // EXTEERNDER LA LISTA CUANDO SEA NECESARI
  especialidadesBase = [
    'Cardiología', 'Dermatología', 'Ginecología', 'Pediatría', 'Neurología', 'Otro'
  ];

  imagenPrevia: string | null = null;
  captchaEnabled = environment.captchaEnabled;
  captchaValido = !environment.captchaEnabled; // Si está deshabilitado, siempre válido

  registroForm!: FormGroup<{
    nombre:            FormControl<string | null>;
    apellido:          FormControl<string | null>;
    dni:               FormControl<string | null>;
    fechaNacimiento:   FormControl<string | null>;
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

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      nombre:           this.fb.control<string | null>(null, Validators.required),
      apellido:         this.fb.control<string | null>(null, Validators.required),
      dni:              this.fb.control<string | null>(null, Validators.required),
      fechaNacimiento:  this.fb.control<string | null>(null, Validators.required), // ← reemplaza “edad”
      email:            this.fb.control<string | null>(null, [Validators.required, Validators.email]),
      password:         this.fb.control<string | null>(null, Validators.required),
      especialidades:   this.fb.control<string[] | null>([], Validators.required),
      otraEspecialidad: this.fb.control<string | null>(null),
      imagenPerfil:     this.fb.control<File | null>(null, Validators.required),
    });

    // 
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

  private calcEdadFromISO(iso: string): number {
    const [y, m, d] = iso.split('-').map(Number);
    const today = new Date();
    let edad = today.getFullYear() - y;
    const month = today.getMonth() + 1;
    const day = today.getDate();
    if (month < m || (month === m && day < d)) edad--;
    return edad;
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
    
  // // DB
  // async upsertPerfil(profile: any) {
  //   const { error } = await this.supa.from('profiles').upsert(profile, { onConflict: 'id' });
  //   if (error) throw error;
  // }

  async upsertPerfil(profile: any) {
    const { error } = await this.supa.client
      .from('profiles')
      .upsert(profile, { onConflict: 'id' });
    if (error) throw error;
  }

  async onSubmit(): Promise<void> {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const fv = this.registroForm.value;
    //this._toggleLoading(true);

    try {
      // 1) Alta en Auth con todos los datos en metadata
      // El trigger leerá estos datos y creará el perfil automáticamente
      const { data, error }: any = await this.supa.client.auth.signUp({
        email: fv.email!,
        password: fv.password!,
        options: {
          data: {
            rol: 'especialista',
            nombre: fv.nombre,
            apellido: fv.apellido,
            dni: fv.dni,
            fecha_nacimiento: fv.fechaNacimiento
          }
        }
      });
      if (error) throw error;
      const userId = data.user.id as string;

      // Si no hay sesión automática (confirmación de email activa)
      if (!data.session) {
        // El trigger ya creó el perfil básico con los datos de metadata
        // Las imágenes y datos adicionales se completarán cuando el usuario verifique su email
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

      // Si hay sesión automática, continuar con el flujo completo

      // 2) Normalizamos especialidades (multi + “Otro”)
      const seleccion = (fv.especialidades ?? []).filter(Boolean);
      let especialidades = seleccion.filter(e => e !== 'Otro');
      if (seleccion.includes('Otro') && fv.otraEspecialidad) {
        especialidades.push(fv.otraEspecialidad.trim());
      }
      // deduplicar + limpiar vacíos
      especialidades = Array.from(new Set(especialidades.map(s => s?.trim()))).filter(Boolean) as string[];

      // 3) Subir avatar al bucket avatars/<uid>/**
      const avatarUrl = await this.supa.uploadAvatar(userId, fv.imagenPerfil!, 1);

      // 4) Calcular edad desde fecha de nacimiento
      const edadCalculada = this.calcEdadFromISO(fv.fechaNacimiento!);

      // 5) Actualizar perfil en profiles con la imagen (el trigger ya creó el perfil básico)
      const { data: updateData, error: perfilError } = await this.supa.client
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          aprobado: false                  // <===== requiere aprobación de Admin
        })
        .eq('id', userId)
        .select();
      
      if (perfilError) throw perfilError;

      // 6) Insertar en tabla especialistas (una fila por cada especialidad)
      // Como la tabla tiene especialidad como TEXT, guardamos la primera especialidad
      // o podríamos crear múltiples registros si fuera necesario
      const primeraEspecialidad = especialidades[0] || 'Sin especialidad';
      const { error: especialistaError } = await this.supa.client
        .from('especialistas')
        .insert({
          id: userId,
          nombre: fv.nombre!,
          apellido: fv.apellido!,
          edad: edadCalculada,
          fecha_nacimiento: fv.fechaNacimiento!,
          dni: fv.dni!,
          especialidad: primeraEspecialidad, // Guardamos la primera, o podríamos hacer múltiples inserts
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
      // Log detallado del error para debugging
      console.error('[Registro Especialista] Error completo:', {
        error: e,
        message: e?.message,
        code: e?.code,
        status: e?.status,
        name: e?.name,
        stack: e?.stack
      });
      
      const mensajeError = this.mapPgError(e);
      Swal.fire('Error', mensajeError, 'error');
    } finally {
      //this._toggleLoading(false);
    }
  }

}



//-------------------------------------------------------------------------------------------
//----------------------- ANTES ERA ASI -------------------------------------
//---------------------------------------------------------------------------



// // registro-especialista.component.ts
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   FormBuilder,
//   FormControl,
//   FormGroup,
//   ReactiveFormsModule,
//   Validators
// } from '@angular/forms';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatCardModule } from '@angular/material/card';
// import { MatSelectModule } from '@angular/material/select';
// import Swal from 'sweetalert2';

// //  Storage y funciones de la API modular:

// @Component({
//     selector: 'app-registro-especialista',
//     standalone:true,
//     imports: [
//         CommonModule,
//         ReactiveFormsModule,
//         MatFormFieldModule,
//         MatInputModule,
//         MatSelectModule,
//         MatButtonModule,
//         MatCardModule
//     ],
//     templateUrl: './registro-especialista.component.html',
//     styleUrls: ['./registro-especialista.component.scss']
// })
// export class RegistroEspecialistaComponent implements OnInit {

//   // Lista fija de especialidades + “Otro”
//   especialidades = [
//     'Cardiología',
//     'Dermatología',
//     'Ginecología',
//     'Pediatría',
//     'Neurología',
//     'Otro'
//   ];

//   imagenPrevia: string | null = null;

//   registroForm!: FormGroup<{
//     nombre: FormControl<string | null>;
//     apellido: FormControl<string | null>;
//     edad: FormControl<number | null>;
//     dni: FormControl<string | null>;
//     especialidad: FormControl<string | null>;
//     otraEspecialidad: FormControl<string | null>;
//     email: FormControl<string | null>;
//     password: FormControl<string | null>;
//     imagenPerfil: FormControl<File | null>;
//   }>;

//   constructor(
//     private fb: FormBuilder,
//    // private especialistaService: EspecialistaService,
//     private storage: Storage            // 🔹 inyectar Storage
//   ) { }

//   ngOnInit() {
//     // Creamos el form con validaciones básicas
//     this.registroForm = this.fb.group({
//       nombre: this.fb.control<string | null>(null, Validators.required),
//       apellido: this.fb.control<string | null>(null, Validators.required),
//       edad: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
//       dni: this.fb.control<string | null>(null, Validators.required),
//       especialidad: this.fb.control<string | null>(null, Validators.required),
//       // inicializamos sin validadores; se los ponemos dinámicamente
//       otraEspecialidad: this.fb.control<string | null>(null),
//       email: this.fb.control<string | null>(null, [Validators.required, Validators.email]),
//       password: this.fb.control<string | null>(null, Validators.required),
//       imagenPerfil: this.fb.control<File | null>(null, Validators.required),
//     });

//     // Si elige “Otro”, requerimos el campo extra
//     this.registroForm.get('especialidad')!.valueChanges.subscribe(val => {
//       const ctrl = this.registroForm.get('otraEspecialidad')!;
//       if (val === 'Otro') {
//         ctrl.setValidators([Validators.required]);
//       } else {
//         ctrl.clearValidators();
//         ctrl.setValue(null);
//       }
//       ctrl.updateValueAndValidity();
//     });
//   }

//   onFileChange(event: Event) {
//     const input = event.target as HTMLInputElement;
//     if (!input.files?.length) return;

//     const file = input.files[0];
//     this.registroForm.get('imagenPerfil')!.setValue(file);
//     this.registroForm.get('imagenPerfil')!.markAsDirty();

//     const reader = new FileReader();
//     reader.onload = () => this.imagenPrevia = reader.result as string;
//     reader.readAsDataURL(file);
//   }

//   onSubmit() {
//     if (this.registroForm.invalid) {
//       this.registroForm.markAllAsTouched();
//       return;
//     }

//     const fv = this.registroForm.value;
//     const especialidadFinal = fv.especialidad === 'Otro'
//       ? fv.otraEspecialidad!
//       : fv.especialidad!;

//     const file = fv.imagenPerfil!;      // 📁 File
//     const filePath = `especialistas/${Date.now()}_${file.name}`;
//     const storageRef = ref(this.storage, filePath);

//     // 1) subimos la imagen a Storage
//     uploadBytes(storageRef, file)
//       .then(() => getDownloadURL(storageRef))
//       .then((url: string) => {
//         // 2) una vez subida, creamos el objeto con la URL
//         const nuevoEspecialista = {
//           nombre: fv.nombre!,
//           apellido: fv.apellido!,
//           edad: fv.edad!,
//           dni: fv.dni!,
//           especialidad: especialidadFinal,
//           email: fv.email!,
//           password: fv.password!,
//           imagenPerfil: url     // ◀️ URL en lugar de File
//         };

//         // 3) lo guardamos en Firestore
//         return this.especialistaService.addEspecialista(nuevoEspecialista)
//           .then(docRef =>
//             // opcional: guardar el id dentro del doc
//             this.especialistaService.updateEspecialista(docRef.id, { id: docRef.id })
//           );
//       })
//       .then(() => {
//         Swal.fire({
//           icon: 'success',
//           title: `Especialista registrado con éxito`,
//           showConfirmButton: false,
//           timer: 2000
//         });
//         this.registroForm.reset();
//         this.imagenPrevia = null;
//       })
//       .catch(err => {
//         console.error(err);
//         Swal.fire('Error', err.message, 'error');
//       });
//   }

  
// }





