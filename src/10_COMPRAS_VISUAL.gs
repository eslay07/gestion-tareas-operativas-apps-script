/*****************************************************************
 * 10_COMPRAS_VISUAL.gs
 * ────────────────────────────────────────────────────────────────
 * Módulo visual, ADITIVO y conservador:
 * - Recomendación por CÓDIGO (no por tarea)
 * - Cierre por TAREA
 * - Panel lateral visual con botones
 * - Sin hojas visibles de resultados
 *
 * Lee como base de datos:
 * - GENERAL
 * - Precios Enero
 * - FAC POR COMPARTIR
 * - ANTICIPOS Y CONTADO
 *
 * No modifica la data operativa.
 *****************************************************************/

var SMARTUI_CFG = {
  MENU_NAME: '🧠 Compras Visual',
  SHEET_GENERAL: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.GENERAL : 'GENERAL'),
  SHEET_PRECIOS: (typeof SYS_CFG !== 'undefined' && SYS_CFG.SHEETS.PRECIOS ? SYS_CFG.SHEETS.PRECIOS : 'Precios Enero'),
  SHEET_FAC: (typeof SYS_CFG !== 'undefined' ? SYS_CFG.SHEETS.FAC : 'FAC POR COMPARTIR'),
  SHEET_ANT: (typeof SYS_CFG !== 'undefined' && SYS_CFG.SHEETS.ANTICIPOS ? SYS_CFG.SHEETS.ANTICIPOS : 'ANTICIPOS Y CONTADO'),
  TZ: (typeof SYS_getTz_ === 'function' ? SYS_getTz_() : (Session.getScriptTimeZone() || 'America/Guayaquil')),
  CLOSE_OK_STATUSES: {
    'FINALIZADO': true,
    'CERRADO': true,
    'LIQUIDADO': true,
    'COMPARTIDA': true
  }
};

// ════════════════════════════════════════════════════════════════
// MENÚ / PANEL
// ════════════════════════════════════════════════════════════════

function SMARTUI_addToSistemaMenu_(menu, ui) {
  ui = ui || SpreadsheetApp.getUi();
  menu.addSubMenu(
    ui.createMenu(SMARTUI_CFG.MENU_NAME)
      .addItem('📌 Abrir panel principal', 'SMARTUI_openPanel')
      .addSeparator()
      .addItem('⚡ Evaluar código seleccionado', 'SMARTUI_openPanelWithCurrentCode')
      .addItem('✅ Evaluar tarea actual', 'SMARTUI_openPanelWithCurrentTask')
      .addSeparator()
      .addItem('🧩 Instalar menú automático', 'SMARTUI_installAutoMenu')
  );
  return menu;
}

function SMARTUI_crearMenuStandalone() {
  SpreadsheetApp.getUi()
    .createMenu(SMARTUI_CFG.MENU_NAME)
    .addItem('📌 Abrir panel principal', 'SMARTUI_openPanel')
    .addSeparator()
    .addItem('⚡ Evaluar código seleccionado', 'SMARTUI_openPanelWithCurrentCode')
    .addItem('✅ Evaluar tarea actual', 'SMARTUI_openPanelWithCurrentTask')
    .addSeparator()
    .addItem('🧩 Instalar menú automático', 'SMARTUI_installAutoMenu')
    .addToUi();
}

function SMARTUI_onOpenMenu_() {
  SMARTUI_crearMenuStandalone();
}

function SMARTUI_installAutoMenu() {
  SMARTUI_uninstallAutoMenu();
  ScriptApp.newTrigger('SMARTUI_onOpenMenu_')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onOpen()
    .create();
  SMARTUI_crearMenuStandalone();
  SpreadsheetApp.getUi().alert('✅ Menú automático de Compras Visual instalado.');
}

function SMARTUI_uninstallAutoMenu() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'SMARTUI_onOpenMenu_' && t.getEventType() === ScriptApp.EventType.ON_OPEN) {
      ScriptApp.deleteTrigger(t);
      n++;
    }
  });
  return n;
}

