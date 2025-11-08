export interface QuickItem {
  label: string;
  route: string;
  avatar: string;
  rol: Rol;
  tooltip?: string;
}

type Rol = 'paciente' | 'especialista' | 'admin';

export interface Perfil {
  id: string;
  rol: Rol;
  aprobado?: boolean | null;
  email?: string | null;
}


