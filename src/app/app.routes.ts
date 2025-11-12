
// // ------------------ CON LAZY LOADING ------------------


// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { BienvenidaComponent } from './bienvenida/bienvenida.component';
import { adminGuard } from '../services/admin.guard';

export const routes: Routes = [
  // Home (redirige a bienvenida)
  { path: '', pathMatch: 'full', redirectTo: 'bienvenida' },
  { path: 'bienvenida', component: BienvenidaComponent, data: { animation: 'bienvenida' } },

  // Auth / público
  { path: 'login-paciente',
    loadComponent: () => import('./components/login-paciente/login-paciente.component')
      .then(m => m.LoginPacienteComponent),
    data: { animation: 'login' } },

  { path: 'registro-paciente',
    loadComponent: () => import('./components/registro-paciente/registro-paciente.component')
      .then(m => m.RegistroPacienteComponent) },

  { path: 'registro-especialista',
    loadComponent: () => import('./components/registro-especialista/registro-especialista.component')
      .then(m => m.RegistroEspecialistaComponent) },

  // Varias (según vayas integrando)
  { path: 'encuesta-atencion',
    loadComponent: () => import('./components/encuesta-atencion/encuesta-atencion.component')
      .then(m => m.EncuestaAtencionComponent) },

  { path: 'log-table',
    loadComponent: () => import('./components/log-table/log-table.component')
      .then(m => m.LogTableComponent) },

  { path: 'estadisticas',
    loadComponent: () => import('./components/estadisticas/estadisticas.component')
      .then(m => m.EstadisticasComponent),
    data: { animation: 'estadisticas' } },

  { path: 'historia-clinica',
    loadComponent: () => import('./components/historia-clinica/historia-clinica.component')
      .then(m => m.HistoriaClinicaComponent) },

  { path: 'listar-especialistas',
    loadComponent: () => import('./components/listar-especialistas/listar-especialistas.component')
      .then(m => m.ListarEspecialistasComponent) },

  { path: 'listar-pacientes',
    loadComponent: () => import('./components/listar-pacientes/listar-pacientes.component')
      .then(m => m.ListarPacientesComponent) },

  { path: 'mis-turnos-especialista',
    loadComponent: () => import('./components/mis-turnos-especialista/mis-turnos-especialista.component')
      .then(m => m.MisTurnosEspecialistaComponent) },

  { path: 'mis-turnos-paciente',
    loadComponent: () => import('./components/mis-turnos-paciente/mis-turnos-paciente.component')
      .then(m => m.MisTurnosPacienteComponent),
    data: { animation: 'turnos' } },

  { path: 'resenia-especialista',
    loadComponent: () => import('./components/resenia-especialista/resenia-especialista.component')
      .then(m => m.ReseniaEspecialistaComponent) },

  { path: 'seleccionar-usuario',
    loadComponent: () => import('./components/seleccionar-usuario/seleccionar-usuario.component')
      .then(m => m.SeleccionarUsuarioComponent) },

  { path: 'seleccionar-usuario-login',
    loadComponent: () => import('./components/seleccionar-usuario-login/seleccionar-usuario-login.component')
      .then(m => m.SeleccionarUsuarioLoginComponent) },

  { path: 'seleccionar-usuario-registro',
    loadComponent: () => import('./components/seleccionar-usuario-registro/seleccionar-usuario-registro.component')
      .then(m => m.SeleccionarUsuarioRegistroComponent) },

  { path: 'turnos-especialidad',
    loadComponent: () => import('./components/turnos-especialidad/turnos-especialidad.component')
      .then(m => m.TurnosEspecialidadComponent) },

  { path: 'turnos-admin',
    loadComponent: () => import('./components/turnos-admin/turnos-admin.component')
      .then(m => m.TurnosAdminComponent),
    canActivate: [adminGuard] },

  { path: 'solicitar-turno',
    loadComponent: () => import('./components/solicitar-turno/solicitar-turno.component')
      .then(m => m.SolicitarTurnoComponent) },

  { path: 'mi-perfil',
    loadComponent: () => import('./components/mi-perfil/mi-perfil.component')
      .then(m => m.MiPerfilComponent),
    data: { animation: 'miPerfil' } },
  { path: 'pacientes-especialista',
    loadComponent: () => import('./components/pacientes-especialista/pacientes-especialista.component')
      .then(m => m.PacientesEspecialistaComponent) },

  { path: 'usuarios-admin',
    loadComponent: () => import('./components/usuarios-admin/usuarios-admin.component')
      .then(m => m.UsuariosAdminComponent),
    canActivate: [adminGuard] },

  { path: '**', redirectTo: 'login-paciente' }
];




