Gestión de Tareas Operativas — Google Apps Script Automation Suite
![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Google Sheets](https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=googlesheets&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000)
![HTML Service](https://img.shields.io/badge/HTML%20Service-FF5722?style=for-the-badge&logo=html5&logoColor=white)
![Gmail](https://img.shields.io/badge/GmailApp-EA4335?style=for-the-badge&logo=gmail&logoColor=white)
![WhatsApp](https://img.shields.io/badge/Green%20API%20WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
Suite operativa desarrollada en Google Apps Script sobre Google Sheets para centralizar la gestión de tareas, sincronizar información entre hojas, generar alertas de órdenes de compra faltantes, controlar facturas pendientes, crear observaciones automáticas y programar recordatorios por WhatsApp mediante Green API.
El proyecto transforma una hoja de cálculo operativa en una herramienta interna con menú personalizado, automatizaciones, triggers, formularios, dashboards, alertas, reportes, logs y módulos independientes para procesos administrativos reales.
---
Vista general del sistema
Menú principal del sistema
![Menú principal del sistema](docs/screenshots/01-menu-sistema.png)
Task Manager
![Task Manager](docs/screenshots/02-task-manager.png)
Dashboard operativo
![Dashboard operativo](docs/screenshots/03-dashboard.png)
Alertas de órdenes de compra faltantes
![Alertas OC](docs/screenshots/04-alertas-oc.png)
Facturas por compartir
![Facturas por compartir](docs/screenshots/05-facturas.png)
Observaciones automáticas
![Observaciones automáticas](docs/screenshots/06-observaciones.png)
WhatsApp Auto Manager
![WhatsApp Auto Manager](docs/screenshots/07-whatsapp-auto.png)
Programador visual de WhatsApp
![Programador WhatsApp](docs/screenshots/08-programador-whatsapp.png)
---
Tabla de contenido
Objetivo del proyecto
Problema identificado
Solución desarrollada
Funcionalidades principales
Arquitectura general
Estructura del repositorio
Módulos del sistema
Stack técnico
Hojas utilizadas
Flujo operativo principal
Instalación
Configuración inicial en Google Sheets
Activadores recomendados
Configuración de WhatsApp
Seguridad y privacidad
Capturas requeridas
Impacto operativo
Retos técnicos resueltos
Roadmap
Aprendizajes técnicos
Autor
Licencia
---
Objetivo del proyecto
El objetivo principal fue automatizar procesos operativos que antes dependían de revisión manual en Google Sheets, correos y seguimiento individual.
La solución permite:
Gestionar tareas por categoría, criticidad, frecuencia y vencimiento.
Sincronizar información entre las hojas `TAREAS` y `GENERAL`.
Detectar tareas sin orden de compra.
Enviar alertas automáticas por correo.
Controlar facturas pendientes de compartir.
Extraer datos desde correos de Gmail.
Generar observaciones estandarizadas por tarea u orden.
Exportar información operativa a una hoja plana `JT_EXPORT`.
Programar mensajes automáticos por WhatsApp.
Mantener logs de notificaciones, envíos y procesos.
Centralizar procesos administrativos dentro de un menú único.
---
Problema identificado
Antes del sistema, varias actividades se realizaban manualmente:
Revisión de tareas en diferentes hojas.
Validación manual de órdenes de compra faltantes.
Seguimiento de facturas pendientes de compartir.
Cruce manual entre tareas, órdenes, proveedores e ingresos.
Generación repetitiva de observaciones.
Recordatorios por correo o WhatsApp sin control centralizado.
Falta de trazabilidad sobre notificaciones enviadas.
Riesgo de omisiones por depender de revisión visual.
Dificultad para priorizar tareas urgentes o críticas.
Duplicidad de información entre hojas operativas.
Pérdida de tiempo en tareas administrativas repetitivas.
Esto generaba pérdida de tiempo, reprocesos, errores humanos y dificultad para priorizar pendientes.
---
Solución desarrollada
Se desarrolló una suite modular en Google Apps Script, integrada directamente en Google Sheets mediante un menú personalizado llamado Sistema.
Desde este menú se pueden ejecutar los principales módulos:
Sincronización operativa.
Task Manager.
Alertas de órdenes de compra.
Facturas por compartir.
Observaciones automáticas.
Exportación JT.
WhatsApp Auto Manager.
La solución aprovecha servicios nativos de Google Workspace y una API externa para WhatsApp.
---
Funcionalidades principales
Gestión de tareas
Creación de tareas operativas.
Clasificación por categoría.
Criticidad:
Baja.
Media.
Alta.
Crítica.
Frecuencia:
Única.
Diaria.
Semanal.
Mensual.
Fecha de vencimiento.
Hora de recordatorio.
Tareas pendientes.
Tareas vencidas.
Tareas de hoy.
Tareas de la semana.
Tareas completadas.
Reactivación de tareas.
Dashboard de resumen.
Envío de reportes por correo.
Log de notificaciones.
---
Sincronización TAREAS ↔ GENERAL
Sincronización bidireccional entre hojas.
Actualización automática al editar.
Cruce de datos por identificador de tarea.
Conversión automática a mayúsculas.
Validación de configuración.
Guardado de última posición por hoja.
Auto-scroll operativo.
Registro del último disparo.
Uso de `LockService` para reducir conflictos de edición.
Limpieza y normalización de datos.
---
Alertas de órdenes de compra faltantes
Detección automática de tareas sin OC.
Identificación de cabeceras de tarea.
Cálculo de antigüedad.
Clasificación por nivel de riesgo.
Priorización de departamentos críticos.
Envío de correo agrupado por tarea.
Correo en texto plano y HTML.
Generación de debug para revisión.
Trigger diario configurable.
---
Facturas por compartir
Revisión automática de correos en Gmail.
Búsqueda por remitente y asunto.
Extracción de datos desde tablas HTML.
Registro de facturas pendientes.
Control de duplicados por factura e ingreso.
Cálculo de días sin compartir.
Clasificación de estado:
Nuevo.
Pendiente.
Urgente.
Crítico.
Compartida.
Recordatorios automáticos.
Alertas por correo.
Integración con WhatsApp.
Etiqueta de Gmail para control de procesados.
---
Observaciones automáticas
Generación de observaciones por tarea.
Generación de observaciones por orden de compra.
Sidebar integrado en Google Sheets.
Configuración de autorizadores por departamento.
Restauración de configuración por defecto.
Formato estándar para proveedores y órdenes.
Lectura dinámica de datos desde la hoja `GENERAL`.
Generación de textos listos para copiar y pegar.
---
Exportación JT
Exportación de ítems desde `GENERAL`.
Creación de hoja plana `JT_EXPORT`.
Asociación de ítems con número de tarea.
Exportación de:
Código.
Detalle.
Cantidad.
Proveedor.
Orden de compra.
Fila de origen.
Fecha de exportación.
Trigger opcional cada 5 minutos.
Estructura plana útil para análisis, filtros y reportes.
---
WhatsApp Auto Manager
Configuración de conexión con Green API.
Sincronización de contactos.
Gestión de contactos activos.
Creación de plantillas.
Programación de mensajes.
Envíos únicos, diarios, semanales o mensuales.
Procesamiento de cola de envíos.
Scheduler automático.
Validación de conexión.
Logs de envío.
Ventana visual para programar campañas.
Búsqueda paginada de contactos.
Uso de variables dinámicas en plantillas.
---
Arquitectura general
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
Estructura del repositorio
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
Módulos del sistema
1. Core del sistema
Archivo:
```txt

src/00_CORE_REFACTORED.gs

```
Responsabilidades:
Menú principal del sistema.
Integración de módulos.
Utilidades compartidas.
Normalización de texto.
Validación de celdas vacías.
Cálculo de días.
Formato de valores.
Limpieza de triggers.
Detector de cabeceras de tarea.
Funciones auxiliares para hojas.
Funciones de apoyo para UI y mensajes.
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
---
2. Configuración base
Archivo:
```txt

src/00_APP_CONFIG.example.gs

```
Responsabilidades:
Definir zona horaria.
Centralizar nombres de hojas.
Mantener una única fuente de configuración.
Evitar nombres quemados en múltiples scripts.
Facilitar adaptación a otros entornos.
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
---
3. Sincronización
Archivo:
```txt

src/01_SYNC.gs

```
Responsabilidades:
Sincronizar datos entre `TAREAS` y `GENERAL`.
Detectar ediciones relevantes.
Actualizar datos relacionados.
Convertir texto a mayúsculas.
Guardar posiciones visitadas.
Ejecutar auto-scroll.
Validar configuración.
Registrar última ejecución.
Evitar ediciones duplicadas o no relevantes.
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
---
4. Alertas de OC
Archivo:
```txt

src/02_OC_ALERT.gs

```
Responsabilidades:
Detectar tareas sin orden de compra.
Calcular días transcurridos.
Clasificar nivel de riesgo.
Agrupar alertas por tarea.
Enviar correo HTML.
Crear trigger diario.
Escribir información de debug.
Priorizar departamentos de alta importancia.
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
---
5. Observaciones automáticas
Archivo:
```txt

src/03_OBSERVACIONES_V3.gs

```
Responsabilidades:
Generar observaciones para una tarea.
Generar observaciones para una orden.
Mostrar sidebar.
Configurar autorizadores por departamento.
Restaurar configuración por defecto.
Leer datos desde `GENERAL`.
Agrupar órdenes por proveedor.
Preparar textos operativos listos para copiar.
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
---
6. Exportación JT
Archivo:
```txt

src/04_GTX_EXPORT.gs

```
Responsabilidades:
Leer ítems de la hoja `GENERAL`.
Detectar tareas.
Crear hoja `JT_EXPORT`.
Exportar registros planos.
Guardar fila de origen.
Registrar fecha de exportación.
Preparar información para análisis o integración externa.
Funciones destacadas:
```txt

GTX_exportNow()

GTX_setupTrigger_5min()

GTX_deleteTriggers()

```
---
7. Task Manager
Archivo:
```txt

src/05_TASK_MANAGER.gs

```
Responsabilidades:
Inicializar hojas del gestor.
Crear tareas.
Editar tareas.
Completar tareas.
Reactivar tareas.
Gestionar categorías.
Aplicar formato visual.
Colorear por criticidad.
Enviar resumen diario.
Enviar resumen semanal.
Registrar logs de correos.
Mostrar formularios HTML.
Mantener dashboard operativo.
Hojas principales:
```txt

TAREAS

Completadas

Configuración

Dashboard

Log Correos

```
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

activarEnvioDiario()

activarResumenSemanal()

instalarMenuTaskManager()

```
---
8. Facturas por compartir
Archivo:
```txt

src/06_FACTURAS.gs

```
Responsabilidades:
Crear hoja `FAC POR COMPARTIR`.
Revisar correos desde Gmail.
Extraer datos desde tablas HTML.
Registrar facturas pendientes.
Evitar duplicados.
Actualizar estados.
Aplicar formato.
Enviar recordatorios.
Crear label de Gmail para procesados.
Controlar días sin compartir.
Preparar alertas escaladas.
Funciones destacadas:
```txt

facInicializarHoja()

facRevisarCorreos()

facRevisarCorreosManual()

_facExtraerFilasJ()

_facActualizarEstados()

_facAplicarFormato()

_facBuildDupSet_()

instalarMenuFacturas()

crearMenuFacturas()

```
---
9. WhatsApp Auto Manager
Archivo:
```txt

src/07_WHATSAPP_AUTO_MANAGER.gs

```
Responsabilidades:
Inicializar módulo WhatsApp.
Crear hojas de configuración.
Sincronizar contactos.
Crear plantillas.
Programar mensajes.
Procesar cola de envíos.
Validar conexión con Green API.
Activar scheduler.
Mantener logs.
Manejar contactos activos.
Configurar límite de envíos por corrida.
Usar pausa entre envíos.
Usar configuración compartida o local.
Hojas principales:
```txt

WA_AUTO_CFG

WA_AUTO_CONTACTOS

WA_AUTO_PROGRAMACION

WA_AUTO_PLANTILLAS

WA_AUTO_LOG

```
Funciones destacadas:
```txt

WAM_inicializarModulo()

WAM_abrirVentanaProgramador()

WAM_validarConexionUI()

WAM_sincronizarContactosUI()

WAM_procesarProgramacionUI()

WAM_activarScheduler()

WAM_desactivarScheduler()

WAM_resetEstadoEjecucion()

WAM_enviarPruebaUI()

WAM_crearMenuStandalone()

```
---
10. Ventana HTML de WhatsApp
Archivo:
```txt

src/WAM_PROGRAMADOR_DIALOG.html

```
Responsabilidades:
Mostrar interfaz visual para programación.
Buscar contactos.
Seleccionar destinatarios.
Configurar frecuencia.
Preparar mensaje.
Enviar datos al backend Apps Script.
Mostrar estados de carga, éxito o error.
Facilitar campañas manuales o programadas.
---
Stack técnico
| Área | Tecnología |
|---|---|
| Backend | Google Apps Script |
| Interfaz principal | Google Sheets UI |
| Interfaz secundaria | HTML Service |
| Base operativa | Google Sheets |
| Automatización | Apps Script Triggers |
| Correo | GmailApp, MailApp |
| WhatsApp | Green API |
| Configuración | PropertiesService |
| Control de concurrencia | LockService |
| HTTP externo | UrlFetchApp |
| Utilidades | Utilities |
| Control de versiones | Git, GitHub, clasp |
---
Hojas utilizadas
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
---
Modelo de datos general
Hoja `TAREAS`
Uso principal:
Registro de tareas operativas.
Seguimiento de criticidad.
Control de frecuencia.
Estado de cada tarea.
Fechas de vencimiento.
Notas y última notificación.
Campos principales:
```txt

ID

Tarea

Descripción

Categoría

Criticidad

Frecuencia

Fecha Creación

Fecha Vencimiento

Hora Recordatorio

Día Semana

Día Mes

Estado

Notas

Última Notificación

```
---
Hoja `GENERAL`
Uso principal:
Fuente operativa para tareas, proveedores, órdenes, ítems y detalles.
Base para sincronización, alertas, observaciones y exportación.
Campos utilizados por los módulos:
```txt

Código

Detalle

Cantidad

Proveedor

Precio

OC

Departamento

Solicitante

Detalle de tarea

```
---
Hoja `FAC POR COMPARTIR`
Uso principal:
Registro y control de facturas pendientes.
Campos principales:
```txt

Número

Proveedor

Número de Factura

Fecha de Factura

Orden de Compra

Número de Ingreso

Número de Tarea

Responsable

Factura Compartida

Fecha Registro

Días sin Compartir

Estado

```
---
Hojas WhatsApp Auto
Uso principal:
Configuración.
Contactos.
Programaciones.
Plantillas.
Logs.
Hojas:
```txt

WA_AUTO_CFG

WA_AUTO_CONTACTOS

WA_AUTO_PROGRAMACION

WA_AUTO_PLANTILLAS

WA_AUTO_LOG

```
---
Flujo operativo principal
```txt

1. El usuario abre Google Sheets.

2. El menú Sistema se carga automáticamente.

3. El usuario crea, consulta o actualiza tareas.

4. El módulo Sync cruza datos entre TAREAS y GENERAL.

5. El sistema detecta tareas sin orden de compra.

6. El módulo OC Alert envía alertas por correo.

7. El módulo Facturas revisa Gmail y registra pendientes.

8. El sistema actualiza estados de facturas.

9. El módulo Observaciones genera textos estandarizados.

10. El módulo WhatsApp Auto programa recordatorios o campañas.

11. Los logs registran actividad relevante.

```
---
Flujo de alertas OC
```txt

1. Se analiza la hoja GENERAL.

2. Se detectan cabeceras de tarea.

3. Se agrupan ítems por tarea.

4. Se identifican ítems sin OC.

5. Se calcula antigüedad.

6. Se asigna riesgo.

7. Se ordenan alertas por prioridad.

8. Se envía correo agrupado.

```
---
Flujo de facturas
```txt

1. El módulo busca correos con asunto configurado.

2. Lee el cuerpo HTML del correo.

3. Extrae tablas.

4. Filtra filas marcadas para seguimiento.

5. Valida duplicados.

6. Registra facturas nuevas.

7. Calcula días sin compartir.

8. Actualiza estado.

9. Envía recordatorios si corresponde.

```
---
Flujo de WhatsApp Auto
```txt

1. Se inicializa el módulo.

2. Se valida conexión con Green API.

3. Se sincronizan contactos.

4. Se crean plantillas.

5. Se programa una campaña.

6. El scheduler revisa la cola.

7. Se envían mensajes pendientes.

8. Se registra resultado en el log.

```
---
Instalación
1. Clonar repositorio
```bash

git clone https://github.com/eslay07/gestion-tareas-operativas-apps-script.git

cd gestion-tareas-operativas-apps-script

```
2. Instalar clasp
```bash

npm install @google/clasp -g

```
3. Iniciar sesión en Google
```bash

clasp login

```
4. Vincular con Apps Script
Crear archivo `.clasp.json` local basado en `.clasp.example.json`:
```json

{

  "scriptId": "TU_SCRIPT_ID_REAL",

  "rootDir": "src"

}

```
5. Subir código a Apps Script
```bash

clasp push

```
---
Configuración inicial en Google Sheets
Después de cargar el código en Apps Script, ejecutar manualmente las funciones iniciales:
```txt

crearMenuSistema()

installTriggers()

inicializarHojas()

facInicializarHoja()

WAM_inicializarModulo()

```
Luego, desde el menú Sistema, validar cada módulo:
```txt

Sistema → Sync / Compras → Validar configuración

Sistema → Task Manager → Inicializar hojas

Sistema → Facturas → Inicializar hoja Facturas

Sistema → WhatsApp Auto → Inicializar módulo

Sistema → WhatsApp Auto → Validar conexión Green API

```
---
Activadores recomendados
Desde el menú del sistema:
```txt

Sistema → Sync / Compras → Instalar / arreglar activadores

Sistema → Sync / Compras → Crear trigger diario OC

Sistema → Sync / Compras → Instalar trigger GTX 5 min

Sistema → Task Manager → Activar envío diario

Sistema → Task Manager → Activar resumen semanal

Sistema → Facturas → Activar revisión de correos

Sistema → Facturas → Activar recordatorios

Sistema → WhatsApp Auto → Activar scheduler

```
---
Configuración de WhatsApp
El módulo WhatsApp Auto puede usar configuración compartida desde la hoja `Configuración`:
```txt

B6 = ID Instance

B7 = API Token

```
También puede usar configuración local en la hoja:
```txt

WA_AUTO_CFG

```
Por seguridad, las credenciales reales no deben estar publicadas en el repositorio.
---
Variables de configuración sugeridas
Archivo de ejemplo:
```txt

samples/script-properties.example.json

```
Contenido sugerido:
```json

{

  "EMAIL_DESTINO": "usuario.demo@empresa.com",

  "EMAIL_ALERTAS": "alertas.demo@empresa.com",

  "WA_ID_INSTANCE": "ID_INSTANCE_DEMO",

  "WA_API_TOKEN": "TOKEN_DEMO",

  "WA_CHAT_ID": "593999999999@c.us",

  "ZONA_HORARIA": "America/Guayaquil"

}

```
---
Seguridad y privacidad
Este repositorio debe publicarse únicamente con datos ficticios o sanitizados.
No subir:
```txt

Correos corporativos reales

Tokens de Green API

ID Instance real

Facturas reales

Órdenes de compra reales

Proveedores reales

Tareas reales

Nombres internos sensibles

Capturas con información corporativa

Archivos exportados reales

```
---
Datos sensibles reemplazados
Para publicar este proyecto, usar valores demo como:
```txt

usuario.demo@empresa.com

alertas.demo@empresa.com

AUTORIZADOR DEMO 1

AUTORIZADOR DEMO 2

AUTORIZADOR DEMO 3

PROVEEDOR DEMO S.A.

OC-DEMO-0001

FACTURA-DEMO-0001

TAREA-DEMO-0001

```
---
Capturas requeridas
Las capturas deben guardarse exactamente con estos nombres dentro de:
```txt

docs/screenshots/

```
Lista obligatoria:
```txt

01-menu-sistema.png

02-task-manager.png

03-dashboard.png

04-alertas-oc.png

05-facturas.png

06-observaciones.png

07-whatsapp-auto.png

08-programador-whatsapp.png

```
01 — Menú principal del sistema
![Menú principal del sistema](docs/screenshots/01-menu-sistema.png)
02 — Task Manager
![Task Manager](docs/screenshots/02-task-manager.png)
03 — Dashboard operativo
![Dashboard operativo](docs/screenshots/03-dashboard.png)
04 — Alertas de órdenes de compra
![Alertas OC](docs/screenshots/04-alertas-oc.png)
05 — Facturas por compartir
![Facturas por compartir](docs/screenshots/05-facturas.png)
06 — Observaciones automáticas
![Observaciones automáticas](docs/screenshots/06-observaciones.png)
07 — WhatsApp Auto Manager
![WhatsApp Auto Manager](docs/screenshots/07-whatsapp-auto.png)
08 — Programador visual de WhatsApp
![Programador visual de WhatsApp](docs/screenshots/08-programador-whatsapp.png)
---
Impacto operativo
La solución permite:
Centralizar procesos operativos dentro de Google Sheets.
Reducir revisión manual repetitiva.
Mejorar seguimiento de tareas.
Detectar órdenes de compra faltantes.
Controlar facturas pendientes.
Estandarizar observaciones.
Automatizar recordatorios por correo.
Automatizar recordatorios y campañas por WhatsApp.
Mantener trazabilidad básica de procesos.
Integrar varios flujos administrativos en un menú único.
Disminuir errores por edición manual.
Mejorar la visibilidad de pendientes críticos.
Acelerar la comunicación interna.
---
Retos técnicos resueltos
Hojas con estructura operativa variable
El sistema identifica cabeceras de tarea y procesa bloques de información dentro de `GENERAL`.
Sincronización sin base de datos externa
Se implementó sincronización entre hojas usando Apps Script, mapas en memoria y triggers de edición.
Control de duplicados
El módulo de facturas evita registros repetidos cruzando número de factura y número de ingreso.
Automatización con triggers
Se automatizaron alertas, reportes, revisiones y recordatorios usando activadores de Apps Script.
WhatsApp programable
Se creó un módulo aislado con prefijo propio, hojas dedicadas, plantillas, contactos, logs y scheduler.
Modularización progresiva
El sistema se organizó en módulos separados para mejorar mantenimiento, lectura y escalabilidad.
Interfaz visual sin infraestructura externa
Se usó HTML Service para crear ventanas y formularios dentro de Google Sheets sin servidor adicional.
---
Roadmap
Mejoras futuras:
Migrar toda credencial sensible a `PropertiesService`.
Crear ambiente demo separado del ambiente productivo.
Agregar roles de usuario.
Mejorar dashboard visual.
Agregar exportación PDF.
Implementar pruebas con datos ficticios.
Centralizar manejo de errores.
Crear documentación técnica por módulo.
Agregar control de cambios por usuario.
Crear versión Web App externa con HTML Service.
Mejorar auditoría de cambios.
Agregar notificaciones por estado.
Agregar configuración visual para todos los módulos.
Crear instalador guiado del sistema.
---
Aprendizajes técnicos
Este proyecto fortaleció habilidades en:
Automatización de procesos administrativos.
Diseño modular en Google Apps Script.
Integración con servicios de Google Workspace.
Consumo de APIs externas.
Manejo de triggers.
Limpieza y transformación de datos.
Creación de interfaces con HTML Service.
Control de duplicados.
Reportería automatizada.
Programación orientada a eventos.
Manejo de hojas como base operativa.
Documentación técnica para repositorios GitHub.
Sanitización de proyectos internos para portafolio profesional.
---
Uso profesional del proyecto
Este repositorio documenta una solución real de automatización operativa desarrollada para optimizar procesos administrativos sobre Google Workspace.
Puede presentarse como experiencia en:
Desarrollo de soluciones internas.
Automatización de procesos.
Google Apps Script.
Integración con APIs.
Gestión de datos en Google Sheets.
Automatización de correos.
Integración con WhatsApp.
Documentación técnica.
Mejora continua de procesos.
---
Descripción para hoja de vida
```txt

Gestión de Tareas Operativas — Google Apps Script Automation Suite

Google Apps Script | Google Sheets | GmailApp | MailApp | HTML Service | Green API | Triggers

Diseñé y desarrollé una suite operativa sobre Google Sheets para centralizar la gestión de tareas, sincronizar información entre hojas, emitir alertas de órdenes de compra faltantes, controlar facturas pendientes, generar observaciones automáticas y programar recordatorios por WhatsApp. La solución integra menú personalizado, formularios HTML, triggers, reportes por correo, control de criticidad, logs y módulos independientes para automatizar procesos administrativos reales.

```
---
Autor
Jimmy Omar Toapanta Guayanay
Ingeniero en Informática
Quito, Ecuador
GitHub: github.com/eslay07
---
Licencia
Proyecto documentado con fines profesionales y demostrativos.
Para uso público se recomienda publicar únicamente una versión sanitizada, sin datos corporativos reales ni credenciales privadas.