function SMARTUI_openPanel() {
  var html = HtmlService.createHtmlOutputFromFile('SMART_PANEL')
    .setTitle('Compras Visual')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  SpreadsheetApp.getUi().showSidebar(html);
}

function SMARTUI_openPanelWithCurrentCode() {
  SMARTUI_openPanel();
}

function SMARTUI_openPanelWithCurrentTask() {
  SMARTUI_openPanel();
}

// ════════════════════════════════════════════════════════════════
// BOOTSTRAP
// ════════════════════════════════════════════════════════════════

function SMARTUI_bootstrap() {
  var activeContext = SMARTUI_getActiveSelectionContext_();
  return {
    timezone: SMARTUI_CFG.TZ,
    selection: activeContext
  };
}

// ════════════════════════════════════════════════════════════════
// RECOMENDACIÓN POR CÓDIGO
// ════════════════════════════════════════════════════════════════

function SMARTUI_getCodeRecommendation(codeRaw) {
  var code = SMARTUI_normCode_(codeRaw);
  if (!code) throw new Error('Ingresa un código válido.');

  SMARTUI_assertBaseSheets_();

  var general = SMARTUI_parseGeneralTasks_();
  var generalMatches = [];

  general.tasks.forEach(function (task) {
    task.items.forEach(function (item) {
      if (SMARTUI_normCode_(item.code) === code) {
        generalMatches.push({
          taskId: task.taskId,
          rowNumber: item.rowNumber,
          depto: task.depto,
          solic: task.solic,
          detalle: task.detalle,
          code: item.code,
          desc: item.desc,
          qty: item.qty,
          prov: item.prov,
          priceRaw: item.priceRaw,
          priceNum: item.priceNum,
          oc: item.oc
        });
      }
    });
  });

  var catalogMatches = SMARTUI_getCatalogMatches_(code);

  var itemName =
    (catalogMatches.length ? catalogMatches[0].desc : '') ||
    (generalMatches.length ? generalMatches[0].desc : '') ||
    'Sin descripción';

  var uniqueTasks = {};
  var uniqueProviders = {};
  var pendingWithoutOC = [];
  var histWithPrice = [];

  generalMatches.forEach(function (m) {
    if (m.taskId) uniqueTasks[m.taskId] = true;
    if (m.prov) uniqueProviders[m.prov] = true;
    if (SMARTUI_isBlank_(m.oc)) pendingWithoutOC.push(m);
    if (SMARTUI_isFiniteNum_(m.priceNum)) histWithPrice.push(m);
  });

  histWithPrice.sort(function (a, b) { return a.rowNumber - b.rowNumber; });
  var histMin = SMARTUI_pickMinPrice_(histWithPrice, 'priceNum');
  var histMax = SMARTUI_pickMaxPrice_(histWithPrice, 'priceNum');
  var histAvg = SMARTUI_avg_(histWithPrice.map(function (x) { return x.priceNum; }));
  var histLast = histWithPrice.length ? histWithPrice[histWithPrice.length - 1] : null;

  var catMin = SMARTUI_pickMinPrice_(catalogMatches, 'priceNum');
  var catAvg = SMARTUI_avg_(catalogMatches.map(function (x) { return x.priceNum; }));

  var bestCandidates = [];
  if (histMin) bestCandidates.push({ source: 'HISTORICO', prov: histMin.prov, priceNum: histMin.priceNum });
  if (catMin) bestCandidates.push({ source: 'CATALOGO', prov: catMin.prov, priceNum: catMin.priceNum });
  var bestOverall = SMARTUI_pickMinPrice_(bestCandidates, 'priceNum');

  var decision = 'SIN REFERENCIAS';
  var savingAbs = '';
  var savingPct = '';

  if (bestOverall && histLast && SMARTUI_isFiniteNum_(histLast.priceNum)) {
    savingAbs = histLast.priceNum - bestOverall.priceNum;
    savingPct = bestOverall.priceNum > 0 ? ((histLast.priceNum - bestOverall.priceNum) / bestOverall.priceNum) * 100 : '';
    if (histLast.priceNum > bestOverall.priceNum * 1.05) {
      decision = 'REVISAR: HAY OPCIÓN MEJOR';
    } else if (histLast.priceNum < bestOverall.priceNum * 0.95) {
      decision = 'PRECIO ACTUAL FUERTE';
    } else {
      decision = 'OK / COMPETITIVO';
    }
  } else if (bestOverall) {
    decision = 'USAR REFERENCIA DISPONIBLE';
  }

  var summaryText = SMARTUI_buildCodeSummaryText_({
    code: code,
    itemName: itemName,
    generalMatches: generalMatches,
    uniqueTasksCount: Object.keys(uniqueTasks).length,
    uniqueProvidersCount: Object.keys(uniqueProviders).length,
    pendingWithoutOC: pendingWithoutOC,
    histMin: histMin,
    histMax: histMax,
    histAvg: histAvg,
    histLast: histLast,
    catMin: catMin,
    catAvg: catAvg,
    bestOverall: bestOverall,
    decision: decision,
    savingAbs: savingAbs,
    savingPct: savingPct
  });

  return {
    code: code,
    itemName: itemName,
    stats: {
      totalPurchases: generalMatches.length,
      uniqueTasks: Object.keys(uniqueTasks).length,
      uniqueProviders: Object.keys(uniqueProviders).length,
      pendingWithoutOC: pendingWithoutOC.length
    },
    historical: {
      min: histMin ? SMARTUI_money_(histMin.priceNum) : 'N/D',
      max: histMax ? SMARTUI_money_(histMax.priceNum) : 'N/D',
      avg: SMARTUI_isFiniteNum_(histAvg) ? SMARTUI_money_(histAvg) : 'N/D',
      last: histLast ? SMARTUI_money_(histLast.priceNum) : 'N/D',
      lastProvider: histLast ? (histLast.prov || 'N/D') : 'N/D',
      lastTask: histLast ? (histLast.taskId || 'N/D') : 'N/D'
    },
    catalog: {
      rows: catalogMatches.length,
      min: catMin ? SMARTUI_money_(catMin.priceNum) : 'N/D',
      avg: SMARTUI_isFiniteNum_(catAvg) ? SMARTUI_money_(catAvg) : 'N/D',
      minProvider: catMin ? (catMin.prov || 'N/D') : 'N/D'
    },
    recommendation: {
      decision: decision,
      source: bestOverall ? bestOverall.source : 'N/D',
      provider: bestOverall ? (bestOverall.prov || 'N/D') : 'N/D',
      price: bestOverall ? SMARTUI_money_(bestOverall.priceNum) : 'N/D',
      savingAbs: SMARTUI_isFiniteNum_(savingAbs) ? SMARTUI_money_(savingAbs) : 'N/D',
      savingPct: SMARTUI_isFiniteNum_(savingPct) ? SMARTUI_pct_(savingPct) : 'N/D'
    },
    recentPurchases: generalMatches
      .slice()
      .sort(function (a, b) { return b.rowNumber - a.rowNumber; })
      .slice(0, 12)
      .map(function (m) {
        return {
          rowNumber: m.rowNumber,
          taskId: m.taskId,
          depto: m.depto || '',
          provider: m.prov || '',
          price: SMARTUI_isFiniteNum_(m.priceNum) ? SMARTUI_money_(m.priceNum) : 'N/D',
          oc: m.oc || '',
          desc: m.desc || ''
        };
      }),
    pendingRows: pendingWithoutOC
      .slice()
      .sort(function (a, b) { return b.rowNumber - a.rowNumber; })
      .slice(0, 12)
      .map(function (m) {
        return {
          rowNumber: m.rowNumber,
          taskId: m.taskId,
          depto: m.depto || '',
          provider: m.prov || '',
          price: SMARTUI_isFiniteNum_(m.priceNum) ? SMARTUI_money_(m.priceNum) : 'N/D'
        };
      }),
    catalogRows: catalogMatches
      .slice()
      .sort(function (a, b) {
        var aa = SMARTUI_isFiniteNum_(a.priceNum) ? a.priceNum : Number.MAX_VALUE;
        var bb = SMARTUI_isFiniteNum_(b.priceNum) ? b.priceNum : Number.MAX_VALUE;
        return aa - bb;
      })
      .slice(0, 12)
      .map(function (c) {
        return {
          provider: c.prov || '',
          price: SMARTUI_isFiniteNum_(c.priceNum) ? SMARTUI_money_(c.priceNum) : 'N/D',
          qty: c.qty || '',
          desc: c.desc || ''
        };
      }),
    summaryText: summaryText
  };
}

