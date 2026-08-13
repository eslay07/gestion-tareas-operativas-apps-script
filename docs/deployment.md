# Guía de Despliegue

## Gestión de Tareas Operativas — Google Apps Script Automation Suite

Este documento explica cómo desplegar el proyecto **Gestión de Tareas Operativas** en Google Apps Script utilizando Google Sheets como base operativa.

La guía está pensada para instalar el sistema desde un repositorio local, configurarlo con datos demo o reales controlados y dejarlo listo para ejecución manual o automática mediante triggers.

---

## 1. Requisitos previos

Antes de desplegar el proyecto se requiere:

- Cuenta de Google.
- Acceso a Google Sheets.
- Acceso a Google Apps Script.
- Node.js instalado en el equipo local.
- Git instalado.
- Clasp instalado globalmente.
- Permisos para autorizar scripts en la cuenta de Google.
- Conexión a Internet.
- Opcional: cuenta Green API para el módulo WhatsApp.

---

## 2. Estructura esperada del repositorio

La estructura local del proyecto debe ser:

```text
gestion-tareas-operativas-apps-script/
│
├── README.md
├── CHANGELOG.md
├── LICENSE
├── .gitignore
├── .clasp.example.json
├── appsscript.example.json
│
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── security.md
│   ├── user-guide.md
│   └── screenshots/
│
├── samples/
│   └── script-properties.example.json
│
└── src/
    ├── 00_APP_CONFIG.example.gs
    ├── 00_CORE_REFACTORED.gs
    ├── 01_SYNC.gs
    ├── 02_OC_ALERT.gs
    ├── 03_OBSERVACIONES_V3.gs
    ├── 04_GTX_EXPORT.gs
    ├── 05_TASK_MANAGER.gs
    ├── 06_FACTURAS.gs
    ├── 07_WHATSAPP_AUTO_MANAGER.gs
    └── WAM_PROGRAMADOR_DIALOG.html
```

---

## 3. Instalación de herramientas locales

### 3.1 Verificar Node.js

Ejecutar en PowerShell:

```powershell
node -v
npm -v
```

Si ambos comandos devuelven versión, Node.js está instalado correctamente.

---

### 3.2 Instalar Clasp

Clasp es la herramienta oficial para trabajar con Google Apps Script desde consola.

```powershell
npm install -g @google/clasp
```

Verificar instalación:

```powershell
clasp -v
```

---

### 3.3 Iniciar sesión en Clasp

```powershell
clasp login
```

Se abrirá el navegador para autorizar la cuenta de Google.

---

## 4. Preparar Google Sheets

### 4.1 Crear una hoja nueva

Crear un archivo en Google Sheets con un nombre descriptivo, por ejemplo:

```text
Gestión de Tareas Operativas Demo
```

---

### 4.2 Crear las hojas requeridas

Dentro del archivo de Google Sheets, crear las siguientes pestañas:

