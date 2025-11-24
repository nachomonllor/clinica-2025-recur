
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterLink } from '@angular/router';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

// Animaciones
import { trigger, transition, style, animate } from '@angular/animations';
import { SupabaseService } from '../../../services/supabase.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    RouterLink,
    MatButtonModule, MatIconModule,
    MatCardModule, MatTooltipModule,
    TranslateModule      
  ],
  templateUrl: './bienvenida.component.html',
  styleUrls: ['./bienvenida.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('450ms ease-out', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class BienvenidaComponent implements OnInit, OnDestroy {
  
    protected readonly autenticado = signal(false);
  private unsubscribeAuthChange?: () => void;
 
  protected readonly idiomas = ['es', 'en', 'pt'] as const;
  protected readonly idiomaActual = signal<string>('es');

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private translate: TranslateService    //  <= ========== NUEVO
  ) {
    const saved = localStorage.getItem('lang');
    const inicial =
      saved && this.idiomas.includes(saved as any)
        ? saved
        : (this.translate.currentLang || 'es');

    this.idiomaActual.set(inicial);
    this.translate.use(inicial);
  }

  // 👇 NUEVO
  protected cambiarIdioma(lang: string): void {
    if (!this.idiomas.includes(lang as any)) return;
    this.idiomaActual.set(lang);
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }





  //---------------------------


  //  constructor(
  //   private supabase: SupabaseService,
  //   private router: Router,
  // ) { } 

  async ngOnInit(): Promise<void> {
    // Verificar si hay tokens de verificación en la URL (viene del email)
    const tieneTokensEnUrl = this.tieneTokensDeVerificacion();

    // Si hay tokens, esperar un poco más para que Supabase los procese
    if (tieneTokensEnUrl) {
      // Esperar un poco para que Supabase procese los tokens de la URL
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Verificar sesión inicial
    await this.verificarSesion();

    // Suscribirse a cambios de autenticación
    this.unsubscribeAuthChange = this.supabase.onAuthChange(async (event, session) => {
      const tieneSesion = !!session;
      this.autenticado.set(tieneSesion);

      // Si se detecta una nueva sesión (por ejemplo, después de verificar email)
      if (tieneSesion && event === 'SIGNED_IN') {
        // Limpiar parámetros de la URL si venían del email
        if (this.tieneTokensDeVerificacion()) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        await this.redirigirSegunRol(session.user.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAuthChange?.();
  }

  private tieneTokensDeVerificacion(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('token') || urlParams.has('type') || urlParams.has('access_token');
  }

  private async verificarSesion(): Promise<void> {
    try {
      // Intentar múltiples veces si hay tokens en la URL (Supabase puede tardar en procesarlos)
      const tieneTokens = this.tieneTokensDeVerificacion();
      let intentos = tieneTokens ? 3 : 1;
      let tieneSesion = false;
      let sessionData = null;

      for (let i = 0; i < intentos; i++) {
        const { data } = await this.supabase.getSession();
        tieneSesion = !!data.session;
        sessionData = data;

        if (tieneSesion) break;

        // Si hay tokens pero aún no hay sesión, esperar un poco más
        if (tieneTokens && i < intentos - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      this.autenticado.set(tieneSesion);

      // Si está autenticado, redirigir a su página de inicio
      if (tieneSesion && sessionData?.session) {
        // Limpiar parámetros de la URL si venían del email
        if (tieneTokens) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        await this.redirigirSegunRol(sessionData.session.user.id);
      }
    } catch (error) {
      console.error('[Bienvenida] Error al verificar sesión:', error);
      this.autenticado.set(false);
    }
  }

  private async redirigirSegunRol(userId: string): Promise<void> {
    try {
      // -------------------------- Nuevo método del SupabaseService --------------------------
      const { data: usuario, error } = await this.supabase.obtenerUsuarioPorId(userId);

      if (error) throw error;
      if (!usuario) throw new Error('Usuario no encontrado');

      const rol = usuario.perfil; // 'PACIENTE' | 'ESPECIALISTA' | 'ADMIN'

      switch (rol) {
        case 'PACIENTE':
          await this.router.navigate(['/mis-turnos-paciente']);
          break;

        case 'ESPECIALISTA':
          await this.router.navigate(['/mis-turnos-especialista']);
          break;

        case 'ADMIN':
          await this.router.navigate(['/turnos-admin']);
          break;

        default:
          // fallback defensivo
          await this.router.navigate(['/login']);
          break;
      }

    } catch (error) {
      console.error('[Bienvenida] Error al obtener usuario para redirección:', error);
      // si algo falla, lo mando a bienvenida para no dejarlo colgado
      await this.router.navigate(['/bienvenida']);
    }
  }


}