function SMARTUI_buildRecommendationMessage(codeRaw) {
  return SMARTUI_getCodeRecommendation(codeRaw).summaryText;
}

// ════════════════════════════════════════════════════════════════
// CIERRE POR TAREA
// ════════════════════════════════════════════════════════════════

function SMARTUI_getTaskClosure(taskIdRaw) {
  var taskId = SMARTUI_normTaskId_(taskIdRaw);
  if (!taskId) throw new Error('Ingresa un número de tarea válido.');

  SMARTUI_assertBaseSheets_();

  var general = SMARTUI_parseGeneralTasks_();
  var task = null;
  for (var i = 0; i < general.tasks.length; i++) {
    if (general.tasks[i].taskId === taskId) {
      task = general.tasks[i];
      break;
    }
  }

  if (!task) throw new Error('No encontré la tarea ' + taskId + ' en GENERAL.');

  var facMap = SMARTUI_buildFacturasMap_();
  var antMap = SMARTUI_buildAnticiposMap_();

  var uniqueOC = {};
  var missingOCRows = [];
  task.items.forEach(function (it) {
    if (SMARTUI_isBlank_(it.oc)) {
      missingOCRows.push({
        rowNumber: it.rowNumber,
        code: it.code || '',
        desc: it.desc || '',
        provider: it.prov || ''
      });
    } else {
      uniqueOC[it.oc] = true;
    }
  });

  var ocList = Object.keys(uniqueOC).sort();
  var fact = facMap[task.taskId] || { total: 0, shared: 0, rows: [] };

  var antPendingRows = [];
  ocList.forEach(function (oc) {
    var antRows = antMap[oc] || [];
    antRows.forEach(function (a) {
      if (!SMARTUI_CFG.CLOSE_OK_STATUSES[a.status]) {
        antPendingRows.push({
          oc: oc,
          provider: a.prov || '',
          type: a.tipoPago || '',
          percent: a.percent || '',
          status: a.status || ''
        });
      }
    });
  });

  var allItemsHaveOC = task.items.length > 0 && missingOCRows.length === 0;
  var facOk = fact.total === 0 || fact.shared === fact.total;
  var antOk = antPendingRows.length === 0;
  var closeReady = allItemsHaveOC && facOk && antOk;

  var reasons = [];
  var actions = [];
  if (!allItemsHaveOC) {
    reasons.push('Faltan OC en ' + missingOCRows.length + ' ítem(s)');
    actions.push('GENERAR / ASIGNAR OC');
  }
  if (!facOk) {
    reasons.push('Facturas pendientes por compartir: ' + (fact.total - fact.shared));
    actions.push('COMPARTIR FACTURAS PENDIENTES');
  }
  if (!antOk) {
    reasons.push('Anticipos/contado abiertos: ' + antPendingRows.length);
    actions.push('CERRAR ANTICIPOS / CONTADO');
  }
  if (!reasons.length) {
    reasons.push('Todo OK: ítems con OC, facturas compartidas y anticipos cerrados');
    actions.push('APTO PARA CIERRE / ARCHIVO');
  }

  var summaryText = SMARTUI_buildClosureSummaryText_({
    task: task,
    closeReady: closeReady,
    itemsTotal: task.items.length,
    itemsWithOC: task.items.length - missingOCRows.length,
    uniqueOCCount: ocList.length,
    factTotal: fact.total,
    factShared: fact.shared,
    antPendingCount: antPendingRows.length,
    reasons: reasons,
    actions: actions
  });

  return {
    taskId: task.taskId,
    headerRow: task.headerRow,
    depto: task.depto || '',
    solic: task.solic || '',
    detalle: task.detalle || '',
    itemsTotal: task.items.length,
    itemsWithOC: task.items.length - missingOCRows.length,
    uniqueOCCount: ocList.length,
    facturasTotal: fact.total,
    facturasShared: fact.shared,
    anticiposPendientes: antPendingRows.length,
    closeReady: closeReady,
    reason: reasons.join(' | '),
    action: actions.join(' | '),
    ocs: ocList,
    missingOCRows: missingOCRows.slice(0, 20),
    pendingAnticipos: antPendingRows.slice(0, 20),
    factRows: fact.rows.slice(0, 20),
    summaryText: summaryText
  };
}

