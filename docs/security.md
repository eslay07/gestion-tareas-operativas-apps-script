\# Seguridad y Buenas Prácticas



\## Gestión de Tareas Operativas — Google Apps Script Automation Suite



Este documento define los criterios de seguridad aplicados al proyecto \*\*Gestión de Tareas Operativas\*\*.



El objetivo es mantener el repositorio seguro, reutilizable y presentable como portafolio profesional, evitando la exposición de datos sensibles, credenciales, correos reales, información corporativa o detalles internos de operación.



\---



\## 1. Principio general



El repositorio debe contener únicamente:



\- Código fuente sanitizado.

\- Archivos de ejemplo.

\- Documentación técnica.

\- Datos demo.

\- Capturas sin información confidencial.

\- Configuraciones no sensibles.



El repositorio no debe contener:



\- Credenciales reales.

\- Correos reales.

\- Tokens.

\- API keys.

\- Contraseñas.

\- IDs privados de Apps Script.

\- IDs reales de hojas de cálculo.

\- Datos reales de proveedores.

\- Datos reales de órdenes de compra.

\- Datos reales de facturas.

\- Información operativa interna.

\- Datos personales.

\- Historial real de correos o mensajes.



\---



\## 2. Datos demo permitidos



Para documentación, ejemplos y pruebas públicas se deben usar únicamente datos ficticios.



Datos demo autorizados:



```text

usuario.demo@empresa.com

alertas.demo@empresa.com

PROVEEDOR DEMO S.A.

OC-DEMO-0001

FACTURA-DEMO-0001

TAREA-DEMO-0001

AUTORIZADOR DEMO 1

AUTORIZADOR DEMO 2

AUTORIZADOR DEMO 3

```



Estos valores permiten explicar el funcionamiento sin exponer información real.



\---



\## 3. Información que nunca debe subirse al repositorio



\### 3.1 Credenciales



No subir:



```text

API keys

Tokens

Contraseñas

Client secrets

Refresh tokens

Access tokens

Credenciales Green API

Credenciales Gmail

Credenciales corporativas

```



\### 3.2 Identificadores privados



No subir:



```text

scriptId real

spreadsheetId real

deploymentId real

web app URL privada

IDs internos de carpetas

IDs de documentos privados

IDs de instancias Green API reales

```



\### 3.3 Datos operativos reales



No subir:



```text

Órdenes de compra reales

Facturas reales

Números de tarea reales

Nombres reales de proveedores

Correos reales de usuarios

Correos reales de clientes

Correos reales de autorizadores

Registros reales de logs

Capturas con información interna

```



\---



\## 4. Archivos sensibles



\### 4.1 `.clasp.json`



El archivo `.clasp.json` contiene el ID real del proyecto Apps Script.



No debe subirse al repositorio público.



Debe usarse únicamente:



```text

.clasp.example.json

```



Ejemplo seguro:



```json

{

&#x20; "scriptId": "SCRIPT\_ID\_DEMO",

&#x20; "rootDir": "src"

}

```



\---



\### 4.2 `appsscript.json`



El archivo `appsscript.json` puede ser público si no contiene información sensible.



Para documentación se recomienda publicar:



```text

appsscript.example.json

```



Antes de subir, revisar:



\- Scopes.

\- Dependencias.

\- URLs.

\- Configuraciones especiales.

\- Servicios avanzados.



\---



\### 4.3 Propiedades del script



Las propiedades reales del script no deben estar en el código.



Se deben configurar desde:



```text

Apps Script → Configuración del proyecto → Propiedades de la secuencia de comandos

```



El repositorio solo debe incluir:



```text

samples/script-properties.example.json

```



Ejemplo seguro:



```json

{

&#x20; "ALERT\_EMAIL\_TO": "alertas.demo@empresa.com",

&#x20; "DEFAULT\_USER\_EMAIL": "usuario.demo@empresa.com",

&#x20; "GREEN\_API\_INSTANCE\_ID": "DEMO\_INSTANCE\_ID",

&#x20; "GREEN\_API\_TOKEN": "DEMO\_TOKEN",

&#x20; "GREEN\_API\_BASE\_URL": "https://api.green-api.com"

}

```



\---



\## 5. Archivo `.gitignore` recomendado



El archivo `.gitignore` debe excluir archivos locales, credenciales y configuraciones privadas.



