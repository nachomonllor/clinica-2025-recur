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
import { QuickAccessUser, QuickLoginsConfig } from '../../models/nav.models';

import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { CapitalizarNombrePipe } from "../../../pipes/capitalizar-nombre.pipe";
import { FabBienvenidaComponent } from '../fab-bienvenida/fab-bienvenida.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatTooltipModule, MatProgressSpinnerModule, MatSnackBarModule,
    AutoFocusDirective,
    TranslateModule,
    CapitalizarNombrePipe,
    FabBienvenidaComponent
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
  
  // Variable de control del captcha
  captchaResuelto: boolean = false; 

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

  ngOnInit(): void {
    this.formularioLogin = this.fb.group({
      email: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    });
  }

  cambiarIdioma(lang: string) {
    if (!this.idiomas.includes(lang)) return;
    this.idiomaActual = lang;
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  recibirCaptcha(esValido: boolean) {
    this.captchaResuelto = esValido;
  }

  // =========================================================================
  //  1. CORRECCIÓN PRINCIPAL: Mapeo explícito para que no falte el email
  // =========================================================================
  // get accesosRapidos(): QuickAccessUser[] {
  //   const usuarios: QuickAccessUser[] = [];

  //   // --- PACIENTES ---
  //   const pacientes = Array.isArray(this.quickLogins.paciente) 
  //     ? this.quickLogins.paciente 
  //     : [this.quickLogins.paciente];
      
  //   pacientes.forEach(u => usuarios.push({
  //     nombre: u.nombre ?? 'Paciente', 
  //     avatar: u.avatar ?? 'assets/avatars/james.jpg',
  //     rol: 'PACIENTE',
  //     email: u.email,       // <--- ESTO ES LO QUE FALTABA CARGAR BIEN
  //     password: u.password
  //   }));

  //   // --- ESPECIALISTAS ---
  //   const especialistas = Array.isArray(this.quickLogins.especialista) 
  //     ? this.quickLogins.especialista 
  //     : [this.quickLogins.especialista];

  //   especialistas.forEach(u => usuarios.push({
  //     nombre: u.nombre ?? 'Especialista',
  //     avatar: u.avatar ?? 'assets/avatars/mendel.jpg',
  //     rol: 'ESPECIALISTA',
  //     email: u.email,       // <--- Aseguramos el mail
  //     password: u.password
  //   }));

  //   // --- ADMINS ---
  //   const admins = Array.isArray(this.quickLogins.admin) 
  //     ? this.quickLogins.admin 
  //     : [this.quickLogins.admin];

  //   admins.forEach(u => usuarios.push({
  //     nombre: u.nombre ?? 'Admin',
  //     avatar: u.avatar ?? 'assets/avatars/jagger.jpg',
  //     rol: 'ADMIN',
  //     email: u.email,       // <--- Aseguramos el mail
  //     password: u.password
  //   }));

  //   return usuarios;
  // }

  // =========================================================================
  //  2. Lógica del click (Tu versión completa)
  // =========================================================================
  // activarQuick(user: any, event?: Event) {
  //   // 1. Evitar propagación del click (útil en elementos flotantes)
  //   if (event) {
  //     event.preventDefault();
  //     event.stopPropagation();
  //   }

  //   console.log('Cargando usuario rápido:', user.email);

  //   // 2. Rellenar el formulario
  //   this.formularioLogin.patchValue({
  //     email: user.email,
  //     password: user.password
  //   });
    
  //   // 3. Marcar los controles como "dirty" para que Angular sepa que cambiaron
  //   this.formularioLogin.markAsDirty();
  //   this.formularioLogin.markAllAsTouched();

  //   // 4. Bypass del Captcha (UX: si elige acceso rápido, confiamos)
  //   this.captchaResuelto = true;

  //   // 5. Actualizar la tarjeta visual "Usuario seleccionado" dentro del login
  //   this.quickSeleccionado = { 
  //     nombre: user.nombre, 
  //     rol: user.rol, 
  //     email: user.email 
  //   };

  //   // 6. Feedback visual (SnackBar)
  //   this.snackBar.dismiss(); // Cierra el anterior si existe
  //   this.snackBar.open(
  //     `Credenciales de ${user.nombre} cargadas.`,
  //     'OK',
  //     { duration: 3000, verticalPosition: 'top' }
  //   );

  //   // 7. Mover el foco al input de password
  //   setTimeout(() => {
  //       this.passwordInput?.nativeElement.focus();
  //   }, 100);
  // }

  activarQuick(user: any, event?: Event) {
    event?.preventDefault();

    this.formularioLogin.patchValue({
      email: user.email,
      password: user.password
    });

    this.captchaResuelto = true;
  }

  async iniciarSesion(): Promise<void> {
    console.log(' [LOGIN] Inicio del proceso');

    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.error = '';

    try {
      const { email, password } = this.formularioLogin.getRawValue();

      // PASO 1: Auth
      const { error: eLogin } = await this.supa.iniciarSesion(email, password);
      if (eLogin) throw eLogin;

      // PASO 2: Obtener User
      const { data: userData, error: eUser } = await this.supa.obtenerUsuarioActual();
      if (eUser || !userData?.user) throw eUser || new Error('Error usuario Auth');
      const user = userData.user;

      // PASO 3: Verificar Email
      if (!user.email_confirmed_at) {
        await this.supa.cerrarSesion();
        throw new Error('Debes verificar tu correo.');
      }

      // PASO 4: Buscar en DB
      let { data: usuario, error: eUsuario } = await this.supa.obtenerUsuarioPorId(user.id);

      // Si no existe, crear fallback
      if (!usuario) {
        console.warn('Usuario no encontrado. Creando fallback...');
        const md: any = user.user_metadata || {};
        const rolMeta = (md.perfil || md.rol || 'PACIENTE').toString().toUpperCase();
        const rolDb: Rol = (rolMeta === 'ESPECIALISTA' || rolMeta === 'ADMIN') ? rolMeta : 'PACIENTE';

        const { data: nuevo, error: eUpsert } = await this.supa.upsertUsuario({
          id: user.id,
          nombre: md.nombre || 'Usuario',
          apellido: md.apellido || 'Sin Apellido',
          edad: md.edad || null,
          dni: md.dni || '',
          obra_social: md.obra_social || null,
          email: user.email || '',
          password: 'auth_managed',
          perfil: rolDb,
          imagen_perfil_1: md.imagen_perfil_1 || null,
          imagen_perfil_2: md.imagen_perfil_2 || null,
          esta_aprobado: rolDb === 'ESPECIALISTA' ? false : true,
          mail_verificado: true,
          activo: true,
          idioma_preferido: 'es'
        });

        if (eUpsert) throw eUpsert;
        usuario = nuevo;
      }

      // PASO 5: Validaciones de negocio
      if (usuario?.perfil === 'ESPECIALISTA' && !usuario.esta_aprobado) {
        await this.supa.cerrarSesion();
        throw new Error('Cuenta pendiente de aprobación.');
      }

      // PASO 6: Bienvenida
      Swal.fire({
        icon: 'success',
        title: `Bienvenido, ${usuario?.nombre}`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

      // PASO 7: Log
      this.logIngresos.registrarIngreso().catch(err => console.error('Log error', err));

      // PASO 8: Navegación
      let ruta = '/bienvenida';
      if (usuario?.perfil === 'PACIENTE') ruta = '/mis-turnos-paciente';
      else if (usuario?.perfil === 'ESPECIALISTA') ruta = '/mis-turnos-especialista';
      else if (usuario?.perfil === 'ADMIN') ruta = '/turnos-admin';

      await this.router.navigateByUrl(ruta);

    } catch (e: any) {
      console.error(' EXCEPCIÓN:', e);
      this.error = this.traducirError(e);
      Swal.fire('Error', this.error, 'error');
    } finally {
      this.cargando = false;
    }
  }

  // private traducirError(e: unknown): string {
  //   const err: any = e;
  //   const msg = String(err?.message ?? err?.error_description ?? err?.statusText ?? '');
  //   const m = msg.toLowerCase();

  //   if (m.includes('failed to fetch') || m.includes('networkerror')) {
  //     return 'No se pudo conectar con el servidor.';
  //   }
  //   if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  //   if (m.includes('email not confirmed')) return 'Debes verificar tu correo.';
  //   return msg || 'Ocurrió un error al procesar la solicitud.';
  // }

  private traducirError(e: unknown): string {
    const err: any = e;
    // Agregamos 'err.details' porque Supabase/Postgres suele poner el detalle de la llave duplicada ahí
    const msg = String(err?.message ?? err?.details ?? err?.error_description ?? err?.statusText ?? '');
    const m = msg.toLowerCase();

    // --- Lógica existente ---
    if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) {
      return 'No se pudo conectar con el servidor. Verificá tu conexión a internet, la URL y la API key de Supabase.';
    }
    if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) {
      return 'Debes verificar tu correo antes de ingresar.';
    }
    if (m.includes('rate') && m.includes('limit')) return 'Demasiados intentos. Esperá unos minutos e intentá nuevamente.';
    if (m.includes('exists') && m.includes('resource')) return 'El archivo ya existe. Probá con otro nombre o ruta.';

    // --- NUEVA LÓGICA PARA DNI DUPLICADO ---
    // El error de postgres suele ser: "duplicate key value violates unique constraint"
    if (m.includes('duplicate key') && (m.includes('dni') || m.includes('users_dni_key'))) {
        return 'El DNI ingresado ya pertenece a otro usuario registrado en el sistema.';
    }

    // Si es duplicate key pero no dice DNI (por si acaso choca otro campo único)
    if (m.includes('duplicate key')) {
        return 'Uno de los datos ingresados ya existe en el sistema (posiblemente DNI o Email).';
    }

    return msg || 'Ocurrió un error al procesar la solicitud.';
  }

//   get accesosRapidos(): QuickAccessUser[] {
//   const usuarios: QuickAccessUser[] = [];

//   const pacientes = Array.isArray(this.quickLogins.paciente)
//     ? this.quickLogins.paciente
//     : [this.quickLogins.paciente];

//   pacientes.forEach(user => {
//     usuarios.push({
//       email: user.email,
//       password: user.password,
//       nombre: user.nombre ?? user.email,
//       avatar: user.avatar ?? 'assets/avatars/james.jpg',
//       rol: 'PACIENTE',
//     });
//   });

//   const especialistas = Array.isArray(this.quickLogins.especialista)
//     ? this.quickLogins.especialista
//     : [this.quickLogins.especialista];

//   especialistas.forEach(user => {
//     usuarios.push({
//       email: user.email,
//       password: user.password,
//       nombre: user.nombre ?? user.email,
//       avatar: user.avatar ?? 'assets/avatars/mendel.jpg',
//       rol: 'ESPECIALISTA',
//     });
//   });

//   const admins = Array.isArray(this.quickLogins.admin)
//     ? this.quickLogins.admin
//     : [this.quickLogins.admin];

//   admins.forEach(user => {
//     usuarios.push({
//       email: user.email,
//       password: user.password,
//       nombre: user.nombre ?? user.email,
//       avatar: user.avatar ?? 'assets/avatars/jagger.jpg',
//       rol: 'ADMIN',
//     });
//   });

//   return usuarios;
// }


// async loginRapido(email: string, password: string): Promise<void> {
//   this.formularioLogin.patchValue({ email, password });
//   this.formularioLogin.markAsDirty();

//   // Si querés que al usar acceso rápido se “apruebe” el captcha:
//   this.captchaResuelto = true;

//   const seleccionado = this.accesosRapidos.find(u => u.email === email);
//   if (seleccionado) {
//     this.quickSeleccionado = { nombre: seleccionado.nombre, rol: seleccionado.rol, email };
//     this.snackBar.dismiss();
//     this.snackBar.open(
//       `Rellenamos las credenciales de ${seleccionado.nombre}. Revisá y presioná Ingresar.`,
//       'Cerrar',
//       { duration: 3500 }
//     );
//   } else {
//     this.quickSeleccionado = undefined;
//   }

//   setTimeout(() => this.passwordInput?.nativeElement.focus({ preventScroll: false }), 20);
// }


// ---- QUICK ACCESS ----

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

// PARA TDOSS OLOS ACCESOS RAPIDOS
loginRapidoUser(user: QuickAccessUser): void {
  console.log('loginRapidoUser ->', user.email, user.password);

  this.formularioLogin.setValue({
    email: user.email,
    password: user.password,
  });

  this.formularioLogin.markAsDirty();
  this.captchaResuelto = true;

  this.quickSeleccionado = {
    nombre: user.nombre,
    rol: user.rol,
    email: user.email
  };

  this.snackBar.dismiss();
  this.snackBar.open(
    `Rellenamos las credenciales de ${user.nombre}. Revisá y presioná Ingresar.`,
    'Cerrar',
    { duration: 3500 }
  );

  setTimeout(() => this.passwordInput?.nativeElement.focus({ preventScroll: false }), 20);
}




}




