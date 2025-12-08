--  TURNOS DE UN ESPECIALISTA:

SELECT 
    -- Datos del horario
    horario.dia_semana,          -- ============> 0=Domingo, 1=Lunes, etc. 
    horario.hora_desde,
    horario.hora_hasta,
    horario.duracion_turno_minutos,
    
    -- Especialidad asociada al horario (si aplica)
    especialidad.nombre AS nombre_especialidad,
    
    -- Datos del especialista (solo para verificar)
    usuario.email
FROM 
    esquema_clinica.horarios_especialista AS horario
INNER JOIN 
    esquema_clinica.usuarios AS usuario ON horario.especialista_id = usuario.id
LEFT JOIN 
    esquema_clinica.especialidades AS especialidad ON horario.especialidad_id = especialidad.id
WHERE 
    usuario.email = 'nachomonllorc+sitzer@gmail.com'
ORDER BY 
    horario.dia_semana ASC, 
    horario.hora_desde ASC;



-- LISTA DE TURNOS CANCELADOS POR EL PACIENTE P
SELECT 
    -- Datos del turno
    turno.fecha_hora_inicio,
    
    -- Especialidad y Especialista
    especialidad.nombre AS especialidad,
    especialista.nombre AS nombre_especialista,
    especialista.apellido AS apellido_especialista,
    
    -- Motivo de la cancelación guardado en el campo comentario
    turno.comentario AS motivo_cancelacion,
    
    -- Estado confirmación visual
    estado.codigo AS estado_turno
FROM 
    esquema_clinica.turnos AS turno
INNER JOIN 
    esquema_clinica.usuarios AS paciente ON turno.paciente_id = paciente.id
INNER JOIN 
    esquema_clinica.usuarios AS especialista ON turno.especialista_id = especialista.id
INNER JOIN 
    esquema_clinica.especialidades AS especialidad ON turno.especialidad_id = especialidad.id
INNER JOIN 
    esquema_clinica.estados_turno AS estado ON turno.estado_turno_id = estado.id
WHERE 
    paciente.email = 'ana@hotmail.com'
    AND estado.codigo = 'CANCELADO'
ORDER BY 
    turno.fecha_hora_inicio DESC;


-- VER TODAS LAS ENCUESTAS DE UN ESPECIALISTA

SELECT 
    ea.fecha_respuesta,
    p.apellido || ', ' || p.nombre as paciente, -- Quien opinó
    ea.estrellas as calificacion,
    ea.comentario as opinion_texto,
    -- Datos extra del sprint 6 (si los cargaron)
    ea.respuesta_radio as pregunta_radio,
    ea.respuesta_checkbox as pregunta_check,
    ea.valor_rango as puntaje_rango
FROM esquema_clinica.encuestas_atencion ea
-- 1. Unimos para identificar a la Especialista (Nora)
JOIN esquema_clinica.usuarios e ON ea.especialista_id = e.id
-- 2. Unimos para ver el nombre del Paciente
JOIN esquema_clinica.usuarios p ON ea.paciente_id = p.id
WHERE 
    e.email = 'nora@hotmail.com' -- Filtramos por el mail de Nora
ORDER BY 
    ea.fecha_respuesta DESC;

