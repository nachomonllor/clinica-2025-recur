import { Routes } from '@angular/router';
<<<<<<< HEAD

import { BienvenidaComponent } from './components/bienvenida/bienvenida.component';
import { LoginComponent } from './components/login/login.component';

import { LogTableComponent } from './components/log-table/log-table.component';
import { EstadisticasComponent } from './components/estadisticas/estadisticas.component';
import { HistoriaClinicaComponent } from './components/historia-clinica/historia-clinica.component';

import { SeleccionarUsuarioLoginComponent } from './components/seleccionar-usuario-login/seleccionar-usuario-login.component';
import { SeleccionarUsuarioRegistroComponent } from './components/seleccionar-usuario-registro/seleccionar-usuario-registro.component';
import { TurnosEspecialidadComponent } from './components/turnos-especialidad/turnos-especialidad.component';
import { PacienteHomeComponent } from './components/paciente/paciente-home/paciente-home.component';
import { RegistroPacienteComponent } from './components/paciente/registro-paciente/registro-paciente.component';

import { EspecialistaHomeComponent } from './components/especialista/especialista-home/especialista-home.component';
import { RegistroEspecialistaComponent } from './components/auth/registro-especialista/registro-especialista.component';
import { AdminHomeComponent } from './components/admin/admin-home/admin-home.component';

