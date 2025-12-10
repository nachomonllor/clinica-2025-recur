import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs'; // <--- Importante
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SupabaseService } from '../../../../services/supabase.service';
import { InicialesPipe } from '../../../../pipes/iniciales.pipe';
import { Rol } from '../../../models/tipos.model';
import { UsuarioPerfil } from '../../../models/usuario.model';

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule, InicialesPipe, TranslateModule],
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
export class PerfilUsuarioComponent implements OnInit, OnDestroy {

  usuario: UsuarioPerfil | null = null;
  cargando = true;
  error?: string;
  esAdmin = false;
  
  private sub: Subscription | null = null;

  constructor(
    private supa: SupabaseService,
    private router: Router,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    // NUEVA LÓGICA REACTIVA: Escuchamos al servicio
    this.sub = this.supa.usuario$.subscribe(async (dbUser) => {
      
      if (dbUser) {
        // Si llegó el usuario, procesamos la info extra (especialidades, etc)
        try {
          this.cargando = true;
          await this.cargarDatosCompletos(dbUser);
        } catch (err: any) {
          console.error('[PerfilUsuario] Error procesando perfil:', err);
          this.error = this.translate.instant('PROFILE.ERROR_GENERIC');
        } finally {
          this.cargando = false;
        }
      } else {
        // Si es null, puede que esté cargando todavía o no haya sesión.
        // (El Guard se encarga de redirigir si no hay sesión, así que esperamos)
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // Logica auxiliar para traer especialidades y armar el objeto para la vista
  // data Mapping ===> transformamos la data cruda de la BD a un objeto de vista limpio
  private async cargarDatosCompletos(u: any): Promise<void> {
    const rolRaw = String(u.perfil || 'PACIENTE').toUpperCase();
    const rol: Rol = rolRaw === 'ESPECIALISTA' ? 'ESPECIALISTA' : 
                     rolRaw === 'ADMIN' ? 'ADMIN' : 'PACIENTE';

    this.esAdmin = rol === 'ADMIN';

    //  Cargar Especialidades (Solo si es especialista)
    let especialidades: string[] = [];
    
    if (rol === 'ESPECIALISTA') {
      const { data: rels, error: relError } = await this.supa.client
        .from('usuario_especialidad')
        .select('especialidad_id, especialidades(nombre)')
        .eq('usuario_id', u.id);

      if (!relError && rels) {
        especialidades = rels
          .map((r: any) => r.especialidades?.nombre)
          .filter(Boolean);
      }
    }

    // Calcular Edad (si no viene directo)
    let edad: number | undefined = u.edad;
    // Si quisieras calcular por fecha de nacimiento (si la tuvieras en metadata o DB)
    // if (!edad && u.fecha_nacimiento) { ... }

    // Generar Bio
    let bio: string;
    if (rol === 'ESPECIALISTA') {
      if (especialidades.length) {
        bio = this.translate.instant(
          'PROFILE.BIO.SPECIALIST_WITH_SPECIALITIES',
          { specialities: especialidades.join(', ') }
        );
      } else {
        bio = this.translate.instant('PROFILE.BIO.SPECIALIST_DEFAULT');
      }
    } else if (rol === 'ADMIN') {
      bio = this.translate.instant('PROFILE.BIO.ADMIN');
    } else {
      bio = this.translate.instant('PROFILE.BIO.PATIENT');
    }

    // Mapear a la interfaz de la vista
    this.usuario = {
      id: u.id,
      nombre: u.nombre ?? '',
      apellido: u.apellido ?? '',
      rol,
      edad,
      dni: u.dni ?? '',
      email: u.email ?? '',
      telefono: null, // Si lo agregas a la tabla, mapealo aquí
      direccion: null,
      ciudad: null,
      obraSocial: u.obra_social ?? null,
      especialidades,
      habilitado: u.activo ?? true,
      avatarUrl: u.imagen_perfil_1 ?? null,
      bannerUrl: null,
      bio
    };
  }

  // --- MÉTODOS DE ACCIÓN (Sin cambios) ---

  get nombreCompleto(): string {
    return this.usuario ? `${this.usuario.nombre} ${this.usuario.apellido}` : '';
  }

  toggleHabilitado() {
    if (this.usuario) {
      // Aquí deberías llamar a la API para actualizar en DB real
      this.usuario.habilitado = !this.usuario.habilitado;
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
    console.log('Descargar historia clínica de', this.usuario?.id);
  }

  verTurnos() {
    if (this.usuario) {
      this.router.navigate(['/turnos-admin'], { queryParams: { usuario: this.usuario.id } }); // Corregí la ruta a /turnos-admin que es la común
    }
  }
}



