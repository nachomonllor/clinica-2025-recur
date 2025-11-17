
import { Routes } from '@angular/router';
import { adminGuard } from '../services/admin.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'bienvenida' },

  // Públicas / Generales
  {
    path: 'bienvenida',
    loadComponent: () =>
      import('./components/bienvenida/bienvenida.component')
        .then(m => m.BienvenidaComponent),
    data: { animation: 'bienvenida' }
  },
  {
    path: 'seleccion-estadisticas',
    loadComponent: () =>
      import('./components/seleccion-estadisticas/seleccion-estadisticas.component')
        .then(m => m.SeleccionEstadisticasComponent)
  },
  {
    path: 'turnos-por-especialidad',
    loadComponent: () =>
      import('./components/turnos-por-especialidad/turnos-por-especialidad.component')
        .then(m => m.TurnosPorEspecialidadComponent)
  },
  {
    path: 'turnos-por-medico',
    loadComponent: () =>
      import('./components/turnos-por-medico/turnos-por-medico.component')
        .then(m => m.TurnosPorMedicoComponent)
  },
  {
    path: 'turnos-por-dia',
    loadComponent: () =>
      import('./components/turnos-por-dia/turnos-por-dia.component')
        .then(m => m.TurnosPorDiaComponent)
  },
  {
    path: 'perfil-usuario',
    loadComponent: () =>
      import('./components/admin/perfil-usuario/perfil-usuario.component')
        .then(m => m.PerfilUsuarioComponent)
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./components/usuarios/usuarios.component')
        .then(m => m.UsuariosComponent)
  },
  {
    path: 'reportes',
    loadComponent: () =>
      import('./components/admin/reportes/reportes.component')
        .then(m => m.ReportesComponent)
  },

  // Auth / Público
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component')
        .then(m => m.LoginComponent),
    data: { animation: 'login' }
  },
  {
    path: 'registro-paciente',
    loadComponent: () =>
      import('./components/registro-paciente/registro-paciente.component')
        .then(m => m.RegistroPacienteComponent)
  },
  {
    path: 'registro-especialista',
    loadComponent: () =>
      import('./components/registro-especialista/registro-especialista.component')
        .then(m => m.RegistroEspecialistaComponent)
  },

  // Otras vistas
  {
    path: 'encuesta-atencion',
    loadComponent: () =>
      import('./components/encuesta-atencion/encuesta-atencion.component')
        .then(m => m.EncuestaAtencionComponent)
  },
  {
    path: 'estadisticas',
    loadComponent: () =>
      import('./components/estadisticas/estadisticas.component')
        .then(m => m.EstadisticasComponent),
    data: { animation: 'estadisticas' }
  },
  {
    path: 'historia-clinica',
    loadComponent: () =>
      import('./components/historia-clinica/historia-clinica.component')
        .then(m => m.HistoriaClinicaComponent)
  },
  {
    path: 'listar-especialistas',
    loadComponent: () =>
      import('./components/listar-especialistas/listar-especialistas.component')
        .then(m => m.ListarEspecialistasComponent)
  },
  {
    path: 'listar-pacientes',
    loadComponent: () =>
      import('./components/listar-pacientes/listar-pacientes.component')
        .then(m => m.ListarPacientesComponent)
  },

  // Flujos por rol
  {
    path: 'mis-turnos-especialista',
    loadComponent: () =>
      import('./components/mis-turnos-especialista/mis-turnos-especialista.component')
        .then(m => m.MisTurnosEspecialistaComponent)
  },
  {
    path: 'mis-turnos-paciente',
    loadComponent: () =>
      import('./components/mis-turnos-paciente/mis-turnos-paciente.component')
        .then(m => m.MisTurnosPacienteComponent),
    data: { animation: 'turnos' }
  },

  {
    path: 'resenia-especialista',
    loadComponent: () =>
      import('./components/resenia-especialista/resenia-especialista.component')
        .then(m => m.ReseniaEspecialistaComponent)
  },
  {
    path: 'seleccionar-usuario',
    loadComponent: () =>
      import('./components/seleccionar-usuario/seleccionar-usuario.component')
        .then(m => m.SeleccionarUsuarioComponent)
  },
  {
    path: 'seleccionar-usuario-login',
    loadComponent: () =>
      import('./components/seleccionar-usuario-login/seleccionar-usuario-login.component')
        .then(m => m.SeleccionarUsuarioLoginComponent)
  },
  {
    path: 'seleccionar-usuario-registro',
    loadComponent: () =>
      import('./components/seleccionar-usuario-registro/seleccionar-usuario-registro.component')
        .then(m => m.SeleccionarUsuarioRegistroComponent)
  },
  {
    path: 'turnos-especialidad',
    loadComponent: () =>
      import('./components/turnos-especialidad/turnos-especialidad.component')
        .then(m => m.TurnosEspecialidadComponent)
  },

  // Administración (lazy + guard)
  {
    path: 'turnos-admin',
    loadComponent: () =>
      import('./components/admin/turnos-admin/turnos-admin.component')
        .then(m => m.TurnosAdminComponent),
    canActivate: [adminGuard]        // si querés, luego lo pasamos a canMatch
  },
  {
    path: 'usuarios-admin',
    loadComponent: () =>
      import('./components/admin/usuarios-admin/usuarios-admin.component')
        .then(m => m.UsuariosAdminComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'log-ingreso',
    loadComponent: () =>
      import('./components/log-ingresos-admin/log-ingresos-admin.component')
        .then(m => m.LogIngresosAdminComponent)
  },

  { path: '**', redirectTo: 'bienvenida' },

];




