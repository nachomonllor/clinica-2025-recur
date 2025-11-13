-- Seed de datos para la pantalla de estadísticas.
-- Crea turnos "DEMO ..." distribuidos en los últimos días y actualiza timestamps
-- en perfiles para que aparezcan registros de ingresos recientes.
-- Ejecutar con: supabase db execute --file supabase/seeds/seed_estadisticas.sql

DO $$
DECLARE
  paciente_id UUID;
  especialistas UUID[];
  esp_count   INTEGER;
  nuevo_turno_id    UUID;
  dia_base    DATE;
  hora_txt    TEXT;
  estado_txt  TEXT;
  especialidad_txt TEXT;
  especialidades TEXT[] := ARRAY['Cardiología', 'Dermatología', 'Pediatría', 'Nutrición'];
BEGIN
  SELECT id INTO paciente_id
  FROM public.profiles
  WHERE rol = 'paciente'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF paciente_id IS NULL THEN
    RAISE EXCEPTION 'Seed estadísticas: no se encontró ningún paciente en public.profiles';
  END IF;

  SELECT ARRAY_AGG(id ORDER BY updated_at DESC)
  INTO especialistas
  FROM (
    SELECT id, updated_at
    FROM public.profiles
    WHERE rol = 'especialista' AND (aprobado IS DISTINCT FROM FALSE)
    ORDER BY updated_at DESC
    LIMIT 3
  ) AS q;

  esp_count := COALESCE(array_length(especialistas, 1), 0);
  IF esp_count = 0 THEN
    RAISE EXCEPTION 'Seed estadísticas: se requiere al menos un especialista aprobado en public.profiles';
  END IF;

  -- Borramos datos demo previos
  DELETE FROM public.historia_clinica
  WHERE public.historia_clinica.turno_id IN (
    SELECT id FROM public.turnos WHERE especialidad LIKE 'DEMO %'
  );

  DELETE FROM public.turnos WHERE especialidad LIKE 'DEMO %';

  -- Creamos 12 turnos distribuidos en los últimos días
  FOR i IN 0 .. 11 LOOP
    dia_base := current_date - i;
    hora_txt := LPAD((8 + (i % 8))::text, 2, '0') || ':00';
    especialidad_txt := 'DEMO ' || especialidades[(i % array_length(especialidades, 1)) + 1];
    estado_txt := CASE
      WHEN i % 5 = 0 THEN 'cancelado'
      WHEN i % 4 = 0 THEN 'rechazado'
      WHEN i % 3 = 0 THEN 'realizado'
      WHEN i % 2 = 0 THEN 'aceptado'
      ELSE 'pendiente'
    END;

    INSERT INTO public.turnos (
      paciente_id,
      especialista_id,
      especialidad,
      fecha_iso,
      estado,
      created_at,
      updated_at
    )
    VALUES (
      paciente_id,
      especialistas[(i % esp_count) + 1],
      especialidad_txt,
      to_char(dia_base, 'YYYY-MM-DD') || 'T' || hora_txt || ':00',
      estado_txt,
      (dia_base || ' ' || hora_txt || ':00')::timestamp,
      (dia_base || ' ' || hora_txt || ':00')::timestamp
    )
    RETURNING id INTO nuevo_turno_id;

    IF estado_txt = 'realizado' THEN
      INSERT INTO public.historia_clinica (
        turno_id,
        paciente_id,
        especialista_id,
        altura,
        peso,
        temperatura,
        presion,
        datos_dinamicos,
        created_at,
        updated_at
      )
      VALUES (
        nuevo_turno_id,
        paciente_id,
        especialistas[(i % esp_count) + 1],
        1.60 + (i % 5) * 0.02,
        60 + (i % 6),
        36.5 + (i % 4) * 0.1,
        '120/80',
        jsonb_build_array(
          jsonb_build_object('clave', 'Índice de riesgo', 'valor', 60, 'tipo', 'rango', 'unidad', '%'),
          jsonb_build_object('clave', 'Nivel de glucosa', 'valor', 92, 'tipo', 'numero', 'unidad', 'mg/dL'),
          jsonb_build_object('clave', 'Requiere seguimiento', 'valor', true, 'tipo', 'booleano')
        ),
        (dia_base || ' ' || hora_txt || ':00')::timestamp,
        (dia_base || ' ' || hora_txt || ':00')::timestamp
      )
      ON CONFLICT (turno_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Simulamos últimos ingresos moviendo updated_at en distintos perfiles
  WITH candidatos AS (
    SELECT id, row_number() OVER (ORDER BY updated_at DESC) AS rn
    FROM public.profiles
    ORDER BY updated_at DESC
    LIMIT 10
  )
  UPDATE public.profiles p
  SET updated_at = NOW()
    - make_interval(days => (c.rn - 1)::int)
    - ((c.rn % 4) * interval '2 hours')
  FROM candidatos c
  WHERE p.id = c.id;
END $$;

