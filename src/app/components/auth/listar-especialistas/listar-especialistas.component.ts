// import { Component } from '@angular/core';

// @Component({
//     selector: 'app-listar-especialistas',
//     standalone: true,
//     imports: [],
//     templateUrl: './listar-especialistas.component.html',
//     styleUrl: './listar-especialistas.component.scss'
// })
// export class ListarEspecialistasComponent {
// }


import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface Especialista {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  especialidades: string[];
  fotoUrl?: string;
  verificadoEmail?: boolean;
  habilitado?: boolean;
  dni?: string;
  edad?: number;
}

type SortKey = 'apellido' | 'especialidades' | 'estado';

@Component({
  selector: 'app-listar-especialistas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './listar-especialistas.component.html',
  styleUrls: ['./listar-especialistas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListarEspecialistasComponent {
  /** Datos a listar */
  @Input() especialistas: Especialista[] = [];
  /** Muestra placeholders de carga */
  @Input() loading = false;
  /** Si es true, muestra acciones de administración (habilitar/inhabilitar) */
  @Input() isAdmin = false;
  /** Si es true, muestra botón “Seleccionar” (útil para solicitar turno) */
  @Input() permitirSeleccion = false;
  /** Placeholder del buscador */
  @Input() placeholderFiltro = 'Buscar por nombre, especialidad o email…';

  /** Eventos hacia el contenedor */
  @Output() verDetalle = new EventEmitter<Especialista>();
  @Output() toggleHabilitado = new EventEmitter<{ id: string; next: boolean }>();
  @Output() reenviarVerificacion = new EventEmitter<Especialista>();
  @Output() seleccionar = new EventEmitter<Especialista>();

  filtro = new FormControl<string>('', { nonNullable: true });

  sortKey: SortKey = 'apellido';
  sortDir: 'asc' | 'desc' = 'asc';

  constructor(private sanitizer: DomSanitizer) {}

  /** Lista procesada para la vista (filtrado + orden) */
  get vm(): Especialista[] {
    const term = this.filtro.value.trim().toLowerCase();
    const filtered = (this.especialistas ?? []).filter((e) => {
      if (!term) return true;
      const base = [
        e.nombre,
        e.apellido,
        e.email,
        e.dni,
        ...(e.especialidades ?? [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return base.includes(term);
    });

    const collator = new Intl.Collator('es');
    const sorted = filtered.sort((a, b) => {
      let va = '';
      let vb = '';

      switch (this.sortKey) {
        case 'apellido':
          va = `${a.apellido ?? ''} ${a.nombre ?? ''}`;
          vb = `${b.apellido ?? ''} ${b.nombre ?? ''}`;
          break;
        case 'especialidades':
          va = (a.especialidades ?? []).join(', ');
          vb = (b.especialidades ?? []).join(', ');
          break;
        case 'estado':
          va = this.estadoTexto(a);
          vb = this.estadoTexto(b);
          break;
      }

      const res = collator.compare(va, vb);
      return this.sortDir === 'asc' ? res : -res;
    });

    return sorted;
  }

  setSort(key: SortKey) {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
  }

  estadoTexto(e: Especialista): string {
    if (e.verificadoEmail === false) return 'Pendiente de verificación';
    return e.habilitado ? 'Habilitado' : 'Deshabilitado';
    // Nota: puedes ajustar esta lógica según tu backend/estados finos.
  }

  initials(e: Especialista): string {
    const n = (e.nombre ?? '').trim();
    const a = (e.apellido ?? '').trim();
    return `${a.charAt(0)}${n.charAt(0)}`.toUpperCase();
  }

  onToggleHabilitado(e: Especialista) {
    const next = !e.habilitado;
    this.toggleHabilitado.emit({ id: e.id, next });
  }

  /** Devuelve HTML con coincidencias resaltadas usando <mark> */
  highlight(text: string, term: string): SafeHtml {
    if (!text) return '';
    if (!term) return text;
    const esc = (s: string) =>
      s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeText = esc(text);
    const safeTerm = esc(term);
    const regex = new RegExp(`(${safeTerm})`, 'gi');
    const html = safeText.replace(regex, '<mark>$1</mark>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  trackById(_: number, e: Especialista) {
    return e.id;
  }
}
