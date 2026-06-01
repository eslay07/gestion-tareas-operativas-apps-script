/*****************************************************************
 * 07_WHATSAPP_AUTO_MANAGER.gs
 * ────────────────────────────────────────────────────────────────
 * Gestor automático de WhatsApp programable y aislado del resto.
 *
 * Diseño:
 * - NO toca funciones existentes del sistema actual.
 * - Todo va con prefijo WAM_ para no chocar con otros módulos.
 * - Puede reutilizar la Green API ya configurada en la hoja
 *   "Configuración" (B6 = idInstance, B7 = apiToken).
 * - Mantiene su propia estructura de hojas.
 *
 * Hojas nuevas:
 * - WA_AUTO_CFG
 * - WA_AUTO_CONTACTOS
 * - WA_AUTO_PROGRAMACION
 * - WA_AUTO_PLANTILLAS
 * - WA_AUTO_LOG
 *****************************************************************/

var WAM_CFG = {
  SHEET_CFG: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.WA_CFG : 'WA_AUTO_CFG'),
  SHEET_CONTACTS: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.WA_CONTACTOS : 'WA_AUTO_CONTACTOS'),
  SHEET_SCHEDULES: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.WA_PROGRAMACION : 'WA_AUTO_PROGRAMACION'),
  SHEET_TEMPLATES: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.WA_PLANTILLAS : 'WA_AUTO_PLANTILLAS'),
  SHEET_LOG: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.WA_LOG : 'WA_AUTO_LOG'),
  DEFAULT_API_URL: 'https://api.green-api.com',
  DEFAULT_TZ: (typeof SYS_getTz_ === 'function' ? SYS_getTz_() : 'America/Guayaquil'),
  DEFAULT_USE_SHARED: 'SI',
  DEFAULT_SHARED_SHEET: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.CONFIG : 'Configuración'),
  DEFAULT_SHARED_ID_CELL: 'B6',
  DEFAULT_SHARED_TOKEN_CELL: 'B7',
  DEFAULT_TRIGGER_MINUTES: 5,
  DEFAULT_BATCH_SIZE: 15,
  DEFAULT_PAUSE_MS: 1200,
  DIALOG_PAGE_SIZE: 100,
  MENU_NAME: '📲 WhatsApp Auto'
};

// ════════════════════════════════════════════════════════════════
// MENÚ
// ════════════════════════════════════════════════════════════════

function WAM_crearMenuStandalone() {
  SpreadsheetApp.getUi()
    .createMenu(WAM_CFG.MENU_NAME)
    .addItem('⚙️ Inicializar módulo', 'WAM_inicializarModulo')
    .addItem('🪟 Programar mensaje desde ventana', 'WAM_abrirVentanaProgramador')
    .addItem('🔌 Validar conexión Green API', 'WAM_validarConexionUI')
    .addItem('⚡ Sincronizar contactos (rápido)', 'WAM_sincronizarContactosUI')
    .addItem('📤 Procesar cola ahora', 'WAM_procesarProgramacionUI')
    .addItem('🧪 Enviar mensaje de prueba', 'WAM_enviarPruebaUI')
    .addSeparator()
    .addItem('⏰ Activar scheduler', 'WAM_activarScheduler')
    .addItem('🚫 Desactivar scheduler', 'WAM_desactivarScheduler')
    .addItem('🧹 Reset de bloqueo/atascos', 'WAM_resetEstadoEjecucion')
    .addSeparator()
    .addItem('📄 Abrir Config', 'WAM_abrirConfig')
    .addItem('👥 Abrir Contactos', 'WAM_abrirContactos')
    .addItem('🗓️ Abrir Programación', 'WAM_abrirProgramacion')
    .addItem('🧾 Abrir Plantillas', 'WAM_abrirPlantillas')
    .addItem('📋 Abrir Log', 'WAM_abrirLog')
    .addToUi();
}

function WAM_instalarMenuAutomatico() {
  WAM_desinstalarMenuAutomatico();
  ScriptApp.newTrigger('WAM_onOpenMenu_')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onOpen()
    .create();
  WAM_crearMenuStandalone();
  SpreadsheetApp.getUi().alert('✅ Menú automático de WhatsApp Auto instalado.');
}

function WAM_desinstalarMenuAutomatico() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'WAM_onOpenMenu_' && t.getEventType() === ScriptApp.EventType.ON_OPEN) {
      ScriptApp.deleteTrigger(t);
      n++;
    }
  });
  return n;
}

function WAM_onOpenMenu_() {
  WAM_crearMenuStandalone();
}

// ════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ════════════════════════════════════════════════════════════════

function WAM_inicializarModulo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shCfg = ss.getSheetByName(WAM_CFG.SHEET_CFG) || ss.insertSheet(WAM_CFG.SHEET_CFG);
  var shContacts = ss.getSheetByName(WAM_CFG.SHEET_CONTACTS) || ss.insertSheet(WAM_CFG.SHEET_CONTACTS);
  var shSchedules = ss.getSheetByName(WAM_CFG.SHEET_SCHEDULES) || ss.insertSheet(WAM_CFG.SHEET_SCHEDULES);
  var shTemplates = ss.getSheetByName(WAM_CFG.SHEET_TEMPLATES) || ss.insertSheet(WAM_CFG.SHEET_TEMPLATES);
  var shLog = ss.getSheetByName(WAM_CFG.SHEET_LOG) || ss.insertSheet(WAM_CFG.SHEET_LOG);

  WAM_setupConfigSheet_(shCfg);
  WAM_setupContactsSheet_(shContacts);
  WAM_setupSchedulesSheet_(shSchedules);
  WAM_setupTemplatesSheet_(shTemplates);
  WAM_setupLogSheet_(shLog);

  WAM_aplicarFormatoGeneral_();
  WAM_crearMenuStandalone();

  SpreadsheetApp.getUi().alert(
    '✅ Módulo WhatsApp Auto inicializado.\n\n' +
    'Orden recomendado:\n' +
    '1) Validar conexión\n' +
    '2) Sincronizar contactos\n' +
    '3) Crear plantillas / programación\n' +
    '4) Activar scheduler'
  );
}

function WAM_setupConfigSheet_(sh) {
  sh.clear();
  sh.getRange(1, 1, 18, 2).setValues([
    ['WHATSAPP AUTO MANAGER', ''],
    ['Usar configuración compartida', WAM_CFG.DEFAULT_USE_SHARED],
    ['API URL local', WAM_CFG.DEFAULT_API_URL],
    ['ID Instance local', ''],
    ['API Token local', ''],
    ['Hoja config compartida', WAM_CFG.DEFAULT_SHARED_SHEET],
    ['Celda ID compartido', WAM_CFG.DEFAULT_SHARED_ID_CELL],
    ['Celda Token compartido', WAM_CFG.DEFAULT_SHARED_TOKEN_CELL],
    ['Zona horaria', WAM_CFG.DEFAULT_TZ],
    ['Intervalo trigger (min)', WAM_CFG.DEFAULT_TRIGGER_MINUTES],
    ['Límite envíos por corrida', WAM_CFG.DEFAULT_BATCH_SIZE],
    ['Pausa entre envíos (ms)', WAM_CFG.DEFAULT_PAUSE_MS],
    ['Phone detectado última validación', ''],
    ['Estado última validación', ''],
    ['Última sync contactos', ''],
    ['Último runner', ''],
    ['Último error runner', ''],
    ['Notas', 'Si usas config compartida, el módulo leerá el id/token desde la hoja Configuración.']
  ]);
  sh.getRange('A1:B1').merge().setFontWeight('bold').setFontSize(14).setBackground('#0b57d0').setFontColor('#ffffff');
  sh.getRange('A2:A18').setFontWeight('bold');
  sh.getRange('B2').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['SI', 'NO'], true).build()
  );
  sh.setFrozenRows(1);
  sh.setColumnWidths(1, 2, 280);
}

