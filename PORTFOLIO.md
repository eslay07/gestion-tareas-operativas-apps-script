# Gestión de tareas operativas · lectura de portafolio

Suite de Apps Script que reúne seguimiento, sincronización, alertas y formularios sobre Google Sheets.

**Autor:** Jimmy Toapanta · [Perfil profesional](https://www.linkedin.com/in/jimmy-toapanta-950a441b8/) · [Portafolio](https://github.com/eslay07)

**Tecnologías:** Google Apps Script · JavaScript · Google Sheets · HTML Service

## Problema y solución

La revisión de pendientes, órdenes y facturas suele repartirse entre hojas, correos y comprobaciones manuales.

Organiza las responsabilidades por módulos y expone un menú operativo con sincronización, alertas, observaciones, facturas y programación de avisos.

## Evidencia para revisar el trabajo

| Archivo o componente | Qué permite revisar |
| --- | --- |
| [src/00_CORE_REFACTORED.gs](src/00_CORE_REFACTORED.gs) | Punto de integración del menú y las acciones. |
| [src/01_SYNC.gs](src/01_SYNC.gs) | Sincronización de información. |
| [src/05_TASK_MANAGER.gs](src/05_TASK_MANAGER.gs) | Gestión de tareas. |
| [src/07_WHATSAPP_AUTO_MANAGER.gs](src/07_WHATSAPP_AUTO_MANAGER.gs) | Programación de avisos por el servicio configurado. |

## Estado y límites

Implementación que requiere hojas, permisos y servicios externos propios. Las capturas y la documentación no sustituyen la validación de cada despliegue.

## Cómo evaluar el proyecto

Leer la configuración de ejemplo y los módulos; usar datos sintéticos antes de autorizar activadores. No se ejecutaron envíos ni activadores de producción.

Esta actualización documental se basa en la revisión del código y de la documentación disponibles. No añade métricas de ahorro, clientes, usuarios ni resultados de producción que no estén respaldados.

## Capacidad que demuestra

Dividir un proceso administrativo en módulos que comparten configuración, registros y puntos de entrada.

[Volver al README](README.md).
