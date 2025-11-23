// src/app/components/perfil-usuario/perfil-usuario.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  animate, query, stagger, style, transition, trigger
} from '@angular/animations';
import { SupabaseService } from '../../../../services/supabase.service';
import { InicialesPipe } from '../../../../pipes/iniciales.pipe';
import { Rol } from '../../../models/tipos.model';
import { MetaUsuario, UsuarioPerfil, UsuarioRowLite } from '../../../models/usuario.model';

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
      if (!authUser) {
        this.router.navigate(['/bienvenida']);
        return;
      }

      const userId = authUser.id;
      const meta = (authUser.user_metadata || {}) as MetaUsuario;

      // 2) Traer fila de esquema_clinica.usuarios
      const { data: usuarioData, error: usuarioError } = await this.supa.client
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (usuarioError) throw usuarioError;
      if (!usuarioData) {
        this.error = 'No se encontraron datos de usuario en la clínica.';
        return;
      }

      const u = (usuarioData ?? {}) as UsuarioRowLite;

      // 3) Rol (normalizado a Rol = 'PACIENTE' | 'ESPECIALISTA' | 'ADMIN')
      const rolRaw = String(u.perfil ?? meta.rol ?? 'PACIENTE').toUpperCase();
      const rol: Rol =
        rolRaw === 'ESPECIALISTA' ? 'ESPECIALISTA' :
        rolRaw === 'ADMIN' ? 'ADMIN' :
        'PACIENTE';

      // 4) Especialidades: primero desde tablas, luego metadata como fallback
      let especialidades: string[] = [];

      if (rol === 'ESPECIALISTA') {
        const { data: rels, error: relError } = await this.supa.client
          .from('usuario_especialidad')
          .select('especialidad_id')
          .eq('usuario_id', userId);

        if (relError) throw relError;

        const ids = (rels ?? [])
          .map((r: any) => r.especialidad_id as string)
          .filter(Boolean);

        if (ids.length) {
          const { data: espData, error: espError } = await this.supa.client
            .from('especialidades')
            .select('nombre')
            .in('id', ids);

          if (espError) throw espError;

          especialidades = (espData ?? [])
            .map((e: any) => e.nombre as string)
            .filter(Boolean);
        }
      }

      // Fallback a metadata CSV
      if (!especialidades.length && meta.especialidades) {
        especialidades = meta.especialidades
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }

      // 5) Edad: de la tabla, o calculada desde fecha_nacimiento en metadata
      let edad: number | undefined;
      if (typeof u.edad === 'number') {
        edad = u.edad;
      } else if (meta.fecha_nacimiento) {
        edad = this.calcEdadFromISO(meta.fecha_nacimiento);
      }

      // 6) Mapear al modelo de la UI (UsuarioPerfil)
      this.usuario = {
        id: userId,
        nombre:   (u.nombre   ?? meta.nombre)   ?? '',
        apellido: (u.apellido ?? meta.apellido) ?? '',
        rol,
        edad,
        dni:   (u.dni ?? meta.dni) ?? '',
        email: (u.email ?? authUser.email) ?? '',

        telefono:  null,                // esos campos no existen en la tabla nueva
        direccion: null,
        ciudad:    null,
        obraSocial: u.obra_social ?? null,

        especialidades,
        habilitado: u.activo ?? true,

        avatarUrl: u.imagen_perfil_1 ?? null,
        bannerUrl: null,               // no tenemos banner_url en el esquema nuevo

        bio:
          rol === 'ESPECIALISTA'
            ? (especialidades.length
                ? `Especialista en ${especialidades.join(', ')}`
                : 'Especialista de la clínica.')
            : rol === 'ADMIN'
              ? 'Administrador del sistema de la clínica.'
              : 'Paciente de la clínica.',
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

  toggleHabilitado() {
    if (this.usuario) {
      this.usuario.habilitado = !this.usuario.habilitado;
      // Ojo: esto solo cambia el estado en la UI.
      // Si querés persistir, deberías llamar a UsuariosService.setActivo(...)
    }
  }

  enviarMail() {
    if (this.usuario?.email) {
      window.location.href = `mailto:${this.usuario.email}`;
    }
  }

  llamar() {
    if (this.usuario?.telefono) {
      window.location.href = `tel:${this.usuario.telefono}`;
    }
  }

  copiar(texto: string) {
    navigator.clipboard?.writeText(texto);
  }

  descargarHistoria() {
    if (this.usuario) {
      console.log('Descargar historia clínica de', this.usuario.id);
    }
  }

  verTurnos() {
    if (this.usuario) {
      console.log('Ver turnos de', this.usuario.id);
    }
  }
}

