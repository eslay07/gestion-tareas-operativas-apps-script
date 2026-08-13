/*****************************************************************
 * 04_GTX_EXPORT.gs
 * ─────────────────────────────────────────────────────────────────
 * Exporta ítems de GENERAL a hoja plana JT_EXPORT
 * Versión sanitizada para GitHub.
 *****************************************************************/

var GTX_CFG = {
  GENERAL_SHEET_NAME: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.GENERAL : 'GENERAL'),
  EXPORT_SHEET_NAME: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.JT_EXPORT : 'JT_EXPORT'),
  HEADER_ROW: 1,
  SCAN_START_ROW: 6474,
  COL_CODE: 2, COL_DETAIL: 3, COL_QTY: 4, COL_PROVIDER: 5, COL_OC: 7,
  MIN_TASK_NUMBER: 1000000,
  MAX_ROWS_READ: 40000
};

function GTX_exportNow() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(GTX_CFG.GENERAL_SHEET_NAME);
  if (!sh) throw new Error('No existe hoja: ' + GTX_CFG.GENERAL_SHEET_NAME);
  var exp = ss.getSheetByName(GTX_CFG.EXPORT_SHEET_NAME);
  if (!exp) exp = ss.insertSheet(GTX_CFG.EXPORT_SHEET_NAME);

  var lastRow = Math.min(sh.getLastRow(), GTX_CFG.MAX_ROWS_READ);
  exp.clear();
  exp.getRange(1, 1, 1, 8).setValues([['TASK_ID', 'CODIGO', 'DETALLE', 'CANTIDAD', 'PROVEEDOR', 'OC', 'ROW_SRC', 'EXPORTED_AT']]);

  var startRow = Math.max(Number(GTX_CFG.SCAN_START_ROW || (GTX_CFG.HEADER_ROW + 1)), GTX_CFG.HEADER_ROW + 1);
  if (lastRow < startRow) return;

  var maxCol = Math.max(GTX_CFG.COL_CODE, GTX_CFG.COL_DETAIL, GTX_CFG.COL_QTY, GTX_CFG.COL_PROVIDER, GTX_CFG.COL_OC);
  var nRows = lastRow - startRow + 1;
  var vals = sh.getRange(startRow, 1, nRows, maxCol).getValues();
  var rowsOut = [], currentTask = '';

  for (var i = 0; i < vals.length; i++) {
    var row = vals[i];

    if (GENERAL_isTaskHeaderRow_(row, 3, GTX_CFG.COL_CODE, GTX_CFG.COL_QTY, GTX_CFG.COL_PROVIDER)) {
      currentTask = normalizeTaskId_(row[GTX_CFG.COL_DETAIL - 1]);
      continue;
    }

    if (!currentTask) continue;

    var code = row[GTX_CFG.COL_CODE - 1];
    var detail = row[GTX_CFG.COL_DETAIL - 1];
    var qty = row[GTX_CFG.COL_QTY - 1];

    if (isBlank_(code) || isBlank_(detail) || !isFinite(Number(qty))) continue;

    rowsOut.push([
      currentTask,
      String(code).trim(),
      String(detail).trim(),
      Number(qty),
      isBlank_(row[GTX_CFG.COL_PROVIDER - 1]) ? '' : String(row[GTX_CFG.COL_PROVIDER - 1]).trim(),
      isBlank_(row[GTX_CFG.COL_OC - 1]) ? '' : String(row[GTX_CFG.COL_OC - 1]).trim(),
      startRow + i,
      new Date()
    ]);
  }

  if (rowsOut.length) exp.getRange(2, 1, rowsOut.length, 8).setValues(rowsOut);
}

function GTX_setupTrigger_5min() {
  GTX_deleteTriggers();
  ScriptApp.newTrigger('GTX_exportNow').timeBased().everyMinutes(5).create();
}

function GTX_deleteTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'GTX_exportNow') ScriptApp.deleteTrigger(t);
  });
}
