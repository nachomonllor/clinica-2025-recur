
// src/app/app.routes.ts
import { Routes } from '@angular/router';

import { BienvenidaComponent } from './components/bienvenida/bienvenida.component';
import { LoginComponent } from './components/login/login.component';
import { PacienteHomeComponent } from './components/paciente-home/paciente-home.component';
import { EspecialistaHomeComponent } from './components/especialista-home/especialista-home.component';
import { AdminHomeComponent } from './components/admin-home/admin-home.component';

import { RegistroPacienteComponent } from './components/registro-paciente/registro-paciente.component';
import { RegistroEspecialistaComponent } from './components/registro-especialista/registro-especialista.component';
import { EncuestaAtencionComponent } from './components/encuesta-atencion/encuesta-atencion.component';
import { LogTableComponent } from './components/log-table/log-table.component';
import { EstadisticasComponent } from './components/estadisticas/estadisticas.component';
import { HistoriaClinicaComponent } from './components/historia-clinica/historia-clinica.component';
import { ListarEspecialistasComponent } from './components/listar-especialistas/listar-especialistas.component';
import { ListarPacientesComponent } from './components/listar-pacientes/listar-pacientes.component';
import { MisTurnosEspecialistaComponent } from './components/mis-turnos-especialista/mis-turnos-especialista.component';
import { MisTurnosPacienteComponent } from './components/mis-turnos-paciente/mis-turnos-paciente.component';
import { ReseniaEspecialistaComponent } from './components/resenia-especialista/resenia-especialista.component';
import { SeleccionarUsuarioComponent } from './components/seleccionar-usuario/seleccionar-usuario.component';
import { SeleccionarUsuarioLoginComponent } from './components/seleccionar-usuario-login/seleccionar-usuario-login.component';
import { SeleccionarUsuarioRegistroComponent } from './components/seleccionar-usuario-registro/seleccionar-usuario-registro.component';
import { TurnosEspecialidadComponent } from './components/turnos-especialidad/turnos-especialidad.component';

export const routes: Routes = [
  // Redirect raíz -> bienvenida
  { path: '', pathMatch: 'full', redirectTo: 'bienvenida' },

  // Páginas principales
  { path: 'bienvenida', component: BienvenidaComponent },
  { path: 'login', component: LoginComponent },

  // Homes por rol
  { path: 'paciente/home', component: PacienteHomeComponent },
  { path: 'especialista/home', component: EspecialistaHomeComponent },
  { path: 'admin', component: AdminHomeComponent },

  // Registro
  { path: 'registro-paciente', component: RegistroPacienteComponent },
  { path: 'registro-especialista', component: RegistroEspecialistaComponent },

  // Varias
  { path: 'encuesta-atencion', component: EncuestaAtencionComponent },
  { path: 'log-table', component: LogTableComponent },
  { path: 'estadisticas', component: EstadisticasComponent },
  { path: 'historia-clinica', component: HistoriaClinicaComponent },
  { path: 'listar-especialistas', component: ListarEspecialistasComponent },
  { path: 'listar-pacientes', component: ListarPacientesComponent },
  { path: 'mis-turnos-especialista', component: MisTurnosEspecialistaComponent },
  { path: 'mis-turnos-paciente', component: MisTurnosPacienteComponent },
  { path: 'resenia-especialista', component: ReseniaEspecialistaComponent },
  { path: 'seleccionar-usuario', component: SeleccionarUsuarioComponent },
  { path: 'seleccionar-usuario-login', component: SeleccionarUsuarioLoginComponent },
  { path: 'seleccionar-usuario-registro', component: SeleccionarUsuarioRegistroComponent },
  { path: 'turnos-especialidad', component: TurnosEspecialidadComponent },

  // Wildcard
  { path: '**', redirectTo: 'bienvenida' },
];




