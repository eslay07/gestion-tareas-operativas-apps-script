\# Guía de Usuario



\## Gestión de Tareas Operativas — Google Apps Script Automation Suite



Esta guía explica cómo utilizar el sistema \*\*Gestión de Tareas Operativas\*\* desde Google Sheets.



El sistema está diseñado para automatizar procesos operativos y administrativos mediante menús personalizados, hojas estructuradas, alertas, dashboards, revisión de correos, generación de observaciones y programación de mensajes WhatsApp.



\---



\## 1. Acceso al sistema



El sistema funciona dentro de un archivo de Google Sheets.



Al abrir el archivo, debe aparecer el menú:



```text

🧩 Sistema

```



Captura de referencia:



!\[Menú principal](screenshots/01-menu-sistema.png)



Desde este menú se accede a los módulos principales:



\- Sincronización.

\- Gestión de tareas.

\- Alertas OC.

\- Observaciones.

\- Exportación.

\- Facturas.

\- WhatsApp Auto Manager.

\- Configuración.

\- Triggers.



\---



\## 2. Hojas principales



El sistema utiliza las siguientes hojas:



| Hoja | Uso |

|---|---|

| `TAREAS` | Registro principal de tareas operativas. |

| `GENERAL` | Vista general o consolidada de información. |

| `FAC POR COMPARTIR` | Control de facturas detectadas desde correos. |

| `Configuración` | Parámetros del gestor de tareas. |

| `Completadas` | Tareas finalizadas. |

| `Dashboard` | Indicadores visuales. |

| `Log Correos` | Registro de correos enviados. |

| `JT\_EXPORT` | Exportación estructurada desde GENERAL. |

| `WA\_AUTO\_CFG` | Configuración WhatsApp. |

| `WA\_AUTO\_CONTACTOS` | Contactos sincronizados. |

| `WA\_AUTO\_PROGRAMACION` | Mensajes programados. |

| `WA\_AUTO\_PLANTILLAS` | Plantillas de mensajes. |

| `WA\_AUTO\_LOG` | Registro de envíos WhatsApp. |



\---



\## 3. Datos demo utilizados



Para pruebas y documentación se usan datos ficticios:



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



No se recomienda usar datos reales en entornos públicos o de demostración.



\---



\## 4. Flujo general de uso



```text

Registrar información en Google Sheets

&#x20;       │

&#x20;       ▼

Ejecutar módulo desde menú

&#x20;       │

&#x20;       ▼

Sistema procesa datos

&#x20;       │

&#x20;       ├── Sincroniza hojas

&#x20;       ├── Genera alertas

&#x20;       ├── Actualiza estados

&#x20;       ├── Envía correos

&#x20;       ├── Genera observaciones

&#x20;       ├── Exporta registros

&#x20;       └── Programa mensajes

&#x20;       │

&#x20;       ▼

Consultar resultados en hojas y logs

```



\---



\## 5. Menú principal



El menú `🧩 Sistema` centraliza las operaciones.



Opciones esperadas:



```text

🧩 Sistema

├── Sincronización

├── Gestor de tareas

├── Alertas OC

├── Observaciones

├── Exportación JT

├── Facturas

├── WhatsApp Auto Manager

├── Triggers

└── Utilidades

```



La disponibilidad exacta puede depender de los módulos instalados.



\---



\## 6. Módulo de sincronización



\### Objetivo



Mantener sincronizada la información entre:



```text

TAREAS ↔ GENERAL

```



\### Funciones disponibles



```text

syncAllNow()

validateSetup()

showLastRun()

```



\### Uso recomendado



1\. Abrir el archivo Google Sheets.

2\. Ir al menú `🧩 Sistema`.

3\. Seleccionar opción de sincronización.

4\. Ejecutar sincronización manual.

5\. Revisar que los datos se actualicen en ambas hojas.



\### Acciones automáticas



El módulo puede reaccionar ante:



\- Ediciones.

\- Selección de celdas.

\- Apertura del archivo.

\- Cambios de información operativa.



\### Recomendaciones



\- No cambiar nombres de hojas manualmente.

\- Mantener los ID de tarea consistentes.

\- Evitar duplicados.

\- Validar estructura antes de usar en producción.



\---



\## 7. Gestor de tareas



\### Objetivo



Administrar tareas operativas desde Google Sheets.



Captura de referencia:



!\[Gestor de tareas](screenshots/02-task-manager.png)



