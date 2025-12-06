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
    data: { animation: 'bienvenida' }
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    data: { animation: 'login' }
  },
  {
    path: 'registro-paciente',
    loadComponent: () => import('./components/registro-paciente/registro-paciente.component').then(m => m.RegistroPacienteComponent)
  },
  {
    path: 'registro-especialista',
    loadComponent: () => import('./components/registro-especialista/registro-especialista.component').then(m => m.RegistroEspecialistaComponent)
  },
  // {
  //   path: 'seleccionar-usuario',
  //   loadComponent: () => import('./components/seleccionar-usuario/seleccionar-usuario.component').then(m => m.SeleccionarUsuarioComponent)
  // },
  // {
  //   path: 'seleccionar-usuario-login',
  //   loadComponent: () => import('./components/seleccionar-usuario-login/seleccionar-usuario-login.component').then(m => m.SeleccionarUsuarioLoginComponent)
  // },
  {
    path: 'seleccionar-usuario-registro',
    loadComponent: () => import('./components/seleccionar-usuario-registro/seleccionar-usuario-registro.component').then(m => m.SeleccionarUsuarioRegistroComponent)
  },


  // Le agregamos el Guard porque solo el especialista debe verla.
  {
    path: 'mis-horarios-especialista',
    component: MisHorariosEspecialistaComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ESPECIALISTA'] }
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
        data: { animation: 'turnos', roles: ['PACIENTE'] }
      },
      {
        path: 'solicitar-turno',
        canActivate: [RoleGuard],
        // Según consigna: "Tendrán acceso tanto el Paciente como el Administrador"
        loadComponent: () => import('./components/solicitar-turno/solicitar-turno.component').then(m => m.SolicitarTurnoComponent),
        data: { roles: ['PACIENTE', 'ADMIN'] }
      },
      {
        path: 'historia-clinica',
        canActivate: [RoleGuard],
        // El especialista la carga, el paciente la ve.
        loadComponent: () => import('./components/historia-clinica/historia-clinica.component').then(m => m.HistoriaClinicaComponent),
        data: { roles: ['PACIENTE', 'ESPECIALISTA'] }
      },
      {
        path: 'encuesta-atencion',
        canActivate: [RoleGuard],
        // Solo el paciente completa la encuesta
        loadComponent: () => import('./components/encuesta-atencion/encuesta-atencion.component').then(m => m.EncuestaAtencionComponent),
        data: { roles: ['PACIENTE'] }
      },

      // --- SECCIÓN ESPECIALISTAS ---
      {
        path: 'mis-turnos-especialista',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/mis-turnos-especialista/mis-turnos-especialista.component').then(m => m.MisTurnosEspecialistaComponent),
        data: { animation: 'turnos', roles: ['ESPECIALISTA'] }
      },
      {
        path: 'pacientes-especialista',
        canActivate: [RoleGuard],
        // Solo especialistas ven a "sus" pacientes
        loadComponent: () => import('./components/pacientes-especialista/pacientes-especialista.component').then(m => m.PacientesEspecialistaComponent),
        data: { roles: ['ESPECIALISTA'] }
      },
      {
        path: 'listar-pacientes',
        canActivate: [RoleGuard],
        // Generalmente para especialistas o admin
        loadComponent: () => import('./components/listar-pacientes/listar-pacientes.component').then(m => m.ListarPacientesComponent),
        data: { roles: ['ESPECIALISTA', 'ADMIN'] }
      },
      {
        path: 'resenia-especialista',
        canActivate: [RoleGuard],
        // Si es para dejar reseña, es rol especialista
        loadComponent: () => import('./components/resenia-especialista/resenia-especialista.component').then(m => m.ReseniaEspecialistaComponent),
        data: { roles: ['ESPECIALISTA'] }
      },

      // --- SECCION ADMIN / REPORTES / ESTADÍSTICAS ---
      {
        path: 'turnos-admin',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/admin/turnos-admin/turnos-admin.component').then(m => m.TurnosAdminComponent),
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'usuarios-admin',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/admin/usuarios-admin/usuarios-admin.component').then(m => m.UsuariosAdminComponent),
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'log-ingreso',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/log-ingresos-admin/log-ingresos-admin.component').then(m => m.LogIngresosAdminComponent),
        data: { roles: ['ADMIN'] }
      },
      
      // ESTADISTICAS E INFORMES (Solo ADMIN)
      {
        path: 'seleccion-estadisticas',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/seleccion-estadisticas/seleccion-estadisticas.component').then(m => m.SeleccionEstadisticasComponent),
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'estadisticas',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/estadisticas/estadisticas.component').then(m => m.EstadisticasComponent),
        data: { animation: 'estadisticas', roles: ['ADMIN'] }
      },
      {
        path: 'reportes',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/admin/reportes/reportes.component').then(m => m.ReportesComponent),
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'turnos-por-especialidad',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/turnos-por-especialidad/turnos-por-especialidad.component').then(m => m.TurnosPorEspecialidadComponent),
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'turnos-por-medico',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/turnos-por-medico/turnos-por-medico.component').then(m => m.TurnosPorMedicoComponent),
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'turnos-por-dia',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/turnos-por-dia/turnos-por-dia.component').then(m => m.TurnosPorDiaComponent),
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'pacientes-por-especialidad',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/pacientes-por-especialidad/pacientes-por-especialidad.component').then(m => m.PacientesPorEspecialidadComponent),
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'medicos-por-especialidad',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/medicos-por-especialidad/medicos-por-especialidad.component').then(m => m.MedicosPorEspecialidadComponent),
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'resultados-encuestas',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/resultados-encuesta/resultados-encuesta.component').then(m => m.ResultadosEncuestaComponent),
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'informes-generales',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/informes-generales/informes-generales.component').then(m => m.InformesGeneralesComponent),
        data: { roles: ['ADMIN'] }
      },
      // {
      //   path: 'turnos-especialidad',
      //   canActivate: [RoleGuard],
      //   loadComponent: () => import('./components/turnos-especialidad/turnos-especialidad.component').then(m => m.TurnosEspecialidadComponent),
      //   data: { roles: ['ADMIN'] }
      // },
      {
        path: 'turnos-por-paciente',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/turnos-por-paciente/turnos-por-paciente.component').then(m => m.TurnosPorPacienteComponent),
        data: { roles: ['ADMIN'] }
      },

      // --- PERFIL Y OTROS ---
      {
        path: 'perfil-usuario',
        canActivate: [RoleGuard],
        // Accesible para todos los roles logueados
        loadComponent: () => import('./components/admin/perfil-usuario/perfil-usuario.component').then(m => m.PerfilUsuarioComponent),
        data: { roles: ['PACIENTE', 'ESPECIALISTA', 'ADMIN'] }
      },
      {
        path: 'mi-perfil',
        canActivate: [RoleGuard],
        loadComponent: () => import('./components/mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent),
        data: { animation: 'miPerfil', roles: ['PACIENTE', 'ESPECIALISTA', 'ADMIN'] }
      },
      {
        path: 'listar-especialistas',
        canActivate: [RoleGuard],
        // Puede que el paciente quiera ver lista de especialistas o el admin
        loadComponent: () => import('./components/listar-especialistas/listar-especialistas.component').then(m => m.ListarEspecialistasComponent),
        data: { roles: ['PACIENTE', 'ADMIN'] }
      }
    ]
  },

  { path: '**', redirectTo: 'bienvenida' }
];