// import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl
// } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { MatCardModule } from '@angular/material/card';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import Swal from 'sweetalert2';
// import { environment } from '../../../environments/environment';
// import { AutoFocusDirective } from '../../../directives/auto-focus.directive';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// import { SupabaseService } from '../../../services/supabase.service';
// import { LogIngresosService } from '../../../services/log-ingresos.service';

// import { Rol } from '../../models/tipos.model';
// import { QuickAccessUser, QuickLoginsConfig } from '../../models/nav.models';

// import { TranslateModule } from '@ngx-translate/core';
// import { TranslateService } from '@ngx-translate/core';
// import { CapitalizarNombrePipe } from "../../../pipes/capitalizar-nombre.pipe";
// import { FabBienvenidaComponent } from '../fab-bienvenida/fab-bienvenida.component';


// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, RouterModule,
//     MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
//     MatTooltipModule, MatProgressSpinnerModule, MatSnackBarModule,
//     AutoFocusDirective,
//     TranslateModule,
//     CapitalizarNombrePipe,
//     FabBienvenidaComponent
// ],
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.scss']
// })
// export class LoginComponent implements OnInit {

//   formularioLogin!: FormGroup<{
//     email: FormControl<string>;
//     password: FormControl<string>;
//   }>;

//   //  VARIABLE DE CONTROL
//   //captchaResuelto: boolean = false;