Ejemplo recomendado:



```gitignore

\# Clasp real config

.clasp.json



\# Apps Script real manifest if needed

appsscript.json



\# Environment files

.env

.env.local

.env.production



\# Credentials

credentials.json

client\_secret.json

token.json

secrets.json



\# Local logs

\*.log

logs/

debug/



\# OS files

.DS\_Store

Thumbs.db



\# Node

node\_modules/



\# Temporary files

\*.tmp

\*.bak

\*.old



\# Local exports

exports/

private/

```



Si el proyecto decide versionar `appsscript.json`, debe revisarse manualmente antes de cada commit.



\---



\## 6. Manejo seguro de Green API



El módulo WhatsApp Auto Manager utiliza Green API mediante `UrlFetchApp`.



Las siguientes variables no deben estar escritas directamente en el código:



```text

GREEN\_API\_INSTANCE\_ID

GREEN\_API\_TOKEN

GREEN\_API\_BASE\_URL

```



Deben obtenerse desde `PropertiesService`.



Ejemplo conceptual:



```javascript

var props = PropertiesService.getScriptProperties();



var instanceId = props.getProperty('GREEN\_API\_INSTANCE\_ID');

var token = props.getProperty('GREEN\_API\_TOKEN');

var baseUrl = props.getProperty('GREEN\_API\_BASE\_URL');

```



\### Reglas



\- No imprimir tokens en logs.

\- No mostrar tokens en alertas.

\- No guardar tokens en hojas visibles.

\- No compartir capturas con tokens.

\- No enviar tokens por correo.

\- No escribir tokens dentro de archivos `.gs`.



\---



\## 7. Manejo seguro de correos



El sistema usa Gmail y MailApp para:



\- Leer correos de facturas.

\- Enviar alertas.

\- Enviar resúmenes.

\- Registrar logs.



\### Reglas



\- Usar correos demo en documentación.

\- No dejar correos reales en archivos públicos.

\- No publicar asuntos reales de correos internos.

\- No subir cuerpo de correos reales.

\- No subir logs reales.

\- No incluir destinatarios reales en capturas.



Ejemplo seguro:



```text

usuario.demo@empresa.com

alertas.demo@empresa.com

```



\---



\## 8. Manejo seguro de hojas de cálculo



El sistema trabaja sobre Google Sheets.



\### Riesgos principales



\- Exposición de nombres reales.

\- Exposición de proveedores.

\- Exposición de órdenes de compra.

\- Exposición de facturas.

\- Exposición de estados internos.

\- Exposición de responsables.



\### Recomendaciones



\- Usar una copia demo del archivo.

\- Reemplazar datos reales por ficticios.

\- Ocultar columnas sensibles antes de capturar pantalla.

\- No publicar enlaces reales del archivo.

\- No usar capturas con datos corporativos.

\- Proteger hojas críticas.

\- Limitar permisos de edición.



\---



\## 9. Capturas de pantalla



Las capturas deben guardarse en:



```text

docs/screenshots/

```



Archivos esperados:



```text

01-menu-sistema.png

02-task-manager.png

03-dashboard.png

04-alertas-oc.png

05-facturas.png

06-observaciones.png

07-whatsapp-auto.png

08-programador-whatsapp.png

```



Antes de subir capturas, revisar que no contengan:



```text

Correos reales

Nombres reales

Proveedores reales

Órdenes reales

Facturas reales

Tokens

URLs privadas

IDs de documentos

Datos personales

Montos reales sensibles

Chats reales

```



\### Recomendación



Usar únicamente datos demo:



```text

TAREA-DEMO-0001

OC-DEMO-0001

FACTURA-DEMO-0001

PROVEEDOR DEMO S.A.

usuario.demo@empresa.com

```



\---



\## 10. Logs del sistema



El sistema puede escribir logs en hojas como:



```text

Log Correos

WA\_AUTO\_LOG

```



Los logs son útiles para auditoría, pero pueden contener datos sensibles.



\### No publicar logs reales



Antes de subir ejemplos:



\- Reemplazar correos por `usuario.demo@empresa.com`.

\- Reemplazar proveedores por `PROVEEDOR DEMO S.A.`.

\- Reemplazar facturas por `FACTURA-DEMO-0001`.

\- Reemplazar órdenes por `OC-DEMO-0001`.