function WAM_setupContactsSheet_(sh) {
  sh.clear();
  sh.getRange(1, 1, 1, 14).setValues([[
    'Activo', 'ContactoID', 'ChatID', 'Tipo', 'NombreVisible', 'NombreWA', 'NombreAgenda',
    'Número', 'Etiquetas', 'VariablesJSON', 'ÚltimoSync', 'Validado', 'Estado', 'Observaciones'
  ]]);
  sh.setFrozenRows(1);
  sh.getRange('A2:A').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['SI', 'NO'], true).build()
  );
  sh.getRange('L2:L').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['SI', 'NO'], true).build()
  );
  sh.setColumnWidths(1, 14, 150);
  sh.setColumnWidth(5, 220);
  sh.setColumnWidth(9, 220);
  sh.setColumnWidth(10, 250);
  sh.getRange('A1:N1').createFilter();
}

function WAM_setupSchedulesSheet_(sh) {
  sh.clear();
  sh.getRange(1, 1, 1, 20).setValues([[
    'Activo', 'CampañaID', 'NombreCampaña', 'DestinoTipo', 'DestinoValor', 'PlantillaKey', 'MensajeBase',
    'Frecuencia', 'FechaInicio', 'Hora', 'DíaSemana', 'DíaMes', 'PróximoEnvio', 'ÚltimoEnvio',
    'LinkPreview', 'LímitePorEjecución', 'SoloUsuarios', 'Estado', 'ÚltimoResultado', 'Notas'
  ]]);
  sh.setFrozenRows(1);
  sh.getRange('A2:A').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['SI', 'NO'], true).build()
  );
  sh.getRange('D2:D').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['CONTACTO', 'CHAT_ID', 'ETIQUETA', 'TODOS_ACTIVOS'], true).build()
  );
  sh.getRange('H2:H').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['UNA_VEZ', 'DIARIA', 'SEMANAL', 'MENSUAL'], true).build()
  );
  sh.getRange('K2:K').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'], true).build()
  );
  sh.getRange('O2:O').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['SI', 'NO'], true).build()
  );
  sh.getRange('Q2:Q').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['SI', 'NO'], true).build()
  );
  sh.setColumnWidths(1, 20, 150);
  sh.setColumnWidth(3, 220);
  sh.setColumnWidth(7, 320);
  sh.setColumnWidth(19, 280);
  sh.getRange('A1:T1').createFilter();
}

function WAM_setupTemplatesSheet_(sh) {
  sh.clear();
  sh.getRange(1, 1, 1, 5).setValues([[
    'PlantillaKey', 'Nombre', 'Mensaje', 'Activa', 'Notas'
  ]]);
  sh.setFrozenRows(1);
  sh.getRange('D2:D').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['SI', 'NO'], true).build()
  );
  sh.setColumnWidths(1, 5, 180);
  sh.setColumnWidth(3, 520);
}

function WAM_setupLogSheet_(sh) {
  sh.clear();
  sh.getRange(1, 1, 1, 12).setValues([[
    'FechaHora', 'CycleKey', 'CampañaID', 'NombreCampaña', 'ChatID', 'ContactoID', 'Estado',
    'CódigoHTTP', 'Respuesta', 'MensajePreview', 'PayloadHash', 'Detalle'
  ]]);
  sh.setFrozenRows(1);
  sh.setColumnWidths(1, 12, 180);
  sh.setColumnWidth(9, 320);
  sh.setColumnWidth(10, 320);
}

function WAM_aplicarFormatoGeneral_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [
    WAM_CFG.SHEET_CONTACTS,
    WAM_CFG.SHEET_SCHEDULES,
    WAM_CFG.SHEET_TEMPLATES,
    WAM_CFG.SHEET_LOG
  ].forEach(function(name) {
    var sh = ss.getSheetByName(name);
    if (sh) {
      var lastCol = sh.getLastColumn();
      sh.getRange(1, 1, 1, lastCol)
        .setBackground('#0b57d0')
        .setFontColor('#ffffff')
        .setFontWeight('bold')
        .setHorizontalAlignment('center')
        .setWrap(true);
    }
  });
}

// ════════════════════════════════════════════════════════════════
// NAVEGACIÓN RÁPIDA
// ════════════════════════════════════════════════════════════════

function WAM_abrirConfig() { WAM_activateSheet_(WAM_CFG.SHEET_CFG); }
function WAM_abrirContactos() { WAM_activateSheet_(WAM_CFG.SHEET_CONTACTS); }
function WAM_abrirProgramacion() { WAM_activateSheet_(WAM_CFG.SHEET_SCHEDULES); }
function WAM_abrirPlantillas() { WAM_activateSheet_(WAM_CFG.SHEET_TEMPLATES); }
function WAM_abrirLog() { WAM_activateSheet_(WAM_CFG.SHEET_LOG); }

function WAM_activateSheet_(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('No existe la hoja: ' + name + '. Ejecuta WAM_inicializarModulo primero.');
  sh.activate();
}

// ════════════════════════════════════════════════════════════════
// UTILIDADES BASE
// ════════════════════════════════════════════════════════════════

function WAM_trim_(v) {
  return v === null || v === undefined ? '' : String(v).replace(/\u00A0/g, ' ').trim();
}

function WAM_boolSI_(v, defaultValue) {
  var s = WAM_trim_(v).toUpperCase();
  if (!s) return !!defaultValue;
  return s === 'SI' || s === 'TRUE' || s === 'VERDADERO' || s === '1';
}

function WAM_now_() {
  return new Date();
}

function WAM_tz_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_CFG);
  var tz = sh ? WAM_trim_(sh.getRange('B9').getValue()) : '';
  return tz || WAM_CFG.DEFAULT_TZ;
}

function WAM_formatDateTime_(d) {
  return Utilities.formatDate(new Date(d), WAM_tz_(), 'yyyy-MM-dd HH:mm:ss');
}

function WAM_formatDate_(d) {
  return Utilities.formatDate(new Date(d), WAM_tz_(), 'yyyy-MM-dd');
}

function WAM_formatTime_(d) {
  return Utilities.formatDate(new Date(d), WAM_tz_(), 'HH:mm');
}

function WAM_normalizePhone_(raw) {
  var s = WAM_trim_(raw).replace(/[^\d]/g, '');
  if (!s) return '';
  return s;
}

function WAM_normalizeChatId_(raw) {
  var s = WAM_trim_(raw);
  if (!s) return '';
  if (/@c\.us$|@g\.us$/i.test(s)) return s;
  var num = WAM_normalizePhone_(s);
  return num ? (num + '@c.us') : '';
}

function WAM_hash_(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(text), Utilities.Charset.UTF_8);
  return bytes.map(function(b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function WAM_toDate_(value, hourValue) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    var d1 = new Date(value);
    if (hourValue) {
      var parts1 = WAM_parseHour_(hourValue);
      d1.setHours(parts1.h, parts1.m, 0, 0);
    }
    return d1;
  }
  var s = WAM_trim_(value);
  if (!s) return null;
  var parts = s.split(/[-\/]/);
  if (parts.length >= 3) {
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var day = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(day)) {
      var d2 = new Date(y, m, day, 0, 0, 0, 0);
      if (hourValue) {
        var parts2 = WAM_parseHour_(hourValue);
        d2.setHours(parts2.h, parts2.m, 0, 0);
      }
      return d2;
    }
  }
  var d3 = new Date(s);
  if (!isNaN(d3.getTime())) {
    if (hourValue) {
      var parts3 = WAM_parseHour_(hourValue);
      d3.setHours(parts3.h, parts3.m, 0, 0);
    }
    return d3;
  }
  return null;
}

function WAM_parseHour_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return { h: value.getHours(), m: value.getMinutes() };
  }
  var s = WAM_trim_(value);
  if (!s) return { h: 9, m: 0 };
  var p = s.split(':');
  var h = parseInt(p[0], 10);
  var m = parseInt(p[1] || '0', 10);
  if (isNaN(h)) h = 9;
  if (isNaN(m)) m = 0;
  h = Math.max(0, Math.min(23, h));
  m = Math.max(0, Math.min(59, m));
  return { h: h, m: m };
}

