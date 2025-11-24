// src/app/components/main-nav/main-nav.component.ts
import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  signal
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { Session } from '@supabase/supabase-js';

import { SupabaseService } from '../../../services/supabase.service';
import { Rol } from '../../models/tipos.model';
import { NavItem } from '../../models/nav.models';

import { TranslateModule, TranslateService } from '@ngx-translate/core'; // <= IDIOMAS


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
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './main-nav.component.html',
  styleUrls: ['./main-nav.component.scss']
})
export class MainNavComponent implements OnInit, OnDestroy {



  protected readonly idiomas = ['es', 'en', 'pt'] as const;
  protected readonly idiomaActual = signal<string>('es');


  constructor(
    private readonly supabase: SupabaseService,
    private readonly router: Router,
    private readonly translate: TranslateService          // < ============= NUEVO
  ) {
    const saved = localStorage.getItem('lang');
    const inicial =
      saved && this.idiomas.includes(saved as any)
        ? saved
        : (this.translate.currentLang || 'es');

    this.idiomaActual.set(inicial);
    this.translate.use(inicial);
  }

  protected cambiarIdioma(lang: string): void {
    if (!this.idiomas.includes(lang as any)) return;
    this.idiomaActual.set(lang);
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  // --------------------------------------------------------------------------------------

  protected readonly cargando = signal(true);
  protected readonly autenticado = signal(false);
  protected readonly rol = signal<Rol | null>(null);
  protected readonly navItems = signal<NavItem[]>([]);
  protected readonly nombreVisible = signal<string>('');
  protected readonly avatarUrl = signal<string | null>(null);
  protected readonly avatarError = signal(false);

  protected readonly tieneLinkPerfil = computed(() =>
    this.navItems().some(item => item.route === '/perfil-usuario')
  );

  private unsubscribeAuthChange?: () => void;

  // constructor(
  //   private readonly supabase: SupabaseService,
  //   private readonly router: Router
  // ) {}

  async ngOnInit(): Promise<void> {
    await this.actualizarDesdeSesion();

    this.unsubscribeAuthChange = this.supabase.onAuthChange((_, session) => {
      this.actualizarEstado(session).catch(err =>
        console.error('[MainNav] Error al actualizar sesión', err)
      );
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAuthChange?.();
  }

  // ---------- Acciones de la UI ----------

  protected async cerrarSesion(): Promise<void> {
    try {
      await this.supabase.cerrarSesion();
      await this.router.navigate(['/bienvenida']);
    } catch (error) {
      console.error('[MainNav] Error al cerrar sesión', error);
    }
  }

  protected irAMiPerfil(): void {
    this.router.navigate(['/perfil-usuario']);
  }

  protected irAHOME(): void {
    const r = this.rol();
    if (r) {
      this.router.navigate([this.obtenerInicioPorRol(r)]);
    } else {
      this.router.navigate(['/bienvenida']);
    }
  }

  protected onAvatarError(): void {
    this.avatarError.set(true);
  }

  // ---------- Sesión / estado ----------

  private async actualizarDesdeSesion(): Promise<void> {
    try {
      const { data, error } = await this.supabase.getSession();
      if (error) {
        console.error('[MainNav] Error al obtener sesión', error);
        this.cargando.set(false);
        return;
      }
      await this.actualizarEstado(data.session);
    } catch (error) {
      console.error('[MainNav] Error al obtener sesión', error);
      this.cargando.set(false);
    }
  }

  private async actualizarEstado(session: Session | null): Promise<void> {
    this.cargando.set(true);

    if (!session) {
      // Estado “deslogueado”
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
      // lee de esquema_clinica.usuarios
      const { data: usuario, error } =
        await this.supabase.obtenerUsuarioPorId(session.user.id);

      if (error) throw error;
      if (!usuario) throw new Error('No se pudo obtener el usuario actual.');

      const rol = (usuario.perfil as Rol | undefined) ?? null;
      this.rol.set(rol);
      this.navItems.set(this.construirMenu(rol));

      const nombre = `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim();
      this.nombreVisible.set(nombre || session.user.email || 'Mi cuenta');

      const avatarUrl =
        usuario.imagen_perfil_1 &&
          String(usuario.imagen_perfil_1).trim() !== ''
          ? usuario.imagen_perfil_1
          : null;

      this.avatarUrl.set(avatarUrl);
      this.avatarError.set(false);
    } catch (error) {
      console.error('[MainNav] Error al cargar usuario', error);
      this.rol.set(null);
      this.navItems.set([]);
      this.nombreVisible.set(session.user.email ?? 'Mi cuenta');
      this.avatarUrl.set(null);
      this.avatarError.set(false);
    } finally {
      this.cargando.set(false);
    }
  }

  // ---------- Menú por rol ----------

  private construirMenu(rol: Rol | null): NavItem[] {
    switch (rol) {
      case 'PACIENTE':
        return [
          { label: 'Mis turnos', route: '/mis-turnos-paciente', icon: 'event_note' },
          { label: 'Solicitar turno', route: '/solicitar-turno', icon: 'add_circle' },
          { label: 'Mi perfil', route: '/perfil-usuario', icon: 'account_circle' }
        ];

      case 'ESPECIALISTA':
        return [
          { label: 'Mis turnos', route: '/mis-turnos-especialista', icon: 'event_note' },
          { label: 'Pacientes', route: '/pacientes-especialista', icon: 'groups' },
          { label: 'Mi perfil', route: '/perfil-usuario', icon: 'account_circle' }
        ];

      case 'ADMIN':
        return [
          { label: 'Turnos', route: '/turnos-admin', icon: 'calendar_month' },
          { label: 'Usuarios', route: '/usuarios-admin', icon: 'supervisor_account' },
          { label: 'Estadísticas', route: '/seleccion-estadisticas', icon: 'insights' },
          { label: 'Ingresos', route: '/log-ingreso', icon: 'event_note' },
          { label: 'Mi perfil', route: '/perfil-usuario', icon: 'account_circle' }
        ];

      default:
        return [];
    }
  }

  private obtenerInicioPorRol(rol: Rol | null): string {
    switch (rol) {
      case 'PACIENTE':
        return '/mis-turnos-paciente';
      case 'ESPECIALISTA':
        return '/mis-turnos-especialista';
      case 'ADMIN':
        return '/turnos-admin';
      default:
        return '/login';
    }
  }
}



