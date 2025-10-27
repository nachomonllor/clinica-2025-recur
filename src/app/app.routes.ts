import { Routes } from '@angular/router';
import { RegistroPacienteComponent } from './components/registro-paciente/registro-paciente.component';
import { RegistroEspecialistaComponent } from './registro-especialista/registro-especialista.component';

export const routes: Routes = [
    // { path: '**', component: RegistroPacienteComponent },
    { path: 'registro-paciente', component: RegistroPacienteComponent },

    { path: 'registro-especialista', component: RegistroEspecialistaComponent }
];
