# Roadmap del Proyecto - Clínica Online

Este documento refleja el plan de trabajo para ir desde el **estado actual** (`DOCUMENTACION.md`) hacia el **objetivo** (`CONSIGNA.md`).

**Última actualización**: 2025-11-11

---

## 📊 Resumen de Progreso

| Sprint | Requerimientos Mínimos | Funcionalidades | Estado General |
|--------|----------------------|-----------------|----------------|
| Sprint 1 | ✅ Completo | ✅ Completo | 🟢 Finalizado |
| Sprint 2 | ✅ Completo | ✅ Completo | 🟢 Finalizado |
| Sprint 3 | ✅ Completo | ✅ Completo | 🟢 Finalizado |
| Sprint 4 | ✅ Completo | ✅ Completo | ✅ Completo |
| Sprint 5 | ❌ No iniciado | ❌ No iniciado | 🔴 Pendiente |
| Sprint 6 | ⚠️ Parcial | ⚠️ Parcial | 🟡 En progreso |

**Leyenda**: ✅ Completado | 🟡 En progreso | ❌ Pendiente | ⚠️ Parcial

**Estado local**: ✅ Servidor Angular corriendo en http://localhost:4201 con Supabase local

---

## Sprint 1 - Autenticación y Gestión de Usuarios

### Requerimientos Mínimos

- [x] **Favicon**
  - Estado: ✅ Implementado
  - Ubicación: `public/favicon.ico`

- [ ] **Subido a la web** *(queda diferido hasta que definamos entorno de producción)*
  - Estado: ❌ Pendiente
  - Notas: Necesita deployment (Vercel, Netlify, Firebase Hosting, etc.)

- [x] **Sistema de loading global**
  - Estado: ✅ Implementado
  - Ubicación: `loading-overlay/`, `loading.service.ts`, `loading.interceptor.ts`
  - Notas: Sistema completo de loading implementado

### Funcionalidades

- Registro paciente y especialista con imágenes, cálculo de edad y validaciones completas
- Login con quick logins configurables, verificación según rol y flujo de aprobación de especialistas
- Módulo `Usuarios Admin` con alta de usuarios (paciente, especialista, admin), aprobación y exportación a Excel
- Bienvenida con accesos a login/registro y ruta protegida con guard para administradores

---

## Sprint 2 - Gestión de Turnos

### Requerimientos Mínimos

- [x] Captcha implementado en formularios de registro
- [x] README actualizado con descripción, accesos y capturas

### Funcionalidades

- `Mis Turnos` (paciente y especialista) con filtros, acciones y controles de estado
- `Turnos Admin` con gestión global y cancelación
- `Solicitar Turno` sin datepicker y con lógica por disponibilidad
- `Mi Perfil` con datos, horarios (especialistas) e historia clínica

---

## Sprint 3 - Historia Clínica y Mejoras

### Requerimientos Mínimos

- [x] Descarga de usuarios en Excel (Admin)
- [x] PDF con historia clínica (Paciente)
- [x] Animaciones de transición entre rutas clave

### Funcionalidades

- Historia clínica completa: carga desde especialista, visualización en paciente, admin y especialista
- Búsqueda enriquecida en turnos (incluye datos de historia clínica)
- Descargas (Excel/PDF) y animaciones aplicadas en router-outlet

---

## Sprint 4 - Gráficos y Estadísticas

### Requerimientos Mínimos

- [x] Pipes adicionales (LocalDate, StatusLabel, RoleLabel)
- [x] Directivas solicitadas (AutoFocus, ElevateOnHover, StatusBadge)

### Funcionalidades

#### Gráficos y Estadísticas (Solo Administrador)
- [x] Componente existe: `estadisticas/`
- [x] Chart.js instalado
- [x] Informes requeridos:
  - [x] Log de ingresos al sistema (usuario, día, horario)
  - [x] Cantidad de turnos por especialidad
  - [x] Cantidad de turnos por día
  - [x] Cantidad de turnos solicitados por médico (lapso de tiempo)
  - [x] Cantidad de turnos finalizados por médico (lapso de tiempo)
