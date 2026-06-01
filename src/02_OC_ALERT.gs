/*****************************************************************
 * 02_OC_ALERT.gs
 * ─────────────────────────────────────────────────────────────────
 * Alerta de Órdenes de Compra faltantes
 * Correo agrupado por tarea con nivel de riesgo
 *****************************************************************/

var CFG_OC_ALERT_V2 = {
  SHEET_NAME: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.GENERAL : 'GENERAL'),
  TO_EMAIL: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.DEFAULTS.EMAIL_DEMO : 'usuario.demo@empresa.com'),
  COL_CODIGO: 2, COL_DESC: 3, COL_CANT: 4, COL_PROV: 5, COL_OC: 7,
  COL_DEPTO: 10, COL_SOLIC: 11, COL_DETALLE: 12,
  TASK_ID_COL: 3,
  FECHA_HEADERS: ['FECHA INICIAL', 'FECHA INGRESO'],
  HIGH_PRIORITY_DEPTS: ['MERCADEO', 'COMERCIAL'],
  DEBUG: false
};

function _OC_handleEdit(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  if (sh.getName() !== CFG_OC_ALERT_V2.SHEET_NAME) return;
  var fechaCol = _OC_resolveFechaCol(sh);
  var r = e.range.getRow();
  if (r < 2 || e.range.getColumn() === fechaCol) return;
  var row = sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0];
  var looksLikeTask = GENERAL_isTaskHeaderRow_(row, CFG_OC_ALERT_V2.TASK_ID_COL, CFG_OC_ALERT_V2.COL_CODIGO, CFG_OC_ALERT_V2.COL_CANT, CFG_OC_ALERT_V2.COL_PROV);
  if (looksLikeTask) {
    var cell = sh.getRange(r, fechaCol);
    if (!(cell.getValue() instanceof Date)) {
      cell.setValue(new Date());
      cell.setNumberFormat('yyyy-mm-dd hh:mm');
    }
  }
}

function createDailyTrigger_V2() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sendTareasSinOCEmail_V2') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendTareasSinOCEmail_V2').timeBased().everyDays(1).atHour(8).nearMinute(30).create();
}

function sendTareasSinOCEmail_V2() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CFG_OC_ALERT_V2.SHEET_NAME);
  if (!sh) throw new Error('No existe "' + CFG_OC_ALERT_V2.SHEET_NAME + '".');
  var fechaCol = _OC_resolveFechaCol(sh);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return;
  var values = sh.getRange(1, 1, lastRow, sh.getLastColumn()).getValues();
  var tasks = _OC_parseTasks(values, fechaCol);
  var now = new Date();
  var alerts = [];

  tasks.forEach(function(task) {
    if (!(task.fechaInicial instanceof Date)) return;
    var faltantes = task.items.filter(function(it) { return isBlank_(it.oc); });
    if (faltantes.length === 0) return;
    var deptoUpper = (task.depto || '').toUpperCase();
    var isHighDept = CFG_OC_ALERT_V2.HIGH_PRIORITY_DEPTS.some(function(k) { return deptoUpper.indexOf(k) !== -1; });
    var days = daysBetween_(task.fechaInicial, now);
    var risk = _OC_riskByDays(days);
    if (isHighDept) risk = { label: 'ALTA PRIORIDAD (DEPTO)', color: '#b71c1c', level: 3 };
    alerts.push({
      taskId: task.taskId,
      depto: task.depto || 'N/D',
      solicitante: task.solicitante || 'N/D',
      detalle: task.detalle || 'N/D',
      fechaInicial: task.fechaInicial,
      days: days,
      risk: risk,
      faltantes: faltantes
    });
  });

  if (CFG_OC_ALERT_V2.DEBUG) _OC_writeDebug(ss, { fechaCol: fechaCol, tareasDetectadas: alerts.length, now: now });
  if (alerts.length === 0) return;

  alerts.sort(function(a, b) { return (b.risk.level - a.risk.level) || (b.days - a.days); });

  MailApp.sendEmail({
    to: CFG_OC_ALERT_V2.TO_EMAIL,
    subject: _OC_buildSubject(alerts),
    body: _OC_buildPlainEmail(alerts, now, ss.getName()),
    htmlBody: _OC_buildHtmlEmail(alerts, now, ss.getName())
  });
}

function debugConteo_V2() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CFG_OC_ALERT_V2.SHEET_NAME);
  var fechaCol = _OC_resolveFechaCol(sh);
  var values = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
  var tasks = _OC_parseTasks(values, fechaCol);
  var count = 0;
  tasks.forEach(function(t) {
    if (t.fechaInicial instanceof Date && t.items.some(function(it) { return isBlank_(it.oc); })) count++;
  });
  _OC_writeDebug(ss, { fechaCol: fechaCol, tareasDetectadas: count, now: new Date() });
}

