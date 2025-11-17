import { UUID } from "./especialista.model";
import { Rol } from "./perfil.model";


export interface LogIngreso {
  id?: string;
  email: string;
  createdAt: Date | string | number;
}

export type PageToken = number | '…';

// ========= Logins / Accesos =========
// VM para gráficos de “Log de ingresos”
export interface LoginLog {
  id: string;
  userId: UUID;
  email?: string | null;
  rol: Rol;
  atISO: string; // ISO 8601 del ingreso
}

// Fila cruda de BD (si usás una tabla de ingresos)
// Si tu tabla/consulta tiene otros nombres de columnas, ajustá acá:
export type IngresoRow = {
  user_id: UUID;
  email: string;
  rol: Rol;                  // 'admin' | 'paciente' | 'especialista'
  timestamp: string;         // timestamptz (ISO)
};

export interface QuickItem {
  label: string;
  route: string;
  avatar: string;
  rol: Rol;
  tooltip?: string;
}

// ========= Admin =========
export interface AdminCounters {
  usuarios: number;
  especialistasPendientes: number;
  turnosHoy: number;
  turnosPendientes: number;
}