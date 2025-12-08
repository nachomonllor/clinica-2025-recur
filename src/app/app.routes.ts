import { Routes } from '@angular/router';
import { MainNavComponent } from './components/main-nav/main-nav.component';
import { RoleGuard } from './guards/role.guard';
import { MisHorariosEspecialistaComponent } from './components/mis-horarios-especialista/mis-horarios-especialista.component';

export const routes: Routes = [
  // Home (redirige a bienvenida)
  { path: '', pathMatch: 'full', redirectTo: 'bienvenida' },

  // ===== RUTAS PÚBLICAS (SIN NAVBAR) =====
  {
    path: 'bienvenida',
    loadComponent: () => import('./components/bienvenida/bienvenida.component').then(m => m.BienvenidaComponent),
    //  Animación de entrada
    data: { animation: 'BienvenidaPage' } 
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    //  Animación al ir al Login
    data: { animation: 'LoginPage' }
  },
  {
    path: 'registro-paciente',
    loadComponent: () => import('./components/registro-paciente/registro-paciente.component').then(m => m.RegistroPacienteComponent),
    // Animación distinta para Registros
    data: { animation: 'RegistroPage' }
  },
  {
    path: 'registro-especialista',
    loadComponent: () => import('./components/registro-especialista/registro-especialista.component').then(m => m.RegistroEspecialistaComponent),
    data: { animation: 'RegistroPage' }
  },

  {
    path: 'seleccionar-usuario-registro',
    loadComponent: () => import('./components/seleccionar-usuario-registro/seleccionar-usuario-registro.component').then(m => m.SeleccionarUsuarioRegistroComponent),
    data: { animation: 'RegistroPage' }
  },
  
  // Ruta suelta de especialista (podría ir dentro del layout también, pero la dejaste fuera)
  {
    path: 'mis-horarios-especialista',
    component: MisHorariosEspecialistaComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ESPECIALISTA'], animation: 'HorariosPage' }
  },

  // ===== RUTAS INTERNAS CON NAVBAR (LAYOUT) =====
  {
    path: '',
    component: MainNavComponent,
    children: [
      
      // --- SECCIÓN PACIENTES ---
      {
        path: 'mis-turnos-paciente',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/mis-turnos-paciente/mis-turnos-paciente.component').then(m => m.MisTurnosPacienteComponent),
        //  Animación para ver listados de turnos
        data: { animation: 'TurnosPage', roles: ['PACIENTE'] }
      },
      {
        path: 'solicitar-turno',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/solicitar-turno/solicitar-turno.component').then(m => m.SolicitarTurnoComponent),
        //  Animación para el Wizard de solicitud
        data: { animation: 'SolicitarTurnoPage', roles: ['PACIENTE', 'ADMIN'] }
      },

      {
        path: 'encuesta-atencion',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/encuesta-atencion/encuesta-atencion.component').then(m => m.EncuestaAtencionComponent),
        data: { animation: 'EncuestaPage', roles: ['PACIENTE'] }
      },

      // --- SECCIÓN ESPECIALISTAS ---
      {
        path: 'mis-turnos-especialista',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/mis-turnos-especialista/mis-turnos-especialista.component').then(m => m.MisTurnosEspecialistaComponent),
        data: { animation: 'TurnosPage', roles: ['ESPECIALISTA'] }
      },
      {
        path: 'pacientes-especialista',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/pacientes-especialista/pacientes-especialista.component').then(m => m.PacientesEspecialistaComponent),
        data: { animation: 'PacientesPage', roles: ['ESPECIALISTA'] }
      },

      {
        path: 'resenia-especialista',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/resenia-especialista/resenia-especialista.component').then(m => m.ReseniaEspecialistaComponent),
        data: { animation: 'ReseniaPage', roles: ['ESPECIALISTA'] }
      },

      // --- SECCION ADMIN / REPORTES / ESTADÍSTICAS ---
      {
        path: 'turnos-admin',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/admin/turnos-admin/turnos-admin.component').then(m => m.TurnosAdminComponent),
        data: { animation: 'TurnosPage', roles: ['ADMIN'] }
      },
      {
        path: 'usuarios-admin',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/admin/usuarios-admin/usuarios-admin.component').then(m => m.UsuariosAdminComponent),
        // Animación para la gestión de usuarios
        data: { animation: 'AdminUsuariosPage', roles: ['ADMIN'] }
      },
      {
        path: 'log-ingreso',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/log-ingresos-admin/log-ingresos-admin.component').then(m => m.LogIngresosAdminComponent),
        data: { animation: 'AdminStatsPage', roles: ['ADMIN'] }
      },
      
      // ESTADISTICAS E INFORMES (Solo ADMIN)
      {
        path: 'seleccion-estadisticas',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/seleccion-estadisticas/seleccion-estadisticas.component').then(m => m.SeleccionEstadisticasComponent),
        // Animación al entrar a estadísticas
        data: { animation: 'AdminStatsPage', roles: ['ADMIN'] }
      },
      {
        path: 'estadisticas',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/estadisticas/estadisticas.component').then(m => m.EstadisticasComponent),
        data: { animation: 'AdminStatsPage', roles: ['ADMIN'] }
      },
      // reportes específicos
      {
        path: 'reportes',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/admin/reportes/reportes.component').then(m => m.ReportesComponent),
        data: { animation: 'AdminStatsPage', roles: ['ADMIN'] }
      },
      {
        path: 'turnos-por-especialidad',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/turnos-por-especialidad/turnos-por-especialidad.component').then(m => m.TurnosPorEspecialidadComponent),
        data: { animation: 'AdminStatsPage', roles: ['ADMIN'] }
      },
      {
        path: 'turnos-por-medico',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/turnos-por-medico/turnos-por-medico.component').then(m => m.TurnosPorMedicoComponent),
        data: { animation: 'AdminStatsPage', roles: ['ADMIN'] }
      },
      {
        path: 'turnos-por-dia',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/turnos-por-dia/turnos-por-dia.component').then(m => m.TurnosPorDiaComponent),
        data: { animation: 'AdminStatsPage', roles: ['ADMIN'] }
      },
      {
        path: 'pacientes-por-especialidad',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/pacientes-por-especialidad/pacientes-por-especialidad.component').then(m => m.PacientesPorEspecialidadComponent),
        data: { animation: 'AdminStatsPage', roles: ['ADMIN'] }
      },
      {
        path: 'medicos-por-especialidad',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/medicos-por-especialidad/medicos-por-especialidad.component').then(m => m.MedicosPorEspecialidadComponent),
        data: { animation: 'AdminStatsPage', roles: ['ADMIN'] }
      },
      {
        path: 'resultados-encuestas',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/resultados-encuesta/resultados-encuesta.component').then(m => m.ResultadosEncuestaComponent),
        data: { animation: 'AdminStatsPage', roles: ['ADMIN'] }
      },
      {
        path: 'informes-generales',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/informes-generales/informes-generales.component').then(m => m.InformesGeneralesComponent),
        data: { animation: 'AdminStatsPage', roles: ['ADMIN'] }
      },
      {
        path: 'turnos-por-paciente',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/turnos-por-paciente/turnos-por-paciente.component').then(m => m.TurnosPorPacienteComponent),
        data: { animation: 'AdminStatsPage', roles: ['ADMIN'] }
      },

      // --- PERFIL Y OTROS ---
      {
        path: 'perfil-usuario',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/admin/perfil-usuario/perfil-usuario.component').then(m => m.PerfilUsuarioComponent),
        data: { animation: 'PerfilPage', roles: ['PACIENTE', 'ESPECIALISTA', 'ADMIN'] }
      },
      {
        path: 'mi-perfil',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent),
        // 8. Animación para el perfil
        data: { animation: 'PerfilPage', roles: ['PACIENTE', 'ESPECIALISTA', 'ADMIN'] }
      },

    ]
  },

  { path: '**', redirectTo: 'bienvenida' }
];