function SMARTUI_buildClosureMessage(taskIdRaw) {
  return SMARTUI_getTaskClosure(taskIdRaw).summaryText;
}

// ════════════════════════════════════════════════════════════════
// CONTEXTO ACTUAL / NAVEGACIÓN
// ════════════════════════════════════════════════════════════════

function SMARTUI_getCurrentGeneralContext() {
  var ctx = SMARTUI_getActiveSelectionContext_();
  if (!ctx.inGeneral) {
    return {
      ok: false,
      message: 'Abre GENERAL y selecciona una fila para detectar tarea o código.'
    };
  }

  return {
    ok: true,
    rowNumber: ctx.rowNumber,
    code: ctx.code || '',
    taskId: ctx.taskId || '',
    inTaskHeader: !!ctx.inTaskHeader,
    message: 'Contexto detectado.'
  };
}

function SMARTUI_goToGeneralRow(rowNumber) {
  rowNumber = parseInt(rowNumber, 10);
  if (!rowNumber || rowNumber < 1) throw new Error('Fila inválida.');

  var sh = SMARTUI_sh_(SMARTUI_CFG.SHEET_GENERAL);
  sh.activate();
  sh.getRange(rowNumber, 1, 1, 1).activate();
  SpreadsheetApp.flush();
  return { ok: true, rowNumber: rowNumber };
}

