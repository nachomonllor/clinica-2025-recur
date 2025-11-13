-- Migración: Tabla historia_clinica

-- Aseguramos las extensiones para UUIDs por compatibilidad entre entornos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla historia_clinica (una por turno finalizado)
CREATE TABLE IF NOT EXISTS public.historia_clinica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id UUID NOT NULL REFERENCES public.turnos(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  especialista_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Datos fijos
  altura DECIMAL(5,2) NOT NULL CHECK (altura > 0),
  peso DECIMAL(5,2) NOT NULL CHECK (peso > 0),
  temperatura DECIMAL(4,2) NOT NULL CHECK (temperatura > 0),
  presion TEXT NOT NULL,
  -- Datos dinámicos (máximo 3 pares clave-valor)
  datos_dinamicos JSONB DEFAULT '[]'::jsonb CHECK (jsonb_array_length(datos_dinamicos) <= 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Un turno solo puede tener una historia clínica
  UNIQUE(turno_id)
);

-- Índices para historia_clinica
CREATE INDEX IF NOT EXISTS idx_historia_clinica_turno ON public.historia_clinica(turno_id);
CREATE INDEX IF NOT EXISTS idx_historia_clinica_paciente ON public.historia_clinica(paciente_id);
CREATE INDEX IF NOT EXISTS idx_historia_clinica_especialista ON public.historia_clinica(especialista_id);
CREATE INDEX IF NOT EXISTS idx_historia_clinica_created_at ON public.historia_clinica(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_historia_clinica_updated_at BEFORE UPDATE ON public.historia_clinica
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.historia_clinica ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para historia_clinica
-- Pacientes pueden ver su propia historia clínica
CREATE POLICY "Pacientes can view own historia clinica" ON public.historia_clinica
  FOR SELECT USING (auth.uid() = paciente_id);

-- Especialistas pueden ver la historia clínica de pacientes que atendieron
CREATE POLICY "Especialistas can view historia clinica of their patients" ON public.historia_clinica
  FOR SELECT USING (auth.uid() = especialista_id);

-- Especialistas pueden crear historia clínica para turnos que atendieron
CREATE POLICY "Especialistas can create historia clinica" ON public.historia_clinica
  FOR INSERT WITH CHECK (
    auth.uid() = especialista_id AND
    EXISTS (
      SELECT 1 FROM public.turnos
      WHERE id = turno_id
        AND especialista_id = auth.uid()
        AND estado = 'aceptado'
    )
  );

-- Especialistas pueden actualizar historia clínica que crearon
CREATE POLICY "Especialistas can update own historia clinica" ON public.historia_clinica
  FOR UPDATE USING (auth.uid() = especialista_id);

-- Admins pueden ver todas las historias clínicas
CREATE POLICY "Admins can view all historia clinica" ON public.historia_clinica
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

