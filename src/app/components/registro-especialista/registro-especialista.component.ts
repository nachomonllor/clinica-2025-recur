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
import { MatSlideToggleModule } from "@angular/material/slide-toggle";

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
    MatProgressSpinnerModule,
    MatSlideToggleModule
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
  // Lógica para AGREGAR especialidad 
  // ======================================================

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

  toggleCaptcha(): void {
    this.captchaEnabled = !this.captchaEnabled;

    const captchaControl = this.registroForm.get('recaptcha');

    if (this.captchaEnabled) {
      // Si lo activamos, le ponemos la validación de nuevo
      captchaControl?.setValidators(Validators.required);
      this.captchaValido = false; // Reseteamos validez
    } else {
      // Si lo desactivamos, LE QUITAMOS la validación (importante)
      captchaControl?.clearValidators();
      this.captchaValido = true; // Lo damos por válido automáticamente
    }
    
    // Actualizamos el estado del input para que Angular se entere
    captchaControl?.updateValueAndValidity();
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