function WAM_weekdayIndex_(value) {
  var s = WAM_trim_(value).toUpperCase();
  var map = {
    'DOMINGO': 0,
    'LUNES': 1,
    'MARTES': 2,
    'MIERCOLES': 3,
    'MIÉRCOLES': 3,
    'JUEVES': 4,
    'VIERNES': 5,
    'SABADO': 6,
    'SÁBADO': 6
  };
  return map.hasOwnProperty(s) ? map[s] : 1;
}

function WAM_safeJsonParse_(text, fallback) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return fallback;
  }
}

// ════════════════════════════════════════════════════════════════
// CONFIG Y GREEN API
// ════════════════════════════════════════════════════════════════

function WAM_getConfig_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(WAM_CFG.SHEET_CFG);
  if (!sh) throw new Error('No existe ' + WAM_CFG.SHEET_CFG + '. Ejecuta WAM_inicializarModulo.');

  var useShared = WAM_boolSI_(sh.getRange('B2').getValue(), true);
  var apiUrl = WAM_trim_(sh.getRange('B3').getValue()) || WAM_CFG.DEFAULT_API_URL;
  var id = WAM_trim_(sh.getRange('B4').getValue());
  var token = WAM_trim_(sh.getRange('B5').getValue());

  if (useShared) {
    var sharedSheetName = WAM_trim_(sh.getRange('B6').getValue()) || WAM_CFG.DEFAULT_SHARED_SHEET;
    var sharedIdCell = WAM_trim_(sh.getRange('B7').getValue()) || WAM_CFG.DEFAULT_SHARED_ID_CELL;
    var sharedTokenCell = WAM_trim_(sh.getRange('B8').getValue()) || WAM_CFG.DEFAULT_SHARED_TOKEN_CELL;
    var sharedSheet = ss.getSheetByName(sharedSheetName);
    if (!sharedSheet) {
      throw new Error('No existe la hoja compartida "' + sharedSheetName + '".');
    }
    id = WAM_trim_(sharedSheet.getRange(sharedIdCell).getValue());
    token = WAM_trim_(sharedSheet.getRange(sharedTokenCell).getValue());
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''),
    idInstance: id,
    apiToken: token,
    useShared: useShared,
    triggerMinutes: Math.max(1, parseInt(sh.getRange('B10').getValue(), 10) || WAM_CFG.DEFAULT_TRIGGER_MINUTES),
    batchSize: Math.max(1, parseInt(sh.getRange('B11').getValue(), 10) || WAM_CFG.DEFAULT_BATCH_SIZE),
    pauseMs: Math.max(0, parseInt(sh.getRange('B12').getValue(), 10) || WAM_CFG.DEFAULT_PAUSE_MS)
  };
}

function WAM_assertApiCfg_(cfg) {
  if (!cfg.idInstance || !cfg.apiToken || !cfg.apiUrl) {
    throw new Error('Falta configuración Green API. Revisa WA_AUTO_CFG o la hoja compartida Configuración.');
  }
}

function WAM_buildUrl_(path, cfg) {
  return cfg.apiUrl + '/waInstance' + cfg.idInstance + '/' + path + '/' + cfg.apiToken;
}

function WAM_callGet_(path, qs) {
  var cfg = WAM_getConfig_();
  WAM_assertApiCfg_(cfg);
  var url = WAM_buildUrl_(path, cfg);
  if (qs) {
    var arr = [];
    Object.keys(qs).forEach(function(k) {
      if (qs[k] !== null && qs[k] !== undefined && WAM_trim_(qs[k]) !== '') {
        arr.push(encodeURIComponent(k) + '=' + encodeURIComponent(qs[k]));
      }
    });
    if (arr.length) url += '?' + arr.join('&');
  }
  var resp = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true
  });
  return WAM_parseHttpResponse_(resp, url, 'GET');
}

function WAM_callPost_(path, payload) {
  var cfg = WAM_getConfig_();
  WAM_assertApiCfg_(cfg);
  var url = WAM_buildUrl_(path, cfg);
  var resp = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true
  });
  return WAM_parseHttpResponse_(resp, url, 'POST');
}

function WAM_parseHttpResponse_(resp, url, method) {
  var code = resp.getResponseCode();
  var text = resp.getContentText() || '';
  var json = WAM_safeJsonParse_(text, null);
  if (code < 200 || code >= 300) {
    throw new Error(method + ' ' + url + ' => HTTP ' + code + ' | ' + text);
  }
  return {
    code: code,
    text: text,
    json: json
  };
}

function WAM_validarConexion() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_CFG);
  var wa = WAM_callGet_('getWaSettings');
  var state = WAM_callGet_('getStateInstance');
  var phone = wa.json && wa.json.phone ? String(wa.json.phone) : '';
  var stateWa = wa.json && wa.json.stateInstance ? String(wa.json.stateInstance) : '';
  var stateInstance = state.json && state.json.stateInstance ? String(state.json.stateInstance) : stateWa;
  if (sh) {
    sh.getRange('B13').setValue(phone);
    sh.getRange('B14').setValue(stateInstance || stateWa || 'N/D');
  }
  return {
    phone: phone,
    state: stateInstance || stateWa || 'N/D',
    waSettings: wa.json,
    stateRaw: state.json
  };
}

function WAM_validarConexionUI() {
  var res = WAM_validarConexion();
  SpreadsheetApp.getUi().alert(
    '✅ Conexión OK\n\n' +
    'Phone: ' + (res.phone || 'N/D') + '\n' +
    'Estado: ' + (res.state || 'N/D')
  );
}

// ════════════════════════════════════════════════════════════════
// CONTACTOS
// ════════════════════════════════════════════════════════════════

function WAM_sincronizarContactosUI() {
  var state = WAM_iniciarSyncContactosBackground_();
  SpreadsheetApp.getUi().alert(
    '⏳ Sincronización lanzada en segundo plano.\n\n' +
    'Estado: ' + (state.status || 'QUEUED') + '\n' +
    'Mensaje: ' + (state.message || 'Procesando...') + '\n\n' +
    'Puedes seguir trabajando mientras termina.'
  );
}

function WAM_sincronizarContactos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(WAM_CFG.SHEET_CONTACTS);
  var cfgSh = ss.getSheetByName(WAM_CFG.SHEET_CFG);
  if (!sh || !cfgSh) throw new Error('Inicializa el módulo primero.');

  var api = WAM_callGet_('getContacts', { group: 'false' });
  var items = Array.isArray(api.json) ? api.json : [];

  var existingRows = [];
  var existingByKey = {};
  var lastRow = sh.getLastRow();
  if (lastRow >= 2) {
    existingRows = sh.getRange(2, 1, lastRow - 1, 14).getValues();
    existingRows.forEach(function(r, idx) {
      var key = WAM_trim_(r[1]) || WAM_trim_(r[2]);
      if (key) existingByKey[key] = idx;
    });
  }

  var inserted = 0;
  var updated = 0;
  var skipped = 0;
  var now = new Date();

  items.forEach(function(item) {
    var contactId = WAM_trim_(item.id);
    var type = WAM_trim_(item.type) || 'user';
    if (!contactId || type !== 'user') {
      skipped++;
      return;
    }

    var chatId = contactId;
    var number = WAM_normalizePhone_(contactId);
    var nameWa = WAM_trim_(item.name);
    var nameAgenda = WAM_trim_(item.contactName);
    var visible = nameAgenda || nameWa || number || chatId;

    var payload = [
      'SI', contactId, chatId, type, visible, nameWa, nameAgenda, number,
      '', '{}', now, 'NO', 'SINCRONIZADO', ''
    ];

    if (existingByKey.hasOwnProperty(contactId)) {
      var idx = existingByKey[contactId];
      var prev = existingRows[idx] || [];
      payload[0] = WAM_trim_(prev[0]) || 'SI';
      payload[8] = WAM_trim_(prev[8]);
      payload[9] = WAM_trim_(prev[9]) || '{}';
      payload[11] = WAM_trim_(prev[11]) || 'NO';
      payload[12] = WAM_trim_(prev[12]) || 'SINCRONIZADO';
      payload[13] = WAM_trim_(prev[13]);
      existingRows[idx] = payload;
      updated++;
    } else {
      existingRows.push(payload);
      existingByKey[contactId] = existingRows.length - 1;
      inserted++;
    }
  });

  if (sh.getMaxRows() < existingRows.length + 1) {
    sh.insertRowsAfter(sh.getMaxRows(), (existingRows.length + 1) - sh.getMaxRows());
  }

  if (existingRows.length) {
    sh.getRange(2, 1, existingRows.length, 14).setValues(existingRows);
  }

  var extraRows = sh.getLastRow() - (existingRows.length + 1);
  if (extraRows > 0) {
    sh.getRange(existingRows.length + 2, 1, extraRows, 14).clearContent();
  }

  cfgSh.getRange('B15').setValue(now);
  return { inserted: inserted, updated: updated, skipped: skipped, total: items.length };
}