\- Reemplazar tareas por `TAREA-DEMO-0001`.

\- Eliminar mensajes de error con información privada.



\---



\## 11. Permisos OAuth



El proyecto puede requerir permisos para:



```text

Google Sheets

Gmail read-only

Gmail send

MailApp

Triggers

External requests

Container UI

```



Scopes comunes:



```json

\[

&#x20; "https://www.googleapis.com/auth/spreadsheets.currentonly",

&#x20; "https://www.googleapis.com/auth/script.scriptapp",

&#x20; "https://www.googleapis.com/auth/script.container.ui",

&#x20; "https://www.googleapis.com/auth/gmail.readonly",

&#x20; "https://www.googleapis.com/auth/gmail.send",

&#x20; "https://www.googleapis.com/auth/script.external\_request"

]

```



\### Buenas prácticas



\- Solicitar solo los permisos necesarios.

\- Evitar scopes amplios si no son requeridos.

\- Documentar por qué se necesita cada permiso.

\- Revisar permisos antes de publicar.

\- Separar entorno demo de entorno real.



\---



\## 12. Triggers



Los triggers permiten automatizar procesos, pero también pueden ejecutar acciones sin intervención manual.



\### Acciones con triggers



```text

Enviar alertas

Revisar correos

Procesar WhatsApp

Exportar registros

Enviar resúmenes

Sincronizar hojas

```



\### Recomendaciones



\- Revisar triggers activos periódicamente.

\- Evitar duplicados.

\- Usar funciones de limpieza.

\- Documentar cada trigger instalado.

\- Ejecutar triggers con una cuenta controlada.

\- No instalar triggers desde cuentas personales si el flujo es crítico.



\---



\## 13. Control de acceso



\### Google Sheets



Recomendaciones:



\- Compartir solo con usuarios necesarios.

\- Evitar enlaces públicos de edición.

\- Usar permisos de lectura cuando sea suficiente.

\- Proteger hojas con fórmulas o configuración.

\- Restringir rangos críticos.



\### Apps Script



Recomendaciones:



\- Limitar editores del proyecto.

\- Usar versiones.

\- Documentar despliegues.

\- Revisar cambios antes de publicar.

\- Mantener propietario claro del script.



\---



\## 14. Separación de entornos



Se recomienda manejar al menos dos entornos:



```text

Demo

Producción

```



\### Entorno demo



Debe usar:



```text

usuario.demo@empresa.com

alertas.demo@empresa.com

PROVEEDOR DEMO S.A.

OC-DEMO-0001

FACTURA-DEMO-0001

TAREA-DEMO-0001

```



\### Entorno producción



Debe estar fuera del repositorio público.



Debe tener:



\- Archivo real privado.

\- Propiedades reales del script.

\- Triggers reales controlados.

\- Permisos restringidos.

\- Logs privados.



\---



\## 15. Revisión antes de cada commit



Antes de hacer commit, ejecutar revisión manual:



```powershell

git status

```



Revisar archivos agregados:



```powershell

git diff --cached

```



Buscar posibles secretos:



```powershell

Select-String -Path .\\src\\\* -Pattern "token","api","password","secret","gmail","@"

```



También revisar:



```powershell

Select-String -Path .\\docs\\\* -Pattern "@","token","secret","password","OC-","FACTURA-"

```



\---



\## 16. Checklist de seguridad previo a publicar



```text

\[ ] No existe .clasp.json real en el repositorio

\[ ] No existen tokens en archivos .gs

\[ ] No existen API keys reales

\[ ] No existen correos reales

\[ ] No existen proveedores reales

\[ ] No existen facturas reales

\[ ] No existen órdenes de compra reales

\[ ] No existen logs reales

\[ ] No existen capturas con datos sensibles

\[ ] appsscript.example.json no contiene datos privados

\[ ] script-properties.example.json usa datos demo

\[ ] README usa datos demo

\[ ] docs usan datos demo

\[ ] .gitignore excluye archivos sensibles

\[ ] Se revisó git diff antes del commit

```



\---



\## 17. Respuesta ante exposición accidental



Si por error se sube información sensible:



\### 17.1 Acción inmediata



\- Eliminar el dato del repositorio.

\- Revocar token o credencial afectada.

\- Generar nueva credencial.

\- Revisar logs de uso.

\- Notificar internamente si aplica.



\### 17.2 Si fue una API key



