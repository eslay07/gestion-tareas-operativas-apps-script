# Gestión de Tareas Operativas

Suite de automatización desarrollada en **Google Apps Script** sobre **Google Sheets** para centralizar tareas operativas, sincronizar información, generar alertas, controlar facturas pendientes, crear observaciones automáticas y programar recordatorios por WhatsApp mediante Green API.

![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=flat-square&logo=google&logoColor=white)
![Google Sheets](https://img.shields.io/badge/Google%20Sheets-34A853?style=flat-square&logo=googlesheets&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=000)
![HTML Service](https://img.shields.io/badge/HTML%20Service-FF5722?style=flat-square&logo=html5&logoColor=white)
![Gmail](https://img.shields.io/badge/GmailApp-EA4335?style=flat-square&logo=gmail&logoColor=white)
![WhatsApp](https://img.shields.io/badge/Green%20API%20WhatsApp-25D366?style=flat-square&logo=whatsapp&logoColor=white)

---

## Vista general

El proyecto convierte una hoja de cálculo operativa en una herramienta interna con menú personalizado, automatizaciones, formularios, dashboards, alertas, reportes, logs y módulos independientes para procesos administrativos reales.

### Menú principal del sistema

<img src="docs/screenshots/01-menu-sistema.png" alt="Menú principal del sistema" width="850">

### Task Manager

<img src="docs/screenshots/02-task-manager.png" alt="Task Manager" width="850">

### Dashboard operativo

<img src="docs/screenshots/03-dashboard.png" alt="Dashboard operativo" width="850">

### Alertas de órdenes de compra faltantes

<img src="docs/screenshots/04-alertas-oc.png" alt="Alertas de órdenes de compra faltantes" width="850">

### Facturas por compartir

<img src="docs/screenshots/05-facturas.png" alt="Facturas por compartir" width="850">

### Observaciones automáticas

<img src="docs/screenshots/06-observaciones.png" alt="Observaciones automáticas" width="850">

### WhatsApp Auto Manager

<img src="docs/screenshots/07-whatsapp-auto.png" alt="WhatsApp Auto Manager" width="850">

### Programador visual de WhatsApp

<img src="docs/screenshots/08-programador-whatsapp.png" alt="Programador visual de WhatsApp" width="850">

---

## Tabla de contenido

- [Objetivo del proyecto](#objetivo-del-proyecto)
- [Problema identificado](#problema-identificado)
- [Solución desarrollada](#solución-desarrollada)
- [Funcionalidades principales](#funcionalidades-principales)
- [Arquitectura general](#arquitectura-general)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Módulos del sistema](#módulos-del-sistema)
- [Stack técnico](#stack-técnico)
- [Hojas utilizadas](#hojas-utilizadas)
- [Flujo operativo principal](#flujo-operativo-principal)
- [Instalación](#instalación)
- [Configuración inicial](#configuración-inicial)
- [Activadores recomendados](#activadores-recomendados)
- [Configuración de WhatsApp](#configuración-de-whatsapp)
- [Seguridad y privacidad](#seguridad-y-privacidad)
- [Impacto operativo](#impacto-operativo)
- [Retos técnicos resueltos](#retos-técnicos-resueltos)
- [Roadmap](#roadmap)
- [Aprendizajes técnicos](#aprendizajes-técnicos)
- [Autor](#autor)
- [Licencia](#licencia)

---

## Objetivo del proyecto

Automatizar procesos operativos que antes dependían de revisión manual en Google Sheets, correos y seguimiento individual.

La solución permite:

- Gestionar tareas por categoría, criticidad, frecuencia y vencimiento.
- Sincronizar información entre las hojas `TAREAS` y `GENERAL`.
- Detectar tareas sin orden de compra.
- Enviar alertas automáticas por correo.
- Controlar facturas pendientes de compartir.
- Extraer datos desde correos de Gmail.
- Generar observaciones estandarizadas por tarea u orden.
- Exportar información operativa a una hoja plana `JT_EXPORT`.
- Programar mensajes automáticos por WhatsApp.
- Mantener logs de notificaciones, envíos y procesos.
- Centralizar procesos administrativos dentro de un menú único.

---

## Problema identificado

Antes del sistema, varias actividades se realizaban manualmente:

- Revisión de tareas en diferentes hojas.
- Validación manual de órdenes de compra faltantes.
- Seguimiento de facturas pendientes de compartir.
- Cruce manual entre tareas, órdenes, proveedores e ingresos.
- Generación repetitiva de observaciones.
- Recordatorios por correo o WhatsApp sin control centralizado.
- Falta de trazabilidad sobre notificaciones enviadas.
- Riesgo de omisiones por depender de revisión visual.
- Dificultad para priorizar tareas urgentes o críticas.
- Duplicidad de información entre hojas operativas.
- Pérdida de tiempo en tareas administrativas repetitivas.

Esto generaba reprocesos, errores humanos y baja visibilidad sobre pendientes críticos.

---

## Solución desarrollada

Se desarrolló una suite modular en Google Apps Script, integrada directamente en Google Sheets mediante un menú personalizado llamado **Sistema**.

Desde este menú se pueden ejecutar los principales módulos:

- Sincronización operativa.
- Task Manager.
- Alertas de órdenes de compra.
- Facturas por compartir.
- Observaciones automáticas.
- Exportación JT.
- WhatsApp Auto Manager.

La solución aprovecha servicios nativos de Google Workspace y una API externa para WhatsApp.

---

## Funcionalidades principales

### Gestión de tareas

- Creación, edición, finalización y reactivación de tareas.
- Clasificación por categoría, criticidad y frecuencia.
- Control de vencimientos, recordatorios y tareas completadas.
- Dashboard de resumen operativo.
- Envío de reportes por correo.
- Registro de notificaciones.

### Sincronización TAREAS ↔ GENERAL

- Sincronización bidireccional entre hojas.
- Actualización automática al editar.
- Cruce de datos por identificador de tarea.
- Conversión automática a mayúsculas.
- Guardado de última posición por hoja.
- Auto-scroll operativo.
- Uso de `LockService` para reducir conflictos de edición.
- Limpieza y normalización de datos.

### Alertas de órdenes de compra faltantes

- Detección automática de tareas sin OC.
- Identificación de cabeceras de tarea.
- Cálculo de antigüedad.
- Clasificación por nivel de riesgo.
- Priorización de departamentos críticos.
- Envío de correo agrupado por tarea.
- Generación de debug para revisión.
- Trigger diario configurable.

### Facturas por compartir

- Revisión automática de correos en Gmail.
- Búsqueda por remitente y asunto.
- Extracción de datos desde tablas HTML.
- Registro de facturas pendientes.
- Control de duplicados por factura e ingreso.
- Cálculo de días sin compartir.
- Clasificación de estado operativo.
- Recordatorios automáticos.
- Integración con WhatsApp.
- Etiqueta de Gmail para control de procesados.

### Observaciones automáticas

- Generación de observaciones por tarea.
- Generación de observaciones por orden de compra.
- Sidebar integrado en Google Sheets.
- Configuración de autorizadores por departamento.
- Lectura dinámica de datos desde la hoja `GENERAL`.
- Generación de textos listos para copiar y pegar.

### Exportación JT

- Exportación de ítems desde `GENERAL`.
- Creación de hoja plana `JT_EXPORT`.
- Asociación de ítems con número de tarea.
- Exportación de código, detalle, cantidad, proveedor, orden de compra, fila de origen y fecha.
- Estructura útil para análisis, filtros y reportes.

### WhatsApp Auto Manager

- Configuración de conexión con Green API.
- Sincronización de contactos.
- Gestión de contactos activos.
- Creación de plantillas.
- Programación de mensajes.
- Envíos únicos, diarios, semanales o mensuales.
- Procesamiento de cola de envíos.
- Validación de conexión.
- Logs de envío.
- Uso de variables dinámicas en plantillas.

---

## Arquitectura general

```txt
Usuario
  ↓
Google Sheets
  ↓
Menú personalizado "Sistema"
  ↓
Google Apps Script
  ├── Core del sistema
  ├── Sincronización TAREAS ↔ GENERAL
  ├── Task Manager
  ├── Alertas OC
  ├── Facturas por compartir
  ├── Observaciones automáticas
  ├── Exportación JT
  └── WhatsApp Auto Manager
  ↓
Servicios externos
  ├── Gmail
  ├── MailApp
  ├── SpreadsheetApp
  ├── HtmlService
  ├── PropertiesService
  ├── LockService
  ├── UrlFetchApp
  └── Green API
```

---

## Estructura del repositorio

```txt
gestion-tareas-operativas-apps-script/
│
├── README.md
├── CHANGELOG.md
├── LICENSE
├── .gitignore
├── .clasp.example.json
├── appsscript.example.json
│
├── src/
│   ├── 00_APP_CONFIG.example.gs
│   ├── 00_CORE_REFACTORED.gs
│   ├── 01_SYNC.gs
│   ├── 02_OC_ALERT.gs
│   ├── 03_OBSERVACIONES_V3.gs
│   ├── 04_GTX_EXPORT.gs
│   ├── 05_TASK_MANAGER.gs
│   ├── 06_FACTURAS.gs
│   ├── 07_WHATSAPP_AUTO_MANAGER.gs
│   └── WAM_PROGRAMADOR_DIALOG.html
│
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── user-guide.md
│   ├── security.md
│   └── screenshots/
│       ├── 01-menu-sistema.png
│       ├── 02-task-manager.png
│       ├── 03-dashboard.png
│       ├── 04-alertas-oc.png
│       ├── 05-facturas.png
│       ├── 06-observaciones.png
│       ├── 07-whatsapp-auto.png
│       └── 08-programador-whatsapp.png
│
└── samples/
    └── script-properties.example.json
```

---

## Módulos del sistema

### 1. Core del sistema

**Archivo:** `src/00_CORE_REFACTORED.gs`

Responsabilidades principales:

- Crear el menú principal.
- Integrar los módulos del sistema.
- Centralizar utilidades compartidas.
- Normalizar texto y valores.
- Validar celdas vacías.
- Calcular días y formatear valores.
- Limpiar triggers.
- Detectar cabeceras de tarea.
- Apoyar funciones de UI y mensajes.

Funciones destacadas:

```txt
crearMenuSistema()
onOpen(e)
onSelectionChange(e)
trigEdit(e)
installTriggers()
GENERAL_isTaskHeaderRow_()
clearTriggersByHandler_()
isBlank_()
normalizeTaskId_()
normalizeText_()
escapeHtml_()
daysBetween_()
formatMoney_()
```

### 2. Configuración base

**Archivo:** `src/00_APP_CONFIG.example.gs`

Responsabilidades principales:

- Definir zona horaria.
- Centralizar nombres de hojas.
- Mantener una única fuente de configuración.
- Evitar nombres quemados en múltiples scripts.
- Facilitar adaptación a otros entornos.

Hojas configuradas:

```txt
TAREAS
GENERAL
FAC POR COMPARTIR
Configuración
Completadas
Dashboard
Log Correos
JT_EXPORT
WA_AUTO_CFG
WA_AUTO_CONTACTOS
WA_AUTO_PROGRAMACION
WA_AUTO_PLANTILLAS
WA_AUTO_LOG
```

### 3. Sincronización

**Archivo:** `src/01_SYNC.gs`

Responsabilidades principales:

- Sincronizar datos entre `TAREAS` y `GENERAL`.
- Detectar ediciones relevantes.
- Actualizar datos relacionados.
- Convertir texto a mayúsculas.
- Guardar posiciones visitadas.
- Ejecutar auto-scroll.
- Validar configuración.
- Registrar última ejecución.

Funciones destacadas:

```txt
_SYNC_handleEdit(e)
_SYNC_handleSelectionChange(e)
_SYNC_onOpenLogic(e)
syncAllNow()
validateSetup()
showLastRun()
_SYNC_updateFromTareas()
_SYNC_updateFromGeneral()
_SYNC_buildGenMap()
_SYNC_buildTarMap()
```

### 4. Alertas de OC

**Archivo:** `src/02_OC_ALERT.gs`

Responsabilidades principales:

- Detectar tareas sin orden de compra.
- Calcular días transcurridos.
- Clasificar nivel de riesgo.
- Agrupar alertas por tarea.
- Enviar correo HTML.
- Crear trigger diario.
- Escribir información de debug.
- Priorizar departamentos críticos.

Funciones destacadas:

```txt
sendTareasSinOCEmail_V2()
createDailyTrigger_V2()
debugConteo_V2()
_OC_parseTasks()
_OC_buildHtmlEmail()
_OC_buildPlainEmail()
_OC_buildSubject()
_OC_riskByDays()
_OC_writeDebug()
```

### 5. Observaciones automáticas

**Archivo:** `src/03_OBSERVACIONES_V3.gs`

Responsabilidades principales:

- Generar observaciones para una tarea.
- Generar observaciones para una orden.
- Mostrar sidebar.
- Configurar autorizadores por departamento.
- Restaurar configuración por defecto.
- Leer datos desde `GENERAL`.
- Agrupar órdenes por proveedor.
- Preparar textos operativos listos para copiar.

Funciones destacadas:

```txt
obs3_abrirSidebar()
obs3_abrirConfigSidebar()
obs3_generarParaLaTarea(taskId)
obs3_generarParaLaOrden(taskId)
obs3_restaurarConfigAutorizadores()
obs3_restaurarConfigPorDefectoConfirm()
OBS3_addToSistemaMenu_()
```

### 6. Exportación JT

**Archivo:** `src/04_GTX_EXPORT.gs`

Responsabilidades principales:

- Leer ítems de la hoja `GENERAL`.
- Detectar tareas.
- Crear hoja `JT_EXPORT`.
- Exportar registros planos.
- Guardar fila de origen.
- Registrar fecha de exportación.
- Preparar información para análisis o integración externa.

Funciones destacadas:

```txt
GTX_exportNow()
GTX_setupTrigger_5min()
GTX_deleteTriggers()
```

### 7. Task Manager

**Archivo:** `src/05_TASK_MANAGER.gs`

Responsabilidades principales:

- Inicializar hojas del gestor.
- Crear, editar, completar y reactivar tareas.
- Gestionar categorías.
- Aplicar formato visual.
- Colorear por criticidad.
- Enviar resumen diario y semanal.
- Registrar logs de correos.
- Mostrar formularios HTML.
- Mantener dashboard operativo.

Funciones destacadas:

```txt
inicializarHojas()
mostrarFormularioNuevaTarea()
gestionarCategorias()
obtenerCategorias()
aplicarFormato()
colorearPorCriticidad()
enviarResumenDiario()
enviarResumenSemanal()
actualizarDashboard()
```

### 8. Facturas por compartir

**Archivo:** `src/06_FACTURAS.gs`

Responsabilidades principales:

- Leer correos relacionados con facturas.
- Extraer datos desde contenido HTML.
- Registrar facturas pendientes.
- Evitar duplicados.
- Controlar estados.
- Enviar recordatorios.
- Registrar trazabilidad.

Funciones destacadas:

```txt
FAC_procesarCorreos()
FAC_enviarRecordatorios()
FAC_actualizarEstados()
FAC_marcarComoCompartida()
FAC_crearTrigger()
FAC_eliminarTriggers()
```

### 9. WhatsApp Auto Manager

**Archivo:** `src/07_WHATSAPP_AUTO_MANAGER.gs`

Responsabilidades principales:

- Administrar configuración de Green API.
- Sincronizar contactos.
- Crear y administrar plantillas.
- Programar mensajes.
- Procesar cola de envíos.
- Validar conexión.
- Registrar logs.
- Gestionar variables dinámicas.

Funciones destacadas:

```txt
WAM_abrirManager()
WAM_guardarConfig()
WAM_probarConexion()
WAM_sincronizarContactos()
WAM_crearPlantilla()
WAM_programarMensaje()
WAM_procesarCola()
WAM_crearTrigger()
WAM_eliminarTriggers()
```

---

## Stack técnico

| Tecnología | Uso |
|---|---|
| Google Apps Script | Automatización principal |
| JavaScript | Lógica del sistema |
| Google Sheets | Interfaz operativa y almacenamiento |
| GmailApp | Lectura de correos |
| MailApp | Envío de alertas |
| HtmlService | Formularios, sidebars y diálogos |
| PropertiesService | Configuración persistente |
| LockService | Control de concurrencia |
| UrlFetchApp | Integración con Green API |
| Green API | Envío de mensajes por WhatsApp |
| clasp | Versionamiento local opcional |

---

## Hojas utilizadas

| Hoja | Propósito |
|---|---|
| `TAREAS` | Gestión principal de tareas |
| `GENERAL` | Información operativa consolidada |
| `FAC POR COMPARTIR` | Control de facturas pendientes |
| `Configuración` | Categorías y parámetros |
| `Completadas` | Historial de tareas cerradas |
| `Dashboard` | Indicadores y resumen |
| `Log Correos` | Registro de notificaciones |
| `JT_EXPORT` | Exportación plana de información |
| `WA_AUTO_CFG` | Configuración de WhatsApp |
| `WA_AUTO_CONTACTOS` | Contactos sincronizados |
| `WA_AUTO_PROGRAMACION` | Mensajes programados |
| `WA_AUTO_PLANTILLAS` | Plantillas de mensajes |
| `WA_AUTO_LOG` | Logs de WhatsApp |

---

## Flujo operativo principal

```txt
1. El usuario trabaja en Google Sheets.
2. El menú "Sistema" carga los módulos disponibles.
3. El usuario crea, consulta o actualiza tareas.
4. El sistema sincroniza datos entre hojas.
5. Los módulos detectan pendientes, facturas u órdenes sin OC.
6. Se generan alertas, observaciones o reportes.
7. Los triggers ejecutan procesos programados.
8. Los logs registran cada operación relevante.
```

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/eslay07/gestion-tareas-operativas-apps-script.git
cd gestion-tareas-operativas-apps-script
```

### 2. Instalar clasp

```bash
npm install -g @google/clasp
clasp login
```

### 3. Configurar el proyecto

Copiar los archivos de ejemplo y completar los valores reales en el entorno privado:

```bash
cp .clasp.example.json .clasp.json
cp appsscript.example.json appsscript.json
cp samples/script-properties.example.json samples/script-properties.local.json
```

### 4. Subir a Apps Script

```bash
clasp push
```

---

## Configuración inicial

En Google Sheets:

1. Crear o abrir la hoja operativa.
2. Vincular el proyecto de Apps Script.
3. Agregar los archivos `.gs` y `.html`.
4. Ejecutar `onOpen()` o recargar la hoja.
5. Verificar que aparezca el menú **Sistema**.
6. Ejecutar la configuración inicial del Task Manager.
7. Validar que existan las hojas requeridas.
8. Revisar permisos de Gmail, Sheets y servicios externos.

---

## Activadores recomendados

| Proceso | Frecuencia sugerida |
|---|---|
| Sincronización operativa | Al editar |
| Alertas OC | Diario |
| Facturas por compartir | Cada 15 a 60 minutos |
| Exportación JT | Cada 5 minutos, si aplica |
| WhatsApp Auto Manager | Cada 5 a 15 minutos |
| Reporte diario | Diario |
| Reporte semanal | Semanal |

---

## Configuración de WhatsApp

El módulo de WhatsApp requiere una cuenta activa de Green API.

Parámetros necesarios:

- `INSTANCE_ID`
- `API_TOKEN`
- Número autorizado.
- Contactos sincronizados.
- Plantillas configuradas.
- Trigger de procesamiento activo.

> Los tokens, IDs reales y credenciales no deben subirse al repositorio.

---

## Seguridad y privacidad

Este repositorio no debe contener:

- Correos reales.
- Tokens de API.
- IDs de instancias.
- Contraseñas.
- Datos internos de proveedores.
- Información financiera real.
- URLs privadas.
- Nombres sensibles de colaboradores.

Para publicar el proyecto se usan archivos `.example` y datos ficticios.

---

## Impacto operativo

El sistema permite:

- Reducir revisión manual.
- Mejorar trazabilidad.
- Centralizar procesos repetitivos.
- Disminuir riesgo de omisiones.
- Priorizar tareas críticas.
- Agilizar generación de observaciones.
- Automatizar recordatorios.
- Estandarizar reportes.
- Convertir una hoja de cálculo en una herramienta operativa interna.

---

## Retos técnicos resueltos

- Modularización de scripts que inicialmente estaban dispersos.
- Sincronización entre hojas con estructuras diferentes.
- Prevención de conflictos mediante `LockService`.
- Manejo de triggers instalables.
- Extracción de datos desde correos HTML.
- Control de duplicados.
- Generación dinámica de textos operativos.
- Integración con API externa desde Apps Script.
- Separación entre configuración real y archivos públicos.
- Documentación del proyecto para portafolio profesional.

---

## Roadmap

- Agregar panel web independiente.
- Migrar logs a una base persistente.
- Incorporar roles por usuario.
- Mejorar validaciones de seguridad.
- Agregar pruebas unitarias para funciones críticas.
- Implementar control avanzado de errores.
- Agregar dashboard histórico.
- Integrar exportación a Looker Studio.
- Mejorar documentación técnica por módulo.
- Automatizar despliegue con clasp.

---

## Aprendizajes técnicos

Este proyecto fortaleció competencias en:

- Automatización con Google Apps Script.
- Diseño modular de soluciones internas.
- Integración con servicios de Google Workspace.
- Procesamiento de correos.
- Manejo de triggers.
- Consumo de APIs externas.
- Normalización de datos.
- Diseño de flujos operativos.
- Documentación técnica para portafolio.
- Publicación segura de proyectos internos.

---

## Autor

**Jimmy Omar Toapanta Guayanay**  
Ingeniero Informático  
Quito, Ecuador

Proyecto desarrollado como iniciativa interna para optimizar procesos administrativos y operativos mediante automatización con Google Apps Script.

---

## Licencia

Este proyecto se publica con fines de documentación técnica y portafolio profesional.

Revisar el archivo `LICENSE` para más información.