\### Hojas utilizadas



```text

TAREAS

Completadas

Configuración

Dashboard

Log Correos

```



\### Funcionalidades



\- Crear tareas.

\- Completar tareas.

\- Reactivar tareas.

\- Administrar categorías.

\- Definir criticidad.

\- Definir frecuencia.

\- Aplicar formato visual.

\- Enviar resumen diario.

\- Enviar resumen semanal.

\- Consultar dashboard.



\---



\### 7.1 Crear una tarea



Desde el menú:



```text

🧩 Sistema → Gestor de tareas → Nueva tarea

```



Datos sugeridos:



```text

ID\_TAREA: TAREA-DEMO-0001

Responsable: usuario.demo@empresa.com

Categoría: Compras

Criticidad: Alta

Frecuencia: Única

Descripción: Validar OC-DEMO-0001 de PROVEEDOR DEMO S.A.

```



\---



\### 7.2 Completar una tarea



Al marcar una tarea como completada:



\- Se actualiza su estado.

\- Puede moverse a la hoja `Completadas`.

\- Se conserva historial.

\- El dashboard puede actualizar indicadores.



\---



\### 7.3 Reactivar una tarea



Una tarea completada puede reactivarse si requiere seguimiento adicional.



Ejemplo:



```text

TAREA-DEMO-0001 requiere revisión adicional por factura pendiente.

```



\---



\### 7.4 Categorías



Las categorías permiten clasificar tareas.



Ejemplos demo:



```text

Compras

Facturas

Seguimiento

Proveedor

Administrativo

```



\---



\### 7.5 Criticidad



La criticidad ayuda a priorizar.



Valores sugeridos:



```text

Baja

Media

Alta

Crítica

```



\---



\### 7.6 Dashboard



La hoja `Dashboard` muestra indicadores del sistema.



Captura de referencia:



!\[Dashboard](screenshots/03-dashboard.png)



Indicadores posibles:



\- Total de tareas.

\- Tareas pendientes.

\- Tareas completadas.

\- Tareas críticas.

\- Tareas vencidas.

\- Resumen por categoría.

\- Resumen por responsable.



\---



\### 7.7 Resumen diario



El sistema puede enviar un resumen diario por correo.



Función asociada:



```text

enviarResumenDiario()

```



Correo demo:



```text

alertas.demo@empresa.com

```



\---



\### 7.8 Resumen semanal



El sistema puede enviar un resumen semanal consolidado.



Función asociada:



```text

enviarResumenSemanal()

```



\---



\## 8. Alertas de órdenes de compra faltantes



\### Objetivo



Detectar tareas que no tienen orden de compra asignada y enviar una alerta por correo.



Captura de referencia:



!\[Alertas OC](screenshots/04-alertas-oc.png)



\### Funciones disponibles



```text

sendTareasSinOCEmail\_V2()

createDailyTrigger\_V2()

debugConteo\_V2()

```



\---



\### 8.1 Ejecutar alerta manual



Desde el menú o desde Apps Script ejecutar:



```text

sendTareasSinOCEmail\_V2()

```



El sistema:



1\. Lee las tareas.

2\. Detecta registros sin OC.

3\. Calcula días pendientes.

4\. Clasifica riesgo.

5\. Agrupa por tarea.

6\. Genera correo HTML.

7\. Envía alerta.



\---



\### 8.2 Crear alerta diaria



Ejecutar:



```text

createDailyTrigger\_V2()

```



Esto configura un trigger diario para enviar alertas automáticamente.



\---



\### 8.3 Clasificación de riesgo



Ejemplo:



```text

Bajo

Medio

Alto

Crítico

```



El riesgo se calcula según antigüedad y prioridad operativa.



\---



\### 8.4 Ejemplo demo



```text

Tarea: TAREA-DEMO-0001

Proveedor: PROVEEDOR DEMO S.A.

OC: Pendiente

Correo destino: alertas.demo@empresa.com

```



\---



\## 9. Generador de observaciones



\### Objetivo



Generar observaciones estandarizadas por tarea o por orden.



Captura de referencia:



!\[Observaciones](screenshots/06-observaciones.png)



\### Funciones disponibles



```text

obs3\_abrirSidebar()

obs3\_abrirConfigSidebar()

obs3\_generarParaLaTarea(taskId)

obs3\_generarParaLaOrden(taskId)

obs3\_restaurarConfigAutorizadores()

obs3\_restaurarConfigPorDefectoConfirm()

```



