import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

type Rol = 'paciente' | 'especialista' | 'admin';

interface AccesoRapido {
  nombre: string;
  rol: Rol;
  email: string;
  password: string;
  avatar?: string; // opcional
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink], // <- IMPORTANTE
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  verPassword = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  accesos: AccesoRapido[] = [
    { nombre: 'Lars', rol: 'paciente', email: 'lars@hotmail.com', password: '111111', avatar: 'assets/avatars/lars.jpg' },
    { nombre: 'Dexter', rol: 'paciente', email: 'dexter@hotmail.com', password: '111111', avatar: 'assets/avatars/dexter_holland.jpg' },
    { nombre: 'Indio', rol: 'paciente', email: 'indio@hotmail.com', password: '111111', avatar: 'assets/avatars/indio.jpg' },
    { nombre: 'Dr. James', rol: 'especialista', email: 'james@hotmail.com', password: '222222', avatar: 'assets/avatars/james.jpg' },
    { nombre: 'Dr. Ceratti', rol: 'especialista', email: 'ceratti@hotmail.com', password: '222222', avatar: 'assets/avatars/ceratti.jpg' },
    { nombre: 'Admin', rol: 'admin', email: 'admin@demo.com', password: 'admin123', avatar: 'assets/avatars/admin.jpg' },
  ];

  labelRol(r: Rol): string {
    return r === 'admin' ? 'Administrador' : r.charAt(0).toUpperCase() + r.slice(1);
  }

  prefill(a: AccesoRapido): void {
    this.form.setValue({ email: a.email, password: a.password });
  }

  limpiar(): void {
    this.form.reset();
  }

  toggleVer(): void {
    this.verPassword = !this.verPassword;
  }

  async ingresar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    try {
      const { email, password } = this.form.value;
      // TODO: Integrá acá tu AuthService si ya lo tenés:
      // await this.authService.login(email, password);
      // Redirigí según tu lógica/rol. Dejo un redirect neutro:
      this.router.navigate(['/bienvenida']);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }
}





// import { Component, inject } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { Perfil, QuickItem } from '../../../models/interfaces';
// import { SupabaseService } from '../../services/supabase.service';

// type Rol = 'paciente' | 'especialista' | 'admin';

// interface AccesoRapido {
//   nombre: string;
//   rol: Rol;
//   email: string;
//   password: string;
//   avatar?: string; // opcional
// }

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.scss']
// })
// export class LoginComponent {
//   form: FormGroup;
//   loading = false;
//   verPassword = false;


//   // fb = inject(FormBuilder);
//   // private router = inject(Router);
//   private sb = inject(SupabaseService);

//   // cargando = false;
//   // errorMsg = '';

//   // form = this.fb.group({
//   //   email: ['', [Validators.required, Validators.email]],
//   //   password: ['', [Validators.required, Validators.minLength(6)]],
//   // });

//   accesos: AccesoRapido[] = [
//     { nombre: 'Susana', rol: 'paciente', email: 'susana@demo.com', password: '111111', avatar: 'assets/avatars/susana.jpg' },
//     { nombre: 'Marcelo', rol: 'paciente', email: 'marcelo@demo.com', password: '111111', avatar: 'assets/avatars/marcelo.jpg' },
//     { nombre: 'Moria', rol: 'paciente', email: 'moria@demo.com', password: '111111', avatar: 'assets/avatars/moria.jpg' },
//     { nombre: 'Dr. Felipe', rol: 'especialista', email: 'felipe@demo.com', password: '222222', avatar: 'assets/avatars/felipe.jpg' },
//     { nombre: 'Dr. Buenamano', rol: 'especialista', email: 'buenamano@demo.com', password: '222222', avatar: 'assets/avatars/buenamano.jpg' },
//     { nombre: 'Admin', rol: 'admin', email: 'admin@demo.com', password: 'admin123', avatar: 'assets/avatars/admin.jpg' },
//   ];

//   constructor(private fb: FormBuilder, private router: Router) {
//     this.form = this.fb.group({
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', [Validators.required, Validators.minLength(4)]],
//     });
//   }

//   labelRol(r: Rol): string {
//     return r === 'admin' ? 'Administrador' : r.charAt(0).toUpperCase() + r.slice(1);
//   }

