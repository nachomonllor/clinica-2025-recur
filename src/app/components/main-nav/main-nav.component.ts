import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { Session } from '@supabase/supabase-js';
import { SupabaseService } from '../../../services/supabase.service';

type Rol = 'paciente' | 'especialista' | 'admin';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-main-nav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './main-nav.component.html',
  styleUrls: ['./main-nav.component.scss']
})
export class MainNavComponent implements OnInit, OnDestroy {
  protected readonly cargando = signal(true);
  protected readonly autenticado = signal(false);
  protected readonly rol = signal<Rol | null>(null);
  protected readonly navItems = signal<NavItem[]>([]);
  protected readonly nombreVisible = signal<string>('');
  protected readonly avatarUrl = signal<string | null>(null);
  protected readonly avatarError = signal(false);

  protected readonly tieneLinkPerfil = computed(() =>
    this.navItems().some(item => item.route === '/mi-perfil')
  );

  private unsubscribeAuthChange?: () => void;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.actualizarDesdeSesion();
    this.unsubscribeAuthChange = this.supabase.onAuthChange((_, session) => {
      this.actualizarEstado(session).catch((err) =>
        console.error('[MainNav] Error al actualizar sesión', err)
      );
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAuthChange?.();
  }

  protected async cerrarSesion(): Promise<void> {
    try {
      await this.supabase.cerrarSesion();
      this.router.navigate(['/bienvenida']);
    } catch (error) {
      console.error('[MainNav] Error al cerrar sesión', error);
    }
  }

  protected irAMiPerfil(): void {
    this.router.navigate(['/mi-perfil']);
  }

  protected irAHOME(): void {
    if (this.rol()) {
      const destino = this.obtenerInicioPorRol(this.rol());
      this.router.navigate([destino]);
    } else {
      this.router.navigate(['/bienvenida']);
    }
  }

  protected onAvatarError(): void {
    this.avatarError.set(true);
  }

  private async actualizarDesdeSesion(): Promise<void> {
    try {
      const { data } = await this.supabase.getSession();
      await this.actualizarEstado(data.session);
    } catch (error) {
      console.error('[MainNav] Error al obtener sesión', error);
      this.cargando.set(false);
    }
  }

  private async actualizarEstado(session: Session | null): Promise<void> {
    this.cargando.set(true);
    if (!session) {
      this.autenticado.set(false);
      this.rol.set(null);
      this.navItems.set([]);
      this.nombreVisible.set('');
      this.avatarUrl.set(null);
      this.avatarError.set(false);
      this.cargando.set(false);
      return;
    }

    this.autenticado.set(true);

    try {
      const { data: perfil } = await this.supabase.obtenerPerfil(session.user.id);
      const rol = (perfil?.rol as Rol | undefined) ?? null;
      this.rol.set(rol);
      this.navItems.set(this.construirMenu(rol));
      const nombre = `${perfil?.nombre ?? ''} ${perfil?.apellido ?? ''}`.trim();
      this.nombreVisible.set(nombre || session.user.email || 'Mi cuenta');
      // Obtener la URL del avatar si está disponible
      const avatarUrl = perfil?.avatar_url && String(perfil.avatar_url).trim() !== '' 
        ? perfil.avatar_url 
        : null;
      this.avatarUrl.set(avatarUrl);
      this.avatarError.set(false);
    } catch (error) {
      console.error('[MainNav] Error al cargar perfil', error);
      this.rol.set(null);
      this.navItems.set([]);
      this.nombreVisible.set(session.user.email ?? 'Mi cuenta');
      this.avatarUrl.set(null);
      this.avatarError.set(false);
    } finally {
      this.cargando.set(false);
    }
  }

  private construirMenu(rol: Rol | null): NavItem[] {
    switch (rol) {
      case 'paciente':
        return [
          { label: 'Mis turnos', route: '/mis-turnos-paciente', icon: 'event_note' },
          { label: 'Solicitar turno', route: '/solicitar-turno', icon: 'add_circle' },
          { label: 'Mi perfil', route: '/mi-perfil', icon: 'account_circle' }
        ];
      case 'especialista':
        return [
          { label: 'Mis turnos', route: '/mis-turnos-especialista', icon: 'event_note' },
          { label: 'Pacientes', route: '/pacientes-especialista', icon: 'groups' },
          { label: 'Mi perfil', route: '/mi-perfil', icon: 'account_circle' }
        ];
      case 'admin':
        return [
          { label: 'Turnos', route: '/turnos-admin', icon: 'calendar_month' },
          { label: 'Usuarios', route: '/usuarios-admin', icon: 'supervisor_account' },
          { label: 'Solicitar turno', route: '/solicitar-turno', icon: 'add_circle' },
          { label: 'Estadísticas', route: '/estadisticas', icon: 'insights' },
          { label: 'Mi perfil', route: '/mi-perfil', icon: 'account_circle' }
        ];
      default:
        return [];
    }
  }

  private obtenerInicioPorRol(rol: Rol | null): string {
    switch (rol) {
      case 'paciente':
        return '/mis-turnos-paciente';
      case 'especialista':
        return '/mis-turnos-especialista';
      case 'admin':
        return '/turnos-admin';
      default:
        return '/bienvenida';
    }
  }
}