// ════════════════════════════════════════════════════════════════
// BASE DE DATOS (LECTURA)
/// ═══════════════════════════════════════════════════════════════

function SMARTUI_parseGeneralTasks_() {
  var sh = SMARTUI_sh_(SMARTUI_CFG.SHEET_GENERAL);
  var lastRow = sh.getLastRow();
  var lastCol = Math.min(12, sh.getLastColumn());
  if (lastRow < 2) return { tasks: [] };

  var data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  var tasks = [];
  var current = null;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowNumber = i + 1;

    var taskId = SMARTUI_normTaskId_(row[2]); // C
    var isHeader = taskId && SMARTUI_isTaskHeaderRow_(row);

    if (isHeader) {
      if (current) {
        current.endRow = rowNumber - 1;
        tasks.push(current);
      }
      current = {
        taskId: taskId,
        headerRow: rowNumber,
        endRow: rowNumber,
        pedido: SMARTUI_trim_(row[8]),
        depto: SMARTUI_trim_(row[9]),
        solic: SMARTUI_trim_(row[10]),
        detalle: SMARTUI_trim_(row[11]),
        items: []
      };
      continue;
    }

    if (!current) continue;

    var code = SMARTUI_trim_(row[1]);   // B
    var desc = SMARTUI_trim_(row[2]);   // C
    var qty = row[3];                   // D
    var prov = SMARTUI_trim_(row[4]);   // E
    var priceRaw = row[5];              // F
    var oc = SMARTUI_trim_(row[6]);     // G

    if (SMARTUI_isBlank_(code) && SMARTUI_isBlank_(desc) && SMARTUI_isBlank_(qty) && SMARTUI_isBlank_(prov) && SMARTUI_isBlank_(oc)) {
      continue;
    }

    current.items.push({
      rowNumber: rowNumber,
      code: code,
      desc: desc,
      qty: qty,
      prov: prov,
      priceRaw: priceRaw,
      priceNum: SMARTUI_parseMoney_(priceRaw),
      oc: oc
    });
    current.endRow = rowNumber;
  }

  if (current) tasks.push(current);

  return { tasks: tasks };
}

