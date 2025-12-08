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