//   //  METODO QUE RECIBE EL EVENTO DEL HIJO
//   // recibirCaptcha(valido: boolean) {
//   //   this.captchaResuelto = valido;
//   // }

//   cargando = false;
//   error = '';

//   quickLogins: QuickLoginsConfig = environment.quickLogins as QuickLoginsConfig;
//   quickSeleccionado?: { nombre: string; rol: Rol; email: string };

//   idiomas = ['es', 'en', 'pt'];
//   idiomaActual = 'es';

//   @ViewChild('passwordInput', { static: false }) passwordInput?: ElementRef<HTMLInputElement>;

//   constructor(
//     private fb: FormBuilder,
//     private supa: SupabaseService,
//     private router: Router,
//     private snackBar: MatSnackBar,
//     private logIngresos: LogIngresosService,
//     private translate: TranslateService,

//   ) {

//     const saved = localStorage.getItem('lang');
//     const inicial = saved && this.idiomas.includes(saved) ? saved : 'es';
//     this.idiomaActual = inicial;
//     this.translate.use(inicial);
//   }

//   cambiarIdioma(lang: string) {
//     if (!this.idiomas.includes(lang)) return;
//     this.idiomaActual = lang;
//     this.translate.use(lang);
//     localStorage.setItem('lang', lang);
//   }
//   ngOnInit(): void {
//     this.formularioLogin = this.fb.group({
//       email: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
//       password: this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
//     });
//   }