//   prefill(a: AccesoRapido): void {
//     this.form.setValue({ email: a.email, password: a.password });
//   }

//   limpiar(): void {
//     this.form.reset();
//   }

//   toggleVer(): void {
//     this.verPassword = !this.verPassword;
//   }

//   async ingresar(): Promise<void> {
//     this.form.markAllAsTouched();
//     if (this.form.invalid || this.loading) return;

//     this.loading = true;
//     try {
//       const { email, password } = this.form.value;
//       // TODO: Integrá acá tu AuthService si ya lo tenés:
//       // await this.authService.login(email, password);
//       // Redirigí según tu lógica/rol. Dejo un redirect neutro:
//       this.router.navigate(['/bienvenida']);
//     } catch (e) {
//       console.error(e);
//     } finally {
//       this.loading = false;
//     }
//   }





//   // Accesos rápidos (ajustá rutas e imágenes a tu proyecto)
//   quickItems: QuickItem[] = [
//     { label: 'Admin', route: '/admin/home', avatar: 'assets/avatars/admin.jpg', rol: 'admin', tooltip: 'Admin' },
//     { label: 'Esp. 1', route: '/especialista/home', avatar: 'assets/avatars/especialista1.jpg', rol: 'especialista' },
//     { label: 'Esp. 2', route: '/especialista/home', avatar: 'assets/avatars/especialista2.jpg', rol: 'especialista' },
//     { label: 'Paciente 1', route: '/paciente/home', avatar: 'assets/avatars/paciente1.jpg', rol: 'paciente' },
//     { label: 'Paciente 2', route: '/paciente/home', avatar: 'assets/avatars/paciente2.jpg', rol: 'paciente' },
//     { label: 'Paciente 3', route: '/paciente/home', avatar: 'assets/avatars/paciente3.jpg', rol: 'paciente' },
//   ];

//   // async ingresar() {
//   //   if (this.cargando || this.form.invalid) return;
//   //   this.errorMsg = '';
//   //   this.cargando = true;

//   //   try {
//   //     const { email, password } = this.form.getRawValue();

//   //     // 1) Sign-in
//   //     const { data: signIn, error: signInErr } =
//   //       await this.sb.client.auth.signInWithPassword({ email: String(email), password: String(password) });
//   //     if (signInErr) throw signInErr;

//   //     // 2) Obtener user
//   //     const { data: { user }, error: userErr } = await this.sb.client.auth.getUser();
//   //     if (userErr || !user) throw userErr ?? new Error('No se pudo obtener el usuario');

//   //     // 3) Perfil en "profiles"
//   //     const perfil = await this.obtenerPerfil(user.id);
//   //     if (!perfil) throw new Error('Perfil inexistente. Contactá al admin.');

//   //     // 4) (opcional) mail verificado
//   //     if (!user.email_confirmed_at) {
//   //       this.errorMsg = 'Debes verificar tu mail antes de ingresar.';
//   //       await this.sb.client.auth.signOut();
//   //       return;
//   //     }

//   //     // 5) Reglas de acceso (especialista debe estar aprobado)
//   //     if (perfil.rol === 'especialista' && !perfil.aprobado) {
//   //       this.errorMsg = 'Tu cuenta de especialista aún no está aprobada.';
//   //       await this.sb.client.auth.signOut();
//   //       return;
//   //     }

//   //     // 6) Redirección por rol
//   //     await this.redirigirSegunRol(perfil.rol);
//   //   } catch (e: any) {
//   //     this.errorMsg = e?.message ?? 'Error inesperado al iniciar sesión.';
//   //   } finally {
//   //     this.cargando = false;
//   //   }
//   // }

//   private async obtenerPerfil(userId: string): Promise<Perfil | null> {
//     const { data, error } = await this.sb.client
//       .from('profiles')
//       .select('id, rol, aprobado, email')
//       .eq('id', userId)
//       .single();
//     if (error) return null;
//     return data as Perfil;
//   }

//   private async redirigirSegunRol(rol: Rol) {
//     switch (rol) {
//       case 'admin': await this.router.navigate(['/admin']); break;
//       case 'especialista': await this.router.navigate(['/especialista/home']); break;
//       default: await this.router.navigate(['/paciente/home']); break;
//     }
//   }