\---



\### 9.1 Abrir sidebar



Desde el menú:



```text

🧩 Sistema → Observaciones → Abrir generador

```



O ejecutar:



```text

obs3\_abrirSidebar()

```



\---



\### 9.2 Generar observación por tarea



Ejemplo:



```text

obs3\_generarParaLaTarea('TAREA-DEMO-0001')

```



Resultado esperado:



```text

Se genera una observación relacionada con la tarea TAREA-DEMO-0001.

```



\---



\### 9.3 Generar observación por orden



Ejemplo:



```text

obs3\_generarParaLaOrden('TAREA-DEMO-0001')

```



\---



\### 9.4 Configurar autorizadores



Autorizadores demo:



```text

AUTORIZADOR DEMO 1

AUTORIZADOR DEMO 2

AUTORIZADOR DEMO 3

```



El módulo permite restaurar una configuración base de autorizadores.



\---



\## 10. Exportación a JT\_EXPORT



\### Objetivo



Exportar ítems desde `GENERAL` hacia `JT\_EXPORT` en una estructura limpia.



\### Funciones disponibles



```text

GTX\_exportNow()

GTX\_setupTrigger\_5min()

GTX\_deleteTriggers()

```



\---



\### 10.1 Ejecutar exportación manual



```text

GTX\_exportNow()

```



Columnas generadas:



```text

TASK\_ID

CODIGO

DETALLE

CANTIDAD

PROVEEDOR

OC

ROW\_SRC

EXPORTED\_AT

```



\---



\### 10.2 Activar exportación automática



```text

GTX\_setupTrigger\_5min()

```



Esto permite ejecutar exportación periódica cada 5 minutos.



\---



\### 10.3 Eliminar triggers de exportación



```text

GTX\_deleteTriggers()

```



\---



\## 11. Gestor de facturas



\### Objetivo



Detectar facturas pendientes desde Gmail y registrarlas en la hoja `FAC POR COMPARTIR`.



Captura de referencia:



!\[Facturas](screenshots/05-facturas.png)



\### Funciones disponibles



```text

facInicializarHoja()

facRevisarCorreos()

facRevisarCorreosManual()

\_facExtraerFilasJ()

\_facActualizarEstados()

\_facAplicarFormato()

facBuildDupSet()

```



\---



\### 11.1 Inicializar hoja de facturas



```text

facInicializarHoja()

```



Crea o prepara la hoja:



```text

FAC POR COMPARTIR

```



\---



\### 11.2 Revisar correos manualmente



```text

facRevisarCorreosManual()

```



El sistema:



1\. Busca correos según remitente y asunto.

2\. Lee tablas HTML.

3\. Extrae datos relevantes.

4\. Valida duplicados.

5\. Inserta registros nuevos.

6\. Actualiza estados.

7\. Aplica formato visual.



\---



\### 11.3 Estados de factura



```text

NUEVO

PENDIENTE

URGENTE

CRÍTICO

COMPARTIDA

```



\---



\### 11.4 Ejemplo demo



```text

Factura: FACTURA-DEMO-0001

Proveedor: PROVEEDOR DEMO S.A.

Remitente: usuario.demo@empresa.com

Estado: NUEVO

```



\---



\## 12. WhatsApp Auto Manager



\### Objetivo



Programar y enviar mensajes WhatsApp mediante Green API.



Captura de referencia:



!\[WhatsApp Auto](screenshots/07-whatsapp-auto.png)



\### Hojas utilizadas



```text

WA\_AUTO\_CFG

WA\_AUTO\_CONTACTOS

WA\_AUTO\_PROGRAMACION

WA\_AUTO\_PLANTILLAS

WA\_AUTO\_LOG

```



\### Funciones disponibles



```text

WAM\_inicializarModulo()

WAM\_abrirVentanaProgramador()

WAM\_validarConexionUI()

WAM\_sincronizarContactosUI()

WAM\_procesarProgramacionUI()

WAM\_activarScheduler()

WAM\_desactivarScheduler()

WAM\_resetEstadoEjecucion()

WAM\_enviarPruebaUI()

```



\---



\### 12.1 Inicializar módulo



```text

WAM\_inicializarModulo()

```



Esto prepara las hojas necesarias.



\---



\### 12.2 Validar conexión



