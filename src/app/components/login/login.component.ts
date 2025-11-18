
// src/app/components/login-paciente/login-paciente.component.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { QuickAccessUser, QuickLoginsConfig } from '../../../models/nav.models';
import { Rol } from '../../../models/perfil.model';
import { SupabaseService } from '../../../services/supabase.service';
import { LogIngresosService } from '../../../services/log-ingresos.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule, MatSnackBarModule,
    AutoFocusDirective,

  ],

  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  formularioLogin!: FormGroup;
  cargando = false;
  error: string = '';
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

  // /// ------------------- CAPTCHA ------------------

  // captchaValido = false;

  // onCaptchaValido(valido: boolean): void {
  //   this.captchaValido = valido;
  // }

  // onSubmit(): void {
  //   if (this.formularioLogin.invalid || !this.captchaValido) {
  //     this.formularioLogin.markAllAsTouched();

  //     if (!this.captchaValido) {
  //       // opcional: mostrar mensaje
  //       // this.snackBar.open('Resuelve el captcha', 'Cerrar', { duration: 3000 });
  //     }

  //     return;
  //   }

  // }

  // // -----------------------------------------


  async onSubmit(): Promise<void> {
    return this.iniciarSesion();
  }


  // async onSubmit(): Promise<void> {
  //   this.loading = true;
  //   const supabase = this.supa.client;

  //   try {
  //     const { data, error } = await supabase.auth.signInWithPassword({
  //       email: this.fb.value.email!,
  //       password: this.fb.value.password!
  //     });

  //     if (error || !data.user) {
  //       throw error || new Error('No se pudo iniciar sesión');
  //     }

  //     const user = data.user;
  //     const md: any = user.user_metadata || {};

  //     //  Fallback: garantiza que exista fila en `perfiles`
  //     await supabase
  //       .from('perfiles')
  //       .upsert({
  //         id: user.id,
  //         rol: md.rol || 'paciente',
  //         nombre: md.nombre || null,
  //         apellido: md.apellido || null,
  //         dni: md.dni || null,
  //         fecha_nacimiento: md.fecha_nacimiento || null,
  //         obra_social: md.obra_social || null,
  //         aprobado: md.rol === 'paciente' ? true : false
  //       }, { onConflict: 'id' });

  //     // ... acá ya seguís con tu lógica normal:
  //     // redireccionar según rol, etc.

  //   } catch (err: any) {
  //     console.error('[Login] Error', err);
  //     Swal.fire('Error', err.message || 'No se pudo iniciar sesión', 'error');
  //   } finally {
  //     this.loading = false;
  //   }
  // }


  ngOnInit(): void {
    this.formularioLogin = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async iniciarSesion(): Promise<void> {
    if (this.quickSeleccionado) {
      this.quickSeleccionado = undefined;
    }
    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.error = '';

    try {
      const { email, password } = this.formularioLogin.value;

      // 1) Login
      const { error: eLogin } = await this.supa.iniciarSesion(email, password);
      if (eLogin) throw eLogin;

      // 2) Usuario + verificación de correo (desde Auth, NO desde profiles)
      const { data: userData, error: eUser } = await this.supa.obtenerUsuarioActual();
      if (eUser || !userData?.user) throw eUser || new Error('No se pudo obtener el usuario.');
      const user = userData.user;

      // 3) Perfil (sin seleccionar email en SupabaseService.obtenerPerfil)
      const { data: perfil, error: ePerfil } = await this.supa.obtenerPerfil(user.id);
      if (ePerfil || !perfil) throw ePerfil || new Error('No se encontró el perfil del usuario.');

      // 4) Validaciones según requisitos del Sprint 1:
      // - Pacientes: solo pueden ingresar si verificaron su mail
      // - Especialistas: solo pueden ingresar si verificaron su mail Y fueron aprobados por admin

      // Verificar email confirmado (requisito para todos los roles)
      if (!user.email_confirmed_at) {
        await this.supa.cerrarSesion();
        throw new Error('Debes verificar tu correo antes de ingresar.');
      }

      // Completar registro en tabla especialistas si falta (para especialistas que se registraron con email confirmation)
      // Esto debe hacerse ANTES de la validación de aprobación para que el registro esté completo
      if (perfil.rol === 'especialista') {
        const { data: especialistaExistente } = await this.supa.client
          .from('especialistas')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!especialistaExistente) {
          // El registro no existe, intentar completarlo desde metadata
          const userMetadata = user.user_metadata || {};
          const rawAppMetaData = (user as any).app_metadata || {};

          // Obtener datos de metadata (pueden estar en user_metadata o app_metadata)
          const nombre = userMetadata['nombre'] || rawAppMetaData['nombre'] || perfil.nombre;
          const apellido = userMetadata['apellido'] || rawAppMetaData['apellido'] || perfil.apellido;
          const dni = userMetadata['dni'] || rawAppMetaData['dni'] || null;
          const fechaNacimiento = userMetadata['fecha_nacimiento'] || rawAppMetaData['fecha_nacimiento'] || null;
          const especialidad = userMetadata['especialidad'] || rawAppMetaData['especialidad'] || 'Sin especialidad';

          if (nombre && apellido && dni && fechaNacimiento) {
            // Calcular edad desde fecha de nacimiento
            const fechaNac = new Date(fechaNacimiento);
            const hoy = new Date();
            let edad = hoy.getFullYear() - fechaNac.getFullYear();
            const mes = hoy.getMonth() - fechaNac.getMonth();
            if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
              edad--;
            }

            // Insertar en especialistas
            const { error: especialistaError } = await this.supa.client
              .from('especialistas')
              .insert({
                id: user.id,
                nombre,
                apellido,
                edad,
                fecha_nacimiento: fechaNacimiento,
                dni,
                especialidad,
                email: user.email || ''
              });

            if (especialistaError) {
              console.warn('[Login] No se pudo completar registro en especialistas:', especialistaError);
            } else {
              console.log('[Login] Registro completado en tabla especialistas');
            }
          } else {
            console.warn('[Login] Faltan datos en metadata para completar registro en especialistas');
          }
        }
      }

      // Validación específica para especialistas (requieren aprobación de admin)
      // Esta validación va DESPUÉS de completar el registro para que los datos estén completos
      if (perfil.rol === 'especialista' && !perfil.aprobado) {
        await this.supa.cerrarSesion();
        throw new Error('Tu cuenta de especialista aún no ha sido aprobada por un administrador.');
      }

      // Para pacientes, verificar que sea paciente (pero permitir otros roles si vienen de quickLogin)
      // if (perfil.rol !== 'paciente') {
      //   await this.supa.cerrarSesion();
      //   throw new Error('No estás registrado como paciente.');
      // }

      // (OPCIONAL) asegurar fila en profiles 
      // await this.supa.client.from('perfiles').upsert(
      //   { id: user.id, rol: 'paciente', aprobado: true }, //sin email
      //   { onConflict: 'id' }
      // );

      // Verificar si el perfil está incompleto (sin imágenes)
      // Esto puede pasar si el usuario se registró pero no completó el registro después de verificar su email
      // Verificamos que las URLs no sean null, undefined, o strings vacíos
      const tieneAvatar = perfil.avatar_url && String(perfil.avatar_url).trim() !== '';
      const tieneImagen2 = perfil.imagen2_url && String(perfil.imagen2_url).trim() !== '';

      // Solo mostrar advertencia si realmente faltan imágenes críticas
      // Para pacientes: ambas imágenes son requeridas
      // Para especialistas: solo avatar es requerido
      const faltaAvatar = !tieneAvatar;
      const faltaImagen2 = perfil.rol === 'paciente' && !tieneImagen2;
      const perfilIncompleto = faltaAvatar || faltaImagen2;

      // Log para debugging
      console.log('[Login] Estado del perfil:', {
        rol: perfil.rol,
        avatar_url: perfil.avatar_url ? 'presente' : 'faltante',
        imagen2_url: perfil.imagen2_url ? 'presente' : 'faltante',
        tieneAvatar,
        tieneImagen2,
        perfilIncompleto
      });

      if (perfilIncompleto) {
        let mensajeFaltante = '';
        if (faltaAvatar && faltaImagen2) {
          mensajeFaltante = 'Faltan ambas imágenes de perfil.';
        } else if (faltaAvatar) {
          mensajeFaltante = 'Falta la primera imagen de perfil.';
        } else if (faltaImagen2) {
          mensajeFaltante = 'Falta la segunda imagen de perfil.';
        }

        await Swal.fire({
          icon: 'info',
          title: 'Completar perfil',
          html: `
            <p>${mensajeFaltante}</p>
            <p>Podés completar tu registro subiendo las imágenes desde la sección "Mi Perfil".</p>
          `,
          confirmButtonText: 'Entendido'
        });
      } else {
        await Swal.fire({ icon: 'success', title: 'Bienvenido', timer: 1500, showConfirmButton: false });
      }

      //REGISTRO EL INGRESO
      await this.logIngresos.registrarIngreso();


      // Redirigir según el rol
      if (perfil.rol === 'paciente') {
        this.router.navigate(['/mis-turnos-paciente']);
      } else if (perfil.rol === 'especialista') {
        this.router.navigate(['/mis-turnos-especialista']);
      } else if (perfil.rol === 'admin') {
        this.router.navigate(['/bienvenida']);
      }
    } catch (e) {
      this.error = this.traducirError(e);
      await Swal.fire('Error', this.error || 'Ocurrió un error al iniciar sesión', 'error');
    } finally {
      this.cargando = false;
    }
  }

  // Login rápido con credenciales predefinidas
  get accesosRapidos(): QuickAccessUser[] {
    const usuarios: QuickAccessUser[] = [];
    (Array.isArray(this.quickLogins.paciente) ? this.quickLogins.paciente : [this.quickLogins.paciente]).forEach(user => {
      usuarios.push({
        email: user.email,
        password: user.password,
        nombre: user.nombre ?? user.email,
        avatar: user.avatar ?? 'assets/avatars/james.jpg',
        rol: 'paciente'
      });
    });
    (Array.isArray(this.quickLogins.especialista) ? this.quickLogins.especialista : [this.quickLogins.especialista]).forEach(user => {
      usuarios.push({
        email: user.email,
        password: user.password,
        nombre: user.nombre ?? user.email,
        avatar: user.avatar ?? 'assets/avatars/mendel.jpg',
        rol: 'especialista'
      });
    });
    (Array.isArray(this.quickLogins.admin) ? this.quickLogins.admin : [this.quickLogins.admin]).forEach(user => {
      usuarios.push({
        email: user.email,
        password: user.password,
        nombre: user.nombre ?? user.email,
        avatar: user.avatar ?? 'assets/avatars/jagger.jpg',
        rol: 'admin'
      });
    });
    return usuarios;
  }

  activarQuick(user: QuickAccessUser, ev?: Event): void {
    console.log('[LoginPaciente] activarQuick', user.email, ev?.type);
    this.loginRapido(user.email, user.password);
  }

  async loginRapido(email: string, password: string): Promise<void> {
    console.log('[LoginPaciente] Quick login seleccionado', email);
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

    setTimeout(() => {
      this.passwordInput?.nativeElement.focus({ preventScroll: false });
    }, 20);
  }

  private traducirError(e: unknown): string {
    const texto = ((): string => {
      if (!e) return 'Ocurrió un error inesperado.';
      if (typeof e === 'string') return e;

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
    })();

    return texto.trim();
  }

}