// // src/app/app.routes.ts
// import { Routes } from '@angular/router';
// import { LoginComponent } from './components/login/login.component';
// import { PacienteHomeComponent } from './components/paciente-home/paciente-home.component';
// import { EspecialistaHomeComponent } from './components/especialista-home/especialista-home.component';
// import { AdminHomeComponent } from './components/admin-home/admin-home.component';
// import { BienvenidaComponent } from './components/bienvenida/bienvenida.component';

// export const routes: Routes = [
//   // Home (redirige a login por ahora)

//   { path: '', pathMatch: 'full', redirectTo: 'bienvenida' },
//   { path: 'bienvenida', component: BienvenidaComponent },

//   { path: '', redirectTo: 'login-paciente', pathMatch: 'full' },

//   { path: 'login', component: LoginComponent } , //loadComponent: () => import('.app/login.component').then(m => m.LoginComponent) },
//   { path: 'paciente/home', component: PacienteHomeComponent},
//   { path: 'especialista/home', component: EspecialistaHomeComponent },
//   { path: 'admin',  component: AdminHomeComponent },

  
//   { path: 'registro-paciente',
//     loadComponent: () => import('./components/registro-paciente/registro-paciente.component')
//       .then(m => m.RegistroPacienteComponent) },

//   { path: 'registro-especialista',
//     loadComponent: () => import('./components/registro-especialista/registro-especialista.component')
//       .then(m => m.RegistroEspecialistaComponent) },

//   // Varias (según vayas integrando)
//   { path: 'encuesta-atencion',
//     loadComponent: () => import('./components/encuesta-atencion/encuesta-atencion.component')
//       .then(m => m.EncuestaAtencionComponent) },

//   { path: 'log-table',
//     loadComponent: () => import('./components/log-table/log-table.component')
//       .then(m => m.LogTableComponent) },

//   { path: 'estadisticas',
//     loadComponent: () => import('./components/estadisticas/estadisticas.component')
//       .then(m => m.EstadisticasComponent) },

//   { path: 'historia-clinica',
//     loadComponent: () => import('./components/historia-clinica/historia-clinica.component')
//       .then(m => m.HistoriaClinicaComponent) },

//   { path: 'listar-especialistas',
//     loadComponent: () => import('./components/listar-especialistas/listar-especialistas.component')
//       .then(m => m.ListarEspecialistasComponent) },

//   { path: 'listar-pacientes',
//     loadComponent: () => import('./components/listar-pacientes/listar-pacientes.component')
//       .then(m => m.ListarPacientesComponent) },

//   { path: 'mis-turnos-especialista',
//     loadComponent: () => import('./components/mis-turnos-especialista/mis-turnos-especialista.component')
//       .then(m => m.MisTurnosEspecialistaComponent) },

//   { path: 'mis-turnos-paciente',
//     loadComponent: () => import('./components/mis-turnos-paciente/mis-turnos-paciente.component')
//       .then(m => m.MisTurnosPacienteComponent) },

//   { path: 'resenia-especialista',
//     loadComponent: () => import('./components/resenia-especialista/resenia-especialista.component')
//       .then(m => m.ReseniaEspecialistaComponent) },

//   { path: 'seleccionar-usuario',
//     loadComponent: () => import('./components/seleccionar-usuario/seleccionar-usuario.component')
//       .then(m => m.SeleccionarUsuarioComponent) },

//   { path: 'seleccionar-usuario-login',
//     loadComponent: () => import('./components/seleccionar-usuario-login/seleccionar-usuario-login.component')
//       .then(m => m.SeleccionarUsuarioLoginComponent) },

//   { path: 'seleccionar-usuario-registro',
//     loadComponent: () => import('./components/seleccionar-usuario-registro/seleccionar-usuario-registro.component')
//       .then(m => m.SeleccionarUsuarioRegistroComponent) },

//   { path: 'turnos-especialidad',
//     loadComponent: () => import('./components/turnos-especialidad/turnos-especialidad.component')
//       .then(m => m.TurnosEspecialidadComponent) },


// ];




