
// src/app/components/perfil-usuario/perfil-usuario.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  animate, query, stagger, style, transition, trigger
} from '@angular/animations';
import { SupabaseService } from '../../../../services/supabase.service';
import { UsuarioPerfil } from '../../../../models/usuario.model';
import { InicialesPipe } from '../../../../pipes/iniciales.pipe';

// --- Tipado del metadata que guardaste en auth.user_metadata
type MetaUsuario = {
  rol?: 'paciente' | 'especialista' | 'admin' | string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  fecha_nacimiento?: string;
  especialidad?: string;
  especialidades?: string; // CSV
};

// --- Filas "livianas" para no depender de que existan todas las columnas
type PerfilRowLite = Partial<{
  nombre: string; apellido: string; rol: string; dni: string; email: string;
  telefono: string; direccion: string; ciudad: string; obra_social: string;
  aprobado: boolean; avatar_url: string | null; banner_url: string | null; bio: string;
  fecha_nacimiento: string;
}>;

type EspecialistaRowLite = Partial<{
  nombre: string; apellido: string; edad: number; dni: string; email: string;
  fecha_nacimiento: string; especialidad: string;
}>;

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule, InicialesPipe],
  templateUrl: './perfil-usuario.component.html',
  styleUrls: ['./perfil-usuario.component.scss'],
  animations: [
    trigger('pageIn', [
      transition(':enter', [
        query('.hero, .panel', [
          style({ opacity: 0, transform: 'translateY(12px) scale(.98)' }),
          stagger(80, animate('420ms cubic-bezier(.2,.8,.2,1)',
            style({ opacity: 1, transform: 'translateY(0) scale(1)' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class PerfilUsuarioComponent implements OnInit {

  usuario: UsuarioPerfil | null = null;
  cargando = true;
  error?: string;

  constructor(
    private supa: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // 1) Usuario autenticado
      const { data: userRes, error: authErr } = await this.supa.client.auth.getUser();
      if (authErr) throw authErr;

      const authUser = userRes.user;
      if (!authUser) { this.router.navigate(['/bienvenida']); return; }

      const userId = authUser.id;
      const meta = (authUser.user_metadata || {}) as MetaUsuario;

      // 2) Traer perfil
      const { data: perfilData, error: perfilError } = await this.supa.client
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (perfilError) throw perfilError;
      const p = (perfilData ?? {}) as PerfilRowLite;

      // 3) Si es especialista, traer fila extra
      let e: EspecialistaRowLite | null = null;
      if ((p.rol ?? meta.rol) === 'especialista') {
        const { data: espData } = await this.supa.client
          .from('especialistas')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        e = (espData ?? {}) as EspecialistaRowLite;
      }

      // 4) Especialidades: metadata CSV → lista; si no, uso la principal de especialistas
      const metaEspecialidades = meta.especialidades ?? '';
      let especialidades = metaEspecialidades.split(',').map(s => s.trim()).filter(Boolean);
      if (especialidades.length === 0 && e?.especialidad) {
        especialidades = [e.especialidad];
      }

      // 5) Edad: calculada desde fecha_nacimiento o número en especialistas
      const fechaNac: string | undefined =
        p.fecha_nacimiento ?? e?.fecha_nacimiento ?? meta.fecha_nacimiento ?? undefined;

      const edad =
        fechaNac ? this.calcEdadFromISO(fechaNac)
                 : (typeof e?.edad === 'number' ? e.edad : undefined);

      // 6) Mapear al modelo de la UI (UsuarioPerfil)
      this.usuario = {
        id: userId,
        nombre:   (p.nombre   ?? e?.nombre   ?? meta.nombre)   ?? '',
        apellido: (p.apellido ?? e?.apellido ?? meta.apellido) ?? '',
        rol:      (p.rol ?? meta.rol) ?? 'paciente',
        edad,
        dni:      (p.dni ?? e?.dni ?? meta.dni) ?? '',
        email:    (p.email ?? authUser.email) ?? '',

        telefono:   p.telefono ?? null,
        direccion:  p.direccion ?? null,
        ciudad:     p.ciudad ?? null,
        obraSocial: p.obra_social ?? null,

        especialidades,
        habilitado: (p.aprobado ?? true),

        avatarUrl:  p.avatar_url ?? null,
        bannerUrl:  p.banner_url ?? '',
        bio:
          p.bio ??
          ((p.rol ?? meta.rol) === 'especialista'
            ? `Especialista en ${especialidades.join(', ')}`
            : 'Paciente de la clínica.')
      };

    } catch (err: any) {
      console.error('[PerfilUsuario] Error cargando perfil:', err);
      this.error = err?.message || 'Error al cargar el perfil.';
    } finally {
      this.cargando = false;
    }
  }

  private calcEdadFromISO(iso: string): number {
    const [y, m, d] = iso.split('-').map(Number);
    const today = new Date();
    let edad = today.getFullYear() - y;
    const month = today.getMonth() + 1;
    const day = today.getDate();
    if (month < m || (month === m && day < d)) edad--;
    return edad;
  }

  get nombreCompleto(): string {
    return this.usuario ? `${this.usuario.nombre} ${this.usuario.apellido}` : '';
  }

  toggleHabilitado() { if (this.usuario) this.usuario.habilitado = !this.usuario.habilitado; }
  enviarMail() { if (this.usuario?.email) window.location.href = `mailto:${this.usuario.email}`; }
  llamar() { if (this.usuario?.telefono) window.location.href = `tel:${this.usuario.telefono}`; }
  copiar(texto: string) { navigator.clipboard?.writeText(texto); }
  descargarHistoria() { if (this.usuario) console.log('Descargar historia clínica de', this.usuario.id); }
  verTurnos() { if (this.usuario) console.log('Ver turnos de', this.usuario.id); }
}







// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import {
//   animate, query, stagger, style, transition, trigger
// } from '@angular/animations';
// import { UsuarioPerfil } from '../../../../models/usuario.model';


// @Component({
//   selector: 'app-perfil-usuario',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './perfil-usuario.component.html',
//   styleUrls: ['./perfil-usuario.component.scss'],
//   animations: [
//     trigger('pageIn', [
//       transition(':enter', [
//         query('.hero, .panel', [
//           style({ opacity: 0, transform: 'translateY(12px) scale(.98)' }),
//           stagger(80, animate('420ms cubic-bezier(.2,.8,.2,1)',
//             style({ opacity: 1, transform: 'translateY(0) scale(1)' })))
//         ])
//       ])
//     ])
//   ]
// })
// export class PerfilUsuarioComponent {
//   // MOCK: REEMPLAZAR POR LA CARGA REAL VIA RUTA - SERVICIO
//   usuario: UsuarioPerfil = {
//     id: 'u123',
//     nombre: 'Ignacio',
//     apellido: 'Monllor',
//     rol: 'admin',
//     edad: 68,
//     dni: '32345.21',
//     email: 'nachomon@yopmail.com',
//     telefono: '+54 11 2345-6789',
//     direccion: 'Av. Córdoba 1234',
//     ciudad: 'CABA',
//     obraSocial: 'OSDE',
//     especialidades: ['Gestión', 'Sistemas'],
//     habilitado: true,
//     avatarUrl: 'assets/avatars/nacho.jpg',
//     bannerUrl: '', // opcional: URL de banner; si no hay, usamos gradient
//     bio: 'Administrador del sistema. Enfocado en garantizar disponibilidad y seguridad.'
//   };

//   get nombreCompleto() { return `${this.usuario.nombre} ${this.usuario.apellido}`; }

//   toggleHabilitado() { this.usuario.habilitado = !this.usuario.habilitado; }

//   enviarMail() { window.location.href = `mailto:${this.usuario.email}`; }
//   llamar() { if (this.usuario.telefono) window.location.href = `tel:${this.usuario.telefono}`; }

//   copiar(texto: string) {
//     navigator.clipboard?.writeText(texto);
//   }

//   descargarHistoria() { console.log('Descargar historia clínica de', this.usuario.id); }
//   verTurnos() { console.log('Ver turnos de', this.usuario.id); }
// }