// // // ------------------ CON LAZY LOADING ------------------
// // src/app/app.routes.ts
// import { Routes } from '@angular/router';
// import { adminGuard } from '../services/admin.guard';
// import { BienvenidaComponent } from './components/bienvenida/bienvenida.component';
// import { UsuariosComponent } from './components/usuarios/usuarios.component';
// import { PerfilUsuarioComponent } from './components/admin/perfil-usuario/perfil-usuario.component';
// import { ReportesComponent } from './components/admin/reportes/reportes.component';
// import { SeleccionEstadisticasComponent } from './components/seleccion-estadisticas/seleccion-estadisticas.component';
// import { TurnosPorEspecialidadComponent } from './components/turnos-por-especialidad/turnos-por-especialidad.component';
// import { TurnosPorMedicoComponent } from './components/turnos-por-medico/turnos-por-medico.component';
// import { TurnosPorDiaComponent } from './components/turnos-por-dia/turnos-por-dia.component';

// export const routes: Routes = [
//   // Home (redirige a bienvenida)
//   { path: '', pathMatch: 'full', redirectTo: 'bienvenida' },
//   { path: 'bienvenida', component: BienvenidaComponent, data: { animation: 'bienvenida' } },
//   { path: 'seleccion-estadisticas', component: SeleccionEstadisticasComponent },
//   { path: 'turnos-por-especialidad', component: TurnosPorEspecialidadComponent},
//   { path: 'turnos-por-medico', component: TurnosPorMedicoComponent},
//   { path: 'turnos-por-dia', component: TurnosPorDiaComponent},
//   { path: 'perfil-usuario', component: PerfilUsuarioComponent},  
//   { path: 'usuarios', component: UsuariosComponent},
//   { path: 'reportes', component: ReportesComponent},

//   // Auth / público
//   { path: 'login-paciente',
//     loadComponent: () => import('./components/login/login.component')
//       .then(m => m.LoginComponent),
//     data: { animation: 'login' } 
//   },

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

//   { path: 'estadisticas',
//     loadComponent: () => import('./components/estadisticas/estadisticas.component')
//       .then(m => m.EstadisticasComponent),
//     data: { animation: 'estadisticas' } },

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


// // { path: 'mis-turnos-paciente', component: MisTurnosPacienteComponent,
// //   canActivate: [RoleGuard], data: { roles: ['paciente'] } },

//   { path: 'mis-turnos-paciente',
//     loadComponent: () => import('./components/mis-turnos-paciente/mis-turnos-paciente.component')
//       .then(m => m.MisTurnosPacienteComponent),
//     data: { animation: 'turnos' } },

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

//   { path: 'turnos-admin',
//     loadComponent: () => import('./components/admin/turnos-admin/turnos-admin.component')
//       .then(m => m.TurnosAdminComponent),
//     canActivate: [adminGuard] },

//   { path: 'solicitar-turno',
//     loadComponent: () => import('./components/solicitar-turno/solicitar-turno.component')
//       .then(m => m.SolicitarTurnoComponent) },

//   { path: 'mi-perfil',
//     loadComponent: () => import('./components/mi-perfil/mi-perfil.component')
//       .then(m => m.MiPerfilComponent),
//     data: { animation: 'miPerfil' } },
//   { path: 'pacientes-especialista',
//     loadComponent: () => import('./components/pacientes-especialista/pacientes-especialista.component')
//       .then(m => m.PacientesEspecialistaComponent) },

//   { path: 'usuarios-admin',
//     loadComponent: () => import('./components/admin/usuarios-admin/usuarios-admin.component')
//       .then(m => m.UsuariosAdminComponent),
//     canActivate: [adminGuard] },
//    // './log-ingresos-admin/log-ingresos-admin.component'

//    { path: 'log-ingreso', 
//        loadComponent: () => import( './components/log-ingresos-admin/log-ingresos-admin.component')  
//        .then( m => m.LogIngresosAdminComponent) },  
    
//   { path: '**', redirectTo: 'bienvenida' },
  
// ];


