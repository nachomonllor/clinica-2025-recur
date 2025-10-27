// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-registro-especialista',
// //   standalone: true,
// //   imports: [],
// //   templateUrl: './registro-especialista.component.html',
// //   styleUrl: './registro-especialista.component.scss'
// // })
// // export class RegistroEspecialistaComponent {

// // }

// src/app/components/registro-especialista/registro-especialista.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';
import { SupabaseService } from '../../services/supabase.service';

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
    MatCardModule
  ],
  templateUrl: './registro-especialista.component.html',
  styleUrls: ['./registro-especialista.component.scss']
})
export class RegistroEspecialistaComponent implements OnInit {

  // EXTEERNDER LA LISTA CUANDO SEA NECESARIO
  especialidadesBase = [
    'Cardiología', 'Dermatología', 'Ginecología', 'Pediatría', 'Neurología', 'Otro'
  ];

  imagenPrevia: string | null = null;

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
    private fb: FormBuilder,
    private supa: SupabaseService
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

  async onSubmit(): Promise<void> {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const fv = this.registroForm.value;
    this._toggleLoading(true);

    try {
      // 1) Alta en Auth (envía mail de verificación)
      const { data, error }: any = await this.supa.signUp(fv.email!, fv.password!);
      if (error) throw error;
      const userId = data.user.id as string;

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

      // 4) Upsert en profiles (rol especialista, pendiente de aprobación)
      await this.supa.upsertProfile({
        id: userId,
        rol: 'especialista',
        nombre: fv.nombre!,
        apellido: fv.apellido!,
        dni: fv.dni!,
        obra_social: null,                 // no aplica acá
        fecha_nacimiento: fv.fechaNacimiento!,
        avatar_url: avatarUrl,
        imagen2_url: null,                 // no usamos segunda imagen para especialista
        aprobado: false,                   // ← clave: requiere aprobación de Admin
        especialidades                     // ← text[]
      });

      Swal.fire({
        icon: 'success',
        title: 'Registro enviado',
        text: 'Verificá tu email. Un administrador debe aprobar tu cuenta antes de ingresar.',
        timer: 3500,
        showConfirmButton: false
      });
      this.registroForm.reset();
      this.imagenPrevia = null;

    } catch (e: any) {
      Swal.fire('Error', e.message || e, 'error');
    } finally {
      this._toggleLoading(false);
    }
  }

  private _toggleLoading(v: boolean) {
    // Podés agregar spinner/overlay aquí si querés.
  }
}


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





