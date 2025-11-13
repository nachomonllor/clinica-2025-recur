
import { Component, OnInit, OnDestroy, signal, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

// Animaciones
import { trigger, transition, style, animate } from '@angular/animations';

import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatButtonModule, MatIconModule, 
    MatCardModule, MatTooltipModule,
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
export class BienvenidaComponent implements OnInit, OnDestroy, AfterViewInit {
  protected readonly autenticado = signal(false);
  private unsubscribeAuthChange?: () => void;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private route: ActivatedRoute,
    private el: ElementRef
  ) {}

  ngAfterViewInit(): void {
    // Aplicar la imagen de fondo directamente al elemento hero
    // Usamos setTimeout para asegurarnos de que el DOM esté completamente renderizado
    setTimeout(() => {
      const heroElement = this.el.nativeElement.querySelector('.hero') as HTMLElement;
      if (heroElement) {
        // Aplicar el fondo directamente al elemento hero (no al ::before)
        heroElement.style.backgroundImage = `linear-gradient(180deg, rgba(7,26,40,.05), rgba(7,26,40,.15)), url('/assets/medical.jpg')`;
        heroElement.style.backgroundPosition = 'center';
        heroElement.style.backgroundSize = 'cover';
        heroElement.style.backgroundRepeat = 'no-repeat';
        heroElement.style.backgroundAttachment = 'fixed';
        
        // También aplicar al ::before para asegurar que funcione
        const styleId = 'bienvenida-bg-style';
        let existingStyle = document.getElementById(styleId);
        if (existingStyle) {
          existingStyle.remove();
        }
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .hero::before {
            background-image: url('/assets/medical.jpg'), linear-gradient(180deg, rgba(7,26,40,.05), rgba(7,26,40,.15)) !important;
            background-position: center !important;
            background-size: cover !important;
            background-repeat: no-repeat !important;
            background-attachment: fixed !important;
          }
        `;
        document.head.appendChild(style);
      }
    }, 100);
  }

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
      const { data: perfil } = await this.supabase.obtenerPerfil(userId);
      const rol = perfil?.rol;
      
      if (rol === 'paciente') {
        this.router.navigate(['/mis-turnos-paciente']);
      } else if (rol === 'especialista') {
        this.router.navigate(['/mis-turnos-especialista']);
      } else if (rol === 'admin') {
        this.router.navigate(['/turnos-admin']);
      }
    } catch (error) {
      console.error('[Bienvenida] Error al obtener perfil para redirección:', error);
    }
  }
}



// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-bienvenida',
//   standalone: true,
//   imports: [],
//   templateUrl: './bienvenida.component.html',
//   styleUrl: './bienvenida.component.scss'
// })
// export class BienvenidaComponent {

// }

// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// // Angular Material
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatCardModule } from '@angular/material/card';

// @Component({
//   selector: 'app-bienvenida',
//   standalone: true,
//   imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatCardModule],
//   templateUrl: './bienvenida.component.html',
//   styleUrls: ['./bienvenida.component.scss']
// })
// export class BienvenidaComponent {}
