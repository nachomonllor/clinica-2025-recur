-- Migración inicial: Esquema completo de la aplicación

-- Extensiones para UUIDs (compatibles con Supabase cloud)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla profiles (perfiles de usuario)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('paciente', 'especialista', 'admin')),
  aprobado BOOLEAN DEFAULT NULL,
  nombre TEXT,
  apellido TEXT,
  dni TEXT,
  email TEXT NOT NULL,
  obra_social TEXT,
  fecha_nacimiento DATE,
  avatar_url TEXT,
  imagen2_url TEXT,
  edad INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_rol ON public.profiles(rol);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_dni ON public.profiles(dni);

-- Tabla pacientes (datos específicos de pacientes)
CREATE TABLE IF NOT EXISTS public.pacientes (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  edad INTEGER NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  obra_social TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla especialistas (datos específicos de especialistas)
CREATE TABLE IF NOT EXISTS public.especialistas (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  edad INTEGER NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  especialidad TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  especialista_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  especialidad TEXT NOT NULL,
  fecha_iso TEXT NOT NULL, -- ISO string formato YYYY-MM-DDTHH:mm:ss
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptado', 'realizado', 'cancelado', 'rechazado')),
  resena_especialista TEXT,
  encuesta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para turnos
CREATE INDEX IF NOT EXISTS idx_turnos_paciente ON public.turnos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_turnos_especialista ON public.turnos(especialista_id);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON public.turnos(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON public.turnos(fecha_iso);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_especialistas_updated_at BEFORE UPDATE ON public.especialistas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turnos_updated_at BEFORE UPDATE ON public.turnos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.especialistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (ajustar según necesidades)
-- Profiles: usuarios pueden ver su propio perfil, todos pueden ver perfiles públicos
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Pacientes: usuarios pueden ver su propio registro
CREATE POLICY "Users can view own paciente record" ON public.pacientes
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own paciente record" ON public.pacientes
  FOR UPDATE USING (auth.uid() = id);

-- Especialistas: usuarios pueden ver su propio registro
CREATE POLICY "Users can view own especialista record" ON public.especialistas
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own especialista record" ON public.especialistas
  FOR UPDATE USING (auth.uid() = id);

-- Turnos: usuarios pueden ver sus propios turnos
CREATE POLICY "Users can view own turnos" ON public.turnos
  FOR SELECT USING (auth.uid() = paciente_id OR auth.uid() = especialista_id);

CREATE POLICY "Users can create own turnos" ON public.turnos
  FOR INSERT WITH CHECK (auth.uid() = paciente_id);

CREATE POLICY "Users can update own turnos" ON public.turnos
  FOR UPDATE USING (auth.uid() = paciente_id OR auth.uid() = especialista_id);

-- Política para admins (ver todo)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

