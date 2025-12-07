# Clínica Online - Sistema de Gestión de Turnos

Este proyecto es una aplicación web desarrollada en **Angular** como trabajo final para la materia **Laboratorio de Computación IV** de la **UTN Avellaneda**. El sistema permite la gestión integral de una clínica, administrando pacientes, especialistas y turnos médicos con flujos diferenciados por rol.

---

## Funcionalidades y Pantallas

### 1. Acceso y Seguridad (Sprint 1)
La aplicación cuenta con una **Página de Bienvenida** con accesos rápidos. El sistema de autenticación incluye verificación de email y aprobación administrativa para especialistas

![bienvenida](src/assets/imagenes_clinica/usuarios/bienvenida.jpg)

#### Login y Registro
  **Registro de Pacientes:** Se capturan datos personales, obra social y dos imágenes de perfil

  ![registro_del_paciente](src/assets/imagenes_clinica/usuarios/registro_del_paciente.jpg)

  **Registro de Especialistas:** Permite seleccionar o añadir especialidades dinámicamente:

  ![registro_del_especialista](src/assets/imagenes_clinica/usuarios/registro_del_especialista.jpg)

  **Captcha:** Implementado en los registros para mayor seguridad

---![login](src/assets/imagenes_clinica/usuarios/login.jpg)

### 2. Módulo de Pacientes 
Los pacientes pueden gestionar su atención médica de forma autónoma.

#### Solicitar Turno

Un asistente paso a paso permite seleccionar especialidad, médico y horario disponible (próximos 15 días), con validaciones de disponibilidad.

* Solo aparecen horarios disponibles:

 ![solicitar_turno_solo_aparecen_dias_horas_disponibles](src/assets/imagenes_clinica/paciente/solicitar_turno_solo_aparecen_dias_horas_disponibles.jpg)

# El paciente puede solicitar un turno:

 ![solicitar_turno](src/assets/imagenes_clinica/paciente/solicitar_turno.jpg)

# Solo aparecen especialistas de la especialidad seleccionada:

![solicitar_turno_solo_aparecen_los_especialistas_de_esa_especialidad](src/assets/imagenes_clinica/paciente/solicitar_turno_solo_aparecen_los_especialistas_de_esa_especialidad.jpg)


#### Mis Turnos y Perfil
# Visualización de turnos con filtro único (por especialidad o especialista):

  ![mis_turnos_paciente](src/assets/imagenes_clinica/paciente/mis_turnos_paciente.jpg)

# Acciones disponibles: Cancelar turno, ver reseña, completar encuesta y calificar atención

 **Perfil:** Descarga de **Historia Clínica en PDF** con logo de la clínica

![Pantalla Mis Turnos Paciente](src/assets/imagenes_clinica/paciente/mis_turnos_paciente.jpg)

### 3. Módulo de Especialistas (Sprint 2 & 3)

Los médicos cuentan con herramientas para administrar su agenda y pacientes

#### Gestión de Turnos y Agenda
**Mis Horarios:** El especialista define su disponibilidad horaria por especialidad.
**Administración de Turnos:** Permite Aceptar, Rechazar o Finalizar turnos dejando reseñas diagnósticas.

![Pantalla Gestión Especialista](src/assets/imagenes_clinica/especialista/mis_pacientes.jpg)

#### Carga de Historia Clínica
Al finalizar un turno, el especialista carga la historia clínica compuesta por datos fijos (altura, peso, temperatura, presión) y datos dinámicos variables

![Pantalla Historia Clínica](src/assets/imagenes_clinica/especialista/historia_clinica_al_finalizar_turno.jpg)

### 4. Modulo de Administracion
Panel de control exclusivo para gestionar la clínica.

#### Gestión de Usuarios


# Visualización de todos los usuarios con capacidad de habilitar o inhabilitar el acceso a Especialistas

# Incluye descarga de nómina en Excel

![Pantalla Sección Usuarios](src/assets/imagenes_clinica/admin/usuarios_admin.jpg)


#### Estadísticas e Informes

Pantalla de seleccion de estadisticas:

![Seleccion estadisticas](src/assets/imagenes_clinica/admin/seleccion_estadisticas.jpg)

# Panel gráfico (Charts) con posibilidad de descarga en Excel o PDFIncluye:

* Log de ingresos al sistema:
![log de ingresos](src/assets/imagenes_clinica/admin/log_ingresos.jpg)

* Cantidad de turnos por especialidad:
![Turnos por especialidad](src/assets/imagenes_clinica/admin/estadisticas/turnos_por_especialidad.jpg)

* Cantidad de turnos por dia:
![Turnos por dia](src/assets/imagenes_clinica/admin/estadisticas/estadisticas_turnos_por_dia.jpg)

* Informes de turnos solicitados y finalizados por médico:
![Informes de turnos solicitados y finalizados por medico](src/assets/imagenes_clinica/admin/estadisticas/estadisticas_turnos_por_medico.jpg)

* Turnos por especialidad:
![Informes de turnos por especialidad](src/assets/imagenes_clinica/admin/estadisticas/turnos_por_especialidad.jpg)



## Características Técnicas Adicionales
**Animaciones:** Transiciones entre componentes (mínimo 6 aplicadas)

**Directivas y Pipes:** Personalizados para mejorar la UX/UI

**Captcha Propio:** Implementado como directiva reutilizable

**Multilenguaje (Sprint 6):** Soporte para Español, Inglés y Portugués

**Encuestas:** Sistema de encuestas de satisfacción con diversos controles

### Tecnologías Utilizadas:

**Frontend:** Angular (Framework)
**Base de Datos:** Supabase
**Almacenamiento:** Supabase Storage 
**Librerías:** `chart.js` (Gráficos), `jspdf` (Reportes), `xlsx` (Excel)



  
