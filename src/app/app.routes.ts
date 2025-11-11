import { Routes } from '@angular/router';

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
  },

  // Paciente (privadas)
  {
    path: 'paciente',
    // canMatch: [authGuard('paciente'), emailVerificadoGuard],
    children: [
      { path: '', component: PacienteHomeComponent },
      {
        path: 'turnos',
        loadComponent: () =>
          import('./components/paciente/mis-turnos-paciente/mis-turnos-paciente.component')
            .then(m => m.MisTurnosPacienteComponent)  // ✔ FIX
      },
      {
        path: 'turno/:id',
        loadComponent: () =>
          import('./components/paciente/turno-detalle/turno-detalle.component')
            .then(m => m.TurnoDetalleComponent)
      },
      { path: 'historia-clinica', component: HistoriaClinicaComponent },
      {
        path: 'encuestas',
        loadComponent: () =>
          import('./components/paciente/encuesta-atencion/encuesta-atencion.component')
            .then(m => m.EncuestaAtencionComponent)
      },
      {
        path: 'estudios',
        loadComponent: () =>
          import('./components/paciente/estudios/estudios.component')
            .then(m => m.EstudiosComponent)
      },
      {
        path: 'estudios/subir',
        loadComponent: () =>
          import('./components/paciente/estudios-subir/estudios-subir.component')
            .then(m => m.EstudiosSubirComponent)
      },
    ]
  },

  // Especialista (privadas)
  {
    path: 'especialista',
    // canMatch: [authGuard('especialista'), emailVerificadoGuard, especialistaAprobadoGuard],
    children: [
      { path: '', component: EspecialistaHomeComponent },
      {
        path: 'agenda',
        loadComponent: () =>
          import('./components/especialista/agenda/agenda.component')
            .then(m => m.AgendaComponent)
      },
      {
        path: 'turnos',
        loadComponent: () =>
          import('./components/especialista/mis-turnos-especialista/mis-turnos-especialista.component')
            .then(m => m.MisTurnosEspecialistaComponent)
      },
      {
        path: 'pacientes',
        loadComponent: () =>
          import('./components/especialista/pacientes/pacientes.component')
            .then(m => m.PacientesComponent)
      },
      {
        path: 'paciente/:id',
        loadComponent: () =>
          import('./components/especialista/paciente-detalle/paciente-detalle.component')
            .then(m => m.PacienteDetalleComponent)
      },
      {
        path: 'turno/:id',
        loadComponent: () =>
          import('./components/especialista/turno-detalle-esp/turno-detalle-esp.component')
            .then(m => m.TurnoDetalleEspComponent)
      },
      {
        path: 'resenias',
        loadComponent: () =>
          import('./components/especialista/resenias/resenias.component')
            .then(m => m.ReseniasComponent)
      },
      {
        path: 'resenia/:id',
        loadComponent: () =>
          import('./components/especialista/resenia/resenia.component')
            .then(m => m.ReseniaComponent)
      },

    ]
  },

  // Admin (privadas)
  {
    path: 'admin',
    // canMatch: [authGuard('admin')],
    children: [
      { path: '', component: AdminHomeComponent },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./components/admin/usuarios/usuarios.component')
            .then(m => m.UsuariosComponent),
      },
      {
        path: 'turnos',
        loadComponent: () =>
          import('./components/admin/turnos-admin/turnos-admin.component')
            .then(m => m.TurnosAdminComponent),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./components/admin/reportes/reportes.component')
            .then(m => m.ReportesComponent),
      },
      { path: 'estadisticas', component: EstadisticasComponent },
      { path: 'logs', component: LogTableComponent },
    ],
  },


  // Aliases y redirects para no romper enlaces existentes ( TODO : limpiarlos)
  { path: 'mis-turnos-paciente', redirectTo: 'paciente/turnos', pathMatch: 'full' },
  { path: 'mis-turnos-especialista', redirectTo: 'especialista/turnos', pathMatch: 'full' },
  { path: 'resenia-especialista', redirectTo: 'especialista/resenias', pathMatch: 'full' },
  { path: 'listar-especialistas', redirectTo: 'admin/usuarios', pathMatch: 'full' },
  { path: 'listar-pacientes', redirectTo: 'admin/usuarios', pathMatch: 'full' },

  // Pantallas públicas extra (si aplica)
  { path: 'turnos-especialidad', component: TurnosEspecialidadComponent },

  // Wildcard
  { path: '**', redirectTo: 'bienvenida' }

];