//   onSubmit(): Promise<void> {
//     return this.iniciarSesion();
//   }

//   async iniciarSesion(): Promise<void> {
//     console.log(' [LOGIN] Inicio del proceso');

//     if (this.formularioLogin.invalid) {
//       this.formularioLogin.markAllAsTouched();
//       return;
//     }

//     this.cargando = true;
//     this.error = '';

//     try {
//       const { email, password } = this.formularioLogin.getRawValue();

//       // --- borramos esta linea
//       // await this.supa.client.auth.signOut();  <=== la volamos 

//       // PASO 1: Auth
//       console.log(' Autenticando con Supabase Auth...');

//       // Agregamos un log justo antes para asegurar que entra acá
//       const { error: eLogin } = await this.supa.iniciarSesion(email, password);

//       if (eLogin) {
//         console.error(' Error Supabase Auth:', eLogin);
//         throw eLogin;
//       }

//       console.log(' Auth OK');

//       // PASO 2: Obtener User
//       console.log(' Obteniendo usuario de sesión...');
//       const { data: userData, error: eUser } = await this.supa.obtenerUsuarioActual();
//       if (eUser || !userData?.user) throw eUser || new Error('Error usuario Auth');
//       const user = userData.user;
//       console.log(' Usuario Auth obtenido:', user.id);

//       // PASO 3: Verificar Email
//       if (!user.email_confirmed_at) {
//         await this.supa.cerrarSesion();
//         throw new Error('Debes verificar tu correo.');
//       }

//       // PASO 4: Buscar en DB
//       console.log('Buscando perfil en tabla usuarios...');
//       let { data: usuario, error: eUsuario } = await this.supa.obtenerUsuarioPorId(user.id);

