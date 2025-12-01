
import { Routes } from '@angular/router';
import { MainNavComponent } from './components/main-nav/main-nav.component';

import { RoleGuard } from './guards/role.guard';
import { MisHorariosEspecialistaComponent } from './components/mis-horarios-especialista/mis-horarios-especialista.component';


export const routes: Routes = [
  // Home (redirige a bienvenida)
  { path: '', pathMatch: 'full', redirectTo: 'bienvenida' },

  // ===== RUTAS PÚBLICAS  ----  SIN NAVBAR =====
  {
    path: 'bienvenida',
    loadComponent: () =>
      import('./components/bienvenida/bienvenida.component')
        .then(m => m.BienvenidaComponent),
    data: { animation: 'bienvenida' }
  },

  {
    path: 'mis-horarios-especialista', component: MisHorariosEspecialistaComponent

  },

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

  // ===== RUTAS INTERNAS / CON NAVBAR (LAYOUT) =====
  {
    path: '',
    component: MainNavComponent,

    children: [
      // --- Paciente ---
      // {
      //   path: 'mis-turnos-paciente',
      //   canActivate: [RoleGuard],   // <-- AGREGADO GUard ---------------------------------------------------------

      //   loadComponent: () =>
      //     import('./components/mis-turnos-paciente/mis-turnos-paciente.component')
      //       .then(m => m.MisTurnosPacienteComponent),
      //   data: {
      //     animation: 'turnos',
      //     roles: ['PACIENTE']
      //   }
      // },

      {
        path: 'mis-turnos-paciente',
        canActivate: [RoleGuard], // OK si RoleGuard ya verifica sesión
        loadComponent: () =>
          import('./components/mis-turnos-paciente/mis-turnos-paciente.component')
            .then(m => m.MisTurnosPacienteComponent),
        data: {
          animation: 'turnos',
          roles: ['PACIENTE']
        }
      },


      {
        path: 'solicitar-turno',
        loadComponent: () =>
          import('./components/solicitar-turno/solicitar-turno.component')
            .then(m => m.SolicitarTurnoComponent)
      },
      {
        path: 'historia-clinica',
        loadComponent: () =>
          import('./components/historia-clinica/historia-clinica.component')
            .then(m => m.HistoriaClinicaComponent)
      },
      {
        path: 'encuesta-atencion',
        loadComponent: () =>
          import('./components/encuesta-atencion/encuesta-atencion.component')
            .then(m => m.EncuestaAtencionComponent)
      },

      // --- Especialista ---
      // {
      //   path: 'mis-turnos-especialista',
      //   loadComponent: () =>
      //     import('./components/mis-turnos-especialista/mis-turnos-especialista.component')
      //       .then(m => m.MisTurnosEspecialistaComponent)
      // },

      {
        path: 'mis-turnos-especialista',
        canActivate: [RoleGuard], // o [AuthGuard, RoleGuard] si los separás
        loadComponent: () =>
          import('./components/mis-turnos-especialista/mis-turnos-especialista.component')
            .then(m => m.MisTurnosEspecialistaComponent),
        data: {
          animation: 'turnos',
          roles: ['ESPECIALISTA']
        }
      },

      {
        path: 'pacientes-especialista',
        loadComponent: () =>
          import('./components/pacientes-especialista/pacientes-especialista.component')
            .then(m => m.PacientesEspecialistaComponent)
      },
      {
        path: 'listar-pacientes',
        loadComponent: () =>
          import('./components/listar-pacientes/listar-pacientes.component')
            .then(m => m.ListarPacientesComponent)
      },
      {
        path: 'resenia-especialista',
        loadComponent: () =>
          import('./components/resenia-especialista/resenia-especialista.component')
            .then(m => m.ReseniaEspecialistaComponent)
      },

      // --- Admin / reportes / estadística ---
      {
        path: 'turnos-admin',
        loadComponent: () =>
          import('./components/admin/turnos-admin/turnos-admin.component')
            .then(m => m.TurnosAdminComponent)
      },
      {
        path: 'usuarios-admin',
        canActivate: [RoleGuard],
        loadComponent: () =>
          import('./components/admin/usuarios-admin/usuarios-admin.component')
            .then(m => m.UsuariosAdminComponent),
        data: {
          roles: ['ADMIN']         // <--  el guard ---------------------------------------------------------
        }
      },
      {
        path: 'log-ingreso',
        loadComponent: () =>
          import('./components/log-ingresos-admin/log-ingresos-admin.component')
            .then(m => m.LogIngresosAdminComponent)
      },
      {
        path: 'seleccion-estadisticas',
        loadComponent: () =>
          import('./components/seleccion-estadisticas/seleccion-estadisticas.component')
            .then(m => m.SeleccionEstadisticasComponent)
      },
      {
        path: 'estadisticas',
        loadComponent: () =>
          import('./components/estadisticas/estadisticas.component')
            .then(m => m.EstadisticasComponent),
        data: { animation: 'estadisticas' }
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./components/admin/reportes/reportes.component')
            .then(m => m.ReportesComponent)
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
        path: 'pacientes-por-especialidad',
        loadComponent: () =>
          import('./components/pacientes-por-especialidad/pacientes-por-especialidad.component')
            .then(m => m.PacientesPorEspecialidadComponent)
      },
      {
        path: 'medicos-por-especialidad',
        loadComponent: () =>
          import('./components/medicos-por-especialidad/medicos-por-especialidad.component')
            .then(m => m.MedicosPorEspecialidadComponent)
      },
      {
        path: 'informe-encuestas',
        loadComponent: () =>
          import('./components/informe-encuestas/informe-encuestas.component')
            .then(m => m.InformeEncuestasComponent)
      },
      {
        path: 'turnos-por-paciente',
        loadComponent: () =>
          import('./components/turnos-por-paciente/turnos-por-paciente.component')
            .then(m => m.TurnosPorPacienteComponent)
      },

      {
        path: 'resultados-encuestas',
        loadComponent: () =>
          import('./components/resultados-encuesta/resultados-encuesta.component')
            .then(m => m.ResultadosEncuestaComponent)
      },

      // informes-generales

       {
        path: 'informes-generales',
        loadComponent: () =>
          import('./components/informes-generales/informes-generales.component')
            .then(m => m.InformesGeneralesComponent)
      },

      {
        path: 'turnos-especialidad',
        loadComponent: () =>
          import('./components/turnos-especialidad/turnos-especialidad.component')
            .then(m => m.TurnosEspecialidadComponent)
      },

      // --- Perfil / otros ---
      {
        path: 'perfil-usuario',
        loadComponent: () =>
          import('./components/admin/perfil-usuario/perfil-usuario.component')
            .then(m => m.PerfilUsuarioComponent)
      },
      {
        path: 'mi-perfil', // si todavía lo usás en algún lado
        loadComponent: () =>
          import('./components/mi-perfil/mi-perfil.component')
            .then(m => m.MiPerfilComponent),
        data: { animation: 'miPerfil' }
      },
      {
        path: 'listar-especialistas',
        loadComponent: () =>
          import('./components/listar-especialistas/listar-especialistas.component')
            .then(m => m.ListarEspecialistasComponent)
      }
    ]
  },

  { path: '**', redirectTo: 'bienvenida' }
];




