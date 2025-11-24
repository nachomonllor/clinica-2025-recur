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
import { Usuario, UsuarioCreate } from '../../models/usuario.model';
import { QuickAccessUser, QuickLoginsConfig } from '../../models/nav.models';

import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatTooltipModule, MatProgressSpinnerModule, MatSnackBarModule,
    AutoFocusDirective,
    TranslateModule,

  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  formularioLogin!: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  cargando = false;
  error = '';

  quickLogins: QuickLoginsConfig = environment.quickLogins as QuickLoginsConfig;
  quickSeleccionado?: { nombre: string; rol: Rol; email: string };

  idiomas = ['es', 'en', 'pt'];
  idiomaActual = 'es';

  @ViewChild('passwordInput', { static: false }) passwordInput?: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private supa: SupabaseService,
    private router: Router,
    private snackBar: MatSnackBar,
    private logIngresos: LogIngresosService,
    private translate: TranslateService,

  ) {

    const saved = localStorage.getItem('lang');
    const inicial = saved && this.idiomas.includes(saved) ? saved : 'es';
    this.idiomaActual = inicial;
    this.translate.use(inicial);
  }

  cambiarIdioma(lang: string) {
    if (!this.idiomas.includes(lang)) return;
    this.idiomaActual = lang;
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }
  ngOnInit(): void {
    this.formularioLogin = this.fb.group({
      email: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    });
  }

  onSubmit(): Promise<void> {
    return this.iniciarSesion();
  }

  async iniciarSesion(): Promise<void> {
    console.log('funcion iniciarSesion()');

    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.error = '';

    try {
      const { email, password } = this.formularioLogin.getRawValue();

      // 1) Login (auth)
      const { error: eLogin } = await this.supa.iniciarSesion(email, password);
      if (eLogin) throw eLogin;

      // 2) Usuario desde Auth
      const { data: userData, error: eUser } = await this.supa.obtenerUsuarioActual();
      if (eUser || !userData?.user) throw eUser || new Error('No se pudo obtener el usuario de Auth.');
      const user = userData.user;

      // 3) Verificación de correo (requisito para todos)
      if (!user.email_confirmed_at) {
        await this.supa.cerrarSesion();
        throw new Error('Debes verificar tu correo antes de ingresar.');
      }

      // 4) Usuario en esquema_clinica.usuarios (intento 1)
      let { data: usuario, error: eUsuario } = await this.supa.obtenerUsuarioPorId(user.id);

      if (eUsuario) {
        console.error('[Login] Error al obtener usuario en tabla usuarios', eUsuario);
        throw eUsuario;
      }

      // 4b) Fallback: si no hay usuario, lo creo y reintento
      if (!usuario) {
        const md: any = user.user_metadata || {};

        const rolMeta = (md.perfil ?? md.rol ?? 'PACIENTE').toString().toUpperCase();
        const rolDb: Rol =
          rolMeta === 'ESPECIALISTA' || rolMeta === 'ADMIN' ? rolMeta : 'PACIENTE';

        const nuevoUsuario: UsuarioCreate = {
          id: user.id,
          nombre: md.nombre ?? '',
          apellido: md.apellido ?? '',
          edad: md.edad ?? null,
          dni: md.dni ?? '',
          obra_social: md.obra_social ?? null,
          email: user.email ?? '',
          // Campo password en la tabla usuarios: sólo para cumplir NOT NULL.
          // La autenticación real la maneja Supabase Auth.
          password: 'auth_managed',
          perfil: rolDb,
          imagen_perfil_1: md.imagen_perfil_1 ?? null,
          imagen_perfil_2: md.imagen_perfil_2 ?? null,
          esta_aprobado: rolDb === 'ESPECIALISTA' ? false : true,
          mail_verificado: !!user.email_confirmed_at,
          activo: true,
          idioma_preferido: 'es',
          fecha_registro: undefined,
        };

        const { data: creado, error: eUpsert } = await this.supa.upsertUsuario(nuevoUsuario);
        if (eUpsert) {
          console.error('[Login] Error al crear usuario', eUpsert);
          throw eUpsert;
        }

        usuario = creado as Usuario | null;
        if (!usuario) throw new Error('No se pudo crear/leer el usuario.');
      }

      // 5) Regla solo para ESPECIALISTA: requiere aprobación
      if (usuario.perfil === 'ESPECIALISTA' && !usuario.esta_aprobado) {
        await this.supa.cerrarSesion();
        throw new Error('Tu cuenta de especialista aún no ha sido aprobada por un administrador.');
      }

      // 6) Avisos de perfil incompleto (imágenes)
      const tieneAvatar1 = !!(usuario.imagen_perfil_1 && String(usuario.imagen_perfil_1).trim());
      const tieneAvatar2 = !!(usuario.imagen_perfil_2 && String(usuario.imagen_perfil_2).trim());

      const faltaAvatar1 = !tieneAvatar1;
      const faltaAvatar2 = usuario.perfil === 'PACIENTE' && !tieneAvatar2;

      if (faltaAvatar1 || faltaAvatar2) {
        const msg = faltaAvatar1 && faltaAvatar2
          ? 'Faltan ambas imágenes de perfil.'
          : faltaAvatar1 ? 'Falta la primera imagen de perfil.' : 'Falta la segunda imagen de perfil.';
        await Swal.fire({
          icon: 'info',
          title: 'Completar perfil',
          html: `<p>${msg}</p><p>Podés subirlas desde "Mi Perfil".</p>`,
          confirmButtonText: 'Entendido'
        });
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'Bienvenido',
          timer: 1200,
          showConfirmButton: false
        });
      }

      // 7) Log de ingreso
      await this.logIngresos.registrarIngreso();

      // 8) Navegación según rol
      if (usuario.perfil === 'PACIENTE') {
        await this.router.navigate(['/mis-turnos-paciente']);
      } else if (usuario.perfil === 'ESPECIALISTA') {
        await this.router.navigate(['/mis-turnos-especialista']);
      } else {
        // Admin → página principal admin (ajustá a tu ruta)
        await this.router.navigate(['/turnos-admin']);
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

    const pacientes = Array.isArray(this.quickLogins.paciente)
      ? this.quickLogins.paciente
      : [this.quickLogins.paciente];

    pacientes.forEach(user => {
      usuarios.push({
        email: user.email,
        password: user.password,
        nombre: user.nombre ?? user.email,
        avatar: user.avatar ?? 'assets/avatars/james.jpg',
        rol: 'PACIENTE',
      });
    });

    const especialistas = Array.isArray(this.quickLogins.especialista)
      ? this.quickLogins.especialista
      : [this.quickLogins.especialista];

    especialistas.forEach(user => {
      usuarios.push({
        email: user.email,
        password: user.password,
        nombre: user.nombre ?? user.email,
        avatar: user.avatar ?? 'assets/avatars/mendel.jpg',
        rol: 'ESPECIALISTA',
      });
    });

    const admins = Array.isArray(this.quickLogins.admin)
      ? this.quickLogins.admin
      : [this.quickLogins.admin];

    admins.forEach(user => {
      usuarios.push({
        email: user.email,
        password: user.password,
        nombre: user.nombre ?? user.email,
        avatar: user.avatar ?? 'assets/avatars/jagger.jpg',
        rol: 'ADMIN',
      });
    });

    return usuarios;
  }

  activarQuick(user: QuickAccessUser, ev?: Event): void {
    console.log('[Login] activarQuick', user.email, ev?.type);
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



