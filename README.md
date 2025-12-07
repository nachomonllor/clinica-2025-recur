# Clínica Online - Sistema de Gestión de Turnos

Este proyecto es una aplicación web desarrollada en **Angular** como trabajo final para la materia **Laboratorio de Computación IV** de la **UTN Avellaneda**. El sistema permite la gestión integral de una clínica, administrando pacientes, especialistas y turnos médicos con flujos diferenciados por rol.

## Funcionalidades y Pantallas

### 1. Acceso y Seguridad (Sprint 1)
La aplicación cuenta con una **Página de Bienvenida** con accesos rápidos. El sistema de autenticación incluye verificación de email y aprobación administrativa para especialistas.

![bienvenida](src/assets/imagenes_clinica/usuarios/bienvenida.jpg)

#### Login y Registro
**Registro de Pacientes:** Se capturan datos personales, obra social y dos imágenes de perfil.

![registro_del_paciente](src/assets/imagenes_clinica/usuarios/registro_del_paciente.jpg)

**Registro de Especialistas:** Permite seleccionar o añadir especialidades dinámicamente.

![registro_del_especialista](src/assets/imagenes_clinica/usuarios/registro_del_especialista.jpg)

**Captcha:** Implementado en los registros para mayor seguridad.

![login](src/assets/imagenes_clinica/usuarios/login.jpg)

### 2. Módulo de Pacientes
**Los pacientes pueden gestionar su atención médica de forma autónoma**

#### Solicitar Turno
**Un asistente paso a paso permite seleccionar especialidad, médico y horario disponible (próximos 15 días), con validaciones de disponibilidad.**

**Solo aparecen horarios disponibles**


![solicitar_turno_solo_aparecen_dias_horas_disponibles](https://github.com/user-attachments/assets/5df4a061-0f01-42f2-83b7-3c786e8e4ee7)


**El paciente puede solicitar un turno:**
![solicitar_turno](src/assets/imagenes_clinica/paciente/solicitar_turno.jpg)

**Solo aparecen especialistas de la especialidad seleccionada:**


![solicitar_turno_solo_aparecen_los_especialistas_de_esa_especialidad](https://github.com/user-attachments/assets/b7c96f67-4af3-4087-846c-40b32ce28434)


#### Mis Turnos y Perfil
**Visualización de turnos con filtro único (por especialidad o especialista):**


![mis_turnos_paciente](https://github.com/user-attachments/assets/5c9fa59a-8b6f-4299-9478-3d503d568054)


**Acciones disponibles: Cancelar turno, ver reseña, completar encuesta y calificar atención.**

**Perfil: Descarga de Historia Clínica en PDF con logo de la clínica.**



### 3. Seccion del especialista: 

![mis_pacientes](https://github.com/user-attachments/assets/2144bed0-7dbe-4176-b2c0-dd8192e104a3)




![cancelar_turno](https://github.com/user-attachments/assets/714bfc91-acc6-46a2-9680-771b3779df20)


![filtro_por_resena](https://github.com/user-attachments/assets/64f163a9-a522-4c82-b15f-26deaa2e4903)


![historia_clinica_al_finalizar_turno](https://github.com/user-attachments/assets/8aaa81bb-fd73-4c59-8741-fdc0d716dd3b)




![historias_clinicas_de_cada_paciente](https://github.com/user-attachments/assets/171dc98b-0fc8-4bd7-a498-3a1086f79a46)





![mis_pacientes](https://github.com/user-attachments/assets/3c830ec7-0450-4472-8bfd-8c9cc5c6c567)




![resena_del_especialista](https://github.com/user-attachments/assets/cced1802-da38-4777-aa2c-fc4be9373556)




![resena_del_paciente_estrellita](https://github.com/user-attachments/assets/3a53c660-6c4b-418a-942a-0a37481bd4b3)




### 4. Seccion del Administrador:





![filtros_usuarios_admin](https://github.com/user-attachments/assets/7d651d64-e409-4579-85a4-f8aeba2de773)
![usuarios_admin](https://github.com/user-attachments/assets/fa99921e-bf53-4b93-baf1-47cf9b1dc572)
![turnos_admin](https://github.com/user-attachments/assets/23baf275-85f3-4d16-b48a-9d72b77c543c)
![seleccion_estadisticas](https://github.com/user-attachments/assets/b794bacf-8100-41be-b951-aa544c257abe)
![perfil_administrador](https://github.com/user-attachments/assets/9d086a7a-ef0f-48e9-aaf5-45bbe8172f93)
![historial_clinico_por_paciente_filtrador](https://github.com/user-attachments/assets/113b9702-bb61-4206-9617-5a451a018aec)




![usuarios_clinica_EXCEL](https://github.com/user-attachments/assets/964154c2-dce9-468a-aa68-37fda373fb30)
![turnos_por_especialidad](https://github.com/user-attachments/assets/7faa2d8c-1327-4dcf-a1a3-c20f7a61fede)
![pdf_log_ingresos](https://github.com/user-attachments/assets/69055bd6-cca0-4078-9b6e-5d99e7b7f6d4)
![log_ingresos](https://github.com/user-attachments/assets/38b86a00-0809-4b33-bf1e-b19057705422)
![lista_usuario_PDF](https://github.com/user-attachments/assets/6b6f4bf5-a948-4f95-8417-6fc7245dac51)
![estadisticas_turnos_por_medico_descarga_excel](https://github.com/user-attachments/assets/65b035fa-4b26-4316-ac6b-4ec463668a00)
![estadisticas_turnos_por_medico](https://github.com/user-attachments/assets/408ff41f-fe71-480b-abcf-003f6d43556d)
![estadisticas_turnos_por_dia](https://github.com/user-attachments/assets/ec40d9f7-0a0e-46e6-9a0f-e5eac15e659a)
















## Características Técnicas Adicionales
**Animaciones:** Transiciones entre componentes (mínimo 6 aplicadas).
**Directivas y Pipes:** Personalizados para mejorar la UX/UI.
**Captcha Propio:** Implementado como directiva reutilizable.
**Multilenguaje (Sprint 6):** Soporte para Español, Inglés y Portugués.
**Encuestas:** Sistema de encuestas de satisfacción con diversos controles.

### Tecnologías Utilizadas:
**Frontend:** Angular (Framework)
**Base de Datos:** Supabase
**Almacenamiento:** Supabase Storage 
**Librerías:** `chart.js` / `ApexCharts` (Gráficos), `jspdf` (Reportes), `xlsx` (Excel)