// }



// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { QuickAccessPanelComponent } from '../ui/quick-access-panel/quick-access-panel.component';
// import { SupabaseService } from '../../services/supabase.service';
// import { Perfil, QuickItem, Rol } from '../../../models/interfaces';

// @Component({
//   standalone: true,
//   selector: 'app-login',
//   imports: [CommonModule, ReactiveFormsModule, RouterModule, QuickAccessPanelComponent],
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.scss']
// })
// export class LoginComponent {
//   private fb = inject(FormBuilder);
//   private router = inject(Router);
//   private sb = inject(SupabaseService);

//   cargando = false;
//   errorMsg = '';

//   form = this.fb.group({
//     email: ['', [Validators.required, Validators.email]],
//     password: ['', [Validators.required, Validators.minLength(6)]],
//   });

//   // Accesos rápidos (ajustá rutas e imágenes a tu proyecto)
//   quickItems: QuickItem[] = [
//     { label: 'Admin', route: '/admin/home', avatar: 'assets/avatars/admin.jpg', rol: 'admin', tooltip: 'Admin' },
//     { label: 'Esp. 1', route: '/especialista/home', avatar: 'assets/avatars/especialista1.jpg', rol: 'especialista' },
//     { label: 'Esp. 2', route: '/especialista/home', avatar: 'assets/avatars/especialista2.jpg', rol: 'especialista' },
//     { label: 'Paciente 1', route: '/paciente/home', avatar: 'assets/avatars/paciente1.jpg', rol: 'paciente' },
//     { label: 'Paciente 2', route: '/paciente/home', avatar: 'assets/avatars/paciente2.jpg', rol: 'paciente' },
//     { label: 'Paciente 3', route: '/paciente/home', avatar: 'assets/avatars/paciente3.jpg', rol: 'paciente' },
//   ];

//   async ingresar() {
//     if (this.cargando || this.form.invalid) return;
//     this.errorMsg = '';
//     this.cargando = true;

//     try {
//       const { email, password } = this.form.getRawValue();

//       // 1) Sign-in
//       const { data: signIn, error: signInErr } =
//         await this.sb.client.auth.signInWithPassword({ email: String(email), password: String(password) });
//       if (signInErr) throw signInErr;

//       // 2) Obtener user
//       const { data: { user }, error: userErr } = await this.sb.client.auth.getUser();
//       if (userErr || !user) throw userErr ?? new Error('No se pudo obtener el usuario');

//       // 3) Perfil en "profiles"
//       const perfil = await this.obtenerPerfil(user.id);
//       if (!perfil) throw new Error('Perfil inexistente. Contactá al admin.');

//       // 4) (opcional) mail verificado
//       if (!user.email_confirmed_at) {
//         this.errorMsg = 'Debes verificar tu mail antes de ingresar.';
//         await this.sb.client.auth.signOut();
//         return;
//       }

//       // 5) Reglas de acceso (especialista debe estar aprobado)
//       if (perfil.rol === 'especialista' && !perfil.aprobado) {
//         this.errorMsg = 'Tu cuenta de especialista aún no está aprobada.';
//         await this.sb.client.auth.signOut();
//         return;
//       }

//       // 6) Redirección por rol
//       await this.redirigirSegunRol(perfil.rol);
//     } catch (e: any) {
//       this.errorMsg = e?.message ?? 'Error inesperado al iniciar sesión.';
//     } finally {
//       this.cargando = false;
//     }
//   }

//   private async obtenerPerfil(userId: string): Promise<Perfil | null> {
//     const { data, error } = await this.sb.client
//       .from('profiles')
//       .select('id, rol, aprobado, email')
//       .eq('id', userId)
//       .single();
//     if (error) return null;
//     return data as Perfil;
//   }

//   private async redirigirSegunRol(rol: Rol) {
//     switch (rol) {
//       case 'admin':        await this.router.navigate(['/admin']); break;
//       case 'especialista': await this.router.navigate(['/especialista/home']); break;
//       default:             await this.router.navigate(['/paciente/home']); break;
//     }
//   }
// }



