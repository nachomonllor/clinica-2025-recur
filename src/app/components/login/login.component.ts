


import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import { AutoFocusDirective } from '../../../directives/auto-focus.directive';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupabaseService } from '../../../services/supabase.service';
import { LogIngresosService } from '../../../services/log-ingresos.service';
import { Rol } from '../../models/tipos.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatTooltipModule, MatProgressSpinnerModule, MatSnackBarModule,
    AutoFocusDirective,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  formularioLogin!: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  cargando = false;           // usa solo este flag (no 'loading')
  error = '';
  quickLogins: QuickLoginsConfig = environment.quickLogins as QuickLoginsConfig;
  quickSeleccionado?: { nombre: string; rol: Rol; email: string };

  @ViewChild('passwordInput', { static: false }) passwordInput?: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private supa: SupabaseService,
    private router: Router,
    private snackBar: MatSnackBar,
    private logIngresos: LogIngresosService
  ) { }

  ngOnInit(): void {
    this.formularioLogin = this.fb.group({
      email: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    });
  }

  /** Si el template aún hace (ngSubmit)="onSubmit()", delegamos */
  onSubmit(): Promise<void> {
    return this.iniciarSesion();
  }

  async iniciarSesion(): Promise<void> {


    console.log(' funcion iniciarSesion()');

    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.error = '';

    try {
      const { email, password } = this.formularioLogin.getRawValue(); // <==== del FormGroup, no del FormBuilder

      // 1) Login
      const { error: eLogin } = await this.supa.iniciarSesion(email, password);
      if (eLogin) throw eLogin;

      // 2) Usuario desde Auth
      const { data: userData, error: eUser } = await this.supa.obtenerUsuarioActual();
      if (eUser || !userData?.user) throw eUser || new Error('No se pudo obtener el usuario.');
      const user = userData.user;

      // 3) Verificación de correo (requisito para todos)
      if (!user.email_confirmed_at) {
        await this.supa.cerrarSesion();
        throw new Error('Debes verificar tu correo antes de ingresar.');
      }

      // 4) Perfil (intento 1)
      let { data: perfil, error: ePerfil } = await this.supa.obtenerPerfil(user.id);

      // 4b) Fallback: si no hay perfil (p.ej., trigger faltó o falló), lo creo y reintento
      if (ePerfil || !perfil) {
        const md: any = user.user_metadata || {};
        await this.supa.client.from('perfiles').upsert({
          id: user.id,
          email: user.email ?? null,                 //<==== no lo dejes en NULL
          rol: md.rol ?? 'paciente',
          nombre: md.nombre ?? null,
          apellido: md.apellido ?? null,
          dni: md.dni ?? null,
          fecha_nacimiento: md.fecha_nacimiento ?? null,
          obra_social: md.obra_social ?? null,
          aprobado: (md.rol === 'especialista') ? false : true
        }, { onConflict: 'id' });

        const retry = await this.supa.obtenerPerfil(user.id);
        perfil = retry.data;
        if (!perfil) throw new Error('No se pudo crear/leer el perfil.');
      }

      // 5) Regla solo para ESPECIALISTA: requiere aprobación
      if (perfil.rol === 'especialista' && !perfil.aprobado) {
        await this.supa.cerrarSesion();
        throw new Error('Tu cuenta de especialista aún no ha sido aprobada por un administrador.');
      }

      // 6) (Opcional) avisos de perfil incompleto
      const tieneAvatar = !!(perfil.avatar_url && String(perfil.avatar_url).trim());
      const tieneImagen2 = !!(perfil.imagen2_url && String(perfil.imagen2_url).trim());
      const faltaAvatar = !tieneAvatar;
      const faltaImagen2 = perfil.rol === 'paciente' && !tieneImagen2;
      if (faltaAvatar || faltaImagen2) {
        const msg = faltaAvatar && faltaImagen2
          ? 'Faltan ambas imágenes de perfil.'
          : faltaAvatar ? 'Falta la primera imagen de perfil.' : 'Falta la segunda imagen de perfil.';
        await Swal.fire({
          icon: 'info',
          title: 'Completar perfil',
          html: `<p>${msg}</p><p>Podés subirlas desde "Mi Perfil".</p>`,
          confirmButtonText: 'Entendido'
        });
      } else {
        await Swal.fire({ icon: 'success', title: 'Bienvenido', timer: 1200, showConfirmButton: false });
      }

      // 7) Log de ingreso
      await this.logIngresos.registrarIngreso();

      // 8) Navegación según rol
      if (perfil.rol === 'paciente') {
        const ok = await this.router.navigate(['/mis-turnos-paciente']);

        console.log('navigate', ok);
      } else if (perfil.rol === 'especialista') {
        await this.router.navigate(['/mis-turnos-especialista']);
      } else {
        await this.router.navigate(['/perfil-usuario']);
      }

    } catch (e) {
      this.error = this.traducirError(e);
      await Swal.fire('Error', this.error || 'Ocurrió un error al iniciar sesión', 'error');
    } finally {
      this.cargando = false;
    }
  } 

  // ----- Quick logins -----
  get accesosRapidos(): QuickAccessUser[] {
    const usuarios: QuickAccessUser[] = [];
    (Array.isArray(this.quickLogins.paciente) ? this.quickLogins.paciente : [this.quickLogins.paciente]).forEach(user => {
      usuarios.push({ email: user.email, password: user.password, nombre: user.nombre ?? user.email, avatar: user.avatar ?? 'assets/avatars/james.jpg', rol: 'paciente' });
    });
    (Array.isArray(this.quickLogins.especialista) ? this.quickLogins.especialista : [this.quickLogins.especialista]).forEach(user => {
      usuarios.push({ email: user.email, password: user.password, nombre: user.nombre ?? user.email, avatar: user.avatar ?? 'assets/avatars/mendel.jpg', rol: 'especialista' });
    });
    (Array.isArray(this.quickLogins.admin) ? this.quickLogins.admin : [this.quickLogins.admin]).forEach(user => {
      usuarios.push({ email: user.email, password: user.password, nombre: user.nombre ?? user.email, avatar: user.avatar ?? 'assets/avatars/jagger.jpg', rol: 'admin' });
    });
    return usuarios;
  }

  activarQuick(user: QuickAccessUser, ev?: Event): void {
    console.log('[LoginPaciente] activarQuick', user.email, ev?.type);
    this.loginRapido(user.email, user.password);
  }

  async loginRapido(email: string, password: string): Promise<void> {
    this.formularioLogin.patchValue({ email, password });
    this.formularioLogin.markAsDirty();
    const seleccionado = this.accesosRapidos.find(u => u.email === email);
    if (seleccionado) {
      this.quickSeleccionado = { nombre: seleccionado.nombre, rol: seleccionado.rol, email };
      this.snackBar.open(
        `Rellenamos las credenciales de ${seleccionado.nombre}. Revisá y presioná Ingresar.`,
        'Cerrar',
        { duration: 3500 }
      );
    } else {
      this.quickSeleccionado = undefined;
    }
    setTimeout(() => this.passwordInput?.nativeElement.focus({ preventScroll: false }), 20);
  }

  private traducirError(e: unknown): string {
    const err: any = e;
    const msg = String(err?.message ?? err?.error_description ?? err?.statusText ?? '');
    const m = msg.toLowerCase();

    if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) {
      return 'No se pudo conectar con el servidor. Verificá tu conexión a internet, la URL y la API key de Supabase.';
    }
    if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) {
      return 'Debes verificar tu correo antes de ingresar.';
    }
    if (m.includes('rate') && m.includes('limit')) return 'Demasiados intentos. Esperá unos minutos e intentá nuevamente.';
    if (m.includes('exists') && m.includes('resource')) return 'El archivo ya existe. Probá con otro nombre o ruta.';
    return msg || 'Ocurrió un error al procesar la solicitud.';
  }
}