function SMARTUI_getCatalogMatches_(code) {
  var sh = SMARTUI_sh_(SMARTUI_CFG.SHEET_PRECIOS);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  var data = sh.getRange(2, 1, lastRow - 1, 10).getValues();
  var out = [];

  data.forEach(function (row) {
    var prov = SMARTUI_trim_(row[0]);  // A
    var desc = SMARTUI_trim_(row[6]);  // G
    var itemCode = SMARTUI_normCode_(row[7]); // H
    var qty = row[8];                  // I
    var priceNum = SMARTUI_parseMoney_(row[9]); // J

    if (itemCode === code) {
      out.push({
        prov: prov,
        desc: desc,
        qty: qty,
        priceNum: priceNum
      });
    }
  });

  return out;
}

function SMARTUI_buildFacturasMap_() {
  var sh = SMARTUI_sh_(SMARTUI_CFG.SHEET_FAC);
  var lastRow = sh.getLastRow();
  var map = {};
  if (lastRow < 2) return map;

  var data = sh.getRange(2, 1, lastRow - 1, 12).getValues();
  data.forEach(function (r) {
    var taskId = SMARTUI_normTaskId_(r[6]); // G
    if (!taskId) return;

    var shared = SMARTUI_normUpper_(r[8]) === 'X';
    if (!map[taskId]) {
      map[taskId] = { total: 0, shared: 0, rows: [] };
    }
    map[taskId].total++;
    if (shared) map[taskId].shared++;
    map[taskId].rows.push({
      provider: SMARTUI_trim_(r[1]),
      factura: SMARTUI_trim_(r[2]),
      ingreso: SMARTUI_trim_(r[5]),
      shared: shared ? 'SI' : 'NO'
    });
  });

  return map;
}

function SMARTUI_buildAnticiposMap_() {
  var sh = SMARTUI_sh_(SMARTUI_CFG.SHEET_ANT);
  var lastRow = sh.getLastRow();
  var map = {};
  if (lastRow < 2) return map;

  var data = sh.getRange(2, 1, lastRow - 1, 6).getValues();
  data.forEach(function (r) {
    var prov = SMARTUI_trim_(r[0]);
    var oc = SMARTUI_trim_(r[1]);
    var tipo = SMARTUI_trim_(r[2]);
    var percent = SMARTUI_trim_(r[3]);
    var status = SMARTUI_normUpper_(r[4]);
    if (!oc) return;
    if (!map[oc]) map[oc] = [];
    map[oc].push({
      prov: prov,
      tipoPago: tipo,
      percent: percent,
      status: status
    });
  });

  return map;
}

// ════════════════════════════════════════════════════════════════
// DETECTAR CONTEXTO DE SELECCIÓN
// ════════════════════════════════════════════════════════════════

