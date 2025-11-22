// Rol/perfil de usuario según la base de datos
export type Rol = 'PACIENTE' | 'ESPECIALISTA' | 'ADMIN';

// Estados de turno posibles (estados_turno.codigo)
export type EstadoTurnoCodigo =
  | 'PENDIENTE'
  | 'ACEPTADO'
  | 'RECHAZADO'
  | 'CANCELADO'
  | 'FINALIZADO';

// Tipo de control para historia_datos_dinamicos.tipo_control
export type TipoControl =
  | 'OTRO'
  | 'RANGO_0_100'
  | 'NUMERICO'
  | 'SI_NO'
  | string;   // por si en el futuro agregás otros tipos

// Tipo de evento en el log de ingresos
export type LogIngresoTipo = 'LOGIN' | 'VISITA' | string;

