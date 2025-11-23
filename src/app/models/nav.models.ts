// src/app/models/nav.models.ts
import { Rol } from './tipos.model';

export interface QuickLoginUserConfig {
  email: string;
  password: string;
  nombre?: string;
  avatar?: string;
}

export interface QuickLoginsConfig {
  paciente: QuickLoginUserConfig | QuickLoginUserConfig[];
  especialista: QuickLoginUserConfig | QuickLoginUserConfig[];
  admin: QuickLoginUserConfig | QuickLoginUserConfig[];
}

// Usuario “rápido” armado para los botones de accesos rápidos del login
export interface QuickAccessUser {
  email: string;
  password: string;
  nombre: string;
  avatar: string;
  rol: Rol;  // 'PACIENTE' | 'ESPECIALISTA' | 'ADMIN'
}

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

// Esto lo usás en el login para accesos rápidos
export interface QuickAccessUser {
  email: string;
  password: string;
  nombre: string;
  avatar: string;
  rol: Rol;
}