function WAM_enriquecerContactoFilaActual() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_CONTACTS);
  if (!sh) throw new Error('No existe WA_AUTO_CONTACTOS.');
  var row = sh.getActiveRange().getRow();
  if (row < 2) throw new Error('Selecciona una fila de contacto.');
  var chatId = WAM_trim_(sh.getRange(row, 3).getValue()) || WAM_trim_(sh.getRange(row, 2).getValue());
  if (!chatId) throw new Error('La fila seleccionada no tiene ChatID/ContactoID.');
  var info = WAM_callPost_('getContactInfo', { chatId: chatId });
  var j = info.json || {};
  var nameWa = WAM_trim_(j.name);
  var contactName = WAM_trim_(j.contactName);
  var visible = contactName || nameWa || WAM_trim_(sh.getRange(row, 5).getValue()) || WAM_normalizePhone_(chatId);

  sh.getRange(row, 5).setValue(visible);
  sh.getRange(row, 6).setValue(nameWa);
  sh.getRange(row, 7).setValue(contactName);
  sh.getRange(row, 11).setValue(new Date());
  sh.getRange(row, 12).setValue('SI');
  sh.getRange(row, 13).setValue('ENRIQUECIDO');
  SpreadsheetApp.getUi().alert('✅ Contacto enriquecido: ' + visible);
}

function WAM_getContactsMap_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_CONTACTS);
  if (!sh || sh.getLastRow() < 2) return { byId: {}, rows: [] };
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 14).getValues().map(function(r, idx) {
    return {
      rowNumber: idx + 2,
      activo: WAM_boolSI_(r[0], true),
      contactoId: WAM_trim_(r[1]),
      chatId: WAM_trim_(r[2]),
      tipo: WAM_trim_(r[3]) || 'user',
      nombreVisible: WAM_trim_(r[4]),
      nombreWa: WAM_trim_(r[5]),
      nombreAgenda: WAM_trim_(r[6]),
      numero: WAM_trim_(r[7]),
      etiquetas: WAM_trim_(r[8]),
      variablesJson: WAM_trim_(r[9]) || '{}',
      validado: WAM_boolSI_(r[11], false),
      estado: WAM_trim_(r[12])
    };
  });
  var byId = {};
  rows.forEach(function(c) {
    if (c.contactoId) byId[c.contactoId] = c;
    if (c.chatId) byId[c.chatId] = c;
    if (c.numero) byId[c.numero] = c;
  });
  return { byId: byId, rows: rows };
}

function WAM_contactHasTag_(contact, tag) {
  var needle = WAM_trim_(tag).toUpperCase();
  if (!needle) return false;
  return (WAM_trim_(contact.etiquetas).toUpperCase().split(',').map(function(s) {
    return WAM_trim_(s).toUpperCase();
  }).indexOf(needle) !== -1);
}

// ════════════════════════════════════════════════════════════════
// PLANTILLAS
// ════════════════════════════════════════════════════════════════

function WAM_getTemplateText_(key) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_TEMPLATES);
  if (!sh || sh.getLastRow() < 2) return '';
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues();
  var found = '';
  data.some(function(r) {
    if (WAM_trim_(r[0]) === WAM_trim_(key) && WAM_boolSI_(r[3], true)) {
      found = WAM_trim_(r[2]);
      return true;
    }
    return false;
  });
  return found;
}

function WAM_renderTemplate_(rawMessage, contact, schedule) {
  var msg = String(rawMessage || '');
  var vars = WAM_safeJsonParse_(contact.variablesJson || '{}', {});
  var replacements = {
    nombre: contact.nombreVisible || contact.nombreAgenda || contact.nombreWa || contact.numero,
    nombre_visible: contact.nombreVisible || '',
    nombre_agenda: contact.nombreAgenda || '',
    nombre_wa: contact.nombreWa || '',
    numero: contact.numero || '',
    chat_id: contact.chatId || '',
    campania: schedule.nombreCampania || '',
    fecha: WAM_formatDate_(new Date()),
    hora: WAM_formatTime_(new Date())
  };

  Object.keys(vars).forEach(function(k) {
    replacements[k] = vars[k];
  });

  Object.keys(replacements).forEach(function(k) {
    var re = new RegExp('\\{' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\}', 'g');
    msg = msg.replace(re, replacements[k] === null || replacements[k] === undefined ? '' : String(replacements[k]));
  });

  return msg;
}

// ════════════════════════════════════════════════════════════════
// PROGRAMACIÓN
// ════════════════════════════════════════════════════════════════

function WAM_getSchedules_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_SCHEDULES);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 20).getValues().map(function(r, idx) {
    return {
      rowNumber: idx + 2,
      activo: WAM_boolSI_(r[0], true),
      campaniaId: WAM_trim_(r[1]) || ('CAMP-' + (idx + 2)),
      nombreCampania: WAM_trim_(r[2]),
      destinoTipo: WAM_trim_(r[3]).toUpperCase(),
      destinoValor: WAM_trim_(r[4]),
      plantillaKey: WAM_trim_(r[5]),
      mensajeBase: WAM_trim_(r[6]),
      frecuencia: WAM_trim_(r[7]).toUpperCase(),
      fechaInicio: r[8],
      hora: r[9],
      diaSemana: WAM_trim_(r[10]).toUpperCase(),
      diaMes: WAM_trim_(r[11]),
      proximoEnvio: r[12],
      ultimoEnvio: r[13],
      linkPreview: WAM_boolSI_(r[14], false),
      limitePorEjecucion: parseInt(r[15], 10) || 0,
      soloUsuarios: WAM_boolSI_(r[16], true),
      estado: WAM_trim_(r[17]),
      ultimoResultado: WAM_trim_(r[18]),
      notas: WAM_trim_(r[19])
    };
  });
}

function WAM_seedExampleRows_() {
  var shT = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_TEMPLATES);
  var shP = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_SCHEDULES);
  if (shT && shT.getLastRow() === 1) {
    shT.getRange(2, 1, 2, 5).setValues([
      ['SALUDO_BASE', 'Saludo base', 'Hola {nombre}, este es un mensaje automático de prueba. Fecha: {fecha} Hora: {hora}', 'SI', 'Usa variables {nombre}, {numero}, {fecha}, {hora}'],
      ['RECORDATORIO', 'Recordatorio', 'Hola {nombre}, te recuerdo: {campania}.', 'SI', 'Plantilla corta']
    ]);
  }
  if (shP && shP.getLastRow() === 1) {
    shP.getRange(2, 1, 1, 20).setValues([[
      'NO', 'CAMP-001', 'Prueba programada', 'CONTACTO', '', 'SALUDO_BASE', '',
      'UNA_VEZ', new Date(), '09:00', 'LUNES', '', '', '',
      'NO', 1, 'SI', 'BORRADOR', 'Completa DestinoValor con un ContactoID o ChatID.', ''
    ]]);
  }
}