//       // Si no existe (usuario fantasma), intentamos crearlo
//       if (!usuario) {
//         console.warn('Usuario no encontrado en tabla. Intentando crear fallback...');
//         // ... (Tu lógica de creación de usuario fantasma que ya tenías) ...
//         const md: any = user.user_metadata || {};
//         const rolMeta = (md.perfil || md.rol || 'PACIENTE').toString().toUpperCase();
//         const rolDb: Rol = (rolMeta === 'ESPECIALISTA' || rolMeta === 'ADMIN') ? rolMeta : 'PACIENTE';

//         // OJO: upsertUsuario devuelve {data, error}
//         const { data: nuevo, error: eUpsert } = await this.supa.upsertUsuario({
//           id: user.id,
//           nombre: md.nombre || 'Usuario',
//           apellido: md.apellido || 'Sin Apellido',
//           edad: md.edad || null,
//           dni: md.dni || '',
//           obra_social: md.obra_social || null,
//           email: user.email || '',
//           password: 'auth_managed',
//           perfil: rolDb,
//           imagen_perfil_1: md.imagen_perfil_1 || null,
//           imagen_perfil_2: md.imagen_perfil_2 || null,
//           esta_aprobado: rolDb === 'ESPECIALISTA' ? false : true,
//           mail_verificado: true,
//           activo: true,
//           idioma_preferido: 'es'
//         });

//         if (eUpsert) throw eUpsert;
//         usuario = nuevo;
//         console.log('Usuario fallback creado');
//       }

//       console.log('Perfil de usuario listo:', usuario?.perfil);

//       // PASO 5: Validaciones de negocio
//       if (usuario?.perfil === 'ESPECIALISTA' && !usuario.esta_aprobado) {
//         await this.supa.cerrarSesion();
//         throw new Error('Cuenta pendiente de aprobación.');
//       }

//       // PASO 6: Mensaje de bienvenida
//       console.log('===> Mostrando alerta de bienvenida...');
//       // Hack: No usamos await en el Swal para no bloquear si el usuario tarda en cerrar
//       Swal.fire({
//         icon: 'success',
//         title: `Bienvenido, ${usuario?.nombre}`,
//         timer: 1500,
//         showConfirmButton: false,
//         toast: true,
//         position: 'top-end'
//       });

//       // PASO 7: Log (Sin await para no bloquear)
//       console.log('===> Registrando log (background)...');
//       this.logIngresos.registrarIngreso().catch(err => console.error('Log error', err));

//       // PASO 8: Navegación
//       console.log(' ===> Intentando navegar...');
//       let ruta = '/bienvenida';
//       if (usuario?.perfil === 'PACIENTE') ruta = '/mis-turnos-paciente';
//       else if (usuario?.perfil === 'ESPECIALISTA') ruta = '/mis-turnos-especialista';
//       else if (usuario?.perfil === 'ADMIN') ruta = '/turnos-admin';

//       console.log('===> Navegando a:', ruta);

//       const navResult = await this.router.navigateByUrl(ruta);

//       console.log('===> Navegación resultado:', navResult);

//       if (!navResult) {
//         // Si el router devuelve false (bloqueado por Guard o error), forzamos stop loading
//         console.warn(' ===> La navegación fue bloqueada o cancelada.');
//         this.cargando = false;

//         // Opcional: Intentar ir a bienvenida si falló la ruta específica
//         // await this.router.navigateByUrl('/bienvenida');
//       }

//       // ------------------------------------------------

//       console.log(' ==> Navegación resultado:', navResult);
//       // Si navResult es false, el Guard rechazó la navegación

//     } catch (e: any) {
//       console.error(' EXCEPCIÓN:', e);
//       this.error = this.traducirError(e);
//       Swal.fire('Error', this.error, 'error');
//     } finally {
//       console.log(' Fin del proceso (Finally). Quitamos spinner.');
//       this.cargando = false;
//     }
//   }

//   // ----- Quick logins -----
//   get accesosRapidos(): QuickAccessUser[] {
//     const usuarios: QuickAccessUser[] = [];

//     const pacientes = Array.isArray(this.quickLogins.paciente)
//       ? this.quickLogins.paciente
//       : [this.quickLogins.paciente];

//     pacientes.forEach(user => {
//       usuarios.push({
//         email: user.email,
//         password: user.password,
//         nombre: user.nombre ?? user.email,
//         avatar: user.avatar ?? 'assets/avatars/james.jpg',
//         rol: 'PACIENTE',
//       });
//     });

//     const especialistas = Array.isArray(this.quickLogins.especialista)
//       ? this.quickLogins.especialista
//       : [this.quickLogins.especialista];

