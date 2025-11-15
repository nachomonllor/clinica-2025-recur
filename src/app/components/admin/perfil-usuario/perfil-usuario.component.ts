

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  animate, query, stagger, style, transition, trigger
} from '@angular/animations';

type Rol = 'paciente' | 'especialista' | 'administrador';

interface UsuarioPerfil {
  id: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  edad?: number;
  dni?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  obraSocial?: string;             // pacientes
  especialidades?: string[];       // especialistas
  habilitado: boolean;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
}

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './perfil-usuario.component.html',
  styleUrls: ['./perfil-usuario.component.scss'],
  animations: [
    trigger('pageIn', [
      transition(':enter', [
        query('.hero, .panel', [
          style({ opacity: 0, transform: 'translateY(12px) scale(.98)' }),
          stagger(80, animate('420ms cubic-bezier(.2,.8,.2,1)',
            style({ opacity: 1, transform: 'translateY(0) scale(1)' })))
        ])
      ])
    ])
  ]
})
export class PerfilUsuarioComponent {
  // MOCK: REEMPLAZAR POR LA CARGA REAL VIA RUTA - SERVICIO
  usuario: UsuarioPerfil = {
    id: 'u123',
    nombre: 'Ignacio',
    apellido: 'Monllor',
    rol: 'administrador',
    edad: 68,
    dni: '32345.21',
    email: 'nachomon@yopmail.com',
    telefono: '+54 11 2345-6789',
    direccion: 'Av. Córdoba 1234',
    ciudad: 'CABA',
    obraSocial: 'OSDE',
    especialidades: ['Gestión', 'Sistemas'],
    habilitado: true,
    avatarUrl: 'assets/avatars/nacho.jpg',
    bannerUrl: '', // opcional: URL de banner; si no hay, usamos gradient
    bio: 'Administrador del sistema. Enfocado en garantizar disponibilidad y seguridad.'
  };

  get nombreCompleto() { return `${this.usuario.nombre} ${this.usuario.apellido}`; }

  toggleHabilitado() { this.usuario.habilitado = !this.usuario.habilitado; }

  enviarMail() { window.location.href = `mailto:${this.usuario.email}`; }
  llamar() { if (this.usuario.telefono) window.location.href = `tel:${this.usuario.telefono}`; }

  copiar(texto: string) {
    navigator.clipboard?.writeText(texto);
  }

  descargarHistoria() { console.log('Descargar historia clínica de', this.usuario.id); }
  verTurnos() { console.log('Ver turnos de', this.usuario.id); }
}