function WAM_resolveTargets_(schedule, contactsMap, cycleKey) {
  var rows = contactsMap.rows || [];
  var targetType = schedule.destinoTipo;
  var targetValue = schedule.destinoValor;
  var candidates = [];

  if (targetType === 'CONTACTO') {
    var c1 = contactsMap.byId[targetValue] || contactsMap.byId[WAM_normalizeChatId_(targetValue)] || contactsMap.byId[WAM_normalizePhone_(targetValue)];
    if (c1) candidates = [c1];
  } else if (targetType === 'CHAT_ID') {
    var chatId = WAM_normalizeChatId_(targetValue);
    var c2 = contactsMap.byId[chatId];
    if (c2) {
      candidates = [c2];
    } else if (chatId) {
      candidates = [{
        contactoId: chatId,
        chatId: chatId,
        tipo: 'user',
        nombreVisible: WAM_normalizePhone_(chatId),
        nombreWa: '',
        nombreAgenda: '',
        numero: WAM_normalizePhone_(chatId),
        etiquetas: '',
        variablesJson: '{}',
        activo: true,
        validado: false,
        estado: 'DIRECTO'
      }];
    }
  } else if (targetType === 'ETIQUETA') {
    candidates = rows.filter(function(c) {
      return c.activo && (!schedule.soloUsuarios || c.tipo === 'user') && WAM_contactHasTag_(c, targetValue);
    });
  } else if (targetType === 'TODOS_ACTIVOS') {
    candidates = rows.filter(function(c) {
      return c.activo && (!schedule.soloUsuarios || c.tipo === 'user');
    });
  }

  var sentHashes = WAM_getSuccessfulHashesForCycle_(cycleKey);
  return candidates.filter(function(c) {
    var key = WAM_hash_(schedule.campaniaId + '|' + (c.contactoId || c.chatId) + '|' + cycleKey);
    return !sentHashes[key];
  });
}

function WAM_getSuccessfulHashesForCycle_(cycleKey) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_LOG);
  var out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, 12).getValues();
  data.forEach(function(r) {
    if (WAM_trim_(r[1]) === cycleKey && WAM_trim_(r[6]).toUpperCase() === 'OK') {
      out[WAM_trim_(r[10])] = true;
    }
  });
  return out;
}

function WAM_computeNextRun_(schedule, fromDate) {
  var base = new Date(fromDate || new Date());
  var start = WAM_toDate_(schedule.fechaInicio, schedule.hora) || new Date(base);
  var t = WAM_parseHour_(schedule.hora);
  var next = new Date(base);
  next.setHours(t.h, t.m, 0, 0);

  if (schedule.frecuencia === 'UNA_VEZ') {
    return WAM_toDate_(schedule.fechaInicio, schedule.hora) || start;
  }

  if (schedule.frecuencia === 'DIARIA') {
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (schedule.frecuencia === 'SEMANAL') {
    var wanted = WAM_weekdayIndex_(schedule.diaSemana || 'LUNES');
    var d = new Date(base);
    d.setHours(t.h, t.m, 0, 0);
    var delta = (7 + wanted - d.getDay()) % 7;
    if (delta === 0) delta = 7;
    d.setDate(d.getDate() + delta);
    return d;
  }

  if (schedule.frecuencia === 'MENSUAL') {
    var day = parseInt(schedule.diaMes, 10);
    if (isNaN(day) || day < 1) {
      var fallback = WAM_toDate_(schedule.fechaInicio, schedule.hora) || start;
      day = fallback.getDate();
    }
    var d2 = new Date(base.getFullYear(), base.getMonth() + 1, 1, t.h, t.m, 0, 0);
    var lastDay = new Date(d2.getFullYear(), d2.getMonth() + 1, 0).getDate();
    d2.setDate(Math.min(day, lastDay));
    return d2;
  }

  return next;
}

function WAM_initialDueDate_(schedule) {
  var d = WAM_toDate_(schedule.fechaInicio, schedule.hora);
  return d || new Date();
}

function WAM_isDue_(schedule, now) {
  if (!schedule.activo) return false;
  var due = schedule.proximoEnvio instanceof Date && !isNaN(schedule.proximoEnvio.getTime())
    ? new Date(schedule.proximoEnvio)
    : WAM_initialDueDate_(schedule);
  return due.getTime() <= now.getTime();
}

function WAM_setScheduleStatus_(schedule, status, result, nextDate, lastSentDate, activeValue) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_SCHEDULES);
  if (!sh) return;
  if (activeValue !== null && activeValue !== undefined) sh.getRange(schedule.rowNumber, 1).setValue(activeValue ? 'SI' : 'NO');
  if (nextDate !== undefined) sh.getRange(schedule.rowNumber, 13).setValue(nextDate || '');
  if (lastSentDate !== undefined) sh.getRange(schedule.rowNumber, 14).setValue(lastSentDate || '');
  sh.getRange(schedule.rowNumber, 18).setValue(status || '');
  sh.getRange(schedule.rowNumber, 19).setValue(result || '');
}

// ════════════════════════════════════════════════════════════════
// ENVÍO
// ════════════════════════════════════════════════════════════════

function WAM_sendMessage_(chatId, message, linkPreview) {
  var payload = {
    chatId: chatId,
    message: message
  };
  if (linkPreview) payload.linkPreview = true;
  return WAM_callPost_('sendMessage', payload);
}

function WAM_logSend_(row) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_LOG);
  if (!sh) throw new Error('No existe WA_AUTO_LOG.');
  sh.appendRow(row);
}

function WAM_enviarPruebaUI() {
  var ui = SpreadsheetApp.getUi();
  var chatResp = ui.prompt('🧪 Mensaje de prueba', 'Ingresa ChatID o número (ej: 5939XXXXXXXX o 5939XXXXXXXX@c.us):', ui.ButtonSet.OK_CANCEL);
  if (chatResp.getSelectedButton() !== ui.Button.OK) return;
  var msgResp = ui.prompt('🧪 Mensaje de prueba', 'Mensaje a enviar:', ui.ButtonSet.OK_CANCEL);
  if (msgResp.getSelectedButton() !== ui.Button.OK) return;

  var chatId = WAM_normalizeChatId_(chatResp.getResponseText());
  if (!chatId) throw new Error('ChatID/número inválido.');
  var message = WAM_trim_(msgResp.getResponseText());
  if (!message) throw new Error('El mensaje está vacío.');

  var res = WAM_sendMessage_(chatId, message, false);
  WAM_logSend_([
    new Date(), 'TEST', 'TEST', 'Mensaje de prueba', chatId, '', 'OK', res.code,
    WAM_trim_(res.text).substring(0, 500), message.substring(0, 500), WAM_hash_('TEST|' + chatId + '|' + message), 'Envío manual de prueba'
  ]);
  SpreadsheetApp.getUi().alert('✅ Mensaje de prueba enviado a ' + chatId);
}

// ════════════════════════════════════════════════════════════════
// RUNNER / PROCESADOR
// ════════════════════════════════════════════════════════════════

function WAM_procesarProgramacionUI() {
  var out = WAM_procesarProgramacion();
  SpreadsheetApp.getUi().alert(
    '✅ Runner ejecutado\n\n' +
    'Campañas evaluadas: ' + out.campaignsChecked + '\n' +
    'Campañas procesadas: ' + out.campaignsProcessed + '\n' +
    'Mensajes OK: ' + out.sentOk + '\n' +
    'Mensajes error: ' + out.sentError + '\n' +
    'Observación: ' + out.note
  );
}

function WAM_runner() {
  try {
    WAM_procesarProgramacion();
  } catch (e) {
    WAM_setCfgValue_('B17', 'RUNNER ERROR: ' + e.message);
    throw e;
  }
}