// // src/app/app.routes.ts
// import { Routes } from '@angular/router';

// export const routes: Routes = [

//   { path: 'login-paciente', loadComponent: () => import('./components/login-paciente/login-paciente.component').then(m => m.LoginPacienteComponent) },
//   { path: 'registro-paciente', loadComponent: () => import('./components/registro-paciente/registro-paciente.component').then(m => m.RegistroPacienteComponent) },
//   { path: 'registro-especialista', loadComponent: () => import('./components/registro-especialista/registro-especialista.component').then(m => m.RegistroEspecialistaComponent) },
//   { path: 'encuesta-atencion', loadComponent: () => import('./components/encuesta-atencion/encuesta-atencion.component').then(m => m.EncuestaAtencionComponent) },
//   { path: 'log-table', loadComponent: () => import('./components/log-table/log-table.component').then(m => m.LogTableComponent) },
  
//   { path: 'estadisticas', loadComponent: () => import('./components/estadisticas/estadisticas.component').then(m => m.EstadisticasComponent) },
//   { path: 'historia-clinica', loadComponent: () => import('./components/historia-clinica/historia-clinica.component').then(m => m.HistoriaClinicaComponent) },
//   { path: 'listar-especialistas', loadComponent: () => import('./components/listar-especialistas/listar-especialistas.component').then(m => m.ListarEspecialistasComponent) },
//   { path: 'listar-pacientes', loadComponent: () => import('./components/listar-pacientes/listar-pacientes.component').then(m => m.ListarPacientesComponent) },
//   { path: 'mis-turnos-especialista', loadComponent: () => import('./components/mis-turnos-especialista/mis-turnos-especialista.component').then(m => m.MisTurnosEspecialistaComponent) },
//   { path: 'mis-turnos-paciente', loadComponent: () => import('./components/mis-turnos-paciente/mis-turnos-paciente.component').then(m => m.MisTurnosPacienteComponent) },
//   { path: 'resenia-especialista', loadComponent: () => import('./components/resenia-especialista/resenia-especialista.component').then(m => m.ReseniaEspecialistaComponent) },
//   { path: 'seleccionar-usuario', loadComponent: () => import('./components/seleccionar-usuario/seleccionar-usuario.component').then(m => m.SeleccionarUsuarioComponent) },
//   { path: 'seleccionar-usuario-login', loadComponent: () => import('./components/seleccionar-usuario-login/seleccionar-usuario-login.component').then(m => m.SeleccionarUsuarioLoginComponent) },
//   { path: 'seleccionar-usuario-registro', loadComponent: () => import('./components/seleccionar-usuario-registro/seleccionar-usuario-registro.component').then(m => m.SeleccionarUsuarioRegistroComponent) },
//   { path: 'turnos-especialidad', loadComponent: () => import('./components/turnos-especialidad/turnos-especialidad.component').then(m => m.TurnosEspecialidadComponent) },

//   // src/app/app.routes.
//   // ts
//   { path: 'mis-turnos/paciente',
//     loadComponent: () => import('./components/mis-turnos-paciente/mis-turnos-paciente.component')
//     .then(m => m.MisTurnosPacienteComponent) },
    
    
//     { path: '**', redirectTo: 'login-paciente' },
// ];



//   /*
//        EncuestaAtencionComponent
//        EstadisticasComponent
//        HistoriaClinicaComponent
//        ListarEspecialistasComponent
//        ListarPacientesComponent
//        LogTableComponent
//        LoginPacienteComponent
//        MisTurnosEspecialistaComponent
//        MisTurnosPacienteComponent
//        RegistroPacienteComponent
 
//        ReseniaEspecialistaComponent
//        SeleccionarUsuarioComponent
//        SeleccionarUsuarioLoginComponent
//        SeleccionarUsuarioRegistroComponent
//        TurnosEspecialidadComponent
 
//   */

//        // import { Routes } from '@angular/router';
// // import { RegistroPacienteComponent } from './components/registro-paciente/registro-paciente.component';
// // import { RegistroEspecialistaComponent } from './components/registro-especialista/registro-especialista.component';
// // import { LoginPacienteComponent } from './components/login-paciente/login-paciente.component';

// // export const routes: Routes = [
// //     // { path: '**', component: RegistroPacienteComponent },
// //     { path: 'registro-paciente', component: RegistroPacienteComponent },

// //     { path: 'registro-especialista', component: RegistroEspecialistaComponent },
// //     { path: 'login-paciente', component: LoginPacienteComponent },
// // ];