// import { Routes } from '@angular/router';

// export const routes: Routes = [
//   // Home (redirige a bienvenida)
//   { path: '', pathMatch: 'full', redirectTo: 'bienvenida' },

//   {
//     path: 'bienvenida',
//     loadComponent: () =>
//       import('./components/bienvenida/bienvenida.component')
//         .then(m => m.BienvenidaComponent),
//     data: { animation: 'bienvenida' }
//   },

//   {
//     path: 'seleccion-estadisticas',
//     loadComponent: () =>
//       import('./components/seleccion-estadisticas/seleccion-estadisticas.component')
//         .then(m => m.SeleccionEstadisticasComponent)
//   },

//   {
//     path: 'turnos-por-especialidad',
//     loadComponent: () =>
//       import('./components/turnos-por-especialidad/turnos-por-especialidad.component')
//         .then(m => m.TurnosPorEspecialidadComponent)
//   },

//   {
//     path: 'turnos-por-medico',
//     loadComponent: () =>
//       import('./components/turnos-por-medico/turnos-por-medico.component')
//         .then(m => m.TurnosPorMedicoComponent)
//   },

//   {
//     path: 'turnos-por-dia',
//     loadComponent: () =>
//       import('./components/turnos-por-dia/turnos-por-dia.component')
//         .then(m => m.TurnosPorDiaComponent)
//   },

//   {
//     path: 'perfil-usuario',
//     loadComponent: () =>
//       import('./components/admin/perfil-usuario/perfil-usuario.component')
//         .then(m => m.PerfilUsuarioComponent)
//     // SUGERIDO: canMatch: [adminGuard]
//   },

//   // {
//   //   path: 'usuarios',
//   //   loadComponent: () =>
//   //     import('./components/usuarios/usuarios.component')
//   //       .then(m => m.UsuariosComponent)
//   // },


//   {
//     path: 'reportes',
//     loadComponent: () =>
//       import('./components/admin/reportes/reportes.component')
//         .then(m => m.ReportesComponent)
//     // SUGERIDO: canMatch: [adminGuard]
//   },

//   // Auth / público
//   {
//     path: 'login',
//     loadComponent: () =>
//       import('./components/login/login.component')
//         .then(m => m.LoginComponent),
//     data: { animation: 'login' }
//   },

