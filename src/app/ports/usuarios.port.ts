// src/app/ports/usuarios.port.ts
import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario, UUID } from '../../models/interfaces';

export interface UsuariosPort {
  getAll(): Observable<Usuario[]>;
  toggleHabilitado(id: UUID, habilitado: boolean): Promise<void> | Observable<void>;
  aprobarEspecialista(id: UUID): Promise<void> | Observable<void>;
}

// Token de DI para poder inyectar la interface
export const USUARIOS_PORT = new InjectionToken<UsuariosPort>('USUARIOS_PORT');

