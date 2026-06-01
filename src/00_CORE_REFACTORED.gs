/*****************************************************************
 * 00_CORE_REFACTORED.gs
 * Núcleo limpio: utilidades compartidas, menú único y triggers.
 *
 * Nota de diseño:
 * - Mantiene nombres públicos existentes para no romper botones,
 *   triggers ni funciones llamadas desde el menú.
 * - El menú se declara por configuración para que el proyecto deje de
 *   verse como una cadena gigante pegada con cinta aislante.
 *****************************************************************/

var APP_CORE = {
  TZ: (typeof SYS_getTz_ === 'function' ? SYS_getTz_() : (Session.getScriptTimeZone() || 'America/Guayaquil')),
  MENU_NAME: '🧩 Sistema',
  UPPER_MAX_CELLS: 5000
};

// ════════════════════════════════════════════════════════════════
// UTILIDADES COMPARTIDAS
// ════════════════════════════════════════════════════════════════

function isBlank_(v) {
  return v === null || v === undefined || String(v).replace(/\u00A0/g, ' ').trim() === '';
}

function normalizeTaskId_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' && v >= 100000) return String(Math.trunc(v));
  var s = String(v).trim();
  return /^\d{6,}$/.test(s) ? s : '';
}

function normalizeText_(v) {
  return (v === null || v === undefined) ? '' : String(v).trim();
}
var safeText_ = normalizeText_;

function escapeHtml_(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function daysBetween_(d1, d2) {
  if (!(d1 instanceof Date) || !(d2 instanceof Date)) return 0;
  var ms = 86400000;
  var a = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  var b = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
  return Math.max(0, Math.floor((b - a) / ms));
}

function formatMoney_(v) {
  if (isBlank_(v)) return '$N/D';
  var s = String(v).trim();
  return s.indexOf('$') === 0 ? s : '$' + s;
}

function normKey_(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return Utilities.formatDate(v, APP_CORE.TZ, 'yyyy-MM-dd');
  return String(v).replace(/\u00A0/g, ' ').trim().toUpperCase();
}

function getLastRowInColumn_(sh, col) {
  if (!sh) return 0;
  var last = sh.getLastRow();
  if (last < 1) return 0;
  var vals = sh.getRange(1, col, last, 1).getValues();
  for (var i = vals.length - 1; i >= 0; i--) {
    if (!isBlank_(vals[i][0])) return i + 1;
  }
  return 0;
}

function intersectsAny_(startCol, nCols, targets) {
  var endCol = startCol + nCols - 1;
  return (targets || []).some(function(c) { return startCol <= c && c <= endCol; });
}

function getSheetSafe_(name, ss) {
  return (ss || SpreadsheetApp.getActiveSpreadsheet()).getSheetByName(name);
}

function toast_(msg, title, seconds) {
  SpreadsheetApp.getActiveSpreadsheet().toast(msg, title || 'Sistema', seconds || 4);
}

function readTable_(sh, startRow, startCol, numRows, numCols) {
  if (!sh || numRows <= 0 || numCols <= 0) return [];
  return sh.getRange(startRow, startCol, numRows, numCols).getValues();
}

function setBackgroundsByRow_(sh, rowStart, colors) {
  if (!sh || !colors || !colors.length) return;
  var numCols = sh.getLastColumn();
  var matrix = colors.map(function(c) {
    var row = [];
    for (var i = 0; i < numCols; i++) row.push(c);
    return row;
  });
  sh.getRange(rowStart, 1, colors.length, numCols).setBackgrounds(matrix);
}

function clearTriggersByHandler_(handlers) {
  var set = {};
  (handlers || []).forEach(function(h) { set[h] = true; });
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (set[t.getHandlerFunction()]) ScriptApp.deleteTrigger(t);
  });
}

function appLog_(context, err) {
  Logger.log('[%s] %s', context, err && err.stack ? err.stack : err);
}

function appTry_(context, fn) {
  try {
    return fn();
  } catch (err) {
    appLog_(context, err);
    return null;
  }
}