//     especialistas.forEach(user => {
//       usuarios.push({
//         email: user.email,
//         password: user.password,
//         nombre: user.nombre ?? user.email,
//         avatar: user.avatar ?? 'assets/avatars/mendel.jpg',
//         rol: 'ESPECIALISTA',
//       });
//     });

//     const admins = Array.isArray(this.quickLogins.admin)
//       ? this.quickLogins.admin
//       : [this.quickLogins.admin];

//     admins.forEach(user => {
//       usuarios.push({
//         email: user.email,
//         password: user.password,
//         nombre: user.nombre ?? user.email,
//         avatar: user.avatar ?? 'assets/avatars/jagger.jpg',
//         rol: 'ADMIN',
//       });
//     });

//     return usuarios;
//   }


//   // async loginRapido(email: string, password: string): Promise<void> {
//   //   this.formularioLogin.patchValue({ email, password });
//   //   this.formularioLogin.markAsDirty();

//   //   const seleccionado = this.accesosRapidos.find(u => u.email === email);
//   //   if (seleccionado) {
//   //     this.quickSeleccionado = { nombre: seleccionado.nombre, rol: seleccionado.rol, email };
//   //     this.snackBar.open(
//   //       `Rellenamos las credenciales de ${seleccionado.nombre}. Revisá y presioná Ingresar.`,
//   //       'Cerrar',
//   //       { duration: 3500 }
//   //     );
//   //   } else {
//   //     this.quickSeleccionado = undefined;
//   //   }

//   //   setTimeout(() => this.passwordInput?.nativeElement.focus({ preventScroll: false }), 20);
//   // }


//   async loginRapido(email: string, password: string): Promise<void> {
//     this.formularioLogin.patchValue({ email, password });
//     this.formularioLogin.markAsDirty();

//     // --- NUEVO: Aprobar captcha automáticamente al usar acceso rápido ---
//     //this.captchaResuelto = true; 
//     // -------------------------------------------------------------------

//     const seleccionado = this.accesosRapidos.find(u => u.email === email);
    
//     if (seleccionado) {
//       this.quickSeleccionado = { nombre: seleccionado.nombre, rol: seleccionado.rol, email };
      
//       // Opcional: Cerrar snackbar anterior si hubiera
//       this.snackBar.dismiss();
      
//       this.snackBar.open(
//         `Rellenamos las credenciales de ${seleccionado.nombre}. Revisá y presioná Ingresar.`,
//         'Cerrar',
//         { duration: 3500 }
//       );
//     } else {
//       this.quickSeleccionado = undefined;
//     }

//     setTimeout(() => this.passwordInput?.nativeElement.focus({ preventScroll: false }), 20);
//   }


//   private traducirError(e: unknown): string {
//     const err: any = e;
//     const msg = String(err?.message ?? err?.error_description ?? err?.statusText ?? '');
//     const m = msg.toLowerCase();

//     if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) {
//       return 'No se pudo conectar con el servidor. Verificá tu conexión a internet, la URL y la API key de Supabase.';
//     }
//     if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
//     if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) {
//       return 'Debes verificar tu correo antes de ingresar.';
//     }
//     if (m.includes('rate') && m.includes('limit')) return 'Demasiados intentos. Esperá unos minutos e intentá nuevamente.';
//     if (m.includes('exists') && m.includes('resource')) return 'El archivo ya existe. Probá con otro nombre o ruta.';
//     return msg || 'Ocurrió un error al procesar la solicitud.';
//   }


//   /* --------- PARA EL CAPTCHA ------------------ */

//    // 3. VARIABLE DE CONTROL DEL CAPTCHA
//   captchaResuelto: boolean = false; 

//   // ... constructor y ngOnInit ...

//   // 4. MÉTODO PARA RECIBIR EL ESTADO DEL CAPTCHA
//   recibirCaptcha(esValido: boolean) {
//     this.captchaResuelto = esValido;
//   }

//   // 5. MODIFICAR TU FUNCIÓN 'activarQuick' (Acceso Rápido)
//   // Para que al hacer clic en las caritas, el captcha se apruebe solo.
//   activarQuick(user: any, event: Event) {
//     // ... tu lógica existente para llenar el form ...
//     this.formularioLogin.patchValue({
//       email: user.email,
//       password: user.password // o lo que uses
//     });
    
//    // PARA METER EL CAPTCHA VISUALMENTE 
//     this.captchaResuelto = true; 
//   }
  

// }


