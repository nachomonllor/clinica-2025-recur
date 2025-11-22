export interface Especialidad {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export interface EspecialidadCreate {
  id?: string;
  nombre: string;
  descripcion?: string | null;
}

export type EspecialidadUpdate = Partial<Omit<Especialidad, 'id'>>;

export interface UsuarioEspecialidad {
  usuario_id: string;
  especialidad_id: string;
}

export type UsuarioEspecialidadCreate = UsuarioEspecialidad;

