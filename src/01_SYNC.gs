/*****************************************************************
 * 01_SYNC.gs
 * ─────────────────────────────────────────────────────────────────
 * Sincronización bidireccional TAREAS ↔ GENERAL
 * Uppercase automático, auto-scroll, posiciones guardadas
 *****************************************************************/

var SYNC_CFG = {
  SHEET_TAREAS:  (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.TAREAS : 'TAREAS'),
  SHEET_GENERAL: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.GENERAL : 'GENERAL'),
  TAR_KEY: 1,   TAR_DEF: 4,
  GEN_KEY: 3,   GEN_J: 10, GEN_K: 11, GEN_L: 12,
  HEADER_ROW: 1,
  CLEAR_WHEN_NO_MATCH: true,
  UPPER_MAX_CELLS: 5000,
  SCROLL: { defaultCol: 2, bySheet: { 'TAREAS': 1, 'GENERAL': 3 } }
};

function _SYNC_onOpenLogic(e) {
  var props = PropertiesService.getDocumentProperties();
  var sh = SpreadsheetApp.getActive().getActiveSheet();
  var name = sh.getName();
  props.deleteProperty('SAVED_POSITIONS');
  props.setProperty('LAST_SHEET', name);
  props.setProperty('VISITED_' + name, 'true');
  _SYNC_gotoLast(sh, _SYNC_pickCol(name));
}

function _SYNC_handleSelectionChange(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  var currentSheet = sh.getName();
  var props = PropertiesService.getDocumentProperties();
  var lastSheet = props.getProperty('LAST_SHEET') || '';
  if (currentSheet === lastSheet) return;

  var yaVisitada = props.getProperty('VISITED_' + currentSheet);
  if (yaVisitada) {
    var pos = _SYNC_getPos(currentSheet);
    if (pos) {
      try { sh.getRange(pos.row, pos.col).activate(); } catch (err) {
        _SYNC_gotoLast(sh, _SYNC_pickCol(currentSheet));
      }
    }
  } else {
    props.setProperty('VISITED_' + currentSheet, 'true');
    _SYNC_gotoLast(sh, _SYNC_pickCol(currentSheet));
  }
  props.setProperty('LAST_SHEET', currentSheet);
}

