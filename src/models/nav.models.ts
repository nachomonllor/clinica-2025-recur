import { Rol } from "./perfil.model";

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}


export interface QuickLoginEntry {
  email: string;
  password: string;
  nombre?: string;
  avatar?: string;
}

export type QuickLoginsConfig = {
  paciente: QuickLoginEntry | QuickLoginEntry[];
  especialista: QuickLoginEntry | QuickLoginEntry[];
  admin: QuickLoginEntry | QuickLoginEntry[];
};

export interface QuickAccessUser {
  email: string;
  password: string;
  nombre: string;
  avatar: string;
  rol: Rol;
}