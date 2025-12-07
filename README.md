# Clínica Online - Sistema de Gestión de Turnos

Este proyecto es una aplicación web desarrollada en **Angular** como trabajo final para la materia **Laboratorio de Computación IV** de la **UTN Avellaneda**. El sistema permite la gestión integral de una clínica, administrando pacientes, especialistas y turnos médicos con flujos diferenciados por rol.

---

## Funcionalidades y Pantallas

### 1. Acceso y Seguridad (Sprint 1)
La aplicación cuenta con una **Página de Bienvenida** con accesos rápidos. El sistema de autenticación incluye verificación de email y aprobación administrativa para especialistas


![bienvenida](https://github.com/user-attachments/assets/85848919-d43a-40fc-a0ff-5682e6435df1)


#### Login y Registro
  **Registro de Pacientes:** Se capturan datos personales, obra social y dos imágenes de perfil


  ![registro_del_paciente](https://github.com/user-attachments/assets/698c4471-d866-4eed-8420-d1a77162a3f8)

  **Registro de Especialistas:** Permite seleccionar o añadir especialidades dinámicamente
  ![registro_del_especialista](https://github.com/user-attachments/assets/5d20a719-21f5-4f42-a77f-9c5753d4937b)

  **Captcha:** Implementado en los registros para mayor seguridad



---![login](https://github.com/user-attachments/assets/a182623e-1525-48ae-bcfe-5c6a787a3560)


### 2. Módulo de Pacientes (Sprint 2 & 3)
Los pacientes pueden gestionar su atención médica de forma autónoma.

#### Solicitar Turno
[cite_start]Un asistente paso a paso (wizard) permite seleccionar especialidad, médico y horario disponible (próximos 15 días), sin utilizar `combobox` y con validaciones de disponibilidad[cite: 159, 160, 164].

> `![Pantalla Solicitar Turno](ruta/a/tu/imagen_solicitar_turno.png)`

#### Mis Turnos y Perfil
* [cite_start]Visualización de turnos con filtro único (por especialidad o especialista)[cite: 96, 97].
* [cite_start]Acciones disponibles: Cancelar turno, ver reseña, completar encuesta y calificar atención[cite: 101, 102, 106].
* [cite_start]**Perfil:** Descarga de **Historia Clínica en PDF** con logo de la clínica[cite: 183, 184].

> `![Pantalla Mis Turnos Paciente](ruta/a/tu/imagen_mis_turnos_paciente.png)`

---

### 3. Módulo de Especialistas (Sprint 2 & 3)
Los médicos cuentan con herramientas para administrar su agenda y pacientes.

#### Gestión de Turnos y Agenda
* [cite_start]**Mis Horarios:** El especialista define su disponibilidad horaria por especialidad[cite: 175, 176].
* [cite_start]**Administración de Turnos:** Permite Aceptar, Rechazar o Finalizar turnos dejando reseñas diagnósticas[cite: 120, 134, 136].

> `![Pantalla Gestión Especialista](ruta/a/tu/imagen_gestion_especialista.png)`

#### Carga de Historia Clínica
[cite_start]Al finalizar un turno, el especialista carga la historia clínica compuesta por datos fijos (altura, peso, temperatura, presión) y datos dinámicos variables[cite: 192, 195, 202].

> `![Pantalla Historia Clínica](ruta/a/tu/imagen_historia_clinica.png)`

---

### 4. Módulo de Administración (Sprint 1 & 4)
Panel de control exclusivo para gestionar la clínica.

#### Gestión de Usuarios
[cite_start]Visualización de todos los usuarios con capacidad de habilitar o inhabilitar el acceso a Especialistas[cite: 69, 72]. [cite_start]Incluye descarga de nómina en Excel[cite: 182].

> `![Pantalla Sección Usuarios](ruta/a/tu/imagen_usuarios_admin.png)`

#### Estadísticas e Informes
[cite_start]Panel gráfico (Charts) con posibilidad de descarga en Excel o PDF[cite: 228]. Incluye:
* [cite_start]Log de ingresos al sistema[cite: 221].
* [cite_start]Cantidad de turnos por especialidad y por día[cite: 224, 225].
* [cite_start]Informes de turnos solicitados y finalizados por médico[cite: 226, 227].

> `![Pantalla Estadísticas](ruta/a/tu/imagen_estadisticas.png)`

---

## Características Técnicas Adicionales
* [cite_start]**Animaciones:** Transiciones entre componentes (mínimo 6 aplicadas)[cite: 245].
* [cite_start]**Directivas y Pipes:** Personalizados para mejorar la UX/UI[cite: 217, 218].
* [cite_start]**Captcha Propio:** Implementado como directiva reutilizable[cite: 236].
* [cite_start]**Multilenguaje (Sprint 6):** Soporte para Español, Inglés y Portugués[cite: 254, 255].
* [cite_start]**Encuestas:** Sistema de encuestas de satisfacción con diversos controles[cite: 262].

---

### 🛠 Tecnologías Utilizadas
* **Frontend:** Angular (Framework).
* **Base de Datos:** Firebase (Firestore).
* **Almacenamiento:** Firebase Storage (Imágenes de perfil).
* **Autenticación:** Firebase Auth.
* **Librerías:** `chart.js` (Gráficos), `jspdf` (Reportes), `xlsx` (Excel).
  