function _SYNC_handleEdit(e) {
  if (!e || !e.range) return;
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(5000)) return;
  try {
    var rng = e.range;
    var sh = rng.getSheet();
    var ss = sh.getParent();
    var name = sh.getName();

    _SYNC_savePos(name, rng.getRow(), rng.getColumn());
    _SYNC_uppercase(rng);

    var shT = ss.getSheetByName(SYNC_CFG.SHEET_TAREAS);
    var shG = ss.getSheetByName(SYNC_CFG.SHEET_GENERAL);
    if (!shT || !shG) {
      _SYNC_setLast({ ok: false, reason: 'Hojas no encontradas', sheet: name, range: rng.getA1Notation() });
      return;
    }

    var touchesTarKey = (name === SYNC_CFG.SHEET_TAREAS) &&
      intersectsAny_(rng.getColumn(), rng.getNumColumns(), [SYNC_CFG.TAR_KEY]);
    var touchesGenRelevant = (name === SYNC_CFG.SHEET_GENERAL) &&
      intersectsAny_(rng.getColumn(), rng.getNumColumns(), [SYNC_CFG.GEN_KEY, SYNC_CFG.GEN_J, SYNC_CFG.GEN_K, SYNC_CFG.GEN_L]);

    if (!touchesTarKey && !touchesGenRelevant) {
      _SYNC_setLast({ ok: true, skipped: true, reason: 'Edición no relevante' });
      return;
    }

    var r1 = rng.getRow(), r2 = r1 + rng.getNumRows() - 1;
    var dataStart = Math.max(r1, SYNC_CFG.HEADER_ROW + 1);
    if (r2 < dataStart) {
      _SYNC_setLast({ ok: true, skipped: true, reason: 'Solo encabezado' });
      return;
    }

    var did = [];
    if (touchesTarKey) {
      var genMap = _SYNC_buildGenMap(shG);
      var n = _SYNC_updateFromTareas(shT, dataStart, r2, genMap);
      did.push('TAREAS→DEF:' + n);
    }
    if (touchesGenRelevant) {
      var tarMap = _SYNC_buildTarMap(shT);
      var n2 = _SYNC_updateFromGeneral(shG, dataStart, r2, shT, tarMap);
      did.push('GENERAL→TAREAS:' + n2);
    }
    _SYNC_setLast({ ok: true, did: did.join(' | '), when: new Date().toISOString() });
  } catch (err) {
    _SYNC_setLast({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function _SYNC_updateFromTareas(shT, rowStart, rowEnd, genMap) {
  var n = rowEnd - rowStart + 1;
  if (n <= 0) return 0;
  var keys = shT.getRange(rowStart, SYNC_CFG.TAR_KEY, n, 1).getValues();
  var out = [];
  for (var i = 0; i < n; i++) {
    var nk = normKey_(keys[i][0]);
    var jkl = nk ? genMap.get(nk) : null;
    out.push(jkl ? [jkl[0], jkl[1], jkl[2]] : ['', '', '']);
  }
  shT.getRange(rowStart, SYNC_CFG.TAR_DEF, n, 3).setValues(out);
  return n;
}

function _SYNC_updateFromGeneral(shG, rowStart, rowEnd, shT, tarMap) {
  var n = rowEnd - rowStart + 1;
  if (n <= 0) return 0;
  var needMax = Math.max(SYNC_CFG.GEN_KEY, SYNC_CFG.GEN_J, SYNC_CFG.GEN_K, SYNC_CFG.GEN_L);
  var block = shG.getRange(rowStart, 1, n, needMax).getValues();
  var iKey = SYNC_CFG.GEN_KEY - 1, iJ = SYNC_CFG.GEN_J - 1, iK = SYNC_CFG.GEN_K - 1, iL = SYNC_CFG.GEN_L - 1;
  var updates = 0;
  for (var i = 0; i < block.length; i++) {
    var nk = normKey_(block[i][iKey]);
    if (!nk) continue;
    var rowsT = tarMap.get(nk);
    if (!rowsT || rowsT.length === 0) continue;
    _SYNC_writeDEF(shT, rowsT, [block[i][iJ], block[i][iK], block[i][iL]]);
    updates += rowsT.length;
  }
  return updates;
}

function _SYNC_buildGenMap(shG) {
  var lastR = getLastRowInColumn_(shG, SYNC_CFG.GEN_KEY);
  if (lastR <= SYNC_CFG.HEADER_ROW) return new Map();
  var n = lastR - SYNC_CFG.HEADER_ROW;
  var needMax = Math.max(SYNC_CFG.GEN_KEY, SYNC_CFG.GEN_J, SYNC_CFG.GEN_K, SYNC_CFG.GEN_L);
  var vals = shG.getRange(SYNC_CFG.HEADER_ROW + 1, 1, n, needMax).getValues();
  var iKey = SYNC_CFG.GEN_KEY - 1, iJ = SYNC_CFG.GEN_J - 1, iK = SYNC_CFG.GEN_K - 1, iL = SYNC_CFG.GEN_L - 1;
  var map = new Map();
  for (var i = 0; i < vals.length; i++) {
    var nk = normKey_(vals[i][iKey]);
    if (nk) map.set(nk, [vals[i][iJ], vals[i][iK], vals[i][iL]]);
  }
  return map;
}

function _SYNC_buildTarMap(shT) {
  var lastR = getLastRowInColumn_(shT, SYNC_CFG.TAR_KEY);
  if (lastR <= SYNC_CFG.HEADER_ROW) return new Map();
  var n = lastR - SYNC_CFG.HEADER_ROW;
  var vals = shT.getRange(SYNC_CFG.HEADER_ROW + 1, SYNC_CFG.TAR_KEY, n, 1).getValues();
  var map = new Map();
  for (var i = 0; i < vals.length; i++) {
    var nk = normKey_(vals[i][0]);
    if (!nk) continue;
    var row = SYNC_CFG.HEADER_ROW + i + 1;
    if (!map.has(nk)) map.set(nk, []);
    map.get(nk).push(row);
  }
  return map;
}

function _SYNC_writeDEF(shT, rowsT, defArr) {
  if (!rowsT || !rowsT.length) return;
  var sorted = rowsT.slice().sort(function(a, b) { return a - b; });
  var start = sorted[0], prev = sorted[0];
  for (var i = 1; i <= sorted.length; i++) {
    if (i < sorted.length && sorted[i] === prev + 1) { prev = sorted[i]; continue; }
    var len = prev - start + 1;
    var vals = [];
    for (var j = 0; j < len; j++) vals.push([defArr[0], defArr[1], defArr[2]]);
    shT.getRange(start, SYNC_CFG.TAR_DEF, len, 3).setValues(vals);
    if (i < sorted.length) start = prev = sorted[i];
  }
}

function _SYNC_uppercase(range) {
  try {
    var nr = range.getNumRows(), nc = range.getNumColumns();
    if (nr * nc > SYNC_CFG.UPPER_MAX_CELLS) return;
    var vals = range.getValues(), formulas = range.getFormulas();
    var changed = false;
    for (var r = 0; r < nr; r++) {
      for (var c = 0; c < nc; c++) {
        if (formulas[r][c]) continue;
        var v = vals[r][c];
        if (typeof v === 'string' && v.length) {
          var up = v.toUpperCase();
          if (up !== v) { vals[r][c] = up; changed = true; }
        }
      }
    }
    if (changed) range.setValues(vals);
  } catch (err) {}
}

function _SYNC_pickCol(name) {
  var map = SYNC_CFG.SCROLL.bySheet || {};
  return map[name] || SYNC_CFG.SCROLL.defaultCol || 1;
}

function _SYNC_gotoLast(sheet, col) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return;
  var vals = sheet.getRange(1, col, lastRow, 1).getValues();
  var target = SYNC_CFG.HEADER_ROW;
  for (var i = vals.length - 1; i >= SYNC_CFG.HEADER_ROW; i--) {
    var s = (vals[i][0] === null || vals[i][0] === undefined) ? '' : String(vals[i][0]).replace(/\u00A0/g, ' ').trim();
    if (s !== '') { target = i + 1; break; }
  }
  sheet.getRange(target, col).activate();
}

function _SYNC_savePos(sheetName, row, col) {
  var props = PropertiesService.getDocumentProperties();
  var pos = {};
  try { pos = JSON.parse(props.getProperty('SAVED_POSITIONS') || '{}'); } catch (e) { pos = {}; }
  pos[sheetName] = { row: row, col: col };
  props.setProperty('SAVED_POSITIONS', JSON.stringify(pos));
}

function _SYNC_getPos(sheetName) {
  try {
    var pos = JSON.parse(PropertiesService.getDocumentProperties().getProperty('SAVED_POSITIONS') || '{}');
    return pos[sheetName] || null;
  } catch (e) { return null; }
}

function _SYNC_setLast(obj) {
  try { PropertiesService.getDocumentProperties().setProperty('LAST_RUN', JSON.stringify(obj, null, 2)); } catch (e) {}
}

function validateSetup() {
  var ss = SpreadsheetApp.getActive();
  var shT = ss.getSheetByName(SYNC_CFG.SHEET_TAREAS);
  var shG = ss.getSheetByName(SYNC_CFG.SHEET_GENERAL);
  var problems = [];
  if (!shT) problems.push('No existe la hoja: ' + SYNC_CFG.SHEET_TAREAS);
  if (!shG) problems.push('No existe la hoja: ' + SYNC_CFG.SHEET_GENERAL);
  if (shT) { if (!shT.getRange(SYNC_CFG.HEADER_ROW + 1, SYNC_CFG.TAR_KEY).getValue()) problems.push('TAREAS: Col A vacía en fila 2.'); }
  if (shG) { if (!shG.getRange(SYNC_CFG.HEADER_ROW + 1, SYNC_CFG.GEN_KEY).getValue()) problems.push('GENERAL: Col C vacía en fila 2.'); }
  var triggers = ScriptApp.getProjectTriggers();
  if (!triggers.some(function(t) { return t.getHandlerFunction() === 'trigEdit'; })) {
    problems.push('⚠️ Trigger "trigEdit" NO activo. Ejecuta "Instalar/Arreglar activadores".');
  }
  SpreadsheetApp.getUi().alert(problems.length ? 'PROBLEMAS:\n- ' + problems.join('\n- ') : '✅ Configuración OK.');
}

function syncAllNow() {
  var ss = SpreadsheetApp.getActive();
  var shT = ss.getSheetByName(SYNC_CFG.SHEET_TAREAS);
  var shG = ss.getSheetByName(SYNC_CFG.SHEET_GENERAL);
  if (!shT || !shG) { SpreadsheetApp.getUi().alert('❌ Faltan hojas.'); return; }
  var genMap = _SYNC_buildGenMap(shG);
  var lastRowT = shT.getLastRow();
  var start = SYNC_CFG.HEADER_ROW + 1;
  if (lastRowT < start) { SpreadsheetApp.getActive().toast('No hay datos.', 'Sync', 3); return; }
  _SYNC_updateFromTareas(shT, start, lastRowT, genMap);
  SpreadsheetApp.getActive().toast('Sincronización completa ✅', 'Sync', 4);
}

function showLastRun() {
  var raw = PropertiesService.getDocumentProperties().getProperty('LAST_RUN') || '';
  SpreadsheetApp.getUi().alert(raw || 'No hay registro. Verifica que el trigger trigEdit esté activo.');
}