function _OC_parseTasks(values, fechaCol) {
  var tasks = [], current = null;
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var looksLikeTask = GENERAL_isTaskHeaderRow_(row, CFG_OC_ALERT_V2.TASK_ID_COL, CFG_OC_ALERT_V2.COL_CODIGO, CFG_OC_ALERT_V2.COL_CANT, CFG_OC_ALERT_V2.COL_PROV);

    if (looksLikeTask) {
      if (current) tasks.push(current);
      var fechaVal = row[fechaCol - 1];
      current = {
        taskId: normalizeTaskId_(row[CFG_OC_ALERT_V2.TASK_ID_COL - 1]),
        depto: normalizeText_(row[CFG_OC_ALERT_V2.COL_DEPTO - 1]),
        solicitante: normalizeText_(row[CFG_OC_ALERT_V2.COL_SOLIC - 1]),
        detalle: normalizeText_(row[CFG_OC_ALERT_V2.COL_DETALLE - 1]),
        fechaInicial: (fechaVal instanceof Date) ? fechaVal : null,
        items: []
      };
      continue;
    }

    if (!current) continue;
    var code = row[CFG_OC_ALERT_V2.COL_CODIGO - 1];
    var desc = row[CFG_OC_ALERT_V2.COL_DESC - 1];
    var qty = row[CFG_OC_ALERT_V2.COL_CANT - 1];
    var prov = row[CFG_OC_ALERT_V2.COL_PROV - 1];
    var oc = row[CFG_OC_ALERT_V2.COL_OC - 1];

    if (isBlank_(code) && isBlank_(desc) && isBlank_(qty) && isBlank_(prov)) continue;
    if (!isBlank_(row[CFG_OC_ALERT_V2.COL_DEPTO - 1]) && isBlank_(current.depto)) current.depto = normalizeText_(row[CFG_OC_ALERT_V2.COL_DEPTO - 1]);
    if (!isBlank_(row[CFG_OC_ALERT_V2.COL_SOLIC - 1]) && isBlank_(current.solicitante)) current.solicitante = normalizeText_(row[CFG_OC_ALERT_V2.COL_SOLIC - 1]);
    if (!isBlank_(row[CFG_OC_ALERT_V2.COL_DETALLE - 1]) && isBlank_(current.detalle)) current.detalle = normalizeText_(row[CFG_OC_ALERT_V2.COL_DETALLE - 1]);
    current.items.push({
      rowIndex: r + 1,
      code: normalizeText_(code),
      desc: normalizeText_(desc),
      qty: qty,
      prov: normalizeText_(prov),
      oc: normalizeText_(oc)
    });
  }
  if (current) tasks.push(current);
  return tasks;
}

function _OC_resolveFechaCol(sh) {
  var headerRow = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var targets = CFG_OC_ALERT_V2.FECHA_HEADERS.map(function(h) { return h.trim().toUpperCase(); });
  var candidates = [];
  for (var c = 0; c < headerRow.length; c++) {
    if (targets.indexOf(String(headerRow[c] || '').trim().toUpperCase()) !== -1) candidates.push(c + 1);
  }
  if (candidates.length === 0) {
    var newCol = sh.getLastColumn() + 1;
    sh.getRange(1, newCol).setValue('FECHA INICIAL').setFontWeight('bold');
    sh.setColumnWidth(newCol, 160);
    sh.getRange(2, newCol, Math.max(1, sh.getLastRow() - 1), 1).setNumberFormat('yyyy-mm-dd hh:mm');
    return newCol;
  }
  if (candidates.length === 1) {
    sh.getRange(1, candidates[0]).setValue('FECHA INICIAL').setFontWeight('bold');
    return candidates[0];
  }
  var lastRow = sh.getLastRow(), bestCol = candidates[0], bestCount = -1;
  candidates.forEach(function(col) {
    var vals = sh.getRange(2, col, Math.max(1, lastRow - 1), 1).getValues();
    var count = vals.filter(function(v) { return v[0] instanceof Date; }).length;
    if (count > bestCount) { bestCount = count; bestCol = col; }
  });
  sh.getRange(1, bestCol).setValue('FECHA INICIAL').setFontWeight('bold');
  candidates.forEach(function(col) { if (col !== bestCol) sh.getRange(1, col).setValue('FECHA (NO USAR)'); });
  return bestCol;
}

function _OC_riskByDays(days) {
  if (days >= 10) return { label: 'CRÍTICO', color: '#c62828', level: 3 };
  if (days >= 6) return { label: 'MÁXIMO', color: '#ef6c00', level: 2 };
  return { label: 'NORMAL', color: '#2e7d32', level: 1 };
}

function _OC_buildSubject(alerts) {
  var crit = alerts.filter(function(a) { return a.risk.level === 3; }).length;
  var max = alerts.filter(function(a) { return a.risk.level === 2; }).length;
  if (crit > 0) return '⚠️ URGENTE: Tareas con ítems SIN OC (CRÍTICO: ' + crit + ')';
  if (max > 0) return '⚠️ Alerta: Tareas con ítems SIN OC (MÁXIMO: ' + max + ')';
  return 'Alerta: Tareas con ítems SIN OC (NORMAL: ' + alerts.length + ')';
}