function SMARTUI_getActiveSelectionContext_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getActiveSheet();
  var range = sh.getActiveRange();
  var rowNumber = range ? range.getRow() : 0;
  var colNumber = range ? range.getColumn() : 0;

  var ctx = {
    inGeneral: sh.getName() === SMARTUI_CFG.SHEET_GENERAL,
    sheetName: sh.getName(),
    rowNumber: rowNumber,
    colNumber: colNumber,
    code: '',
    taskId: '',
    inTaskHeader: false
  };

  if (!ctx.inGeneral || rowNumber < 2) return ctx;

  var row = sh.getRange(rowNumber, 1, 1, Math.min(12, sh.getLastColumn())).getValues()[0];
  var directCode = SMARTUI_normCode_(row[1]); // B
  var directTask = SMARTUI_normTaskId_(row[2]); // C
  var isHeader = directTask && SMARTUI_isTaskHeaderRow_(row);

  if (directCode) ctx.code = directCode;
  if (directTask && isHeader) {
    ctx.taskId = directTask;
    ctx.inTaskHeader = true;
    return ctx;
  }

  var tasks = SMARTUI_parseGeneralTasks_().tasks;
  for (var i = 0; i < tasks.length; i++) {
    if (rowNumber >= tasks[i].headerRow && rowNumber <= tasks[i].endRow) {
      ctx.taskId = tasks[i].taskId;
      break;
    }
  }

  return ctx;
}

// ════════════════════════════════════════════════════════════════
// RESÚMENES DE TEXTO
// ════════════════════════════════════════════════════════════════

function SMARTUI_buildCodeSummaryText_(o) {
  var lines = [];
  lines.push('CÓDIGO: ' + o.code);
  lines.push('ITEM: ' + (o.itemName || 'N/D'));
  lines.push('Compras registradas: ' + o.generalMatches.length);
  lines.push('Tareas involucradas: ' + o.uniqueTasksCount);
  lines.push('Proveedores históricos: ' + o.uniqueProvidersCount);
  lines.push('Pendientes sin OC: ' + o.pendingWithoutOC.length);
  lines.push('Histórico min: ' + (o.histMin ? SMARTUI_money_(o.histMin.priceNum) + ' | ' + (o.histMin.prov || 'N/D') : 'N/D'));
  lines.push('Histórico último: ' + (o.histLast ? SMARTUI_money_(o.histLast.priceNum) + ' | ' + (o.histLast.prov || 'N/D') : 'N/D'));
  lines.push('Catálogo min: ' + (o.catMin ? SMARTUI_money_(o.catMin.priceNum) + ' | ' + (o.catMin.prov || 'N/D') : 'N/D'));
  lines.push('Mejor referencia: ' + (o.bestOverall ? (o.bestOverall.source + ' | ' + (o.bestOverall.prov || 'N/D') + ' | ' + SMARTUI_money_(o.bestOverall.priceNum)) : 'N/D'));
  lines.push('Decisión: ' + o.decision);
  if (SMARTUI_isFiniteNum_(o.savingAbs)) lines.push('Ahorro potencial: ' + SMARTUI_money_(o.savingAbs));
  if (SMARTUI_isFiniteNum_(o.savingPct)) lines.push('Ahorro potencial %: ' + SMARTUI_pct_(o.savingPct));
  return lines.join('\n');
}

function SMARTUI_buildClosureSummaryText_(o) {
  var lines = [];
  lines.push('TAREA: ' + o.task.taskId);
  lines.push('DEPARTAMENTO: ' + (o.task.depto || 'N/D'));
  lines.push('SOLICITANTE: ' + (o.task.solic || 'N/D'));
  lines.push('DETALLE: ' + (o.task.detalle || 'N/D'));
  lines.push('Items totales: ' + o.itemsTotal);
  lines.push('Items con OC: ' + o.itemsWithOC);
  lines.push('OC únicas: ' + o.uniqueOCCount);
  lines.push('Facturas total: ' + o.factTotal);
  lines.push('Facturas compartidas: ' + o.factShared);
  lines.push('Anticipos/contado pendientes: ' + o.antPendingCount);
  lines.push('CIERRE APTO: ' + (o.closeReady ? 'SI' : 'NO'));
  lines.push('Motivo: ' + o.reasons.join(' | '));
  lines.push('Acción sugerida: ' + o.actions.join(' | '));
  return lines.join('\n');
}

// ════════════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════════════

