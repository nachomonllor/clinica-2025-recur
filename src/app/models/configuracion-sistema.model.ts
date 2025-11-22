export interface ConfiguracionSistema {
  clave: string;
  valor_texto: string | null;
  valor_numero: number | null;
  valor_boolean: boolean | null;
}

export interface ConfiguracionSistemaCreate {
  clave: string;
  valor_texto?: string | null;
  valor_numero?: number | null;
  valor_boolean?: boolean | null;
}

export type ConfiguracionSistemaUpdate =
  Partial<Omit<ConfiguracionSistema, 'clave'>>;


  