function _OC_buildHtmlEmail(alerts, now, ssName) {
  var tz = APP_CORE.TZ;
  var dateStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm');
  var blocks = alerts.map(function(a) {
    var badge = '<span style="display:inline-block;padding:4px 10px;border-radius:14px;background:' + a.risk.color + ';color:#fff;font-weight:900;font-size:12px;">' + escapeHtml_(a.risk.label) + '</span>';
    var fechaTxt = Utilities.formatDate(a.fechaInicial, tz, 'yyyy-MM-dd HH:mm');
    var itemsRows = a.faltantes.map(function(it) {
      return '<tr><td style="padding:6px;border-bottom:1px solid #eee;">' + escapeHtml_(it.code || 'N/D') + '</td>' +
        '<td style="padding:6px;border-bottom:1px solid #eee;">' + escapeHtml_(it.desc || 'N/D') + '</td>' +
        '<td style="padding:6px;border-bottom:1px solid #eee;">' + escapeHtml_(it.qty || 'N/D') + '</td>' +
        '<td style="padding:6px;border-bottom:1px solid #eee;">' + escapeHtml_(it.prov || 'N/D') + '</td></tr>';
    }).join('');
    return '<div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin:12px 0;background:#fff;">' +
      '<div style="display:flex;gap:10px;align-items:center;">' + badge + '<div><b>' + a.days + '</b> días desde FECHA INICIAL</div></div>' +
      '<div style="margin-top:8px;"><div><b>Tarea:</b> ' + escapeHtml_(a.taskId) + '</div>' +
      '<div><b>Departamento:</b> ' + escapeHtml_(a.depto) + '</div>' +
      '<div><b>Solicitante:</b> ' + escapeHtml_(a.solicitante) + '</div>' +
      '<div><b>Detalle:</b> ' + escapeHtml_(a.detalle) + '</div>' +
      '<div><b>Fecha inicial:</b> ' + escapeHtml_(fechaTxt) + '</div></div>' +
      '<div style="margin-top:10px;padding:10px;border:1px solid #f0b5b5;background:#fff5f5;border-radius:10px;">' +
      '<div style="font-weight:900;color:#b71c1c;margin-bottom:6px;">ARTICULO SIN ORDEN DE COMPRA:</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr>' +
      '<th style="text-align:left;padding:6px;background:#f6f6f6;border-bottom:2px solid #ddd;">Código</th>' +
      '<th style="text-align:left;padding:6px;background:#f6f6f6;border-bottom:2px solid #ddd;">Descripción</th>' +
      '<th style="text-align:left;padding:6px;background:#f6f6f6;border-bottom:2px solid #ddd;">Cantidad</th>' +
      '<th style="text-align:left;padding:6px;background:#f6f6f6;border-bottom:2px solid #ddd;">Proveedor</th>' +
      '</tr></thead><tbody>' + itemsRows + '</tbody></table>' +
      '<div style="margin-top:10px;font-weight:900;color:#111;">Acción requerida: Generar y asignar OC a cada ítem listado.</div></div></div>';
  }).join('');
  return '<div style="font-family:Arial,sans-serif;line-height:1.35;color:#111;">' +
    '<div style="font-size:16px;font-weight:900;color:#b71c1c;">ALERTA: TAREAS CON ÍTEMS SIN ORDEN DE COMPRA</div>' +
    '<div style="color:#555;margin-bottom:10px;">Fuente: <b>' + escapeHtml_(ssName) + '</b> | Ejecutado: <b>' + escapeHtml_(dateStr) + '</b></div>' + blocks + '</div>';
}

function _OC_buildPlainEmail(alerts, now, ssName) {
  var tz = APP_CORE.TZ;
  var out = 'ALERTA: TAREAS SIN OC\nFuente: ' + ssName + '\nEjecutado: ' + Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm') + '\n\n';
  alerts.forEach(function(a) {
    out += '[' + a.risk.label + '] ' + a.days + ' días\nTarea: ' + a.taskId + '\nDepto: ' + a.depto + '\n';
    a.faltantes.forEach(function(it) { out += '- ' + (it.code || 'N/D') + ' | ' + (it.desc || 'N/D') + '\n'; });
    out += '\n';
  });
  return out;
}

function _OC_writeDebug(ss, info) {
  var name = 'DEBUG_OC_ALERT_V2';
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, 5).setValues([['Timestamp', 'FechaCol', 'Tareas', 'Sheet', 'Nota']]).setFontWeight('bold');
  }
  var ts = Utilities.formatDate(info.now, APP_CORE.TZ, 'yyyy-MM-dd HH:mm:ss');
  sh.appendRow([ts, info.fechaCol, info.tareasDetectadas, CFG_OC_ALERT_V2.SHEET_NAME, 'Si tareas=0 no se envía correo.']);
}
/