export const routes: Routes = [
  // Raíz
  { path: '', pathMatch: 'full', redirectTo: 'bienvenida' },

  // Públicas
  { path: 'bienvenida', component: BienvenidaComponent },
  { path: 'login', component: LoginComponent },

  // Registro (si ya tenés componentes separados, mantenelos)
  { path: 'registro-paciente', component: RegistroPacienteComponent },
  { path: 'registro-especialista', component: RegistroEspecialistaComponent },
  { path: 'seleccionar-usuario-login', component: SeleccionarUsuarioLoginComponent },
  { path: 'seleccionar-usuario-registro', component: SeleccionarUsuarioRegistroComponent },

  // Auth (públicas)
  {
    path: 'auth',
    children: [
      {
        path: 'registro-especialista',
        loadComponent: () =>
          import('./components/auth/registro-especialista/registro-especialista.component')
            .then(m => m.RegistroEspecialistaComponent)
      },
      // Alias temporal: si alguien entra a /auth/listar-especialistas, lo enviamos al área protegida de Admin
      { path: 'listar-especialistas', redirectTo: '/admin/especialistas', pathMatch: 'full' },
    ]
=======
import { adminGuard } from '../services/admin.guard';
import { BienvenidaComponent } from './components/bienvenida/bienvenida.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { PerfilUsuarioComponent } from './components/admin/perfil-usuario/perfil-usuario.component';
import { ReportesComponent } from './components/admin/reportes/reportes.component';
import { SeleccionEstadisticasComponent } from './components/seleccion-estadisticas/seleccion-estadisticas.component';
import { TurnosPorEspecialidadComponent } from './components/turnos-por-especialidad/turnos-por-especialidad.component';

export const routes: Routes = [
  // Home (redirige a bienvenida)
  { path: '', pathMatch: 'full', redirectTo: 'bienvenida' },
  { path: 'bienvenida', component: BienvenidaComponent, data: { animation: 'bienvenida' } },

    {path: 'seleccion-estadisticas', component: SeleccionEstadisticasComponent },

  {path: 'usuarios', component: UsuariosComponent},

  {path: 'turnos-por-especialidad', component: TurnosPorEspecialidadComponent},
  
  {path: 'perfil-usuario', component: PerfilUsuarioComponent},

  {path: 'reportes', component: ReportesComponent},



  // Auth / público
  { path: 'login-paciente',
    loadComponent: () => import('./components/login/login.component')
      .then(m => m.LoginComponent),
    data: { animation: 'login' } 
>>>>>>> 1-6-mas-estilos
  },

  // PACIENTE
  {
    path: 'paciente',
    children: [
      { path: '', component: PacienteHomeComponent },
      {
        path: 'turnos',
        data: { backTo: ['/paciente'] },
        loadComponent: () => import('./components/paciente/mis-turnos-paciente/mis-turnos-paciente.component')
          .then(m => m.MisTurnosPacienteComponent)
      },
      {
        path: 'turno/:id',
        data: { backTo: ['/paciente/turnos'] }, // ← detalle de turno vuelve a lista
        loadComponent: () => import('./components/paciente/turno-detalle/turno-detalle.component')
          .then(m => m.TurnoDetalleComponent)
      },
      { path: 'historia-clinica', component: HistoriaClinicaComponent, data: { backTo: ['/paciente'] } },
      {
        path: 'encuestas',
        data: { backTo: ['/paciente'] },
        loadComponent: () => import('./components/paciente/encuesta-atencion/encuesta-atencion.component')
          .then(m => m.EncuestaAtencionComponent)
      },
      {
        path: 'estudios',
        data: { backTo: ['/paciente'] },
        loadComponent: () => import('./components/paciente/estudios/estudios.component')
          .then(m => m.EstudiosComponent)
      },
      {
        path: 'estudios/subir',
        data: { backTo: ['/paciente/estudios'] }, // ← vuelve a la lista de estudios
        loadComponent: () => import('./components/paciente/estudios-subir/estudios-subir.component')
          .then(m => m.EstudiosSubirComponent)
      },
    ]
  },

  // ESPECIALISTA
  {
    path: 'especialista',
    children: [
      { path: '', component: EspecialistaHomeComponent },
      { path: 'agenda', data: { backTo: ['/especialista'] }, loadComponent: () => import('./components/especialista/agenda/agenda.component').then(m => m.AgendaComponent) },
      { path: 'turnos', data: { backTo: ['/especialista'] }, loadComponent: () => import('./components/especialista/mis-turnos-especialista/mis-turnos-especialista.component').then(m => m.MisTurnosEspecialistaComponent) },
      { path: 'pacientes', data: { backTo: ['/especialista'] }, loadComponent: () => import('./components/especialista/pacientes/pacientes.component').then(m => m.PacientesComponent) },
      {
        path: 'paciente/:id',
        data: { backTo: ['/especialista/pacientes'] }, // ← detalle vuelve a lista
        loadComponent: () => import('./components/especialista/paciente-detalle/paciente-detalle.component').then(m => m.PacienteDetalleComponent)
      },
      {
        path: 'turno/:id',
        data: { backTo: ['/especialista/turnos'] }, // ← detalle vuelve a lista
        loadComponent: () => import('./components/especialista/turno-detalle-esp/turno-detalle-esp.component').then(m => m.TurnoDetalleEspComponent)
      },
      { path: 'resenias', data: { backTo: ['/especialista'] }, loadComponent: () => import('./components/especialista/resenias/resenias.component').then(m => m.ReseniasComponent) },
      {
        path: 'resenia/:id',
        data: { backTo: ['/especialista/resenias'] }, // ← detalle vuelve a lista
        loadComponent: () => import('./components/especialista/resenia/resenia.component').then(m => m.ReseniaComponent)
      },
    ]
  },

  // ADMIN (todas vuelven al home de Admin, no hay :id)
  {
    path: 'admin',
    children: [
      { path: '', component: AdminHomeComponent },
      { path: 'usuarios', data: { backTo: ['/admin'] }, loadComponent: () => import('./components/admin/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
      { path: 'turnos', data: { backTo: ['/admin'] }, loadComponent: () => import('./components/admin/turnos-admin/turnos-admin.component').then(m => m.TurnosAdminComponent) },
      { path: 'reportes', data: { backTo: ['/admin'] }, loadComponent: () => import('./components/admin/reportes/reportes.component').then(m => m.ReportesComponent) },
      { path: 'estadisticas', data: { backTo: ['/admin'] }, component: EstadisticasComponent },
      { path: 'logs', data: { backTo: ['/admin'] }, component: LogTableComponent },
    ]
  },

<<<<<<< HEAD

  // Aliases y redirects para no romper enlaces existentes ( TODO : limpiarlos)
  { path: 'mis-turnos-paciente', redirectTo: 'paciente/turnos', pathMatch: 'full' },
  { path: 'mis-turnos-especialista', redirectTo: 'especialista/turnos', pathMatch: 'full' },
  { path: 'resenia-especialista', redirectTo: 'especialista/resenias', pathMatch: 'full' },
  { path: 'listar-especialistas', redirectTo: 'admin/usuarios', pathMatch: 'full' },
  { path: 'listar-pacientes', redirectTo: 'admin/usuarios', pathMatch: 'full' },
=======
  { path: 'estadisticas',
    loadComponent: () => import('./components/estadisticas/estadisticas.component')
      .then(m => m.EstadisticasComponent),
    data: { animation: 'estadisticas' } },
>>>>>>> 1-6-mas-estilos

  // Pantallas públicas extra (si aplica)
  { path: 'turnos-especialidad', component: TurnosEspecialidadComponent },

  // Wildcard
  { path: '**', redirectTo: 'bienvenida' }

<<<<<<< HEAD
=======
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
    loadComponent: () => import('./components/admin/turnos-admin/turnos-admin.component')
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
    loadComponent: () => import('./components/admin/usuarios-admin/usuarios-admin.component')
      .then(m => m.UsuariosAdminComponent),
    canActivate: [adminGuard] },
   // './log-ingresos-admin/log-ingresos-admin.component'

   { path: 'log-ingreso', 
       loadComponent: () => import( './components/log-ingresos-admin/log-ingresos-admin.component')  
       .then( m => m.LogIngresosAdminComponent) },  
    

  

  { path: '**', redirectTo: 'bienvenida' },

  
  
>>>>>>> 1-6-mas-estilos
];