//   {
//     path: 'registro-paciente',
//     loadComponent: () =>
//       import('./components/registro-paciente/registro-paciente.component')
//         .then(m => m.RegistroPacienteComponent)
//   },

//   {
//     path: 'registro-especialista',
//     loadComponent: () =>
//       import('./components/registro-especialista/registro-especialista.component')
//         .then(m => m.RegistroEspecialistaComponent)
//   },

//   // Varias (según vayas integrando)
//   {
//     path: 'encuesta-atencion',
//     loadComponent: () =>
//       import('./components/encuesta-atencion/encuesta-atencion.component')
//         .then(m => m.EncuestaAtencionComponent)
//   },

//   {
//     path: 'estadisticas',
//     loadComponent: () =>
//       import('./components/estadisticas/estadisticas.component')
//         .then(m => m.EstadisticasComponent),
//     data: { animation: 'estadisticas' }
//   },

//   {
//     path: 'historia-clinica',
//     loadComponent: () =>
//       import('./components/historia-clinica/historia-clinica.component')
//         .then(m => m.HistoriaClinicaComponent)
//   },

//   {
//     path: 'listar-especialistas',
//     loadComponent: () =>
//       import('./components/listar-especialistas/listar-especialistas.component')
//         .then(m => m.ListarEspecialistasComponent)
//   },

//   {
//     path: 'listar-pacientes',
//     loadComponent: () =>
//       import('./components/listar-pacientes/listar-pacientes.component')
//         .then(m => m.ListarPacientesComponent)
//   },

//   {
//     path: 'mis-turnos-especialista',
//     loadComponent: () =>
//       import('./components/mis-turnos-especialista/mis-turnos-especialista.component')
//         .then(m => m.MisTurnosEspecialistaComponent)
//   },

//   // { path: 'mis-turnos-paciente', component: MisTurnosPacienteComponent,
//   //   canActivate: [RoleGuard], data: { roles: ['paciente'] } },

//   {
//     path: 'mis-turnos-paciente',
//     loadComponent: () =>
//       import('./components/mis-turnos-paciente/mis-turnos-paciente.component')
//         .then(m => m.MisTurnosPacienteComponent),
//     data: { animation: 'turnos' }
//   },

//   {
//     path: 'resenia-especialista',
//     loadComponent: () =>
//       import('./components/resenia-especialista/resenia-especialista.component')
//         .then(m => m.ReseniaEspecialistaComponent)
//   },

//   {
//     path: 'seleccionar-usuario',
//     loadComponent: () =>
//       import('./components/seleccionar-usuario/seleccionar-usuario.component')
//         .then(m => m.SeleccionarUsuarioComponent)
//   },

//   {
//     path: 'seleccionar-usuario-login',
//     loadComponent: () =>
//       import('./components/seleccionar-usuario-login/seleccionar-usuario-login.component')
//         .then(m => m.SeleccionarUsuarioLoginComponent)
//   },

//   {
//     path: 'seleccionar-usuario-registro',
//     loadComponent: () =>
//       import('./components/seleccionar-usuario-registro/seleccionar-usuario-registro.component')
//         .then(m => m.SeleccionarUsuarioRegistroComponent)
//   },

//   {
//     path: 'turnos-especialidad',
//     loadComponent: () =>
//       import('./components/turnos-especialidad/turnos-especialidad.component')
//         .then(m => m.TurnosEspecialidadComponent)
//   },

//   {
//     path: 'turnos-admin',
//     loadComponent: () =>
//       import('./components/admin/turnos-admin/turnos-admin.component')
//         .then(m => m.TurnosAdminComponent),
//     // SUGERIDO: canMatch: [adminGuard]
//   },

//   {
//     path: 'solicitar-turno',
//     loadComponent: () =>
//       import('./components/solicitar-turno/solicitar-turno.component')
//         .then(m => m.SolicitarTurnoComponent)
//   },

//   {
//     path: 'mi-perfil',
//     loadComponent: () =>
//       import('./components/mi-perfil/mi-perfil.component')
//         .then(m => m.MiPerfilComponent),
//     data: { animation: 'miPerfil' }
//   },

//   {
//     path: 'pacientes-especialista',
//     loadComponent: () =>
//       import('./components/pacientes-especialista/pacientes-especialista.component')
//         .then(m => m.PacientesEspecialistaComponent)
//   },

//   {
//     path: 'usuarios-admin',
//     loadComponent: () =>
//       import('./components/admin/usuarios-admin/usuarios-admin.component')
//         .then(m => m.UsuariosAdminComponent),
//     // SUGERIDO: canMatch: [adminGuard]
//   },

//   {
//     path: 'log-ingreso',
//     loadComponent: () =>
//       import('./components/log-ingresos-admin/log-ingresos-admin.component')
//         .then(m => m.LogIngresosAdminComponent)
//   },

//   { path: '**', redirectTo: 'bienvenida' },
// ];



