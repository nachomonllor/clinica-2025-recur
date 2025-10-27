// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-login-paciente',
//   standalone: true,
//   imports: [],
//   templateUrl: './login-paciente.component.html',
//   styleUrl: './login-paciente.component.scss'
// })
// export class LoginPacienteComponent {
// }


// src/app/components/login-paciente/login-paciente.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Swal from 'sweetalert2';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login-paciente',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './login-paciente.component.html',
  styleUrls: ['./login-paciente.component.scss']
})
export class LoginPacienteComponent implements OnInit {
  formularioLogin!: FormGroup;
  cargando = false;
  //error: string | null = null;
  error: string = ''; // en lugar de string | null

  constructor(private fb: FormBuilder, private supa: SupabaseService, private router: Router) { }

  ngOnInit(): void {
    this.formularioLogin = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async iniciarSesion() {
  if (this.formularioLogin.invalid) { this.formularioLogin.markAllAsTouched(); return; }

  this.cargando = true;
  this.error = '';

  try {
    if (!navigator.onLine) throw new Error('Sin conexión a internet.');

    const { email, password } = this.formularioLogin.value;
    const { error } = await this.supa.iniciarSesion(email, password);
    if (error) throw error;

 
    
      // 2) Verificación de correo (requisito del Sprint)
      const { data: userData, error: eUser } = await this.supa.obtenerUsuarioActual();
      if (eUser || !userData?.user) throw eUser || new Error('No se pudo obtener el usuario.');
      const user = userData.user;
      if (!user.email_confirmed_at) {
        await this.supa.cerrarSesion();
        throw new Error('Debes verificar tu correo antes de ingresar.');
      }

      // 3) Verificar que sea PACIENTE en profiles
      const { data: perfil, error: ePerfil } = await this.supa.obtenerPerfilPorId(user.id);
      if (ePerfil || !perfil) throw ePerfil || new Error('No se encontró el perfil del usuario.');
      if (perfil.rol !== 'paciente') {
        await this.supa.cerrarSesion();
        throw new Error('No estás registrado como paciente.');
      }

      // (Pacientes no requieren "aprobado", lo controlamos en especialistas)
      Swal.fire({ icon: 'success', title: 'Bienvenido', timer: 1500, showConfirmButton: false });
      this.router.navigate(['/mis-turnos']);
  } catch (e) {
    this.error = this.traducirError(e);
    await Swal.fire('Error', this.error || 'Ocurrió un error al iniciar sesión', 'error');
  } finally {
    this.cargando = false;
  }
}


  // async iniciarSesion(): Promise<void> {
  //   if (this.formularioLogin.invalid) {
  //     this.formularioLogin.markAllAsTouched();
  //     return;
  //   }

  //   this.cargando = true;
  //   this.error = '';
  //   const { email, password } = this.formularioLogin.value;

  //   try {
  //     // 1) Login en Supabase
  //     const { error } = await this.supa.iniciarSesion(email, password);
  //     if (error) throw error;

  //     // 2) Verificación de correo (requisito del Sprint)
  //     const { data: userData, error: eUser } = await this.supa.obtenerUsuarioActual();
  //     if (eUser || !userData?.user) throw eUser || new Error('No se pudo obtener el usuario.');
  //     const user = userData.user;
  //     if (!user.email_confirmed_at) {
  //       await this.supa.cerrarSesion();
  //       throw new Error('Debes verificar tu correo antes de ingresar.');
  //     }

  //     // 3) Verificar que sea PACIENTE en profiles
  //     const { data: perfil, error: ePerfil } = await this.supa.obtenerPerfilPorId(user.id);
  //     if (ePerfil || !perfil) throw ePerfil || new Error('No se encontró el perfil del usuario.');
  //     if (perfil.rol !== 'paciente') {
  //       await this.supa.cerrarSesion();
  //       throw new Error('No estás registrado como paciente.');
  //     }

  //     // (Pacientes no requieren "aprobado", lo controlamos en especialistas)
  //     Swal.fire({ icon: 'success', title: 'Bienvenido', timer: 1500, showConfirmButton: false });
  //     this.router.navigate(['/mis-turnos']);
  //   } catch (e: any) {
  //     this.error = e?.message || 'Error al iniciar sesión';
  //     Swal.fire('Error', this.error, 'error');
  //     //  Swal.fire('Error', this.error ?? 'Error al iniciar sesión', 'error');

  //   } finally {
  //     this.cargando = false;
  //   }
  // }

  private traducirError(e: unknown): string {
    // cortes rápidos y mensajes frecuentes de Supabase/Auth/Storage
    const texto = ((): string => {
      if (!e) return 'Ocurrió un error inesperado.';
      if (typeof e === 'string') return e;

      const err: any = e;

      // Posibles campos útiles que trae supabase-js
      const msg = String(err?.message ?? err?.error_description ?? err?.statusText ?? '');

      const m = msg.toLowerCase();

      // Red común de “no hay red / CORS / proxy / URL mal”
      if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) {
        return 'No se pudo conectar con el servidor. Verificá tu conexión a internet, la URL y la API key de Supabase.';
      }

      // Login inválido
      if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
      if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) {
        return 'Debes verificar tu correo antes de ingresar.';
      }

      // Rate limit / demasiados intentos
      if (m.includes('rate') && m.includes('limit')) return 'Demasiados intentos. Esperá unos minutos e intentá nuevamente.';

      // Storage: archivo ya existe (por si lo usás en otros flows)
      if (m.includes('exists') && m.includes('resource')) return 'El archivo ya existe. Probá con otro nombre o ruta.';

      // Fallback
      return msg || 'Ocurrió un error al procesar la solicitud.';
    })();

    return texto.trim();
  }

}
