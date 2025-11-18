Deploy: https://clinica-2025-recur.web.app/

# Clínica Online (Angular)

**README para personas no técnicas**

> Trabajo práctico de **Laboratorio de Computación IV – UTN Avellaneda**. Este documento explica, en lenguaje simple, qué hace la aplicación, qué pantallas tiene y cómo usarlas según tu rol (Paciente, Especialista o Administrador). La clínica del caso de estudio abre de **lunes a viernes 8:00–19:00** y **sábados 8:00–14:00**; cuenta con **6 consultorios**, **2 laboratorios** y **una sala de espera**. Los turnos se solicitan por la web y los profesionales pueden tener **una o más especialidades**. 

---

## Contenidos

* [¿Qué es Clínica Online?](#qué-es-clínica-online)
* [Roles y permisos](#roles-y-permisos)
* [Cómo empezar (paso a paso)](#cómo-empezar-paso-a-paso)
* [Pantallas y qué contiene cada una](#pantallas-y-qué-contiene-cada-una)
* [Flujos frecuentes por rol](#flujos-frecuentes-por-rol)
* [Estados de un turno (glosario)](#estados-de-un-turno-glosario)
* [Descargas (PDF/Excel) e informes](#descargas-pdfexcel-e-informes)
* [Idiomas y accesibilidad](#idiomas-y-accesibilidad)
* [Preguntas frecuentes y solución de problemas](#preguntas-frecuentes-y-solución-de-problemas)
* [Créditos](#créditos)

---

## ¿Qué es Clínica Online?

Es un sistema web para gestionar **turnos médicos**, **usuarios** (pacientes, especialistas y administradores) y **documentación clínica**. Permite registrarse, iniciar sesión, pedir turnos, atender pacientes, registrar historia clínica y ver estadísticas de uso. (Resumen de la **página 1** de la consigna). 

---

## Roles y permisos

Cada persona ingresa con un perfil y ve solamente lo que corresponde a su rol:

| Rol               | Qué puede hacer                                                                                                                                                                                    | Dónde lo hace                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Paciente**      | Registrarse y **verificar su email** para ingresar; solicitar turnos; **ver/cancelar** sus turnos (según estado); **calificar** la atención; **completar encuestas**; ver su **historia clínica**. | *Registro*, *Login*, *Solicitar turno*, *Mis turnos*, *Mi perfil*.  |
| **Especialista**  | Registrarse y **ser habilitado por un administrador** tras verificar su email; **definir horarios**; **aceptar/rechazar/finalizar** turnos; **cargar historia clínica**; ver turnos asignados.     | *Registro*, *Login*, *Mis horarios* (en *Mi perfil*), *Mis turnos*. |
| **Administrador** | Ver/crear usuarios (incluye crear **Administradores**), **habilitar/inhabilitar** especialistas; ver **todos los turnos** y cancelarlos cuando corresponda; **generar informes y estadísticas**.   | *Usuarios*, *Turnos*, *Solicitar turno*, *Informes/Estadísticas*.   |

Condiciones importantes de acceso (ver **página 2**):

* Paciente: **solo ingresa si verificó su email** al registrarse.
* Especialista: **solo ingresa si un Administrador lo aprobó** y su email fue verificado. 

---

## Cómo empezar (paso a paso)

1. **Entrar a la página de bienvenida**
   Desde aquí verás los accesos a **Registrarse** e **Iniciar sesión**. (Sprint 1 / **página 2**). 

2. **Registrarte**

   * **Paciente:** nombre, apellido, edad, DNI, obra social, email, contraseña y **2 fotos** de perfil.
   * **Especialista:** nombre, apellido, edad, DNI, **especialidad** (elegir o **agregar** si no existe), email, contraseña y **foto** de perfil.
     Se validan los datos y se utiliza **captcha** en el registro. (Sprint 2 / **páginas 2–3**). 

3. **Verificar el email**
   Obligatorio para Paciente y Especialista (requisito de ingreso). (**página 2**). 

4. **Inicio de sesión (Login)**
   Con tu email y contraseña. Hay **botones de acceso rápido** (atajos) en la pantalla de login. (**página 2**). 

5. **Primeros pasos según tu rol**

   * Paciente: ve a **Solicitar turno** o **Mis turnos**.
   * Especialista: completa **Mis horarios** en **Mi perfil**. (**página 5**).
   * Administrador: gestiona **Usuarios** y **Turnos**. (**páginas 2, 4**). 

---

## Pantallas y qué contiene cada una

### 1) **Página de bienvenida**

Accesos directos a **Login** y **Registro**. (**página 2**). 

### 2) **Registro**

Formulario para crear cuentas de **Paciente** y **Especialista** (con validaciones). El especialista puede **elegir o crear** su especialidad. (**página 2**). 

### 3) **Login**

Permite ingresar al sistema. Incluye **botones de acceso rápido**. (Requiere email verificado; además, el Especialista necesita **aprobación de Administrador**). (**página 2**). 

### 4) **Usuarios** *(solo Administrador)*

Lista de usuarios con opción de **habilitar/inhabilitar** Especialistas y **crear** nuevos usuarios (incluye **Administrador**). (**páginas 2–3**). 

### 5) **Mis turnos**

* **Paciente:** ve solo **sus** turnos. Puede **filtrar** por **Especialidad** o **Especialista** (un filtro a la vez) y realizar acciones visibles **según el estado** del turno:
  **Cancelar** (si no fue realizado), **ver reseña**, **completar encuesta** (si el especialista marcó “realizado”), **calificar atención** (tras el turno). (**página 3**). 
* **Especialista:** ve **sus turnos** asignados. Puede **filtrar** por **Especialidad** o **Paciente** y: **Cancelar** (si no fue aceptado/realizado/rechazado), **Rechazar**, **Aceptar**, **Finalizar** (al finalizar debe dejar **reseña/diagnóstico**), **Ver reseña**. El **estado** del turno se ve claramente. (**páginas 3–4**). 

### 6) **Turnos** *(solo Administrador)*

Vista general de **todos** los turnos de la clínica. Filtro por **Especialidad** o **Especialista**. Acción disponible: **Cancelar** (si el turno no fue aceptado/realizado/rechazado). (**página 4**). 

### 7) **Solicitar turno**

Disponible para **Paciente** y **Administrador**. Seleccionar **Especialidad**, **Especialista**, **día y horario** dentro de los **próximos 15 días**, respetando la **disponibilidad** del especialista. El Administrador además elige el **Paciente**. (**página 4**). 

### 8) **Mi perfil**

Datos personales y, para Pacientes, acceso a su **Historia clínica**.
**Mis horarios:** visible solo para **Especialista**, para cargar su **disponibilidad** (puede tener más de una especialidad). (**página 5**). 

### 9) **Historia clínica**

La completa el **Especialista al finalizar** la atención. Tiene **4 datos fijos** (altura, peso, temperatura, presión) y hasta **3 datos dinámicos** (clave/valor). La ven: el **Paciente** (en *Mi perfil*), el **Administrador** (en *Usuarios*) y los **Especialistas** que hayan atendido al paciente al menos una vez (en *Pacientes*). (**página 5**). 

### 10) **Informes y estadísticas** *(Administrador)*

Incluye: **Log de ingresos** (quién entró y cuándo), **turnos por especialidad**, **turnos por día**, **turnos solicitados por médico** y **finalizados por médico** en un período; los **gráficos** e informes se pueden **descargar** en **Excel o PDF**. (**página 6**). 

---

## Flujos frecuentes por rol

### Paciente

1. **Registrarse** → verificar email → **Iniciar sesión**.
2. **Solicitar turno** (elige especialidad, médico y horario).
3. En **Mis turnos**:

   * **Cancelar** si aún **no fue realizado**.
   * Tras la atención: **calificar** y **completar encuesta**; **ver reseña** si el especialista escribió comentarios. (**página 3**). 

### Especialista

1. **Registrarse** → verificar email → esperar **aprobación del Administrador** → **Iniciar sesión**.
2. En **Mi perfil** → **Mis horarios** (cargar disponibilidad).
3. En **Mis turnos**: **Aceptar** / **Rechazar** solicitudes; **Cancelar** si todavía no fue aceptado/realizado/rechazado; **Finalizar** un turno aceptado dejando **reseña/diagnóstico**; **Ver reseña** cuando exista. (**páginas 3–4**). 

### Administrador

1. En **Usuarios**: **habilitar** especialistas nuevos; crear usuarios (incluye **Administrador**).
2. En **Turnos**: ver todos y **cancelar** si corresponde.
3. En **Informes**: revisar **estadísticas** y **descargar** reportes. (**páginas 2, 4, 6**). 

---

## Estados de un turno (glosario)

* **Pendiente**: creado, a la espera de decisión del especialista.
* **Aceptado**: confirmado por el especialista.
* **Rechazado**: no será atendido por el especialista.
* **Cancelado**: anulado antes de realizarse (según reglas por rol).
* **Realizado**: el paciente fue atendido; queda habilitada **reseña**, **calificación** y **encuesta**. (Estados y reglas de visibilidad resumidos de **páginas 3–4**). 

---

## Descargas (PDF/Excel) e informes

* **Usuarios → Exportar Excel** (solo Administrador) **o**
* **Mi perfil (Paciente) → Descargar historia clínica en PDF** con **logo**, **título** y **fecha de emisión**. (Sprint 3 / **página 5**). 
* **Informes/Estadísticas**: además de ver gráficos, se pueden **descargar** en **Excel/PDF**. (Sprint 4 / **página 6**). 
* **Estadísticas adicionales**: cantidad de visitas, pacientes por especialidad, médicos por especialidad, e informes basados en la **encuesta de atención**; con opción de **descargar imagen del gráfico**. (Sprint 6 / **página 7**). 

---

## Idiomas y accesibilidad

El sistema ofrece **Español**, **Inglés** y **Portugués** (mínimo **3 pantallas traducidas**). También incorpora **animaciones de transición** para una navegación más fluida. (Sprints 5–6 / **páginas 6–7**). 

---

## Preguntas frecuentes y solución de problemas

* **No puedo ingresar. ¿Qué reviso?**

  * Paciente: asegurate de **verificar el email**.
  * Especialista: además de verificar email, debe **habilitarte un Administrador**. (**página 2**). 

* **No me aparece la opción “Aceptar” o “Finalizar”.**

  * Solo se muestran **las acciones válidas para el estado actual** del turno. Por ejemplo, **Finalizar** aparece **solo** si el turno fue **Aceptado**. (**página 4**). 

* **¿Cuándo puedo cancelar un turno?**

  * **Paciente**: si el turno **no fue realizado**. (**página 3**).
  * **Especialista/Admin**: si el turno **no fue aceptado, realizado o rechazado**. (**página 4**). 

* **¿Para qué sirve la encuesta de atención?**
  Recoge la **satisfacción del paciente** (texto libre, estrellas, radio, checkbox, rango, etc.) y luego aparece en **informes estadísticos**. (Sprint 6 / **página 7**). 

* **Veo un control “captcha”. ¿Es normal?**
  Sí. Se usa en el **registro** y en altas realizadas por paciente/profesional; se puede **deshabilitar** desde la configuración prevista por el proyecto. (Sprints 2 y 5 / **páginas 3 y 6**). 

---

## Créditos

Este proyecto sigue la **consigna oficial “Clínica Online 2025”** de la materia. Este README resume esas pautas para usuarios finales y no incluye pasos técnicos ni código. 