function WAM_procesarProgramacion() {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) {
    return { campaignsChecked: 0, campaignsProcessed: 0, sentOk: 0, sentError: 0, note: 'Bloqueado por otra ejecución.' };
  }

  try {
    var now = new Date();
    WAM_setCfgValue_('B16', now);
    WAM_setCfgValue_('B17', '');

    var apiStatus = WAM_validarConexion();
    if (String(apiStatus.state || '').toLowerCase() !== 'authorized') {
      throw new Error('La instancia Green API no está en estado authorized. Estado actual: ' + apiStatus.state);
    }

    var cfg = WAM_getConfig_();
    var contactsMap = WAM_getContactsMap_();
    var schedules = WAM_getSchedules_();
    var checked = 0;
    var processed = 0;
    var sentOk = 0;
    var sentError = 0;
    var anyDue = false;

    schedules.forEach(function(schedule) {
      checked++;
      if (!schedule.activo) return;
      if (!WAM_isDue_(schedule, now)) return;
      anyDue = true;

      var dueDate = schedule.proximoEnvio instanceof Date && !isNaN(schedule.proximoEnvio.getTime())
        ? new Date(schedule.proximoEnvio)
        : WAM_initialDueDate_(schedule);
      var cycleKey = schedule.campaniaId + '|' + WAM_formatDateTime_(dueDate);
      var targets = WAM_resolveTargets_(schedule, contactsMap, cycleKey);
      var limit = schedule.limitePorEjecucion > 0 ? schedule.limitePorEjecucion : cfg.batchSize;
      var template = schedule.plantillaKey ? WAM_getTemplateText_(schedule.plantillaKey) : '';
      var baseMessage = template || schedule.mensajeBase;

      if (!baseMessage) {
        WAM_setScheduleStatus_(schedule, 'ERROR', 'Sin mensaje base ni plantilla.', dueDate, '', null);
        processed++;
        sentError++;
        return;
      }

      if (!targets.length) {
        var nextNoTargets = schedule.frecuencia === 'UNA_VEZ' ? '' : WAM_computeNextRun_(schedule, now);
        if (schedule.frecuencia === 'UNA_VEZ') {
          WAM_setScheduleStatus_(schedule, 'SIN_DESTINATARIOS', 'No hubo destinatarios válidos para este ciclo.', '', '', false);
        } else {
          WAM_setScheduleStatus_(schedule, 'SIN_DESTINATARIOS', 'No hubo destinatarios válidos para este ciclo.', nextNoTargets, '', null);
        }
        processed++;
        return;
      }

      var sentThisRun = 0;
      var hasError = false;
      var remaining = targets.length;

      for (var i = 0; i < targets.length; i++) {
        if (sentThisRun >= limit) break;
        var contact = targets[i];
        var chatId = WAM_normalizeChatId_(contact.chatId || contact.contactoId || contact.numero);
        if (!chatId) {
          sentError++;
          hasError = true;
          continue;
        }
        var finalMessage = WAM_renderTemplate_(baseMessage, contact, schedule);
        var payloadHash = WAM_hash_(schedule.campaniaId + '|' + (contact.contactoId || chatId) + '|' + cycleKey);

        try {
          var res = WAM_sendMessage_(chatId, finalMessage, schedule.linkPreview);
          WAM_logSend_([
            new Date(), cycleKey, schedule.campaniaId, schedule.nombreCampania, chatId, contact.contactoId || '',
            'OK', res.code, WAM_trim_(res.text).substring(0, 500), finalMessage.substring(0, 500), payloadHash,
            'Enviado correctamente'
          ]);
          sentOk++;
          sentThisRun++;
          remaining--;
          if (cfg.pauseMs > 0) Utilities.sleep(cfg.pauseMs);
        } catch (err) {
          hasError = true;
          sentError++;
          remaining--;
          WAM_logSend_([
            new Date(), cycleKey, schedule.campaniaId, schedule.nombreCampania, chatId, contact.contactoId || '',
            'ERROR', '', String(err.message || err).substring(0, 500), finalMessage.substring(0, 500), payloadHash,
            'Fallo en envío'
          ]);
        }
      }

      var freshRemaining = WAM_resolveTargets_(schedule, contactsMap, cycleKey).length;
      var status = hasError ? 'PARCIAL_CON_ERROR' : 'OK';
      var resultText = 'OK ' + sentThisRun + ' | Pendientes ciclo: ' + freshRemaining;

      if (freshRemaining > 0 && sentThisRun >= limit) {
        WAM_setScheduleStatus_(schedule, 'PARCIAL', resultText + ' | Se alcanzó el límite por corrida.', dueDate, now, null);
      } else {
        if (schedule.frecuencia === 'UNA_VEZ') {
          WAM_setScheduleStatus_(schedule, status, resultText + ' | Campaña cerrada.', '', now, false);
        } else {
          var nextRun = WAM_computeNextRun_(schedule, now);
          WAM_setScheduleStatus_(schedule, status, resultText, nextRun, now, null);
        }
      }

      processed++;
    });

    return {
      campaignsChecked: checked,
      campaignsProcessed: processed,
      sentOk: sentOk,
      sentError: sentError,
      note: anyDue ? 'Se procesaron campañas vencidas o listas.' : 'No había campañas vencidas.'
    };
  } finally {
    lock.releaseLock();
  }
}

// ════════════════════════════════════════════════════════════════
// TRIGGERS
// ════════════════════════════════════════════════════════════════

function WAM_activarScheduler() {
  WAM_desactivarScheduler();
  var cfg = WAM_getConfig_();
  ScriptApp.newTrigger('WAM_runner')
    .timeBased()
    .everyMinutes(cfg.triggerMinutes)
    .create();
  SpreadsheetApp.getUi().alert('✅ Scheduler activado cada ' + cfg.triggerMinutes + ' minuto(s).');
}

function WAM_desactivarScheduler() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'WAM_runner') {
      ScriptApp.deleteTrigger(t);
      n++;
    }
  });
  SpreadsheetApp.getActive().toast('Scheduler WAM desactivado. Triggers eliminados: ' + n, 'WhatsApp Auto', 5);
  return n;
}

function WAM_resetEstadoEjecucion() {
  WAM_setCfgValue_('B16', '');
  WAM_setCfgValue_('B17', '');
  SpreadsheetApp.getUi().alert('✅ Estado de ejecución reseteado.');
}

function WAM_setCfgValue_(cell, value) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_CFG);
  if (sh) sh.getRange(cell).setValue(value);
}

// ════════════════════════════════════════════════════════════════
// HERRAMIENTAS DE APOYO
// ════════════════════════════════════════════════════════════════

function WAM_generarIDsFaltantes() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_SCHEDULES);
  if (!sh || sh.getLastRow() < 2) return;
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, 20).getValues();
  data.forEach(function(r, idx) {
    if (!WAM_trim_(r[1])) {
      sh.getRange(idx + 2, 2).setValue('CAMP-' + Utilities.formatDate(new Date(), WAM_tz_(), 'yyyyMMdd') + '-' + ('000' + (idx + 1)).slice(-3));
    }
  });
}

function WAM_crearEjemplos() {
  WAM_seedExampleRows_();
  SpreadsheetApp.getUi().alert('✅ Ejemplos creados en Plantillas y Programación.');
}


// ════════════════════════════════════════════════════════════════
// PROGRAMADOR VISUAL / VENTANA EMERGENTE
// ════════════════════════════════════════════════════════════════

function WAM_abrirVentanaProgramador() {
  WAM_assertModuleReady_();
  var html = HtmlService.createHtmlOutputFromFile('WAM_PROGRAMADOR_DIALOG')
    .setWidth(1180)
    .setHeight(780)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  SpreadsheetApp.getUi().showModalDialog(html, 'WhatsApp Auto · Programador de mensajes');
}

function WAM_assertModuleReady_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var missing = [];
  [WAM_CFG.SHEET_CFG, WAM_CFG.SHEET_CONTACTS, WAM_CFG.SHEET_SCHEDULES, WAM_CFG.SHEET_LOG].forEach(function(name) {
    if (!ss.getSheetByName(name)) missing.push(name);
  });
  if (missing.length) {
    throw new Error(
      'El módulo WhatsApp Auto no está inicializado. Faltan hojas: ' + missing.join(', ') +
      '. Ejecuta WAM_inicializarModulo() primero.'
    );
  }
}