\- Revocar la API key.

\- Crear una nueva.

\- Actualizar propiedades del script.

\- Revisar accesos recientes.



\### 17.3 Si fue un correo o dato operativo



\- Eliminar del repositorio.

\- Reemplazar por dato demo.

\- Revisar capturas.

\- Revisar historial de commits si el repositorio es público.



\---



\## 18. Sanitización recomendada



\### Antes



```text

Proveedor: Nombre Real S.A.

Factura: 001-002-000123456

OC: 4500000001

Correo: usuario.real@empresa.com

```



\### Después



```text

Proveedor: PROVEEDOR DEMO S.A.

Factura: FACTURA-DEMO-0001

OC: OC-DEMO-0001

Correo: usuario.demo@empresa.com

```



\---



\## 19. Seguridad en código



\### No recomendado



```javascript

var token = 'TOKEN\_REAL\_AQUI';

var email = 'usuario.real@empresa.com';

```



\### Recomendado



```javascript

var props = PropertiesService.getScriptProperties();

var token = props.getProperty('GREEN\_API\_TOKEN');

var email = props.getProperty('DEFAULT\_USER\_EMAIL');

```



\---



\## 20. Seguridad en mensajes WhatsApp



El módulo WhatsApp Auto Manager debe evitar:



\- Enviar mensajes a contactos no validados.

\- Registrar tokens en logs.

\- Mostrar credenciales en pantalla.

\- Enviar información sensible por error.

\- Programar mensajes sin trazabilidad.



\### Recomendaciones



\- Validar destinatarios.

\- Registrar estado de envío.

\- Registrar errores sin exponer credenciales.

\- Usar plantillas revisadas.

\- Probar primero con contactos demo.



\---



\## 21. Seguridad en facturas



El módulo de facturas debe cuidar:



\- Datos fiscales.

\- Números de factura.

\- Proveedores.

\- Fechas.

\- Remitentes.

\- Estados internos.



Para repositorio público, usar:



```text

FACTURA-DEMO-0001

PROVEEDOR DEMO S.A.

usuario.demo@empresa.com

```



\---



\## 22. Seguridad en alertas OC



El módulo de alertas OC puede contener datos sensibles de operación.



Para documentación, usar:



```text

TAREA-DEMO-0001

OC-DEMO-0001

PROVEEDOR DEMO S.A.

alertas.demo@empresa.com

```



No publicar:



\- Órdenes reales.

\- Antigüedad real.

\- Departamentos reales sensibles.

\- Priorizaciones internas reales.

\- Destinatarios reales.



\---



\## 23. Seguridad en observaciones



Las observaciones pueden contener información interna de gestión.



Usar autorizadores demo:



```text

AUTORIZADOR DEMO 1

AUTORIZADOR DEMO 2

AUTORIZADOR DEMO 3

```



No publicar:



\- Nombres reales de autorizadores.

\- Flujos reales de aprobación.

\- Motivos internos.

\- Comentarios operativos reales.



\---



\## 24. Seguridad en dashboard



El dashboard puede exponer métricas internas.



Antes de capturar pantalla:



\- Usar datos demo.

\- Ocultar montos reales.

\- Ocultar responsables reales.

\- Ocultar fechas sensibles.

\- Ocultar rendimiento real de equipos.

\- Revisar cada celda visible.



\---



\## 25. Auditoría recomendada



Revisar periódicamente:



```text

Permisos del archivo

Permisos del Apps Script

Triggers activos

Propiedades del script

Logs de ejecución

Capturas publicadas

Commits recientes

Issues públicas

Pull requests

```



\---



\## 26. Recomendación para portafolio



Para mostrar el proyecto profesionalmente sin comprometer datos:



\- Usar un archivo demo.

\- Usar capturas limpias.

\- Explicar arquitectura.

\- Explicar módulos.

\- Explicar impacto operativo.

\- Evitar información real.

\- Mostrar flujo funcional.

\- Mostrar buenas prácticas de seguridad.



\---



\## 27. Conclusión



La seguridad del proyecto depende principalmente de mantener separados el código documentado y la información real de operación.



El repositorio debe demostrar capacidad técnica, automatización, integración y criterio profesional, pero nunca debe exponer datos reales.



La regla central es simple:



```text

Código público, datos demo.

Credenciales privadas, fuera del repositorio.

```