/**
 * Detector único de cabecera de tarea en GENERAL.
 * Se reutiliza en OC, Observaciones y Exportación JT.
 */
function GENERAL_isTaskHeaderRow_(row, taskIdCol, codeCol, qtyCol, provCol) {
  var taskId = normalizeTaskId_(row[(taskIdCol || 3) - 1]);
  var code = row[(codeCol || 2) - 1];
  var qty = row[(qtyCol || 4) - 1];
  var prov = row[(provCol || 5) - 1];
  return !!(taskId && isBlank_(code) && isBlank_(qty) && isBlank_(prov));
}

// ════════════════════════════════════════════════════════════════
// MENÚ ÚNICO
// ════════════════════════════════════════════════════════════════

function APP_addMenuItems_(menu, items) {
  (items || []).forEach(function(item) {
    if (item === '-') {
      menu.addSeparator();
    } else {
      menu.addItem(item[0], item[1]);
    }
  });
  return menu;
}

function APP_subMenu_(ui, title, items) {
  return APP_addMenuItems_(ui.createMenu(title), items);
}

function crearMenuSistema() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu(APP_CORE.MENU_NAME);

  if (typeof OBS3_addToSistemaMenu_ === 'function') {
    OBS3_addToSistemaMenu_(menu, ui);
  } else {
    menu.addSubMenu(APP_subMenu_(ui, '📝 Emitir observaciones', [
      ['Abrir panel lateral', 'obs3_abrirSidebar']
    ]));
  }

  menu.addSeparator();
  menu.addSubMenu(APP_subMenu_(ui, '🔄 Sync / Compras', [
    ['✅ Validar configuración', 'validateSetup'],
    ['🔁 Sincronizar todo ahora', 'syncAllNow'],
    ['🧾 Ver último disparo', 'showLastRun'],
    ['⚙️ Instalar / arreglar activadores', 'installTriggers'],
    '-',
    ['📧 Alerta tareas sin OC', 'sendTareasSinOCEmail_V2'],
    ['⏰ Crear trigger diario OC (08:30)', 'createDailyTrigger_V2'],
    ['🧪 Debug OC', 'debugConteo_V2'],
    '-',
    ['📤 Exportar JT_EXPORT', 'GTX_exportNow'],
    ['⏱️ Instalar trigger GTX 5 min', 'GTX_setupTrigger_5min'],
    ['🗑️ Borrar triggers exportación GTX', 'GTX_deleteTriggers']
  ]));

  menu.addSubMenu(APP_subMenu_(ui, '📋 Task Manager', [
    ['➕ Nueva tarea', 'mostrarFormularioNuevaTarea'],
    '-',
    ['📌 Tareas pendientes', 'verTareasPendientes'],
    ['⚠️ Tareas vencidas', 'verTareasVencidas'],
    ['📅 Tareas de hoy', 'verTareasHoy'],
    ['📆 Tareas de esta semana', 'verTareasEstaSemana'],
    ['📊 Dashboard resumen', 'generarDashboard'],
    ['✅ Tareas completadas', 'verTareasCompletadas'],
    '-',
    ['✅ Marcar como completada', 'marcarCompletada'],
    ['🔄 Reactivar tarea', 'reactivarTarea'],
    ['✏️ Editar tarea seleccionada', 'editarTarea'],
    ['🗑️ Eliminar tarea seleccionada', 'eliminarTarea'],
    '-',
    ['📤 Enviar resumen diario (email)', 'enviarResumenManual'],
    ['📱 Enviar resumen (WhatsApp)', 'enviarWhatsAppManual'],
    ['📊 Enviar resumen semanal', 'enviarResumenSemanalManual'],
    ['⏰ Activar envío diario', 'configurarTriggerDiario'],
    ['📅 Activar resumen semanal', 'configurarTriggerSemanal'],
    ['🚫 Desactivar triggers Task Manager', 'eliminarTriggers'],
    ['📋 Ver log correos', 'verLogCorreos'],
    '-',
    ['🔧 Inicializar hojas', 'inicializarHojas'],
    ['🎨 Aplicar formato', 'aplicarFormato'],
    ['📂 Gestionar categorías', 'gestionarCategorias'],
    ['📧 Cambiar correo', 'cambiarCorreo'],
    ['📱 Configurar WhatsApp', 'configurarWhatsApp']
  ]));

  menu.addSubMenu(APP_subMenu_(ui, '📄 Facturas', [
    ['📥 Revisar correos ahora', 'facRevisarCorreosManual'],
    ['👁️ Ver pendientes', 'facVerPendientes'],
    ['⚠️ Ver críticas (3+ días)', 'facVerCriticas'],
    ['📤 Enviar recordatorio', 'facEnviarRecordatorioManual'],
    '-',
    ['✅ Revisión correos (1h)', 'facActivarRevisionCorreos'],
    ['✅ Recordatorios diarios', 'facActivarRecordatorios'],
    ['✅ Alerta crítica (3h)', 'facActivarAlertaCritica'],
    ['🚀 Activar todo', 'facActivarTodo'],
    ['🚫 Desactivar todo', 'facDesactivarTodo'],
    '-',
    ['🔧 Inicializar hoja Facturas', 'facInicializarHoja']
  ]));

  menu.addSubMenu(APP_subMenu_(ui, '📲 WhatsApp Auto', [
    ['⚙️ Inicializar módulo', 'WAM_inicializarModulo'],
    ['🪟 Programar mensaje desde ventana', 'WAM_abrirVentanaProgramador'],
    ['🔌 Validar conexión Green API', 'WAM_validarConexionUI'],
    ['⚡ Sincronizar contactos (rápido)', 'WAM_sincronizarContactosUI'],
    ['📤 Procesar cola ahora', 'WAM_procesarProgramacionUI'],
    ['🧪 Enviar mensaje de prueba', 'WAM_enviarPruebaUI'],
    '-',
    ['⏰ Activar scheduler', 'WAM_activarScheduler'],
    ['🚫 Desactivar scheduler', 'WAM_desactivarScheduler'],
    ['🧹 Reset de bloqueo/atascos', 'WAM_resetEstadoEjecucion'],
    '-',
    ['📄 Abrir Config', 'WAM_abrirConfig'],
    ['👥 Abrir Contactos', 'WAM_abrirContactos'],
    ['🗓️ Abrir Programación', 'WAM_abrirProgramacion'],
    ['🧾 Abrir Plantillas', 'WAM_abrirPlantillas'],
    ['📋 Abrir Log', 'WAM_abrirLog']
  ]));

  menu.addSubMenu(APP_subMenu_(ui, '⚙️ Sistema', [
    ['🔧 Inicializar Task Manager', 'inicializarHojas'],
    ['🔧 Inicializar hoja Facturas', 'facInicializarHoja'],
    ['🎨 Reaplicar formato Task Manager', 'aplicarFormato']
  ]));

  menu.addToUi();
}

// ════════════════════════════════════════════════════════════════
// TRIGGERS PRINCIPALES
// ════════════════════════════════════════════════════════════════

function onOpen(e) {
  appTry_('crearMenuSistema', function() { crearMenuSistema(); });
  appTry_('_SYNC_onOpenLogic', function() { _SYNC_onOpenLogic(e); });
}

function onSelectionChange(e) {
  appTry_('_SYNC_handleSelectionChange', function() { _SYNC_handleSelectionChange(e); });
}

function trigEdit(e) {
  appTry_('_SYNC_handleEdit', function() { _SYNC_handleEdit(e); });
  appTry_('_OC_handleEdit', function() { _OC_handleEdit(e); });
}

function installTriggers() {
  var ss = SpreadsheetApp.getActive();
  clearTriggersByHandler_(['trigEdit', 'trigOpen', 'trigSelectionChange']);
  ScriptApp.newTrigger('trigEdit').forSpreadsheet(ss).onEdit().create();
  toast_('Activador instalado: onEdit → trigEdit', 'Triggers', 5);
}