function WAM_getContactDialogRows_(search) {
  var rows = WAM_getContactsMap_().rows || [];
  var needle = WAM_trim_(search).toLowerCase();
  var filtered = rows.filter(function(c) {
    if (c.tipo !== 'user') return false;
    if (!(c.chatId || c.contactoId)) return false;
    var hay = [c.nombreVisible, c.nombreAgenda, c.nombreWa, c.numero, c.etiquetas, c.chatId, c.contactoId]
      .join(' ')
      .toLowerCase();
    return !needle || hay.indexOf(needle) !== -1;
  });

  filtered.sort(function(a, b) {
    var aa = (a.nombreVisible || a.numero || '').toLowerCase();
    var bb = (b.nombreVisible || b.numero || '').toLowerCase();
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  });

  return filtered.map(function(c) {
    return {
      id: c.contactoId || c.chatId,
      chatId: c.chatId || c.contactoId,
      nombre: c.nombreVisible || c.nombreAgenda || c.nombreWa || c.numero || c.chatId,
      numero: c.numero || '',
      etiquetas: c.etiquetas || '',
      activo: c.activo ? 'SI' : 'NO',
      estado: c.estado || ''
    };
  });
}


function WAM_sincronizarContactosDirecta_() {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) {
    throw new Error('No se pudo tomar el bloqueo del documento para sincronizar. Intenta otra vez en unos segundos.');
  }
  try {
    WAM_writeSyncState_({
      status: 'RUNNING',
      message: 'Consultando contactos de la línea actual y actualizando la hoja...',
      startedAt: new Date().toISOString(),
      finishedAt: '',
      total: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      error: ''
    });
    var out = WAM_sincronizarContactos();
    return WAM_writeSyncState_({
      status: 'DONE',
      message: 'Sincronización terminada.',
      finishedAt: new Date().toISOString(),
      total: out.total || 0,
      inserted: out.inserted || 0,
      updated: out.updated || 0,
      skipped: out.skipped || 0,
      error: ''
    });
  } catch (e) {
    WAM_writeSyncState_({
      status: 'ERROR',
      message: 'La sincronización falló.',
      finishedAt: new Date().toISOString(),
      error: (e && e.message) ? e.message : String(e)
    });
    throw e;
  } finally {
    lock.releaseLock();
  }
}

// WAM_sincronizarContactosYListarDialogo_ removed in v6 (replaced by WAM_dialogSync)

function WAM_getSyncProps_() {
  return PropertiesService.getDocumentProperties();
}

function WAM_getSyncStateKey_() {
  return 'WAM_CONTACT_SYNC_STATE';
}

function WAM_readSyncState_() {
  var raw = WAM_getSyncProps_().getProperty(WAM_getSyncStateKey_());
  var now = new Date().toISOString();
  var state = WAM_safeJsonParse_(raw || '', null);
  if (!state || typeof state !== 'object') {
    return {
      status: 'IDLE',
      message: 'Sin sincronización en curso.',
      startedAt: '',
      finishedAt: '',
      total: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      error: '',
      checkedAt: now
    };
  }
  state.checkedAt = now;
  return state;
}

function WAM_writeSyncState_(patch) {
  var current = WAM_readSyncState_();
  var next = {};
  Object.keys(current).forEach(function(k) { next[k] = current[k]; });
  Object.keys(patch || {}).forEach(function(k) { next[k] = patch[k]; });
  next.checkedAt = new Date().toISOString();
  WAM_getSyncProps_().setProperty(WAM_getSyncStateKey_(), JSON.stringify(next));
  return next;
}

function WAM_clearSyncRunTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'WAM_runContactSyncBackground_') {
      ScriptApp.deleteTrigger(t);
    }
  });
}

function WAM_getEstadoSyncContactos_() {
  return WAM_readSyncState_();
}

function WAM_resetEstadoSyncContactos_() {
  WAM_clearSyncRunTriggers_();
  return WAM_writeSyncState_({
    status: 'IDLE',
    message: 'Sin sincronización en curso.',
    startedAt: '',
    finishedAt: '',
    total: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    error: ''
  });
}

function WAM_iniciarSyncContactosBackground_() {
  WAM_assertModuleReady_();
  var state = WAM_readSyncState_();
  if (state.status === 'QUEUED' || state.status === 'RUNNING') {
    return state;
  }
  WAM_clearSyncRunTriggers_();
  state = WAM_writeSyncState_({
    status: 'QUEUED',
    message: 'Sincronización en cola. Se ejecutará en segundo plano.',
    startedAt: new Date().toISOString(),
    finishedAt: '',
    total: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    error: ''
  });
  ScriptApp.newTrigger('WAM_runContactSyncBackground_')
    .timeBased()
    .after(1000)
    .create();
  return state;
}

function WAM_runContactSyncBackground_() {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(5000)) {
    WAM_writeSyncState_({
      status: 'QUEUED',
      message: 'Otra sincronización está tomando el candado del documento. Reintentando.'
    });
    WAM_clearSyncRunTriggers_();
    ScriptApp.newTrigger('WAM_runContactSyncBackground_').timeBased().after(15000).create();
    return;
  }

  try {
    WAM_writeSyncState_({
      status: 'RUNNING',
      message: 'Consultando contactos de la línea actual y actualizando la hoja...',
      startedAt: WAM_readSyncState_().startedAt || new Date().toISOString(),
      finishedAt: '',
      error: ''
    });
    var out = WAM_sincronizarContactos();
    WAM_writeSyncState_({
      status: 'DONE',
      message: 'Sincronización terminada.',
      finishedAt: new Date().toISOString(),
      total: out.total || 0,
      inserted: out.inserted || 0,
      updated: out.updated || 0,
      skipped: out.skipped || 0,
      error: ''
    });
  } catch (e) {
    WAM_writeSyncState_({
      status: 'ERROR',
      message: 'La sincronización falló.',
      finishedAt: new Date().toISOString(),
      error: (e && e.message) ? e.message : String(e)
    });
  } finally {
    WAM_clearSyncRunTriggers_();
    lock.releaseLock();
  }
}

/**
 * Dialog boot: returns ALL contacts in compact format for client-side filtering.
 * Single server call, then all search/pagination happens in the browser instantly.
 */
function WAM_dialogBoot() {
  WAM_assertModuleReady_();
  var tz = WAM_tz_();
  var now = new Date();
  return {
    timezone: tz,
    today: Utilities.formatDate(now, tz, 'yyyy-MM-dd'),
    timeNow: Utilities.formatDate(now, tz, 'HH:mm'),
    pageSize: WAM_CFG.DIALOG_PAGE_SIZE,
    contacts: WAM_getAllContactsCompact_()
  };
}

/**
 * Dialog sync: runs full sync then returns updated contact list.
 */
function WAM_dialogSync() {
  WAM_assertModuleReady_();
  var syncResult = WAM_sincronizarContactos();
  return {
    sync: syncResult,
    contacts: WAM_getAllContactsCompact_()
  };
}

/**
 * Returns ALL active user contacts as compact objects for the dialog.
 * Keys: i=id, n=name, u=number, t=tags (keeps payload small).
 */
function WAM_getAllContactsCompact_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_CONTACTS);
  if (!sh || sh.getLastRow() < 2) return [];
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, 14).getValues();
  var out = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var tipo = WAM_trim_(r[3]) || 'user';
    if (tipo !== 'user') continue;
    var id = WAM_trim_(r[1]) || WAM_trim_(r[2]);
    if (!id) continue;
    out.push({
      i: id,
      n: WAM_trim_(r[4]) || WAM_trim_(r[6]) || WAM_trim_(r[5]) || WAM_trim_(r[7]) || id,
      u: WAM_trim_(r[7]) || '',
      t: WAM_trim_(r[8]) || ''
    });
  }
  out.sort(function(a, b) {
    var aa = a.n.toLowerCase(), bb = b.n.toLowerCase();
    return aa < bb ? -1 : aa > bb ? 1 : 0;
  });
  return out;
}

