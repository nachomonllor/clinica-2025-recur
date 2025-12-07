# Clínica Online - Sistema de Gestión de Turnos

Este proyecto es una aplicación web desarrollada en **Angular** como trabajo final para la materia **Laboratorio de Computación IV** de la **UTN Avellaneda**. El sistema permite la gestión integral de una clínica, administrando pacientes, especialistas y turnos médicos con flujos diferenciados por rol.

---

## Funcionalidades y Pantallas

### 1. Acceso, Registro y Seguridad
El sistema cuenta con un flujo de autenticación robusto. Desde la pantalla de bienvenida se puede acceder al Login o al Registro.

**Bienvenida y Selección de Rol:**
Acceso rápido a los diferentes portales de la aplicación.
![bienvenida](https://github.com/user-attachments/assets/8e4f12f1-57e4-4baa-b846-30856f019b23)


**En la siguiente pantalla elegimos si nos registramos como paciente o como especialista**
![seleccion_registro](https://github.com/user-attachments/assets/ee28483d-e969-410f-9c78-4c8376c8f400)

**Formularios de Registro:**
* **Pacientes:** Carga de datos personales, obra social y doble validación de identidad.
* **Especialistas:** Selección dinámica de especialidades.


![registro_del_paciente](https://github.com/user-attachments/assets/91e1c598-e426-4918-8c0f-52746e302260)

**En el registro del especialista pueden agregarse hasta tres especialidades que no existen en el listado, ademas tenemos la posibilidad de desactivar el captcha**
![registro_del_especialista](https://github.com/user-attachments/assets/678a2dcf-94ba-440b-8928-99d6d76e0a0e)

**Inicio de Sesión:**
Validación de credenciales con verificaciones de correo electrónico y aprobación administrativa (para especialistas).

**Disponemos de accesos rapidos de los usuarios en la esquina inferior derecha**
![login](https://github.com/user-attachments/assets/e8ddb539-457f-4ce9-a4ec-3c5d6a1bac31)

---

### 2. Módulo de Pacientes
Los pacientes gestionan su atención médica de forma autónoma con un asistente paso a paso.

**Solicitud de Turnos:**
Filtro de especialistas según la especialidad seleccionada y muestra únicamente los días y horarios disponibles (próximos 15 días).

**Pantalla de solicitar turno**
![solicitar_turno](https://github.com/user-attachments/assets/d8bfcfb4-2ca3-493b-82bd-061d3b3dfa1d)

**Solo son visibles los especialistas de la especialidad seleccionada**
![solicitar_turno_solo_aparecen_los_especialistas_de_esa_especialidad](https://github.com/user-attachments/assets/4077f1c6-dd26-441d-94ce-abdcc19fdbda)

**Solo son visibles los dias y horas disponibles del especialista seleccionado**
![solicitar_turno_solo_aparecen_dias_horas_disponibles](https://github.com/user-attachments/assets/cf67f0ec-4f8a-483e-9c89-9b69a8a28c44)

**Gestión de Turnos y Acciones:**
Panel "Mis Turnos" con filtros y acciones rápidas: ver reseñas del médico, completar encuestas de satisfacción y calificar la atención.

**El paciente puede descargar su historia clinica como PDF, ver la reseña que le dejo el especialista en un turno finalizado, calificar la atencion del especialista, ademas tiene la posibilidad cancelar el turno dejando un mensaje justificativo **
![mis_turnos_paciente](https://github.com/user-attachments/assets/606299ca-a80a-4a6c-9773-88f6e7d34196)

**El paciente puede ver la reseña del especialista**
![ver_resena](https://github.com/user-attachments/assets/39a2723c-96c9-4c4b-a9bb-ae1d1ed81832)

**El paciente puede completar una encuesta referente a la atencion brindada por el especialista**
![completar_encuesta](https://github.com/user-attachments/assets/9b6a9a37-2990-4c9c-9912-47961817d969)

**Pantalla de detalle de la reseña**
![ver_resena_asignada_al_paciente_en_turno](https://github.com/user-attachments/assets/cc1bff90-1336-4837-8dcc-af2b9a08d565)

**Reportes y Exportación:**
Capacidad de descargar la lista de turnos en Excel y la **Historia Clínica** completa en formato PDF con el logo institucional.

**El paciente tiene la posibilidad de exportar los turnos como archivo Excel**
![exportar_turnos_excel](https://github.com/user-attachments/assets/dce519e6-ecfa-4cb8-ad07-b3d5cc0d9b56)

**Tambien tiene la posibilidad de exportar la historia clinica**
![exportar_historia_clinica_PDF](https://github.com/user-attachments/assets/9585ed72-96e6-4d82-a40c-80f24436d5c4)

---

### 3. Módulo de Especialistas
Herramientas para la gestión de la agenda médica y el seguimiento de pacientes.

**Gestión de Pacientes y Turnos:**
Visualización de pacientes atendidos y administración de turnos (Finalizar, Cancelar, Rechazar).

![mis_pacientes](https://github.com/user-attachments/assets/2144bed0-7dbe-4176-b2c0-dd8192e104a3)


**El especialista dispone de la posibilidad de cancelar un turno solicitado por el paciente**
![cancelar_turno](https://github.com/user-attachments/assets/714bfc91-acc6-46a2-9680-771b3779df20)

**Historia Clínica y Reseñas:**
Al finalizar una consulta, el especialista carga los datos fijos y dinámicos de la historia clínica. También puede visualizar reseñas y comentarios.

![historia_clinica_al_finalizar_turno](https://github.com/user-attachments/assets/8aaa81bb-fd73-4c59-8741-fdc0d716dd3b)

**En la siguiente seccion el especialista puede acceder a todas las historias clinicas de cada uno de sus pacientes**
![historias_clinicas_de_cada_paciente](https://github.com/user-attachments/assets/171dc98b-0fc8-4bd7-a498-3a1086f79a46)

**El especialista dispone de la posibilidad de dejar su reseña sobre el paciente**
![resena_del_especialista](https://github.com/user-attachments/assets/cced1802-da38-4777-aa2c-fc4be9373556)

**El especialista puede filtrar por reseña y que se filtren todos los turnos de sus pacientes que contengan esa parte de la reseña**
![filtro_por_resena](https://github.com/user-attachments/assets/64f163a9-a522-4c82-b15f-26deaa2e4903)

**El especialista puede ver la reseña que dejo cada paciente**
![resena_del_paciente_estrellita](https://github.com/user-attachments/assets/3a53c660-6c4b-418a-942a-0a37481bd4b3)

---

### 4. Módulo de Administración
Panel de control centralizado para la gestión operativa y análisis de datos.

**Gestión de Usuarios y Turnos:**
Listados completos con filtros avanzados, descarga de nóminas en Excel/PDF y control de acceso.


![usuarios_admin](https://github.com/user-attachments/assets/fa99921e-bf53-4b93-baf1-47cf9b1dc572)

**El administrador puede filtrar en la seccion de turnos**
![filtros_usuarios_admin](https://github.com/user-attachments/assets/7d651d64-e409-4579-85a4-f8aeba2de773)


![turnos_admin](https://github.com/user-attachments/assets/23baf275-85f3-4d16-b48a-9d72b77c543c)

**El administrador puede exportar los turnos como archivo EXcel**
![usuarios_clinica_EXCEL](https://github.com/user-attachments/assets/964154c2-dce9-468a-aa68-37fda373fb30)

**El administrador puede exportar como excel a todos los usuarios**
![lista_usuario_PDF](https://github.com/user-attachments/assets/6b6f4bf5-a948-4f95-8417-6fc7245dac51)

**Estadísticas e Informes:**
Dashboard con gráficos interactivos (Charts) exportables. Incluye análisis de turnos por especialidad, por día, por médico y logs de ingreso al sistema.

**El administrador tiene acceso a una pantalla para seleccionar estadisticas**
![seleccion_estadisticas](https://github.com/user-attachments/assets/b794bacf-8100-41be-b951-aa544c257abe)

**Puede ver los turnos por dia**
![estadisticas_turnos_por_dia](https://github.com/user-attachments/assets/ec40d9f7-0a0e-46e6-9a0f-e5eac15e659a)

**Tambien puede visualizar los turnos por especialidad**
![turnos_por_especialidad](https://github.com/user-attachments/assets/7faa2d8c-1327-4dcf-a1a3-c20f7a61fede)

**Puede visualizar los turnos por medico**
![estadisticas_turnos_por_medico](https://github.com/user-attachments/assets/408ff41f-fe71-480b-abcf-003f6d43556d)

**Logs y Descargas:**
Registro de actividad y descargas de reportes.

**El administrador tiene acceso a el historial de ingresos**
![log_ingresos](https://github.com/user-attachments/assets/38b86a00-0809-4b33-bf1e-b19057705422)

**Tambien puede exportar el registro de ingresos como PDF**
![pdf_log_ingresos](https://github.com/user-attachments/assets/69055bd6-cca0-4078-9b6e-5d99e7b7f6d4)

**Puede exportar las estadisticas de turnos por medico como excel**
![estadisticas_turnos_por_medico_descarga_excel](https://github.com/user-attachments/assets/65b035fa-4b26-4316-ac6b-4ec463668a00)

**Perfil Administrador y Control Global:**
![perfil_administrador](https://github.com/user-attachments/assets/9d086a7a-ef0f-48e9-aaf5-45bbe8172f93)

**El administrador dispone de la posibilidad de filtrar en la seccion del historial**
![historial_clinico_por_paciente_filtrador](https://github.com/user-attachments/assets/113b9702-bb61-4206-9617-5a451a018aec)

---

## Características Técnicas
El proyecto cumple con los siguientes requerimientos técnicos avanzados:

* **Animaciones:** Transiciones fluidas entre componentes (mínimo 6 aplicadas).
* **Directivas y Pipes:** Personalizados para mejorar la UX/UI (ej. formatos de fecha, estilos dinámicos).
* **Captcha Propio:** Implementado como directiva reutilizable en los formularios de acceso.
* **Multilenguaje (Sprint 6):** Soporte internacionalización (i18n) para Español, Inglés y Portugués.
* **Encuestas:** Sistema dinámico de encuestas de satisfacción con diversos controles.

### Stack Tecnológico
* **Frontend:** Angular 17+ (Framework)
* **Base de Datos:** Supabase (PostgreSQL)
* **Almacenamiento:** Supabase Storage (Imágenes)
* **Librerías:**
    * `ng-apexcharts` / `chart.js` (Visualización de datos)
    * `jspdf` & `html2canvas` (Generación de reportes PDF)
    * `xlsx` (Exportación a hojas de cálculo)





<!-- # Clínica Online - Sistema de Gestión de Turnos

Este proyecto es una aplicación web desarrollada en **Angular** como trabajo final para la materia **Laboratorio de Computación IV** de la **UTN Avellaneda**. El sistema permite la gestión integral de una clínica, administrando pacientes, especialistas y turnos médicos con flujos diferenciados por rol.

## Funcionalidades y Pantallas

![registro_del_paciente](https://github.com/user-attachments/assets/91e1c598-e426-4918-8c0f-52746e302260)
![registro_del_especialista](https://github.com/user-attachments/assets/678a2dcf-94ba-440b-8928-99d6d76e0a0e)
![login](https://github.com/user-attachments/assets/e8ddb539-457f-4ce9-a4ec-3c5d6a1bac31)

![bienvenida](https://github.com/user-attachments/assets/8e4f12f1-57e4-4baa-b846-30856f019b23)
![seleccion_registro](https://github.com/user-attachments/assets/ee28483d-e969-410f-9c78-4c8376c8f400)



### Seccion del paciente

![solicitar_turno](https://github.com/user-attachments/assets/d8bfcfb4-2ca3-493b-82bd-061d3b3dfa1d)
![mis_turnos_paciente](https://github.com/user-attachments/assets/606299ca-a80a-4a6c-9773-88f6e7d34196)
![exportar_turnos_excel](https://github.com/user-attachments/assets/dce519e6-ecfa-4cb8-ad07-b3d5cc0d9b56)
![exportar_historia_clinica_PDF](https://github.com/user-attachments/assets/9585ed72-96e6-4d82-a40c-80f24436d5c4)
![completar_encuesta](https://github.com/user-attachments/assets/9b6a9a37-2990-4c9c-9912-47961817d969)
![ver_resena_asignada_al_paciente_en_turno](https://github.com/user-attachments/assets/cc1bff90-1336-4837-8dcc-af2b9a08d565)
![ver_resena](https://github.com/user-attachments/assets/39a2723c-96c9-4c4b-a9bb-ae1d1ed81832)
![solicitar_turno_solo_aparecen_los_especialistas_de_esa_especialidad](https://github.com/user-attachments/assets/4077f1c6-dd26-441d-94ce-abdcc19fdbda)
![solicitar_turno_solo_aparecen_dias_horas_disponibles](https://github.com/user-attachments/assets/cf67f0ec-4f8a-483e-9c89-9b69a8a28c44)




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
 -->
