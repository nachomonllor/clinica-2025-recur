import { Routes } from '@angular/router';
import { RegistroPacienteComponent } from './components/registro-paciente/registro-paciente.component';
import { RegistroEspecialistaComponent } from './registro-especialista/registro-especialista.component';
import { LoginPacienteComponent } from './login-paciente/login-paciente.component';

export const routes: Routes = [
    // { path: '**', component: RegistroPacienteComponent },
    { path: 'registro-paciente', component: RegistroPacienteComponent },

    { path: 'registro-especialista', component: RegistroEspecialistaComponent },
    { path: 'login-paciente', component: LoginPacienteComponent },
];


// // src/app/app.routes.ts (o donde definas rutas)
// import { Routes } from '@angular/router';
// import { LoginPacienteComponent } from './components/login-paciente/login-paciente.component';

// export const routes: Routes = [
//   { path: 'login-paciente', component: LoginPacienteComponent },
//   { path: 'mis-turnos', loadComponent: () => import('./components/mis-turnos/mis-turnos.component').then(m => m.MisTurnosComponent) },
//   { path: '', redirectTo: 'login-paciente', pathMatch: 'full' },
// ];
