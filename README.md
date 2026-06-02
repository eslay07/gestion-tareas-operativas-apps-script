# Gestión de Tareas Operativas — Google Apps Script Automation Suite

![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Google Sheets](https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=googlesheets&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000)
![HTML Service](https://img.shields.io/badge/HTML%20Service-FF5722?style=for-the-badge&logo=html5&logoColor=white)
![Gmail](https://img.shields.io/badge/GmailApp-EA4335?style=for-the-badge&logo=gmail&logoColor=white)
![Automation](https://img.shields.io/badge/Workflow%20Automation-0A66C2?style=for-the-badge)

Suite operativa desarrollada en **Google Apps Script** sobre **Google Sheets** para centralizar la gestión de tareas, sincronizar información entre hojas, generar alertas, controlar facturas, automatizar correos, gestionar descargas y apoyar procesos internos mediante interfaces visuales.

El proyecto convierte una hoja de cálculo operativa en una herramienta interna con menú personalizado, panel visual, formularios HTML, triggers, reportes, logs y módulos independientes para procesos administrativos reales.

---

## Vista general

### Login

![Login](docs/screenshots/Login.png)

### Configuraciones

![Configuraciones](docs/screenshots/Configuraciones.png)

### Menú de Bienes

![Menú de Bienes](docs/screenshots/Menu%20de%20Bienes.png)

### Menú de Servicios

![Menú de Servicios](docs/screenshots/Menu%20de%20Servicios.png)

### Menú de flujo

![Menú de flujo](docs/screenshots/Menu%20de%20flujo.png)

### Reasignación de tareas

![Reasignación de tareas](docs/screenshots/Reasignacion%20de%20tareas.png)

### Correos masivos

![Correos masivos](docs/screenshots/correos%20masivos.png)

### Descargas OC

![Descargas OC](docs/screenshots/descargas%20oc.png)

---

## Tabla de contenido

- [Objetivo del proyecto](#objetivo-del-proyecto)
- [Problema identificado](#problema-identificado)
- [Solución desarrollada](#solución-desarrollada)
- [Funcionalidades principales](#funcionalidades-principales)
- [Arquitectura general](#arquitectura-general)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Módulos principales](#módulos-principales)
- [Stack técnico](#stack-técnico)
- [Instalación](#instalación)
- [Configuración inicial](#configuración-inicial)
- [Seguridad y privacidad](#seguridad-y-privacidad)
- [Impacto operativo](#impacto-operativo)
- [Retos técnicos resueltos](#retos-técnicos-resueltos)
- [Roadmap](#roadmap)
- [Uso profesional](#uso-profesional)
- [Autor](#autor)
- [Licencia](#licencia)

---

## Objetivo del proyecto

Automatizar procesos operativos y administrativos que antes dependían de revisión manual en Google Sheets, correos, validaciones individuales y seguimiento visual.

La solución permite:

- Centralizar tareas operativas en Google Sheets.
- Sincronizar información entre hojas de trabajo.
- Gestionar tareas, responsables y estados.
- Controlar órdenes, bienes, servicios y flujos internos.
- Generar alertas automáticas por correo.
- Apoyar el envío de correos masivos.
- Registrar y consultar información desde una interfaz visual.
- Reducir errores por revisión manual repetitiva.
- Mantener una estructura modular y mantenible en Apps Script.

---

## Problema identificado

Antes del sistema, varios procesos se realizaban de forma manual:

- Revisión de tareas en diferentes hojas.
- Cruce manual entre tareas, bienes, servicios y responsables.
- Seguimiento individual de pendientes.
- Reasignación manual de tareas.
- Envío repetitivo de correos.
- Control manual de descargas y órdenes.
- Falta de interfaz visual centralizada.
- Riesgo de omisiones por depender de revisión visual.
- Pérdida de tiempo en tareas administrativas repetitivas.

Esto generaba reprocesos, dificultad para priorizar pendientes, errores humanos y baja trazabilidad operativa.

---

## Solución desarrollada

Se desarrolló una suite modular en **Google Apps Script**, integrada con **Google Sheets** y complementada con interfaces HTML mediante **HTML Service**.

El sistema incluye:

- Menú personalizado dentro de Google Sheets.
- Panel visual para consulta y operación.
- Formularios HTML.
- Automatizaciones con triggers.
- Sincronización entre hojas.
- Gestión de tareas.
- Control de flujos operativos.
- Alertas y reportes.
- Módulos separados para mantenimiento progresivo.

---

## Funcionalidades principales

### Gestión de tareas operativas

- Registro de tareas.
- Clasificación por estado y prioridad.
- Reasignación de tareas.
- Consulta de pendientes.
- Seguimiento desde hoja y panel visual.
- Actualización de información relacionada.

### Menú de bienes y servicios

- Separación de flujos por tipo de proceso.
- Consulta visual desde panel.
- Acceso rápido a operaciones frecuentes.
- Estructura preparada para procesos administrativos reales.

### Sincronización de información

- Cruce entre hojas operativas.
- Actualización automática de datos relacionados.
- Normalización de texto.
- Validación de datos relevantes.
- Uso de funciones auxiliares compartidas.

### Alertas y correos

- Generación de reportes por correo.
- Apoyo para correos masivos.
- Control de destinatarios mediante configuración.
- Uso de `GmailApp` y `MailApp`.

### Panel visual

- Interfaz HTML integrada con Apps Script.
- Pantalla de login.
- Secciones de configuración.
- Menús de bienes, servicios y flujo.
- Visualización más clara para usuarios no técnicos.

### Descargas y soporte operativo

- Módulo orientado a descargas OC.
- Organización de procesos relacionados con órdenes.
- Base preparada para integraciones futuras.

---

## Arquitectura general

```txt
Usuario
  ↓
Google Sheets
  ↓
Menú personalizado / Panel HTML
  ↓
Google Apps Script
  ├── Configuración global
  ├── Core del sistema
  ├── Sincronización
  ├── Gestión de tareas
  ├── Alertas y correos
  ├── Facturas / órdenes
  ├── Panel visual
  └── Automatizaciones
  ↓
Servicios Google Workspace
  ├── SpreadsheetApp
  ├── GmailApp
  ├── MailApp
  ├── HtmlService
  ├── ScriptApp
  ├── PropertiesService
  ├── LockService
  └── Utilities
```

---

## Estructura del repositorio

```txt
gestion-tareas-operativas-apps-script/
├── README.md
├── CHANGELOG.md
├── LICENSE
├── .gitignore
├── .clasp.example.json
├── appsscript.example.json
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
│   ├── 10_COMPRAS_VISUAL.gs
│   ├── SMART_PANEL.html
│   └── WAM_PROGRAMADOR_DIALOG.html
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── user-guide.md
│   ├── security.md
│   └── screenshots/
│       ├── Configuraciones.png
│       ├── Login.png
│       ├── Menu de Bienes.png
│       ├── Menu de Servicios.png
│       ├── Menu de flujo.png
│       ├── Reasignacion de tareas.png
│       ├── correos masivos.png
│       └── descargas oc.png
└── samples/
    └── script-properties.example.json
```

---

## Módulos principales

### `00_APP_CONFIG.example.gs`

Archivo de configuración base. Centraliza nombres de hojas, zona horaria y constantes generales del sistema.

### `00_CORE_REFACTORED.gs`

Núcleo del sistema. Contiene utilidades compartidas, menú principal, funciones de apoyo y conexión entre módulos.

### `01_SYNC.gs`

Módulo de sincronización entre hojas operativas. Permite mantener información relacionada actualizada y reducir trabajo manual.

### `02_OC_ALERT.gs`

Módulo de alertas para órdenes de compra. Detecta pendientes, agrupa información y genera reportes por correo.

### `03_OBSERVACIONES_V3.gs`

Generador de observaciones automáticas. Estandariza textos operativos para tareas, proveedores y órdenes.

### `04_GTX_EXPORT.gs`

Exportador operativo. Convierte información estructurada de hojas en una salida plana para análisis, filtros o reportes.

### `05_TASK_MANAGER.gs`

Gestor de tareas. Permite crear, consultar, completar, reactivar y dar seguimiento a tareas operativas.

### `06_FACTURAS.gs`

Módulo de facturas. Apoya la revisión, registro y control de facturas pendientes desde correos y hojas.

### `07_WHATSAPP_AUTO_MANAGER.gs`

Módulo de automatización de mensajes. Preparado para integraciones de notificación mediante API externa.

### `10_COMPRAS_VISUAL.gs`

Backend del panel visual de compras. Conecta la interfaz HTML con funciones de Apps Script.

### `SMART_PANEL.html`

Interfaz visual principal del sistema. Incluye login, configuraciones, menús de bienes, servicios, flujo y operaciones.

### `WAM_PROGRAMADOR_DIALOG.html`

Interfaz complementaria para programación de mensajes.

---

## Stack técnico

| Área | Tecnología |
|---|---|
| Backend | Google Apps Script |
| Interfaz principal | Google Sheets UI |
| Interfaz visual | HTML Service |
| Lenguaje | JavaScript |
| Base operativa | Google Sheets |
| Automatización | Apps Script Triggers |
| Correos | GmailApp, MailApp |
| Configuración | PropertiesService |
| Concurrencia | LockService |
| Utilidades | Utilities |
| Control de versiones | Git, GitHub, clasp |

---

## Instalación

### 1. Clonar repositorio

```bash
git clone https://github.com/eslay07/gestion-tareas-operativas-apps-script.git
cd gestion-tareas-operativas-apps-script
```

### 2. Instalar clasp

```bash
npm install @google/clasp -g
```

### 3. Iniciar sesión en Google

```bash
clasp login
```

### 4. Crear archivo `.clasp.json`

Usar `.clasp.example.json` como referencia:

```json
{
  "scriptId": "TU_SCRIPT_ID_REAL",
  "rootDir": "src"
}
```

### 5. Subir código a Apps Script

```bash
clasp push
```

---

## Configuración inicial

Después de cargar el código en Apps Script, ejecutar manualmente las funciones iniciales según los módulos instalados:

```txt
crearMenuSistema()
installTriggers()
inicializarHojas()
facInicializarHoja()
WAM_inicializarModulo()
```

Luego validar desde el menú del sistema:

```txt
Sistema → Sync / Compras → Validar configuración
Sistema → Task Manager → Inicializar hojas
Sistema → Facturas → Inicializar hoja Facturas
Sistema → WhatsApp Auto → Inicializar módulo
```

---

## Seguridad y privacidad

Este repositorio debe publicarse únicamente con datos ficticios o sanitizados.

No subir:

```txt
Correos corporativos reales
Tokens de API
ID Instance real
Facturas reales
Órdenes de compra reales
Proveedores reales
Tareas reales
Nombres internos sensibles
Capturas con información corporativa confidencial
Archivos exportados reales
```

Valores recomendados para demo:

```txt
usuario.demo@empresa.com
alertas.demo@empresa.com
AUTORIZADOR DEMO 1
PROVEEDOR DEMO S.A.
OC-DEMO-0001
FACTURA-DEMO-0001
TAREA-DEMO-0001
```

---

## Impacto operativo

La solución permite:

- Centralizar procesos operativos dentro de Google Sheets.
- Reducir revisión manual repetitiva.
- Mejorar seguimiento de tareas.
- Organizar flujos de bienes y servicios.
- Estandarizar observaciones.
- Automatizar reportes y correos.
- Mejorar visibilidad de pendientes críticos.
- Disminuir errores por edición manual.
- Presentar información mediante una interfaz visual.
- Documentar una solución interna como proyecto profesional.

---

## Retos técnicos resueltos

### Modularización de un sistema operativo real

El sistema se separó en módulos por responsabilidad para mejorar lectura, mantenimiento y escalabilidad.

### Sincronización sin base de datos externa

Se implementó sincronización usando Google Sheets como base operativa, mapas en memoria y triggers de Apps Script.

### Interfaz visual sin infraestructura adicional

Se utilizó HTML Service para crear una experiencia visual sin necesidad de servidor externo.

### Automatización con servicios Google Workspace

Se integraron `SpreadsheetApp`, `GmailApp`, `MailApp`, `ScriptApp`, `PropertiesService` y `LockService`.

### Sanitización para portafolio profesional

Se preparó una versión documentada sin credenciales ni datos internos sensibles.

---

## Roadmap

Mejoras futuras:

- Crear ambiente demo independiente.
- Migrar credenciales a `PropertiesService`.
- Agregar roles de usuario.
- Mejorar dashboard visual.
- Agregar exportación PDF.
- Centralizar manejo de errores.
- Crear documentación técnica por módulo.
- Agregar auditoría de cambios.
- Crear instalador guiado del sistema.
- Separar configuración productiva y configuración demo.

---

## Uso profesional

Este repositorio documenta una solución real de automatización operativa desarrollada para optimizar procesos administrativos sobre Google Workspace.

Puede presentarse como experiencia en:

- Desarrollo de soluciones internas.
- Automatización de procesos.
- Google Apps Script.
- Integración con Google Workspace.
- Gestión de datos en Google Sheets.
- Automatización de correos.
- Creación de interfaces con HTML Service.
- Documentación técnica.
- Mejora continua de procesos.

---

## Descripción para hoja de vida

```txt
Gestión de Tareas Operativas — Google Apps Script Automation Suite
Google Apps Script | Google Sheets | HTML Service | GmailApp | MailApp | Triggers

Diseñé y desarrollé una suite operativa sobre Google Sheets para centralizar tareas, sincronizar información entre hojas, generar alertas, controlar procesos administrativos, automatizar correos y presentar información mediante un panel visual en HTML Service. La solución integra menú personalizado, formularios, triggers, reportes, logs y módulos independientes para automatizar procesos internos reales.
```

---

## Autor

**Jimmy Omar Toapanta Guayanay**  
Ingeniero en Informática  
Quito, Ecuador

GitHub: [github.com/eslay07](https://github.com/eslay07)

---

## Licencia

Proyecto documentado con fines profesionales y demostrativos.

Para uso público se recomienda publicar únicamente una versión sanitizada, sin datos corporativos reales ni credenciales privadas.