```text

WAM\_validarConexionUI()

```



El sistema comprueba si las credenciales demo o reales están configuradas correctamente.



\---



\### 12.3 Sincronizar contactos



```text

WAM\_sincronizarContactosUI()

```



Actualiza la hoja:



```text

WA\_AUTO\_CONTACTOS

```



\---



\### 12.4 Abrir programador visual



```text

WAM\_abrirVentanaProgramador()

```



Captura de referencia:



!\[Programador WhatsApp](screenshots/08-programador-whatsapp.png)



Desde la interfaz se puede:



\- Buscar contactos.

\- Seleccionar destinatarios.

\- Escribir mensaje.

\- Elegir frecuencia.

\- Programar envío.



\---



\### 12.5 Frecuencias disponibles



```text

Única

Diaria

Semanal

Mensual

```



\---



\### 12.6 Procesar mensajes programados



```text

WAM\_procesarProgramacionUI()

```



El sistema revisa la programación pendiente y envía los mensajes que correspondan.



\---



\### 12.7 Activar scheduler



```text

WAM\_activarScheduler()

```



Permite procesar la cola automáticamente.



\---



\### 12.8 Desactivar scheduler



```text

WAM\_desactivarScheduler()

```



Detiene el procesamiento automático.



\---



\### 12.9 Enviar mensaje de prueba



```text

WAM\_enviarPruebaUI()

```



Permite validar configuración antes de activar envíos reales.



\---



\## 13. Programador visual WhatsApp



El archivo:



```text

WAM\_PROGRAMADOR\_DIALOG.html

```



proporciona la interfaz para programar mensajes.



\### Funciones de la interfaz



\- Buscar contacto.

\- Seleccionar uno o varios destinatarios.

\- Configurar frecuencia.

\- Escribir mensaje.

\- Guardar programación.

\- Enviar datos al backend mediante `google.script.run`.



\### Flujo



```text

Usuario abre programador

&#x20;       │

&#x20;       ▼

Selecciona contactos

&#x20;       │

&#x20;       ▼

Escribe mensaje

&#x20;       │

&#x20;       ▼

Configura frecuencia

&#x20;       │

&#x20;       ▼

Guarda programación

&#x20;       │

&#x20;       ▼

Backend registra en WA\_AUTO\_PROGRAMACION

```



\---



\## 14. Logs y auditoría



El sistema registra información de ejecución en hojas de log.



\### Hojas de log



```text

Log Correos

WA\_AUTO\_LOG

```



\### Información registrada



\- Fecha de ejecución.

\- Acción realizada.

\- Resultado.

\- Mensaje de error si existe.

\- Estado de envío.

\- Destinatario demo.

\- Módulo de origen.



Ejemplo demo:



```text

Fecha: 2026-01-01

Acción: Envío de alerta OC

Destinatario: alertas.demo@empresa.com

Resultado: OK

```



\---



\## 15. Triggers



Los triggers permiten ejecutar procesos automáticamente.



\### Tipos de procesos automatizables



```text

Alertas OC diarias

Resumen diario

Resumen semanal

Revisión de facturas

Procesamiento WhatsApp

Exportación JT\_EXPORT

Sincronización

```



\### Recomendación



Revisar triggers activos periódicamente desde:



```text

Apps Script → Desencadenadores

```



Evitar duplicados. Un trigger duplicado puede enviar correos o mensajes dos veces, que es básicamente ponerle turbo al caos.



\---



\## 16. Buenas prácticas de uso



\- No cambiar nombres de hojas sin actualizar configuración.

\- No eliminar columnas críticas.

\- No borrar hojas de log sin respaldo.

\- No usar credenciales reales en código.

\- Revisar dashboard antes de tomar decisiones.

\- Validar correos destino antes de activar alertas.

\- Probar WhatsApp con datos demo.

\- Revisar logs si algo no se ejecuta.

\- No duplicar triggers.

\- Mantener respaldos del archivo.



\---



\## 17. Errores comunes



\### No aparece el menú



Posibles causas:



\- El archivo no fue recargado.

\- No se ejecutó `onOpen(e)`.

\- Falta autorización.

\- Hay error en el código.



Solución:



```text

Recargar Google Sheets

Ejecutar crearMenuSistema()

Autorizar permisos

Revisar registros de Apps Script

```



\---



\### No se sincronizan datos



Posibles causas:



\- ID de tarea vacío.