```text
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

El sistema puede inicializar algunas hojas desde sus funciones, pero para despliegue controlado se recomienda crearlas desde el inicio.

---

### 4.3 Estructura recomendada de hojas principales

#### TAREAS

Columnas sugeridas:

```text
ID_TAREA
FECHA
RESPONSABLE
DEPARTAMENTO
DESCRIPCION
ESTADO
CRITICIDAD
CATEGORIA
FRECUENCIA
OBSERVACION
ULTIMA_ACTUALIZACION
```

Ejemplo demo:

```text
TAREA-DEMO-0001
usuario.demo@empresa.com
PROVEEDOR DEMO S.A.
```

---

#### GENERAL

Columnas sugeridas:

```text
TASK_ID
CODIGO
DETALLE
CANTIDAD
PROVEEDOR
OC
ESTADO
FECHA_REGISTRO
OBSERVACION
```

Ejemplo demo:

```text
TASK_ID: TAREA-DEMO-0001
PROVEEDOR: PROVEEDOR DEMO S.A.
OC: OC-DEMO-0001
```

---

#### FAC POR COMPARTIR

Columnas sugeridas:

```text
FECHA
PROVEEDOR
FACTURA
ASUNTO
REMITENTE
ESTADO
DIAS_PENDIENTE
ULTIMA_REVISION
```

Ejemplo demo:

```text
FACTURA-DEMO-0001
PROVEEDOR DEMO S.A.
usuario.demo@empresa.com
```

---

#### JT_EXPORT

Columnas esperadas:

```text
TASK_ID
CODIGO
DETALLE
CANTIDAD
PROVEEDOR
OC
ROW_SRC
EXPORTED_AT
```

---

## 5. Preparar archivos de configuración

### 5.1 Copiar archivo de manifiesto

El archivo del repositorio es:

```text
appsscript.example.json
```

Para usarlo en el proyecto real, copiarlo como:

```text
appsscript.json
```

Comando PowerShell:

```powershell
Copy-Item appsscript.example.json appsscript.json
```

---

### 5.2 Copiar configuración de Clasp

El archivo del repositorio es:

```text
.clasp.example.json
```

Para trabajar localmente, copiarlo como:

```text
.clasp.json
```

```powershell
Copy-Item .clasp.example.json .clasp.json
```

Luego se debe reemplazar el `scriptId` por el ID real del proyecto Apps Script.

---

## 6. Crear proyecto Apps Script

### Opción A: Crear proyecto desde Google Sheets

1. Abrir el archivo de Google Sheets.
2. Ir a:

```text
Extensiones → Apps Script
```

3. Crear el proyecto.
4. Copiar el ID del proyecto desde:

```text
Configuración del proyecto → ID de secuencia de comandos
```

5. Pegar ese ID en `.clasp.json`.

Ejemplo:

```json
{
  "scriptId": "SCRIPT_ID_DEMO",
  "rootDir": "src"
}
```

---

### Opción B: Crear proyecto desde consola

Desde la carpeta raíz:

```powershell
clasp create --type sheets --title "Gestión de Tareas Operativas Demo" --rootDir src
```

---

## 7. Configurar `.clasp.json`

El archivo `.clasp.json` real debe apuntar a la carpeta `src`.

Ejemplo:

```json
{
  "scriptId": "SCRIPT_ID_DEMO",
  "rootDir": "src"
}
```

No subir este archivo al repositorio si contiene un ID real.

---

## 8. Configurar `appsscript.json`

Ejemplo recomendado:

```json
{
  "timeZone": "America/Guayaquil",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

Ajustar permisos según los módulos que se vayan a usar.

---

## 9. Preparar archivo de configuración principal

El archivo:

```text
00_APP_CONFIG.example.gs
```

Debe revisarse antes de subirlo.

En un proyecto real se puede usar como:

```text
00_APP_CONFIG.gs
```

Si se mantiene como `.example.gs`, revisar que las referencias del código coincidan con el nombre del archivo y las variables internas.

La configuración debe incluir nombres de hojas como:

```javascript
var SYS_CFG = {
  TZ: 'America/Guayaquil',
  SHEETS: {
    TAREAS: 'TAREAS',
    GENERAL: 'GENERAL',
    FAC: 'FAC POR COMPARTIR',
    CONFIG: 'Configuración',
    COMPLETADAS: 'Completadas',
    DASHBOARD: 'Dashboard',
    LOG_CORREOS: 'Log Correos',
    JT_EXPORT: 'JT_EXPORT',
    WA_CFG: 'WA_AUTO_CFG',
    WA_CONTACTOS: 'WA_AUTO_CONTACTOS',
    WA_PROGRAMACION: 'WA_AUTO_PROGRAMACION',
    WA_PLANTILLAS: 'WA_AUTO_PLANTILLAS',
    WA_LOG: 'WA_AUTO_LOG'
  }
};
```

---

## 10. Subir el proyecto a Google Apps Script

Desde la carpeta raíz:

```powershell
clasp push
```

Si solicita confirmación, aceptar.

Para abrir el proyecto:

```powershell
clasp open
```

---

## 11. Autorizar permisos

En el editor de Apps Script:

1. Ejecutar una función inicial, por ejemplo:

```text
crearMenuSistema
```

2. Google solicitará autorización.
3. Revisar permisos.
4. Autorizar con la cuenta correspondiente.

Módulos que pueden solicitar permisos:

- Google Sheets.
- Gmail.
- Envío de correo.
- Triggers.
- Conexiones externas.
- Interfaz HTML.

---

## 12. Inicialización del sistema

Ejecutar las funciones necesarias desde Apps Script o desde el menú del sistema.

### 12.1 Crear menú principal

```javascript
crearMenuSistema();
```

Luego recargar Google Sheets.

Debe aparecer el menú:

```text
🧩 Sistema
```

Captura esperada:

```text
docs/screenshots/01-menu-sistema.png
```

---

### 12.2 Inicializar gestor de tareas

```javascript
inicializarHojas();
```

Esto prepara hojas como:

```text
TAREAS
Completadas
Configuración
Dashboard
Log Correos
```

Capturas relacionadas:

```text
docs/screenshots/02-task-manager.png
docs/screenshots/03-dashboard.png
```

---

### 12.3 Inicializar facturas

```javascript
facInicializarHoja();
```

Esto prepara la hoja:

```text
FAC POR COMPARTIR
```

Captura relacionada:

```text
docs/screenshots/05-facturas.png
```

---

### 12.4 Inicializar WhatsApp Auto Manager

```javascript
WAM_inicializarModulo();
```

Esto prepara:

```text
WA_AUTO_CFG
WA_AUTO_CONTACTOS
WA_AUTO_PROGRAMACION
WA_AUTO_PLANTILLAS
WA_AUTO_LOG
```

Capturas relacionadas:

```text
docs/screenshots/07-whatsapp-auto.png
docs/screenshots/08-programador-whatsapp.png
```

---

## 13. Configurar propiedades del script

Las credenciales no deben colocarse en el código.

Usar:

```text
Archivo → Configuración del proyecto → Propiedades de la secuencia de comandos
```

Ejemplo basado en:

```text
samples/script-properties.example.json
```

Propiedades demo:

```json
{
  "ALERT_EMAIL_TO": "alertas.demo@empresa.com",
  "DEFAULT_USER_EMAIL": "usuario.demo@empresa.com",
  "GREEN_API_INSTANCE_ID": "DEMO_INSTANCE_ID",
  "GREEN_API_TOKEN": "DEMO_TOKEN",
  "GREEN_API_BASE_URL": "https://api.green-api.com"
}
```

---

## 14. Configurar módulo de alertas OC

### 14.1 Ejecutar alerta manual

```javascript
sendTareasSinOCEmail_V2();
```

El sistema debe:

- Leer tareas.
- Detectar tareas sin OC.
- Calcular antigüedad.
- Clasificar riesgo.
- Enviar correo HTML.

Captura relacionada:

```text
docs/screenshots/04-alertas-oc.png
```

---

### 14.2 Crear trigger diario

```javascript
createDailyTrigger_V2();
```

Esto programa la alerta automática diaria.

---

### 14.3 Depurar conteo

```javascript
debugConteo_V2();
```

Permite revisar cuántas tareas fueron detectadas y cómo fueron clasificadas.

---

## 15. Configurar sincronización TAREAS ↔ GENERAL

### 15.1 Validar estructura

```javascript
validateSetup();
```

### 15.2 Sincronizar manualmente

```javascript
syncAllNow();
```

### 15.3 Revisar última ejecución

```javascript
showLastRun();
```

La sincronización se apoya en:

```text
_SYNC_updateFromTareas()
_SYNC_updateFromGeneral()
_SYNC_buildGenMap()
_SYNC_buildTarMap()
```

---

## 16. Configurar observaciones

### 16.1 Abrir sidebar

```javascript
obs3_abrirSidebar();
```

Captura relacionada:

```text
docs/screenshots/06-observaciones.png
```

### 16.2 Abrir configuración

```javascript
obs3_abrirConfigSidebar();
```

### 16.3 Generar observación por tarea

```javascript
obs3_generarParaLaTarea('TAREA-DEMO-0001');
```

### 16.4 Generar observación por orden

```javascript
obs3_generarParaLaOrden('TAREA-DEMO-0001');
```

### 16.5 Restaurar autorizadores demo

```javascript
obs3_restaurarConfigAutorizadores();
```

Autorizadores demo:

```text
AUTORIZADOR DEMO 1
AUTORIZADOR DEMO 2
AUTORIZADOR DEMO 3
```

---

## 17. Configurar exportación JT_EXPORT

### 17.1 Exportación manual

```javascript
GTX_exportNow();
```

### 17.2 Trigger cada 5 minutos

```javascript
GTX_setupTrigger_5min();
```

### 17.3 Eliminar triggers

```javascript
GTX_deleteTriggers();
```

---

## 18. Configurar gestor de facturas

### 18.1 Revisión manual de correos

```javascript
facRevisarCorreosManual();
```

### 18.2 Revisión automática

```javascript
facRevisarCorreos();
```

El sistema busca correos, extrae datos de tablas HTML y actualiza estados:

```text
NUEVO
PENDIENTE
URGENTE
CRÍTICO
COMPARTIDA
```

---

## 19. Configurar WhatsApp Auto Manager

### 19.1 Validar conexión

```javascript
WAM_validarConexionUI();
```

### 19.2 Sincronizar contactos

```javascript
WAM_sincronizarContactosUI();
```

### 19.3 Abrir programador visual

```javascript
WAM_abrirVentanaProgramador();
```

Captura relacionada:

```text
docs/screenshots/08-programador-whatsapp.png
```

### 19.4 Procesar programación manualmente

```javascript
WAM_procesarProgramacionUI();
```

### 19.5 Activar scheduler

```javascript
WAM_activarScheduler();
```

### 19.6 Desactivar scheduler

```javascript
WAM_desactivarScheduler();
```

### 19.7 Enviar prueba

```javascript
WAM_enviarPruebaUI();
```

---

## 20. Instalación de triggers centrales

Ejecutar:

```javascript
installTriggers();
```

Esta función debe instalar los triggers principales del sistema.

Antes de instalar nuevos triggers, se recomienda limpiar duplicados por handler usando:

```javascript
clearTriggersByHandler_();
```

---

## 21. Validación posterior al despliegue

Después de desplegar, verificar:

- El menú `🧩 Sistema` aparece al abrir la hoja.
- Las hojas existen con los nombres correctos.
- Los módulos inicializan sin errores.
- Las funciones manuales se ejecutan correctamente.
- Los correos demo no contienen datos reales.
- Las propiedades del script están configuradas.
- Los triggers no están duplicados.
- Los logs se escriben correctamente.
- Las capturas están en `docs/screenshots/`.
- El repositorio no contiene `.clasp.json` real ni credenciales.

---

## 22. Comandos útiles de Clasp

### Subir cambios

```powershell
clasp push
```

### Descargar cambios desde Apps Script

```powershell
clasp pull
```

### Abrir proyecto

```powershell
clasp open
```

### Ver logs

```powershell
clasp logs
```

### Ver estado

```powershell
clasp status
```

---

## 23. Flujo recomendado de trabajo

```text
Editar código local
        │
        ▼
Guardar cambios
        │
        ▼
clasp push
        │
        ▼
Probar en Apps Script
        │
        ▼
Validar en Google Sheets
        │
        ▼
Commit en Git
        │
        ▼
Push a GitHub
```

---

## 24. Comandos Git recomendados

### Revisar estado

```powershell
git status
```

### Agregar archivos

```powershell
git add .
```

### Crear commit

```powershell
git commit -m "docs: add deployment and architecture documentation"
```

### Subir cambios

```powershell
git push origin main
```

---

## 25. Checklist de despliegue

```text
[ ] Node.js instalado
[ ] Clasp instalado
[ ] Login en Clasp realizado
[ ] Google Sheets creado
[ ] Hojas principales creadas
[ ] Proyecto Apps Script creado
[ ] .clasp.json configurado localmente
[ ] appsscript.json preparado
[ ] Código subido con clasp push
[ ] Permisos autorizados
[ ] Menú principal visible
[ ] Gestor de tareas inicializado
[ ] Dashboard creado
[ ] Facturas inicializadas
[ ] WhatsApp Auto Manager inicializado
[ ] Propiedades del script configuradas
[ ] Triggers instalados
[ ] Logs validados
[ ] Capturas agregadas
[ ] Datos sensibles excluidos
```

---

## 26. Problemas comunes

### No aparece el menú

Solución:

- Recargar Google Sheets.
- Ejecutar `crearMenuSistema()`.
- Verificar que `onOpen(e)` exista.
- Confirmar autorización del script.

---

### Error de permisos

Solución:

- Ejecutar una función manualmente desde Apps Script.
- Autorizar todos los permisos solicitados.
- Revisar `appsscript.json`.

---

### No se envían correos

Solución:

- Verificar permisos Gmail/MailApp.
- Confirmar destinatario demo.
- Revisar cuota de correo.
- Revisar logs en `Log Correos`.

---

### No se leen correos de facturas

Solución:

- Revisar permisos de Gmail.
- Ajustar remitente o asunto de búsqueda.
- Verificar estructura HTML del correo.
- Ejecutar `facRevisarCorreosManual()`.

---

### No funciona Green API

Solución:

- Revisar `GREEN_API_INSTANCE_ID`.
- Revisar `GREEN_API_TOKEN`.
- Confirmar conexión externa.
- Ejecutar `WAM_validarConexionUI()`.
- Revisar `WA_AUTO_LOG`.

---

### Triggers duplicados

Solución:

- Eliminar triggers manualmente desde Apps Script.
- Ejecutar funciones de limpieza.
- Reinstalar triggers con `installTriggers()`.

---

## 27. Recomendaciones para producción

- Usar una cuenta técnica o cuenta autorizada estable.
- No depender de cuentas personales si el proceso es crítico.
- Documentar propietarios del archivo.
- Proteger rangos sensibles.
- Usar validaciones de datos.
- Revisar cuotas de Apps Script.
- Monitorear logs semanalmente.
- Respaldar el archivo de Google Sheets.
- Usar versiones del proyecto.
- Separar entorno demo y entorno real.

---

## 28. Resultado esperado

Al finalizar el despliegue, el sistema debe permitir:

- Administrar tareas operativas desde Google Sheets.
- Sincronizar información entre `TAREAS` y `GENERAL`.
- Detectar órdenes de compra faltantes.
- Enviar alertas por correo.
- Generar observaciones.
- Exportar ítems a `JT_EXPORT`.
- Revisar facturas pendientes desde Gmail.
- Programar mensajes WhatsApp.
- Visualizar dashboard operativo.
- Mantener trazabilidad mediante logs.

---

## 29. Conclusión

El despliegue convierte un archivo de Google Sheets en una plataforma operativa automatizada basada en Google Apps Script.

El sistema queda listo para uso demo, portafolio profesional o adaptación controlada a un entorno real, siempre respetando las prácticas de seguridad y evitando exponer información sensible en el repositorio.