function SMARTUI_assertBaseSheets_() {
  [SMARTUI_CFG.SHEET_GENERAL, SMARTUI_CFG.SHEET_PRECIOS, SMARTUI_CFG.SHEET_FAC, SMARTUI_CFG.SHEET_ANT].forEach(function (name) {
    SMARTUI_sh_(name);
  });
}

function SMARTUI_sh_(name) {
  if (typeof SYS_sh_ === 'function') return SYS_sh_(name);
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('No existe la hoja: ' + name);
  return sh;
}

function SMARTUI_trim_(v) {
  return v === null || v === undefined ? '' : String(v).replace(/\u00A0/g, ' ').trim();
}

function SMARTUI_isBlank_(v) {
  return SMARTUI_trim_(v) === '';
}

function SMARTUI_normUpper_(v) {
  return SMARTUI_trim_(v).toUpperCase();
}

function SMARTUI_normTaskId_(v) {
  if (v === null || v === undefined) return '';
  var s = String(v).trim();
  if (/^\d{6,}$/.test(s)) return s;
  if (typeof v === 'number' && v >= 100000) return String(Math.trunc(v));
  return '';
}

function SMARTUI_normCode_(v) {
  return SMARTUI_trim_(v).toUpperCase();
}

function SMARTUI_isTaskHeaderRow_(row) {
  var taskId = SMARTUI_normTaskId_(row[2]); // C
  var code = row[1]; // B
  var qty = row[3];  // D
  var prov = row[4]; // E

  return !!(
    taskId &&
    SMARTUI_isBlank_(code) &&
    SMARTUI_isBlank_(qty) &&
    SMARTUI_isBlank_(prov)
  );
}

function SMARTUI_parseMoney_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number') return isNaN(v) ? '' : v;

  var s = String(v).trim()
    .replace(/\$/g, '')
    .replace(/\s+/g, '')
    .replace(/[^0-9,.\-]/g, '');

  if (!s) return '';

  var hasDot = s.indexOf('.') !== -1;
  var hasComma = s.indexOf(',') !== -1;

  if (hasDot && hasComma) {
    var lastDot = s.lastIndexOf('.');
    var lastComma = s.lastIndexOf(',');
    if (lastDot > lastComma) {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasDot && s.split('.').length > 2) {
    var partsDot = s.split('.');
    s = partsDot.slice(0, -1).join('') + '.' + partsDot[partsDot.length - 1];
  } else if (hasComma && s.split(',').length > 2) {
    var partsComma = s.split(',');
    s = partsComma.slice(0, -1).join('') + '.' + partsComma[partsComma.length - 1];
  } else if (hasComma && !hasDot) {
    s = s.replace(',', '.');
  }

  var n = parseFloat(s);
  return isNaN(n) ? '' : n;
}

function SMARTUI_isFiniteNum_(v) {
  return typeof v === 'number' && isFinite(v);
}

function SMARTUI_pickMinPrice_(arr, key) {
  if (!arr || !arr.length) return null;
  var min = null;
  arr.forEach(function (x) {
    var price = x[key];
    if (!SMARTUI_isFiniteNum_(price)) return;
    if (!min || price < min[key]) min = x;
  });
  return min;
}

function SMARTUI_pickMaxPrice_(arr, key) {
  if (!arr || !arr.length) return null;
  var max = null;
  arr.forEach(function (x) {
    var price = x[key];
    if (!SMARTUI_isFiniteNum_(price)) return;
    if (!max || price > max[key]) max = x;
  });
  return max;
}

function SMARTUI_avg_(arr) {
  var vals = (arr || []).filter(function (x) { return SMARTUI_isFiniteNum_(x); });
  if (!vals.length) return '';
  var sum = vals.reduce(function (a, b) { return a + b; }, 0);
  return sum / vals.length;
}

function SMARTUI_money_(n) {
  if (!SMARTUI_isFiniteNum_(n)) return 'N/D';
  return '$' + Number(n).toFixed(2);
}

function SMARTUI_pct_(n) {
  if (!SMARTUI_isFiniteNum_(n)) return 'N/D';
  return Number(n).toFixed(1) + '%';
}