- [x] Descarga de gráficos/informes:
  - [x] Excel
  - [x] PDF
- [x] Estética refinada (paleta coherente, gradientes, tooltips custom)
- [x] Mensaje de “sin datos” cuando aún no hay actividad registrada
- [ ] QA de descargas y dataset real (pendiente)

---

## Sprint 5 - Mejoras en Historia Clínica y Captcha

### Funcionalidades

#### Nuevos Datos Dinámicos en Historia Clínica
- [ ] Agregar 3 nuevos datos dinámicos:
  - [ ] Control de rango entre 0 y 100
  - [ ] Cuadro de texto numérico
  - [ ] Switch con "Si" o "No"

#### Captcha Propio
- [ ] Generar directiva de captcha propio
- [ ] Comunicación Input/Output con componente contenedor
- [ ] Utilizar en toda operación de alta (paciente y profesional)
- [ ] Opción para deshabilitar captcha

#### Animaciones de Transición
- [ ] Aplicar al menos 6 animaciones de transición entre componentes
- Estado actual: 1 animación (bienvenida)
- Pendientes: 5 animaciones más

---

## Sprint 6 - Internacionalización y Encuestas

### Funcionalidades

#### Idiomas
- [x] @ngx-translate instalado
- [ ] Implementar traducciones:
  - [ ] Inglés
  - [ ] Español
  - [ ] Portugués
- [ ] Traducir mínimo 3 pantallas del sistema

#### Encuesta de Atención
- [x] Componente existe: `encuesta-atencion/`
- [ ] Verificar controles requeridos (mínimo 5):
  - [ ] SOLO UN cuadro de texto
  - [ ] Estrellas para calificar
  - [ ] Radio button
  - [ ] Check box
  - [ ] Control de rango
- [ ] Requisito: Datos de mínimo 30 días con acciones

#### Informes Estadísticos Adicionales
- [ ] Cantidad de visitas que tuvo la clínica
- [ ] Cantidad de pacientes por especialidad
- [ ] Cantidad de médicos por especialidad
- [ ] Informe basado en encuesta al cliente (respuestas)
- [ ] Informe por cantidad de visitas (seleccionar paciente, mostrar todos los turnos)
- [ ] Cantidad de pacientes por especialidad (descargar imagen del gráfico)
- [ ] Cantidad de médicos por especialidad (descargar imagen del gráfico)

---

## 🔧 Tareas Técnicas Generales

### Problemas Identificados a Resolver

- [ ] **Código comentado extensivo**
  - Limpiar código legacy y mover ejemplos a documentación técnica

- [ ] **Servicios de autenticación**
  - Revisar `AuthService` vs `SupabaseService` y consolidar responsabilidades

- [ ] **Guardias adicionales**
  - Evaluar guard por rol para rutas de paciente/especialista

- [ ] **Servicio Firestore**
  - Confirmar si sigue en uso; eliminar si quedó obsoleto tras migrar a Supabase

### Mejoras de Arquitectura

- [ ] Documentación de API de servicios
- [ ] Tests unitarios para servicios críticos
- [ ] Manejo centralizado de errores
- [ ] Validación de roles en guards específicos

---

## 📝 Notas de Implementación

### Restricciones Técnicas Importantes

- ⚠️ **NO UTILIZAR Combobox** en filtros de turnos
- ⚠️ **NO UTILIZAR Datepicker** en solicitud de turnos

### Estados de Turno

- Pendiente
- Aceptado
- Realizado
- Cancelado
- Rechazado

### Prioridades Sugeridas

1. **Alta Prioridad**: Sprint 4 (pipes, directivas, informes con Chart.js)
2. **Media Prioridad**: Sprint 5 (mejoras en historia clínica y captcha propio)
3. **Baja Prioridad**: Sprint 6 (i18n, encuestas avanzadas, informes adicionales)

---

*Este roadmap se actualizará conforme se vayan completando las tareas.*