\- Nombres de hojas incorrectos.

\- Estructura modificada.

\- Trigger no instalado.



Solución:



```text

Ejecutar validateSetup()

Ejecutar syncAllNow()

Revisar TAREAS y GENERAL

```



\---



\### No se envían alertas OC



Posibles causas:



\- No hay tareas sin OC.

\- Correo destino no configurado.

\- Permisos de correo no autorizados.

\- Cuota de correo alcanzada.



Solución:



```text

Ejecutar debugConteo\_V2()

Revisar alertas.demo@empresa.com

Revisar Log Correos

```



\---



\### No se detectan facturas



Posibles causas:



\- El asunto del correo no coincide.

\- El remitente no coincide.

\- El correo no tiene tabla HTML esperada.

\- Gmail no fue autorizado.



Solución:



```text

Ejecutar facRevisarCorreosManual()

Revisar permisos Gmail

Revisar criterios de búsqueda

```



\---



\### WhatsApp no envía mensajes



Posibles causas:



\- Green API no configurado.

\- Token inválido.

\- Instancia desconectada.

\- Contacto no sincronizado.

\- Scheduler desactivado.



Solución:



```text

Ejecutar WAM\_validarConexionUI()

Ejecutar WAM\_sincronizarContactosUI()

Revisar WA\_AUTO\_LOG

```



\---



\## 18. Checklist operativo



```text

\[ ] Menú 🧩 Sistema visible

\[ ] Hojas principales creadas

\[ ] Configuración revisada

\[ ] TAREAS contiene registros válidos

\[ ] GENERAL contiene datos sincronizables

\[ ] Dashboard actualizado

\[ ] Alertas OC probadas

\[ ] Facturas inicializadas

\[ ] Observaciones funcionando

\[ ] JT\_EXPORT genera salida

\[ ] WhatsApp Auto inicializado

\[ ] Logs registrando eventos

\[ ] Triggers revisados

\[ ] Datos sensibles fuera del sistema demo

```



\---



\## 19. Flujo recomendado de operación diaria



```text

1\. Abrir Google Sheets

2\. Revisar Dashboard

3\. Validar tareas críticas

4\. Ejecutar sincronización si es necesario

5\. Revisar alertas OC

6\. Revisar facturas nuevas

7\. Generar observaciones pendientes

8\. Exportar información si aplica

9\. Revisar mensajes WhatsApp programados

10\. Consultar logs ante cualquier error

```



\---



\## 20. Flujo recomendado de operación semanal



```text

1\. Revisar tareas completadas

2\. Revisar tareas vencidas

3\. Revisar categorías

4\. Revisar facturas críticas

5\. Revisar órdenes sin OC

6\. Validar triggers activos

7\. Revisar logs de WhatsApp

8\. Revisar dashboard

9\. Enviar resumen semanal

10\. Respaldar archivo si aplica

```



\---



\## 21. Recomendaciones para demostración profesional



Para mostrar este sistema como proyecto de portafolio:



\- Usar una copia demo.

\- Cargar datos ficticios.

\- Mostrar menú principal.

\- Mostrar dashboard.

\- Mostrar alerta OC demo.

\- Mostrar gestor de facturas con datos ficticios.

\- Mostrar observaciones con autorizadores demo.

\- Mostrar programador WhatsApp sin tokens reales.

\- Explicar el impacto operativo.

\- Evitar capturas con información privada.



\---



\## 22. Resultado esperado



Con el sistema correctamente configurado, el usuario puede:



\- Gestionar tareas desde Google Sheets.

\- Automatizar seguimiento operativo.

\- Reducir tareas manuales repetitivas.

\- Detectar órdenes de compra faltantes.

\- Controlar facturas pendientes.

\- Generar observaciones estandarizadas.

\- Exportar información estructurada.

\- Programar mensajes WhatsApp.

\- Consultar dashboards.

\- Auditar ejecuciones mediante logs.



\---



\## 23. Conclusión



La suite convierte Google Sheets en una herramienta operativa automatizada, práctica y extensible.



El sistema no busca reemplazar un ERP completo, pero sí cubrir procesos administrativos repetitivos donde normalmente todo termina dependiendo de memoria humana, correos perdidos y hojas editadas a mano como si fueran reliquias arqueológicas.



Usado correctamente, permite ordenar el flujo operativo, mejorar trazabilidad y reducir errores sin requerir infraestructura adicional.