function WAM_buildDateFromStrings_(dateStr, timeStr) {
  var d = WAM_trim_(dateStr);
  if (!d) throw new Error('La fecha es obligatoria.');
  var t = WAM_parseHour_(timeStr || '09:00');
  var parts = d.split('-');
  if (parts.length !== 3) throw new Error('Fecha inválida. Usa formato YYYY-MM-DD.');
  var yy = parseInt(parts[0], 10);
  var mm = parseInt(parts[1], 10) - 1;
  var dd = parseInt(parts[2], 10);
  var out = new Date(yy, mm, dd, t.h, t.m, 0, 0);
  if (isNaN(out.getTime())) throw new Error('No se pudo construir la fecha/hora del envío.');
  return out;
}

function WAM_weekdayNameFromDate_(d) {
  var map = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
  return map[(new Date(d)).getDay()];
}

function WAM_escapeTextSingleLine_(text, maxLen) {
  var s = WAM_trim_(text).replace(/\s+/g, ' ');
  if (maxLen && s.length > maxLen) return s.substring(0, maxLen);
  return s;
}

function WAM_getSelectedContactsByIds_(selectedIds) {
  if (!selectedIds || !selectedIds.length) throw new Error('No seleccionaste contactos.');
  var map = WAM_getContactsMap_().byId || {};
  var out = [];
  var seen = {};
  selectedIds.forEach(function(idRaw) {
    var id = WAM_trim_(idRaw);
    if (!id || seen[id]) return;
    seen[id] = true;
    var c = map[id] || map[WAM_normalizeChatId_(id)] || map[WAM_normalizePhone_(id)];
    if (!c) {
      var chatId = WAM_normalizeChatId_(id);
      c = {
        contactoId: chatId,
        chatId: chatId,
        tipo: 'user',
        nombreVisible: WAM_normalizePhone_(chatId),
        nombreWa: '',
        nombreAgenda: '',
        numero: WAM_normalizePhone_(chatId),
        etiquetas: '',
        variablesJson: '{}',
        activo: true,
        validado: false,
        estado: 'DIRECTO'
      };
    }
    out.push(c);
  });
  if (!out.length) throw new Error('No se resolvió ningún contacto válido.');
  return out;
}

function WAM_validateDialogPayload_(payload, mode) {
  payload = payload || {};
  var message = WAM_trim_(payload.message);
  var selectedIds = payload.selectedContactIds || [];
  if (!selectedIds.length) throw new Error('Debes elegir al menos un contacto.');
  if (!message) throw new Error('El mensaje está vacío.');
  if (mode === 'schedule') {
    var dateStr = WAM_trim_(payload.date);
    var timeStr = WAM_trim_(payload.time);
    if (!dateStr) throw new Error('La fecha de envío es obligatoria.');
    if (!timeStr) throw new Error('La hora de envío es obligatoria.');
    var freq = WAM_trim_(payload.frequency || 'UNA_VEZ').toUpperCase();
    if (['UNA_VEZ', 'DIARIA', 'SEMANAL', 'MENSUAL'].indexOf(freq) === -1) {
      throw new Error('Frecuencia inválida.');
    }
  }
}

function WAM_guardarProgramacionDesdeDialogo(payload) {
  WAM_assertModuleReady_();
  WAM_validateDialogPayload_(payload, 'schedule');

  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_SCHEDULES);
  if (!sh) throw new Error('No existe la hoja WA_AUTO_PROGRAMACION.');

  var selectedContacts = WAM_getSelectedContactsByIds_(payload.selectedContactIds || []);
  var frequency = WAM_trim_(payload.frequency || 'UNA_VEZ').toUpperCase();
  var startDate = WAM_buildDateFromStrings_(payload.date, payload.time);
  var weekday = frequency === 'SEMANAL'
    ? WAM_trim_(payload.weekday).toUpperCase() || WAM_weekdayNameFromDate_(startDate)
    : '';
  var dayOfMonth = frequency === 'MENSUAL'
    ? (parseInt(payload.dayOfMonth, 10) || startDate.getDate())
    : '';
  var linkPreview = payload.linkPreview ? 'SI' : 'NO';
  var lotId = 'WAMLOT-' + Utilities.formatDate(new Date(), WAM_tz_(), 'yyyyMMddHHmmss');
  var baseName = WAM_trim_(payload.campaignName) || ('Mensaje ' + Utilities.formatDate(startDate, WAM_tz_(), 'dd/MM/yyyy HH:mm'));
  var notes = 'Creado desde ventana emergente | Lote ' + lotId + (WAM_trim_(payload.notes) ? ' | ' + WAM_trim_(payload.notes) : '');
  var msg = String(payload.message || '');
  var rows = [];

  selectedContacts.forEach(function(contact, idx) {
    var campaignId = lotId + '-' + ('00' + (idx + 1)).slice(-3);
    rows.push([
      'SI',
      campaignId,
      baseName + ' · ' + (contact.nombreVisible || contact.numero || contact.chatId),
      'CONTACTO',
      contact.contactoId || contact.chatId,
      '',
      msg,
      frequency,
      startDate,
      WAM_trim_(payload.time),
      weekday,
      dayOfMonth,
      startDate,
      '',
      linkPreview,
      1,
      'SI',
      'PROGRAMADO',
      '',
      notes
    ]);
  });

  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 20).setValues(rows);

  return {
    ok: true,
    created: rows.length,
    lotId: lotId,
    campaignName: baseName,
    nextRun: Utilities.formatDate(startDate, WAM_tz_(), 'yyyy-MM-dd HH:mm')
  };
}

function WAM_enviarAhoraDesdeDialogo(payload) {
  WAM_assertModuleReady_();
  WAM_validateDialogPayload_(payload, 'send');

  var cfg = WAM_getConfig_();
  var selectedContacts = WAM_getSelectedContactsByIds_(payload.selectedContactIds || []);
  var cycleKey = 'MANUAL-' + Utilities.formatDate(new Date(), WAM_tz_(), 'yyyyMMddHHmmss');
  var scheduleLike = { nombreCampania: WAM_trim_(payload.campaignName) || 'Envío manual' };
  var logRows = [];
  var ok = 0;
  var err = 0;

  selectedContacts.forEach(function(contact, idx) {
    var chatId = WAM_normalizeChatId_(contact.chatId || contact.contactoId || contact.numero);
    var message = WAM_renderTemplate_(payload.message, contact, scheduleLike);
    try {
      var res = WAM_sendMessage_(chatId, message, !!payload.linkPreview);
      ok++;
      logRows.push([
        new Date(),
        cycleKey,
        'MANUAL',
        scheduleLike.nombreCampania,
        chatId,
        contact.contactoId || chatId,
        'OK',
        res.code,
        WAM_trim_(res.text).substring(0, 500),
        message.substring(0, 500),
        WAM_hash_('MANUAL|' + chatId + '|' + message + '|' + idx),
        'Enviado desde ventana emergente'
      ]);
    } catch (e) {
      err++;
      logRows.push([
        new Date(),
        cycleKey,
        'MANUAL',
        scheduleLike.nombreCampania,
        chatId,
        contact.contactoId || chatId,
        'ERROR',
        '',
        WAM_trim_(e.message).substring(0, 500),
        message.substring(0, 500),
        WAM_hash_('MANUAL|' + chatId + '|' + message + '|' + idx),
        'Error en envío manual'
      ]);
    }
    if (idx < selectedContacts.length - 1 && cfg.pauseMs > 0) Utilities.sleep(cfg.pauseMs);
  });

  if (logRows.length) {
    var shLog = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WAM_CFG.SHEET_LOG);
    shLog.getRange(shLog.getLastRow() + 1, 1, logRows.length, 12).setValues(logRows);
  }

  return {
    ok: true,
    sentOk: ok,
    sentError: err,
    total: selectedContacts.length,
    cycleKey: cycleKey
  };
}